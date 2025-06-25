# PromptLab MVP

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

## 📝 Contributing

- PRs must pass lint, build, and test gates.
- Keep all dependencies in sync using `pnpm.overrides`.
- Document any native dependencies or special setup in this README.

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

![CI](https://img.shields.io/badge/CI-pending-lightgrey) ![Coverage](https://img.shields.io/badge/coverage-0%25-red)

_End of README.md_
