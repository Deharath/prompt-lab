# Contributing to PromptLab

Thank you for your interest in contributing! Please follow these guidelines to ensure a smooth workflow and maintain code quality.

## Project Structure

- **apps/api**: Express + Zod backend (TypeScript, Drizzle ORM, providers).
- **apps/web**: React 19 + Vite + shadcn/ui frontend.
- **packages/evaluator**: TypeScript metrics library.
- **packages/test-cases**: JSONL fixtures and helpers.
- **scripts**: Utility scripts.

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

## Adding Packages or References

- Update `tsconfig.json` references at the root.
- Add your package to `pnpm-workspace.yaml`.
- Ensure `composite: true` and correct `rootDir`/`outDir` in your package's `tsconfig.json`.
- Only import across packages via public API (e.g., `@prompt-lab/evaluator`). Never import from another package’s `src/` directly.

## Linting & Formatting

- Run `pnpm lint` before committing. Zero warnings required for CI.
- ESLint uses Airbnb+TS+Prettier. See `eslint.config.js` for details.
- Test/config files may use devDependencies via overrides.

## Testing & Coverage

- All code must be covered by tests (≥90% for `evaluator`).
- Use Vitest for all tests. Coverage is enforced in CI.
- Mock external APIs (OpenAI, Gemini) in tests.

## Environment Variables

- Never commit secrets. Use `.env.example` to document required variables.
- Always load `.env` at runtime.

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
