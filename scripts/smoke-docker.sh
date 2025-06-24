#!/bin/bash
set -euo pipefail

docker build -t promptlab:test ..
CONTAINER=$(docker run -d -p 3000:3000 promptlab:test)
for i in {1..20}; do
  if curl -sf http://localhost:3000/health > /dev/null; then
    echo "API up"
    docker rm -f "$CONTAINER"
    exit 0
  fi
  sleep 2
done
docker logs "$CONTAINER"
docker rm -f "$CONTAINER"
exit 1
