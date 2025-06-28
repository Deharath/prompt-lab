# CI Environment Setup

This document explains how to handle environment variables in CI/CD pipelines.

## Problem

The GitHub CI was failing because the Docker container required the `OPENAI_API_KEY` environment variable, but it wasn't provided in the CI environment.

## Solutions Implemented

### 1. Updated CI Workflow

The `.github/workflows/ci.yml` file now provides dummy environment variables when starting the Docker container:

```yaml
- name: Start container
  run: docker run -d --name promptlab -p 3000:3000 -e OPENAI_API_KEY=dummy-key-for-ci -e NODE_ENV=test promptlab:test
```

### 2. Enhanced Configuration

The `packages/api/src/config/index.ts` file now detects CI environments and allows dummy API keys:

- Detects CI environments using `CI=true` or `GITHUB_ACTIONS=true`
- Provides default dummy values for API keys in test/CI environments
- Still requires real API keys in production

### 3. CI Environment Template

Created `.env.ci` file with all the necessary environment variables for CI/testing purposes.

## Usage

### Local Development

```bash
cp .env.example .env
# Edit .env with your actual API keys
```

### CI/Testing

The CI environment automatically uses dummy values, no additional setup required.

### Docker Development

```bash
docker-compose up  # Uses development environment with dummy values
```

## Environment Detection

The application detects the environment in this order:

1. `NODE_ENV=test` - Test environment (allows dummy API keys)
2. `CI=true` or `GITHUB_ACTIONS=true` - CI environment (allows dummy API keys)
3. `NODE_ENV=production` - Production environment (requires real API keys)
4. Default - Development environment (allows dummy API keys)
