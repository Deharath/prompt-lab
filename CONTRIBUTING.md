# Contributing to PromptLab

Thank you for your interest in contributing! Please follow these guidelines to ensure a smooth workflow and maintain code quality.

## Project Structure

- **apps/api**: Express server with routes and middleware (imports from packages/api)
- **apps/web**: React 19 + Vite frontend with streaming job interface
- **packages/api**: Shared business logic (providers, jobs, database)
- **packages/evaluator**: TypeScript metrics library with pluggable evaluation
- **packages/test-cases**: JSONL fixtures and test helpers
- **scripts**: Utility scripts for linting and maintenance

## Getting Started

1. **Install dependencies:**
   ```sh
   pnpm install
   ```
2. **Set up your environment:**
   - Copy `.env.example` to `.env` and fill in required values.
3. **Build all packages:**
   ```sh
   pnpm tsc -b
   ```
4. **Run tests:**
   ```sh
   pnpm test
   ```

## Frontend Component Organization

**Component Directory Structure Rule:**

A component must be placed in its own directory (e.g., `components/MyComponent/index.tsx`) if it has, or is expected to have, any of the following: sub-components, dedicated hooks, style files, or test files. Simple, single-file components can reside in a shared directory (e.g., `components/ui/Button.tsx`).

**Hook Organization Rule:**

New hooks should be created in their own file within the `hooks/` directory and have a single, clear responsibility. Each hook file should contain only one main hook and related helper functions. Avoid creating utility hook files that combine unrelated functionality.

**Constants Organization Rule:**

Static data like sample prompts, navigation items, and configuration constants should be moved to dedicated files in the `constants/` directory rather than being hardcoded within component files.

## Adding Packages or References

- Update `tsconfig.json` references at the root.
- Add your package to `pnpm-workspace.yaml`.
- Ensure `composite: true` and correct `rootDir`/`outDir` in your package's `tsconfig.json`.
- Only import across packages via public API (e.g., `@prompt-lab/evaluator`). Never import from another package’s `src/` directly.

## Linting & Formatting

- **Automated Quality Checks**: Run `pnpm lint` before committing. Zero warnings required for CI.
- **Enhanced ESLint Rules**: Our configuration includes complexity limits, code quality checks, and best practices:
  - Function complexity limit: 10
  - Maximum function length: 50 lines
  - Maximum function parameters: 4
  - Magic number detection (use named constants)
  - Prefer nullish coalescing (`??`) over logical OR (`||`)
  - React best practices and hooks rules
- **Pre-commit Hooks**: Husky automatically runs linting and formatting on staged files
- **Base Configuration**: ESLint uses Airbnb+TS+Prettier. See `eslint.config.js` for details.
- **Available Scripts**:
  - `pnpm lint` - Run ESLint checks
  - `pnpm format` - Format code with Prettier
  - `pnpm quality:check` - Run lint, TypeScript checks, and tests
  - `pnpm quality:fix` - Auto-fix formatting and linting issues
- Test/config files may use devDependencies via overrides.

## Testing & Coverage

- All code must be covered by tests (≥90% for `evaluator`).
- Use Vitest for all tests. Coverage is enforced in CI.
- Mock external APIs (OpenAI, Gemini) in tests.

## Environment Variables

Set up your environment by copying `.env.example` to `.env`:

```bash
# Required
OPENAI_API_KEY=your_openai_key_here

# Optional
GEMINI_API_KEY=your_gemini_key_here
PORT=3000
DATABASE_URL=sqlite.db
```

- **OPENAI_API_KEY**: Required for GPT model providers
- **GEMINI_API_KEY**: Optional, enables Gemini models (graceful fallback if missing)
- **DATABASE_URL**: SQLite database path (auto-created on first run)
- Never commit secrets. Use `.env.example` to document required variables.
- Always load `.env` at runtime.

## Architecture Notes

- `packages/api` contains shared business logic used by `apps/api`
- Database uses SQLite with Drizzle ORM (auto-initializes tables)
- Job execution is async with Server-Sent Events for real-time streaming
- Provider interface supports OpenAI and Gemini with unified AsyncGenerator streaming

## CI/CD

- Lint, build, test, and Docker smoke test must all pass in CI.
- Node 18 & 22 are tested for compatibility.
- Always commit `pnpm-lock.yaml` after dependency changes.

## Docker

- Multi-stage build for minimal images.
- Only production artifacts are copied to runtime image.
- Check logs if Docker smoke test fails.

## Dependency Updates

- Use [Renovate](https://github.com/renovatebot/renovate) or [Dependabot](https://github.com/dependabot) for automated updates.
- Always install `@types` for all dependencies, including dev-only.

## Native/Platform-Specific Dependencies

- See the README for any native or platform-specific requirements.

## Questions?

Open an issue or ask in the project discussions.
