# PromptLab MVP — Codex Agent Guide
_This file is **for autonomous agents** (OpenAI Codex or similar) that will open PRs in this repository.  
Humans may read it too, but the primary audience is code-writing automation._

---

## 1. Project Snapshot
PromptLab is a minimalist playground for **testing, scoring and version-controlling LLM prompts**.  
Key claims we must uphold:

* Node + TypeScript backend hits multiple LLM APIs.  
* Automated quality / cost metrics over JSONL test-sets.  
* React (Vite) UI for live prompt tweaking.  
* CI gate fails on quality regression.

---

## 2. Folder Map

| Path | Purpose |
|------|---------|
| `apps/api` | Express + Zod service. Main entry: `src/index.ts` |
| `apps/web` | React 18 + shadcn/ui front-end (Vite) |
| `packages/evaluator` | Pure-TS lib: embeddings, metrics, retry logic |
| `packages/test-cases` | JSONL fixtures (`*.jsonl`) used in eval |
| `.github/workflows` | CI definitions |
| `docs/*` _(optional)_ | Extra diagrams / ADRs |

> **Rule:** Agents must not create new top-level folders without updating this table.

---

## 3. Canonical Dev Commands

| Intent | Command (root) |
|--------|----------------|
| Start both servers in watch-mode | `pnpm dev` |
| Unit tests (Vitest) | `pnpm test` |
| End-to-end prompt eval | `pnpm test:e2e` |
| Type-check all workspaces | `pnpm -r tsc --noEmit` |
| Lint & format | `pnpm lint && pnpm format` |

Scripts live in `package.json` **at the root**; individual workspaces may add overrides.

---

## 4. Style Guardrails

* **TypeScript strict** everywhere (`"strict": true` in base `tsconfig.json`).  
* **ESLint + Prettier** with Airbnb/TypeScript preset.  
* **Vitest** for both unit and integration tests.  
* React components: functional, hooks-only, no class components.

Agents should run `pnpm lint && pnpm test && pnpm test:e2e && pnpm -r tsc --noEmit` locally (or via CI) **before** opening a PR.

---

## 5. Merge Policy

1. **PR-only** workflow. Agents must never push directly to `main`.  
2. A PR is merge-ready when:  
   * CI is green on Node 18 and 20.  
   * Coverage delta ≥ 0 (we do not accept coverage regressions).  
   * No `eslint --max-warnings 0` violations.  
3. Human review may request changes; agents should respond with an updated PR.

---

## 6. Dependency Boundaries

* Use **OpenAI official SDK** (`openai`) for calls + embeddings.  
* No heavy frameworks (Nest, Next) — keep api layer lean.  
* Front-end state: React context or TanStack Query; avoid Redux or MobX.  
* All secrets live in `.env`; do **not** commit keys.

---

## 7. Forbidden Actions

* Publishing Docker images to public registries.  
* Creating cloud resources (S3 buckets, Vercel projects, etc.).  
* Writing to `.npmrc` or `.yarnrc`.  
* Committing `package-lock.json` (pnpm workspace uses `pnpm-lock.yaml`).

---

_End of AGENTS.md_
