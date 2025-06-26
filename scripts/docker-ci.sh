#!/bin/sh
# Run lint and tests inside Docker for CI/local parity
set -e

# This script must be run from the host, not inside a container.
# Example usage: ./scripts/docker-ci.sh

docker compose build

docker compose run --rm prompt-lab pnpm -r lint

docker compose run --rm prompt-lab pnpm -r test
