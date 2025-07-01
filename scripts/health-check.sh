#!/bin/bash
#
# This script is used in the CI to check if the Docker container is healthy.
# It waits for the API to become ready by polling the health endpoints.
#

set -e # Exit immediately if a command exits with a non-zero status.
set -o pipefail # Return the exit status of the last command in the pipe that failed.

echo "��� Waiting for API to become ready..."
echo "Container should be starting now..."
# Give the container a moment to initialize
sleep 5

for i in $(seq 1 40); do
  # Check if container is still running
  container_status=$(docker ps --filter name=promptlab --format '{{.Status}}' 2>/dev/null || echo "not found")
  if [[ ! "$container_status" =~ "Up" ]]; then
    echo "❌ Container not running (status: $container_status)"
    echo "��� Container logs:"
    docker logs promptlab 2>&1 || echo "No logs available"
    exit 1
  fi

  # Check if API is ready
  echo "��� Checking health endpoint (attempt $i/40)..."
  if curl -sf -m 5 http://localhost:3000/health/ping >/dev/null 2>&1; then
    echo "✅ Basic ping endpoint working! Checking ready endpoint..."

    # Now check the actual ready endpoint
    if curl -sf -m 5 http://localhost:3000/health/ready >/dev/null 2>&1; then
      echo "✅ Ready endpoint working! Health check passed."
    else
      echo "⚠️  Ready endpoint not responding, but ping works. Checking logs..."
      echo "��� Recent container logs:"
      docker logs --tail 20 promptlab 2>&1 || echo "No recent logs available"
      exit 1
    fi

    # Also test that we can reach the main health endpoint
    echo "��� Testing main health endpoint..."
    if curl -sf -m 5 http://localhost:3000/health >/dev/null 2>&1; then
      echo "✅ Main health endpoint also working!"
    else
      echo "⚠️  Main health endpoint not responding, but /ready is working"
    fi
    exit 0
  fi

  # Show some debug info every few attempts
  if [ $((i % 5)) -eq 0 ]; then
    echo "��� Debug info at attempt $i:"
    echo "   Container status: $container_status"
    echo "   Port 3000 listening: $(netstat -tuln 2>/dev/null | grep ':3000' || echo 'not detected')"
  fi

  echo "⏳ API not ready yet... waiting 3 seconds (attempt $i/40)"
  sleep 3
done

echo "❌ Gave up waiting for API after 120 seconds"
echo "��� Final container status:"
docker ps --filter name=promptlab --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No container info"
echo "��� Final container logs:"
docker logs promptlab 2>&1 || echo "No logs available"
echo "��� Network info:"
netstat -tuln 2>/dev/null | grep ':3000' || echo "Port 3000 not listening"
exit 1
