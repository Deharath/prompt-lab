# PromptLab MVP — Codex Agent Guide

\_This file is for autonomous agents (OpenAI C## 8. Pitfalls & Gotchas (Updated v0.1.0)

### **Architecture & Imports**

- **Shared package usage**: Always import from `@prompt-lab/api`, never from `packages/api/src/*` directly
- **Circular dependencies**: `apps/api` imports from `packages/api`, but never vice versa
- **Provider interface**: Use the unified interface in `packages/api/src/providers/index.ts`

### **Build & Development**

- **Alias hygiene**: If `@prompt-lab/evaluator` or `@prompt-lab/api` fails to resolve, verify `paths` in `tsconfig.json`
- **Lockfile updates**: Run `pnpm install` at repo root and commit `pnpm-lock.yaml`; CI uses `--frozen-lockfile`
- **Composite builds**: Ensure packages set `"composite": true` and proper `references` - run `pnpm tsc` after changes
- **Cross-platform**: Use Node.js path utilities, avoid shell-specific commands

### **Database & Jobs**

- **SQLite auto-creation**: Database and tables auto-initialize on first run
- **Job status flow**: pending → running → completed/failed (track via job.status)
- **SSE streaming**: Use EventSource for frontend, proper error handling for connection drops

### **Testing & CI**

- **Test isolation**: Tests use in-memory SQLite databases (no shared state)
- **Coverage gates**: Evaluator must maintain ≥90% coverage, web tests are optional
- **Provider mocking**: Always mock OpenAI/Gemini APIs in tests (never hit real endpoints)
- **Docker entrypoint**: Path is `apps/api/dist/src/index.js` (not `apps/api/dist/index.js`)

### **Migration from Legacy**

- **Frontend migration**: Web app still uses `/eval` endpoint (needs `/jobs` migration)
- **Cost tracking**: Not yet implemented (planned for v0.2.0)
- **Job cancellation**: AbortController not yet in provider interfacec.) collaborating in this repo.\_

---

## 1. Project Snapshot

PromptLab is a **scientific method for LLM prompting** with real-time streaming execution against:

- **OpenAI GPT-4.1** (plus `gpt-4.1-mini` / `gpt-4.1-nano`)
- **Google Gemini 2.5 Flash**

**Current Status (v0.1.0):**

- ✅ Enterprise-grade backend with job-based execution
- ✅ Real-time streaming via Server-Sent Events
- ✅ 40+ tests passing with 100% evaluator coverage
- 🟡 Frontend uses legacy `/eval` API (modernization planned for v0.2.0)

---

## 2. Folder Map

| Path                  | Purpose                                                         |
| --------------------- | --------------------------------------------------------------- |
| `apps/api`            | Express server (routes, middleware) - imports from packages/api |
| `apps/web`            | React 19 + Vite frontend with streaming UI                      |
| `packages/api`        | **NEW**: Shared business logic (providers, jobs, database)      |
| `packages/evaluator`  | Pure-TS metrics library (exactMatch, cosineSim)                 |
| `packages/test-cases` | JSONL fixtures used in evaluation                               |
| `scripts`             | Utility scripts (e.g., JSONL lint)                              |
| `.github/workflows`   | GitHub Actions CI configs                                       |
| `tsconfig.json`       | Base TS config with project references                          |

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

- **OpenAI SDK** for GPT-4.1 endpoints with streaming support.
- **Google Generative AI SDK** (or REST) for Gemini 2.5 Flash.
- **SQLite + Drizzle ORM** for job persistence and database operations.
- **Server-Sent Events (SSE)** for real-time streaming completions.
- No heavy frameworks; lean Express with pluggable provider architecture.
- Secrets via `.env`; never commit keys.

---

## 7. Key API Architecture (Updated v0.1.0)

### **Shared Business Logic** (`packages/api`)

- **LLMProvider interface**: `complete(prompt, options): AsyncGenerator<string>`
- **OpenAIProvider**: Full streaming implementation for GPT-4.1 series
- **GeminiProvider**: Full streaming implementation for Gemini 2.5 Flash
- **Job Service**: CRUD operations with SQLite persistence
- **Database**: Drizzle ORM with auto-initializing schema

### **Express Server** (`apps/api`)

- **Routes**: `/jobs` (POST, GET, SSE streaming), `/eval` (legacy)
- **Middleware**: Rate limiting, validation, CORS, error handling
- **Imports**: All business logic from `@prompt-lab/api` package

### **Job-Based Execution**

- POST `/jobs` → Creates job → Returns job ID
- GET `/jobs/:id/stream` → Server-Sent Events with real-time tokens
- SQLite persistence with status tracking (pending → running → completed)

### **Recent Refactoring (v0.1.0)**

- ✅ Eliminated code duplication between `apps/api` and `packages/api`
- ✅ Unified provider implementations under single interface
- ✅ Consolidated database logic into shared package
- ✅ All tests updated to use shared implementations
- **Extensible**: Add new providers by implementing the interface

### Job System & Database

- **Job table**: `id`, `prompt`, `provider`, `model`, `status`, `result`, `metrics`, `createdAt`, `updatedAt`
- **SQLite + Drizzle ORM**: Automatic schema creation and migrations
- **Job statuses**: `pending`, `running`, `completed`, `failed`

### Streaming Endpoints

- `POST /jobs` - Create job, returns job metadata
- `GET /jobs/:id/stream` - SSE stream with real-time tokens and final metrics
- `POST /eval` - Run evaluation against test datasets

---

## 8. Forbidden Actions

- Publishing Docker images publicly
- Creating cloud resources automatically
- Writing to `.npmrc` / `.yarnrc`
- Committing `package-lock.json` (we use `pnpm-lock.yaml`)

---

## 9. Pitfalls & Gotchas

- **Alias hygiene:** if `@prompt-lab/evaluator` fails to resolve, verify the `paths` entry in `tsconfig.json` and the `imports` section in each package’s `package.json`.
- **Lockfile updates:** run `pnpm install` at repo root and commit the updated `pnpm-lock.yaml`; CI uses `--frozen-lockfile` so mismatches fail.
- **Composite TypeScript builds:** ensure packages set `"composite": true` and include proper `references`—run `pnpm tsc` after changes to catch stray build info.
- **Coverage blockers & workflow quirks:** coverage thresholds live in `vitest.config.mts`; the Docker smoke test may hide failing services. Keep an eye on Node 18 vs. 22 runs.

workspace alias @prompt-lab/evaluator

_End of AGENTS.md_
