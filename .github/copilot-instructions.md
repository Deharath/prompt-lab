# Copilot Contributor Guide for PromptLab

This document provides essential context for contributing to PromptLab. This is a strictly-typed, test-driven TypeScript monorepo that prioritizes clean architecture, comprehensive error handling, and automated quality assurance.

---

## 1. Development Environment & Commands

### Required Tools & Setup

- **Node.js:** Use version 18.x as specified in the CI workflow.
- **Package Manager:** All commands must use `pnpm`.
- **Environment:** Copy `.env.example` to `.env` and fill in the API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`) for local development.

### Key Commands

- **Install Dependencies:** `pnpm install`
- **Build All Packages:** `pnpm build` (Required before testing)
- **Run All Tests:** `pnpm test`
- **Run Linter:** `pnpm lint`
- **Run Type-Checker:** `pnpm tsc`
- **Apply DB Migrations:** `pnpm run migrate` (For schema changes)

**Note:** There are no pre-commit hooks (`husky`, `lint-staged`). Code quality is enforced by the CI pipeline.

---

## 2. Repository Structure & Critical Files

- **`apps/api`**: The main Express.js server. Defines routes and server logic.
- **`apps/web`**: The React + Vite frontend. Contains all UI components and pages.
- **`packages/api`**: **The heart of the application.** Contains all core business logic, services, and provider integrations. **Most backend work belongs here.**
- **`packages/evaluator`**: A pure TypeScript library for metrics calculation.
- **`db/`**: Contains the Drizzle ORM schema (`schema.ts`) and migration files.

### The Top 5 "Must-Read" Files

1.  **`packages/api/src/jobs/service.ts`**: Contains the core business logic for the entire job lifecycle.
2.  **`apps/api/src/routes/jobs.ts`**: Defines the main API endpoints, showing validation and service integration patterns.
3.  **`db/schema.ts`**: The single source of truth for the database structure.
4.  **`apps/web/src/store/jobStore.ts`**: The main Zustand store for the frontend, showing how UI state is managed.
5.  **`packages/api/src/errors/ApiError.ts`**: Defines the custom error classes used throughout the backend.

---

## 3. Key Architectural Patterns & Guidelines

### TypeScript & Code Quality

- **Strictly No `any`:** The `any` type is forbidden. If an external library lacks types, create a specific interface.
- **Async/Await Only:** Use `async/await` exclusively for all asynchronous operations. Do not use `.then()` chains.
- **Component Structure:** React components are self-contained. Logic, types, and JSX are co-located in a single `.tsx` file.

### Monorepo Architecture

- **Directional Imports:** `apps` can import from `packages`. **Packages must never import from `apps`.**
- **Workspace Aliases:** Always use workspace aliases for imports (e.g., `import { createJob } from '@prompt-lab/api'`). Never use relative paths like `../packages/api/src`.

### Backend (API) Patterns

- **Data Access:** All database interactions must use the shared Drizzle ORM client exported from `packages/api/src/db/index.ts`. Queries are built directly in service functions.
- **Error Handling:** Use the custom error classes from `ApiError.ts` (`ValidationError`, `NotFoundError`, etc.). In routes, wrap logic in `try...catch` blocks and pass errors to the `next(error)` function.
- **API Response Shape:**
  - **Success:** Return the raw data object directly (e.g., `res.json(job)`).
  - **Error:** The global error middleware will format this into `{ error: string, code?: string }`.

### Frontend (Web) Patterns

- **State Management:** Use the existing Zustand store (`jobStore.ts`). Add new properties and actions to this co-located state slice. Async actions are defined as `async` methods directly within the store creation logic.

### Testing

- **Frameworks:** Use **Vitest** for all tests and **React Testing Library (RTL)** for frontend components.
- **Mocking:** **All external network calls MUST be mocked.** Tests should be self-contained and never hit a real third-party API.
- **Database:** Integration tests should use an in-memory SQLite database.
