# PromptLab MVP

[![CI](https://github.com/your-username/prompt-lab/workflows/CI/badge.svg)](https://github.com/your-username/prompt-lab/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%20%7C%2022-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-orange.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **LLM prompt sandbox** with live metrics on _GPT-4.1 (+ mini / nano)_ and _Gemini 2.5 Flash_.  
> Built to show real Node + TS chops, not slide-deck vapourware.

---

## ✨ Features

- **Multi-model**: GPT-4.1 (full, mini, nano) and Gemini 2.5 Flash.
- **Automated eval**: embedding-cosine, exact-match & length heuristics; DeepEval/BERTScore pluggable.
- **Cost & latency tracking** baked into every run.
- **React UI** with history pane — no backend refresh.
- **CI gate** fails if your latest prompt degrades benchmark.
- **Coverage gate**: `@prompt-lab/evaluator` must keep ≥90% test coverage;
  any ESLint warning fails CI.
- **Monorepo** (`pnpm`) with strict TypeScript and project references.

---

## 🗂️ Monorepo Structure

```
apps/
  api/         # Express API backend
  web/         # React frontend
packages/
  evaluator/   # Core evaluation logic
  test-cases/  # Test data and helpers
```

- All packages use TypeScript project references for fast, reliable builds.
- Unified scripts: `build`, `test`, `lint`, `clean` in every package.
- All `.d.ts` files are ignored by ESLint.

---

## 🛠️ Scripts

- `pnpm -r build` — Build all packages using TypeScript project references
- `pnpm -r test` — Run all tests
- `pnpm -r lint` — Lint all code
- `pnpm -r clean` — Clean all build artifacts

---

## 🚦 CI/CD

- See `.github/workflows/ci.yml` for full pipeline: install, lint, build, test, and Docker smoke test

---

## 🐳 Docker & Dev Containers

- **Production:**
  - Build and run with Docker:
    ```sh
    docker build -t promptlab:latest .
    docker run -p 3000:3000 promptlab:latest
    ```
- **Development:**
  - Use VS Code Dev Containers for a reproducible local environment:
    - Open folder in container (requires Docker and VS Code)
    - All dependencies and build tools are pre-installed

---

## ➕ Adding a New Package

1. Create a new folder in `apps/` or `packages/`.
2. Add a `tsconfig.json` with `composite: true` and a `package.json` with standard scripts.
3. Add a reference in the root `tsconfig.json`.
4. Run `pnpm install` and `pnpm -r build`.

---

## 📦 Folder Structure

```text
prompt-lab/
├─ apps/
│  ├─ api/            # Express + Zod
│  └─ web/            # React + shadcn/ui
├─ packages/
│  ├─ evaluator/      # Metrics lib
│  └─ test-cases/     # JSONL fixtures
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

### Prerequisites

- Node.js 18.x or 22.x
- pnpm 10.x
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/prompt-lab.git
cd prompt-lab

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Build all packages
pnpm -r build

# Start development servers
pnpm dev
```

### Available Scripts

- `pnpm dev` - Start development servers (API + Web)
- `pnpm test` - Run all tests with coverage
- `pnpm lint` - Lint all code
- `pnpm format` - Format all code with Prettier
- `pnpm audit` - Check for security vulnerabilities
- `pnpm deps:check` - Check for unused dependencies
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
- `GOOGLE_API_KEY` - Your Google Gemini API key
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

![CI](https://img.shields.io/badge/CI-pending-lightgrey) ![Coverage](https://img.shields.io/badge/coverage-0%25-red)

_End of README.md_
