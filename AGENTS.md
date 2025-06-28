# PromptLab MVP — Agent Contributor Guide

_This file guides autonomous agents (OpenAI Codex, Claude, etc.) working in this repository._

---

## 1. Project Snapshot

PromptLab is a **scientific method for LLM prompting** with real-time streaming execution against:

- **OpenAI GPT-4** (plus variants)
- **Google Gemini 2.5 Flash**

**Current Status (v0.1.0):**

- ✅ Enterprise-grade backend with job-based execution
- ✅ Real-time streaming via Server-Sent Events
- ✅ 40+ tests passing with 100% evaluator coverage
- ✅ TypeScript monorepo with project references
- 🟡 Frontend uses legacy `/eval` API (modernization planned for v0.2.0)

---

## 2. Repository Structure

| Path                  | Purpose                                                         |
| --------------------- | --------------------------------------------------------------- |
| `apps/api`            | Express server (routes, middleware) - imports from packages/api |
| `apps/web`            | React 19 + Vite frontend with streaming UI                      |
| `packages/api`        | **Core**: Shared business logic (providers, jobs, database)     |
| `packages/evaluator`  | Pure-TS metrics library (exactMatch, cosineSim)                 |
| `packages/test-cases` | JSONL fixtures used in evaluation                               |
| `packages/jobs`       | **(removed)** legacy job utilities now in `packages/api`        |
| `packages/providers`  | **(removed)** legacy provider code now in `packages/api`        |
| `scripts`             | Utility scripts (e.g., JSONL lint)                              |
| `.github/workflows`   | GitHub Actions CI configs                                       |

**Note**: `packages/jobs` and `packages/providers` were consolidated into `packages/api`.

---

## 3. Development Commands

| Intent                  | Command         | Notes                        |
| ----------------------- | --------------- | ---------------------------- |
| Install dependencies    | `pnpm install`  | Run from repository root     |
| Dev servers (API + Web) | `pnpm dev`      | Starts both API and web      |
| Dev API only            | `pnpm dev:api`  | Express server on port 3000  |
| Dev Web only            | `pnpm dev:web`  | React app on port 5173       |
| Run all tests           | `pnpm test`     | Unit + integration tests     |
| Run API E2E tests       | `pnpm test:e2e` | End-to-end API tests         |
| Type-check all packages | `pnpm tsc`      | TypeScript compilation check |
| Lint all packages       | `pnpm lint`     | ESLint checks                |
| Format all files        | `pnpm format`   | Prettier formatting          |
| Build all packages      | `pnpm build`    | Production builds            |
| Clean build artifacts   | `pnpm clean`    | Remove dist/, node_modules   |

---

## 4. Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` types allowed
- **ESLint**: Airbnb + TypeScript rules, zero warnings required
- **Prettier**: Auto-formatting enforced
- **Testing**: Vitest for unit/integration, ≥90% coverage for evaluator
- **Architecture**: Clean separation between apps and packages

**Pre-commit requirements**: All commands below must pass:

```bash
pnpm tsc && pnpm lint && pnpm test
```

---

## 5. Architecture Guidelines

### **Import Rules**

- ✅ Import from workspace aliases: `@prompt-lab/api`, `@prompt-lab/evaluator`
- ❌ Never import directly from `packages/*/src/*`
- ✅ `apps/api` can import from `packages/api`
- ❌ Packages should never import from apps

### **TypeScript Configuration**

- Each package has independent `tsconfig.json` with full compiler options
- Maintains `"composite": true` for project references
- Clean builds required: remove `tsconfig.tsbuildinfo` if builds fail

### **Database & Jobs**

- SQLite with Drizzle ORM, auto-initializing schema
- Job flow: `pending` → `running` → `completed`/`failed`
- Server-Sent Events for real-time streaming

---

## 6. Testing Instructions

### **Running Tests**

```bash
# All tests with coverage
pnpm test

# Specific package tests
pnpm --filter @prompt-lab/evaluator test
pnpm --filter web test

# E2E tests
pnpm test:e2e
```

### **Test Requirements**

- Use in-memory SQLite for database tests
- Mock all external APIs (OpenAI, Gemini)
- Maintain ≥90% coverage for evaluator package
- All tests must pass before merging

### **Common Test Issues**

- Build failures: Run `pnpm clean && pnpm build`
- Import errors: Check workspace aliases in `tsconfig.json`
- Database issues: Tests use in-memory SQLite, no shared state

---

## 7. Docker & CI

### **Docker Commands**

```bash
# Build and run container
pnpm docker:run

# Manual Docker build
docker build -t promptlab:latest .
docker run -p 3000:3000 promptlab:latest
```

### **CI Pipeline**

- Runs on Node 18 & 22
- All tests must pass
- Zero ESLint warnings
- Docker smoke test included
- Entry point: `apps/api/dist/src/index.js`

---

## 8. Pull Request Guidelines

### **Title Format**

```
<type>: <description>

Examples:
fix: resolve TypeScript build configuration issues
feat: add streaming support for Gemini provider
docs: update API documentation
```

### **PR Requirements**

- Create PR, never push directly to `main`
- All CI checks must pass
- Include tests for new functionality
- Update documentation if needed
- Follow PR template in `.github/pull_request_template.md`

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
