# Scripts Directory

This directory contains utility and maintenance scripts for the Prompt Lab project. These scripts are used for database migrations, health checks, testing, and CI/CD operations.

## Scripts Overview

### Database Migration Scripts

#### `migrate.ts`

- **Purpose:** Runs database migrations for the main application
- **Usage:** `npx tsx scripts/migrate.ts`
- **Requirements:** None - uses default database configuration
- **Description:** Executes pending database migrations using the migration system from `@prompt-lab/evaluation-engine`

### Health Check Scripts

#### `health-check-enhanced.sh`

- **Purpose:** Enhanced health check with detailed diagnostics
- **Usage:** `./scripts/health-check-enhanced.sh`
- **Requirements:** Docker container named "promptlab" must be running
- **Description:** Robust health checking with:
  - Detailed diagnostic output
  - Configurable retry attempts and timeouts
  - Color-coded output
  - Enhanced error handling
  - Container status monitoring

### Docker & CI Scripts

#### `docker-ci.sh`

- **Purpose:** Run lint and tests inside Docker for CI/local parity
- **Usage:** `./scripts/docker-ci.sh`
- **Requirements:** Docker and docker-compose installed
- **Description:** Builds Docker image and runs linting and tests in containerized environment

#### `smoke-docker.sh`

- **Purpose:** Smoke test for Docker container functionality
- **Usage:** `./scripts/smoke-docker.sh`
- **Requirements:** Docker installed, port 3000 available
- **Environment Variables:**
  - `OPENAI_API_KEY`: Set to dummy value for testing
  - `NODE_ENV`: Set to "test"
- **Description:** Builds Docker image, starts container, and tests basic API endpoints

### Development & Testing Scripts

#### `lint-jsonl.cjs`

- **Purpose:** Validates JSONL file format across the project
- **Usage:** `node scripts/lint-jsonl.cjs`
- **Requirements:** Node.js
- **Description:** Recursively finds and validates all `.jsonl` files in the project directory

## Usage Guidelines

### Running Scripts

1. **TypeScript scripts (.ts)**: Use `npx tsx <script-name>`
2. **Shell scripts (.sh)**: Use `./scripts/<script-name>` (ensure executable permissions)
3. **JavaScript modules (.mjs)**: Use `node scripts/<script-name>`
4. **CommonJS scripts (.cjs)**: Use `node scripts/<script-name>`

### Environment Setup

Most scripts require the project to be properly set up:

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Set up environment variables (for production scripts)
cp .env.example .env
# Edit .env with your values
```

### CI/CD Usage

The health check and Docker scripts are specifically designed for CI/CD pipelines:

- Use `docker-ci.sh` for containerized testing
- Use `health-check-enhanced.sh` for deployment verification
- Use `smoke-docker.sh` for basic functionality testing

### Development Workflow

For development and debugging:

1. Use `migrate.ts` after schema changes
2. Use `lint-jsonl.cjs` before committing JSONL files

## Troubleshooting

### Common Issues

1. **Permission denied on .sh scripts**: Run `chmod +x scripts/*.sh`
2. **TypeScript compilation errors**: Ensure packages are built with `pnpm build`
3. **Docker scripts failing**: Verify Docker is running and ports are available
4. **Migration failures**: Check database connectivity and backup data first

### Getting Help

- For Docker issues: Check container logs with `docker logs <container-name>`
- For database issues: Verify database file permissions and schema version
