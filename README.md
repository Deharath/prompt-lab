# PromptLab

[![CI](https://github.com/Deharath/prompt-lab/workflows/CI/badge.svg)](https://github.com/Deharath/prompt-lab/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-orange.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> An LLM prompt evaluation sandbox with live metrics for GPT-4.1 and Gemini 2.5 Flash.
> This project is a robust, test-driven application designed to showcase modern TypeScript and Node.js best practices.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or 22.x
- pnpm 10.x
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/Deharath/prompt-lab.git
cd prompt-lab

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys:
# OPENAI_API_KEY=your_openai_key_here
# GEMINI_API_KEY=your_gemini_key_here (optional)

# Build all packages
pnpm -r build

# Start development servers
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000

---

## ✨ Features

- **Multi-model streaming**: GPT-4.1 (full, mini, nano) and Gemini 2.5 Flash with real-time execution
- **Job-based architecture**: Persistent job tracking with SQLite, Server-Sent Events, and a `/jobs` endpoint for retrieving results
- **Advanced evaluation**: Cosine similarity and exact-match metrics via a modular evaluation package
- **Cost & token tracking**: Detailed per-job totals exposed through the `/jobs` endpoint
- **React UI**: Modern interface with streaming job execution and progress monitoring
- **CI/CD ready**: Comprehensive test suite (79+ tests) with automated quality gates
- **Production-grade**: Rate limiting, validation, Docker containerization, monorepo architecture
- **Enterprise testing**: 100% evaluator coverage, E2E tests, proper test isolation
- **Job comparison**: Use the History drawer to pick two runs and view differences at `/jobs/:id/diff`

---

## 🛡️ Architectural Guardrails & Code Quality

PromptLab enforces strict architectural and code quality standards to ensure maintainability and reliability:

| Concern        | Rule                                                                   | Common Pitfall to Avoid                                                 |
| -------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Monorepo**   | `apps` import from `packages`. `packages` never import from `apps`.    | Using relative paths (`../../`) instead of aliases (`@prompt-lab/api`). |
| **Backend**    | Logic lives in `packages/api`. Throw subclasses of `ApiError`.         | Putting business logic directly in Express route handlers.              |
| **Frontend**   | Use the central Zustand store (`jobStore.ts`). Extend the slice.       | Creating a new, separate store for a feature.                           |
| **Typescript** | **Zero `any`**. Use `unknown` for unsafe types. Only `async/await`.    | Using `.then()` or ignoring a missing type.                             |
| **Testing**    | Mock all external network/DB calls. Use in-memory DB for integrations. | Writing tests that make real API calls.                                 |

**Definition of Done:**

- [ ] The original problem is demonstrably solved.
- [ ] The full test suite (`pnpm test`) passes without any skips or failures.
- [ ] The linter (`pnpm lint`) and type-checker (`pnpm tsc`) are 100% clean.
- [ ] You have reflected on potential edge cases not covered by existing tests.
- [ ] Your commit message is clear and documents all primary and secondary changes.
- [ ] The codebase is measurably cleaner than when you started.

---

## 🗂️ Monorepo Structure

```
apps/
  api/         # Express API server (routes, middleware)
  web/         # React frontend with streaming UI
packages/
  api/         # Shared business logic (providers, jobs, database, cost tracking)
  evaluator/   # Core evaluation metrics and scoring
  jobs/        # Job helpers and types
  providers/   # Model provider integrations
  test-cases/  # JSONL test datasets and helpers
db/            # SQLite database files
```

- **Unified architecture**: `packages/api` provides shared business logic used by `apps/api`
- **Real-time execution**: Job-based processing with Server-Sent Events streaming
- **TypeScript project references**: Fast, reliable builds across all packages
- **Comprehensive testing**: 79+ tests with proper isolation and 100% evaluator coverage

---

## 🧪 Testing Philosophy

- **All external network and DB calls must be mocked.**
- **Integration tests use an in-memory SQLite DB** for isolation and speed.
- **No real API keys or cloud credentials** should be used in tests.
- **Test coverage for `evaluator` must remain above 90%.**
- **E2E and integration tests must not pollute production data.**

---

## Comparing Two Runs

Use the **History** drawer's Compare mode to select any two completed runs.
After picking a pair the app navigates to `/diff` where the text output and
metric deltas are displayed side by side.

You can also retrieve this information through the API:

```bash
curl "http://localhost:3000/jobs/<baseJobId>/diff?otherId=<compareJobId>"
```

---

## 📷 Demo & Screenshots

> _Contributors: Please add screenshots or a short GIF of the UI and/or API in action here!_

---

## 📚 Documentation & Resources

- [AGENTS.md](docs/AGENTS.md): Agent architecture and design
- [CI_SETUP.md](docs/CI_SETUP.md): Continuous Integration setup
- [CI_ENHANCEMENT_SUMMARY.md](docs/CI_ENHANCEMENT_SUMMARY.md): CI/CD enhancements
- [CONTRIBUTING.md](CONTRIBUTING.md): Contribution guidelines
- [CHANGELOG.md](CHANGELOG.md): Release history and notable changes

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of releases and major changes.

---

## 💬 Community & Support

- For questions, open an issue or start a discussion on GitHub.
- Feature requests and bug reports are welcome via [Issues](https://github.com/Deharath/prompt-lab/issues).
- For real-time chat, consider starting a [GitHub Discussions](https://github.com/Deharath/prompt-lab/discussions) thread.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🛠️ Development Scripts

- `pnpm dev` — Start both API and web dev servers
- `pnpm -r build` — Build all packages using TypeScript project references
- `pnpm test` — Run comprehensive test suite (includes all unit and integration tests)
- `pnpm -r lint` — Lint all code with zero warnings policy
- `pnpm -r clean` — Clean all build artifacts
- `pnpm docker:run` — Build and run Docker container locally
- `pnpm migrate` — Run database migrations
- `pnpm deps:check` — Check for unused dependencies
- `pnpm deps:update` — Update all dependencies to latest
- `pnpm audit` — Check for security vulnerabilities
- `pnpm format` — Format all code with Prettier

---

## ➕ Adding a New Package

1. Create a new folder in `apps/` or `packages/`.
2. Add a `tsconfig.json` with `composite: true` and a `package.json` with standard scripts.
3. Add a reference in the root `tsconfig.json`.
4. Run `pnpm install` and `pnpm -r build`.
5. **Follow architectural guardrails:**
   - `apps` may import from `packages`, but never the reverse.
   - Use path aliases (e.g., `@prompt-lab/api`) instead of relative paths.
   - No business logic in route handlers; use `packages/api` for backend logic.
   - No `any` types; use `unknown` if necessary.

---

## 📦 Folder Structure

```text
prompt-lab/
├─ apps/
│  ├─ api/            # Express + Zod API server
│  └─ web/            # React + shadcn/ui frontend
├─ packages/
│  ├─ api/            # Shared business logic, cost tracking, DB
│  ├─ evaluator/      # Metrics and evaluation logic
│  ├─ jobs/           # Job helpers and types
│  ├─ providers/      # Model provider integrations
│  ├─ test-cases/     # JSONL fixtures and helpers
├─ db/                # SQLite database files
```

---

## 📋 Stretch Goals

- Adapter layer for “bring-your-own” model.
- GPT self-eval metric vs. embedding cosine.
- Micro RAG experiment tracking hallucination.

---

## 🛑 Disclaimers

- No cloud creds stored—use your own `.env`.
- Test cases are synthetic.
- MIT licence; double-check token cost before running `pnpm test:e2e`.

---

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development servers (API + Web)
- `pnpm test` - Run all tests with coverage
- `pnpm lint` - Lint all code
- `pnpm format` - Format all code with Prettier
- `pnpm audit` - Check for security vulnerabilities
- `pnpm deps:check` - Check for unused dependencies
- `pnpm deps:update` - Update all dependencies to latest
- `pnpm migrate` - Run database migrations
- `pnpm clean` - Clean all build artifacts

### Testing

- Unit tests: `pnpm test`
- E2E tests: `pnpm test:e2e`
- Coverage report is generated in `coverage/` directory

### Code Quality

- Pre-commit hooks automatically lint and format code
- All commits must pass TypeScript type checking
- Test coverage must remain above 90% for evaluator package
- ESLint warnings will fail CI

---

## 🚀 Deployment

### Docker

```bash
# Build and run with Docker
pnpm docker:run

# Or manually:
docker build -t promptlab .
docker run -p 3000:3000 promptlab
```

### Environment Variables

Required environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key
- `GEMINI_API_KEY` - Your Google Gemini API key
- `DATABASE_URL` - SQLite database path (defaults to `sqlite.db`)

See `.env.example` for all available options.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📊 Project Status

- ✅ Core functionality complete
- ✅ Test suite with >90% coverage
- ✅ CI/CD pipeline
- ✅ Docker support
- ✅ Pre-commit hooks
- 🔄 Automated dependency updates
- 📋 Issue templates and PR guidelines

---

## 🛠️ Native/Platform-Specific Dependencies

- If you are running on Windows, ensure you have SQLite installed or use the provided Docker setup.
- No native Node.js modules are required, but some dependencies may require build tools (e.g., node-gyp, Python 3, C++ build tools) for optional features.
- See package READMEs for any additional requirements.

---

## 📦 Dependency Management

- Always install `@types` for all dependencies, including dev-only packages.
- Use [Renovate](https://github.com/renovatebot/renovate) or [Dependabot](https://github.com/dependabot) for automated dependency updates.
- After any dependency change, run `pnpm install` at the root and commit `pnpm-lock.yaml`.

---
