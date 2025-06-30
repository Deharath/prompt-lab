#!/bin/bash
set -euo pipefail

echo "Building Docker image..."
docker build -t promptlab:test .

echo "Starting container..."
CONTAINER=$(docker run -d -p 3000:3000 -e OPENAI_API_KEY=dummy-key-for-ci -e NODE_ENV=test promptlab:test)

echo "Waiting for API to be ready..."
for i in {1..20}; do
  if ! docker ps --filter id="$CONTAINER" --format '{{.Status}}' | grep -q 'Up'; then
    echo "Container exited early 😭"
    docker logs "$CONTAINER" || true
    docker rm -f "$CONTAINER"
    exit 1
  fi
  
  if curl -sf http://localhost:3000/health/ready > /dev/null; then
    echo "API is up 🎉"
    docker rm -f "$CONTAINER"
    exit 0
  fi
  
  echo "API not up yet… retrying ($i/20)"
  sleep 2
done

echo "Gave up waiting for API"
docker logs "$CONTAINER" || true
docker rm -f "$CONTAINER"
exit 1
