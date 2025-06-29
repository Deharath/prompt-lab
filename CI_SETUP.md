# CI Environment Setup

This document explains the simplified CI/CD pipeline setup for PromptLab.

## Overview

The CI pipeline runs on Linux containers with Docker, providing a consistent and reliable build environment. All complexity related to Windows compatibility has been removed to keep the CI simple and maintainable.

## CI Architecture

The CI pipeline consists of two main jobs:

1. **Build & Test** - Builds all packages, runs linting, and executes tests
2. **Docker Smoke Test** - Builds and tests the Docker container

### Build & Test Job

This job runs on `["self-hosted", "linux"]` runners and performs:

- Dependency installation with native build tools
- Package building using `pnpm build`
- Linting with `pnpm -r lint`, `pnpm lint:data`, and dependency checks
- Test execution with `pnpm -r test`

### Docker Smoke Test Job

This job validates the Docker container:

- Builds the Docker image with caching
- Starts the container with dummy environment variables
- Performs health checks using the `/health/ready` endpoint
- Cleans up containers after testing

## Environment Variables

### CI Environment

The CI automatically provides dummy environment variables for testing:

```bash
OPENAI_API_KEY=dummy-key-for-ci
NODE_ENV=test
```

### Local Development

```bash
cp .env.example .env
# Edit .env with your actual API keys
```

### Docker Development

```bash
docker-compose up  # Uses development environment with dummy values
```

## Health Check Endpoints

The API provides three health check endpoints:

- `/health` - Full health check including external services (OpenAI, database)
- `/health/ready` - Readiness check (database only) - **used by CI**
- `/health/live` - Basic liveness check (process health only)

In CI/test environments, health checks are optimized to avoid real API calls to external services.

## Environment Detection

The application detects the environment in this order:

1. `NODE_ENV=test` - Test environment (allows dummy API keys)
2. `CI=true` or `GITHUB_ACTIONS=true` - CI environment (allows dummy API keys)
3. `NODE_ENV=production` - Production environment (requires real API keys)
4. Default - Development environment (allows dummy API keys)

## Simplified Architecture Benefits

- **Single runner type**: Only Linux containers, no Windows complexity
- **Inline jobs**: All steps in main workflow, no reusable workflow complexity
- **Consistent environment**: Docker ensures identical behavior across local and CI
- **Faster execution**: Fewer job dependencies and simplified logic
- **Easier maintenance**: Single workflow file with clear, linear steps
