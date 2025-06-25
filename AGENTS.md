# PromptLab MVP — Codex Agent Guide

_This file is for autonomous agents (OpenAI Codex, etc.) collaborating in this repo._

---

## 1. Project Snapshot

PromptLab is a minimalist playground for **testing, scoring and version-controlling prompts** against two ultra-cheap, up-to-date families:

- **OpenAI GPT-4.1** (plus `gpt-4.1-mini` / `gpt-4.1-nano`)
- **Google Gemini 2.5 Flash**

---

## 2. Folder Map

| Path                  | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `apps/api`            | Express + Zod service. Entry → `src/index.ts` |
| `apps/web`            | React 18 + shadcn/ui front-end (Vite)         |
| `packages/evaluator`  | Pure-TS metrics lib                           |
| `packages/test-cases` | JSONL fixtures used in eval                   |
| `scripts`             | Utility scripts (e.g., JSONL lint)            |
| `.github/workflows`   | GitHub Actions CI configs                     |
| `tsconfig.json`       | Base TS config shared across apps             |

_Agents must update this table before adding new top-level dirs._

---

## 3. Canonical Dev Commands

| Intent                  | Command                    |
| ----------------------- | -------------------------- |
| Dev servers (API + Web) | `pnpm dev`                 |
| Unit tests              | `pnpm test`                |
| Prompt E2E              | `pnpm test:e2e`            |
| Type-check              | `pnpm tsc`                 |
| Lint / Format           | `pnpm lint && pnpm format` |

---

## 4. Style Guardrails

- **Strict TS**, ESLint (Airbnb+TS) & Prettier
- **Vitest** for unit / integration
- React hooks-only

Agents must run the full command suite above before opening PRs.

---

## 5. Merge Policy

1. PR-only, never push straight to `main`.
2. CI green on Node 18 & 22, evaluator coverage ≥90%, zero ESLint warnings.
3. Human reviewer may require changes; agent amends the PR.

---

## 6. Dependency Boundaries

- **OpenAI SDK** for GPT-4.1 endpoints.
- **Google Generative AI SDK** (or REST) for Gemini 2.5 Flash.
- No heavy frameworks; lean Express.
- Secrets via `.env`; never commit keys.

---

## 7. Forbidden Actions

- Publishing Docker images publicly
- Creating cloud resources automatically
- Writing to `.npmrc` / `.yarnrc`
- Committing `package-lock.json` (we use `pnpm-lock.yaml`)

---

## 8. Pitfalls & Gotchas

- **Alias hygiene:** if `@prompt-lab/evaluator` fails to resolve, verify the `paths` entry in `tsconfig.json` and the `imports` section in each package’s `package.json`.
- **Lockfile updates:** run `pnpm install` at repo root and commit the updated `pnpm-lock.yaml`; CI uses `--frozen-lockfile` so mismatches fail.
- **Composite TypeScript builds:** ensure packages set `"composite": true` and include proper `references`—run `pnpm tsc` after changes to catch stray build info.
- **Coverage blockers & workflow quirks:** coverage thresholds live in `vitest.config.mts`; the Docker smoke test may hide failing services. Keep an eye on Node 18 vs. 22 runs.

workspace alias @prompt-lab/evaluator

_End of AGENTS.md_
