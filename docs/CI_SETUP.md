# CI Environment Setup

This document explains the simplified CI/CD pipeline setup for PromptLab.

## Overview

The CI pipeline runs on Linux containers with Docker, providing a consistent and reliable build environment. All complexity related to Windows compatibility has been removed to keep the CI simple and maintainable.

## CI Architecture

The CI pipeline consists of four main jobs with optimal parallelization:

1. **Build** - Installs dependencies and builds all packages, uploads artifacts
2. **Lint** (parallel after build) - Runs all linting and code quality checks
3. **Test** (parallel after build) - Executes all unit and integration tests
4. **Docker Smoke Test** (after all pass) - Builds and tests the Docker container

### Build Job

This job runs on `["self-hosted", "linux"]` runners and performs:

- Dependency installation with native build tools
- Package building using `pnpm build`
- Uploads built workspace as artifact for parallel jobs

### Lint Job (Parallel)

Runs in parallel after build completion:

- Downloads built workspace artifact
- Runs `pnpm -r lint`, `pnpm lint:data`, and dependency checks
- Performs security audit with `pnpm audit`

### Test Job (Parallel)

Runs in parallel after build completion:

- Downloads built workspace artifact
- Executes all tests with `pnpm -r test`

### Docker Smoke Test Job

Runs after all other jobs complete successfully:

- Builds the Docker image with caching
- Starts container with dummy environment variables
- Performs robust health checks using `/health/ready` endpoint
- Enhanced error handling and logging
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

- **Optimal parallelization**: Lint and test jobs run in parallel after build
- **Single runner type**: Only Linux containers, no Windows complexity
- **Artifact sharing**: Built workspace shared between jobs for efficiency
- **Consistent environment**: Docker ensures identical behavior across local and CI
- **Robust health checks**: Enhanced error handling with better logging
- **Faster execution**: Parallel jobs reduce total CI time
- **Easier maintenance**: Clear job separation with logical dependencies
