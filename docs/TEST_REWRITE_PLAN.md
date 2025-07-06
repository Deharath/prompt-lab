# Test Suite Overhaul and Rewrite Plan

## 1. Introduction

This document outlines a comprehensive, multi-phase plan to address the current state of the project's test suite. Following a major frontend refactoring and a complete overhaul of the metrics system, the existing tests are no longer functional or relevant. A complete rewrite is necessary to ensure code quality, prevent regressions, and provide a stable foundation for future development.

The goal is to achieve a "green" CI pipeline with a robust, maintainable, and meaningful set of tests that accurately reflect the current architecture.

## 2. Analysis Summary

A review of the codebase and key architectural documents (`refactor_plan_v2.md`, `METRICS_ARCHITECTURE.md`) reveals two primary drivers for the test failures:

1.  **Frontend Refactoring:** The `apps/web` frontend has been significantly restructured. Monolithic components like `Home.tsx` have been broken down, state management has been centralized into Zustand stores (`workspaceStore.ts`), and the testing strategy has shifted to prioritize **Storybook** for component-level and visual testing.
2.  **Metrics System Overhaul:** The backend metrics calculation engine has been completely rewritten into a modular, service-oriented architecture located in `packages/api/src/lib`. The old evaluation system and its corresponding API endpoints have been deprecated, leading to breaking changes in data structures and API contracts.

Existing tests in `apps/api/test` and `apps/web/test` are still referencing the old, now non-existent, code, rendering them obsolete.

## 3. Guiding Principles

The new test suite will be developed with the following principles in mind:

- **Alignment with Architecture:** Tests will be structured to match the new frontend and backend architectures.
- **Focus on Value:** Prioritize tests that cover critical paths, business logic, and complex integrations over simple, low-risk code.
- **Maintainability:** Write clear, concise, and well-documented tests that are easy to understand and update.
- **Automation:** All tests will be fully automated and integrated into the CI pipeline.
- **Right Tool for the Job:**
  - Use **Vitest** for unit and integration testing of backend services and frontend logic.
  - Use **Storybook** for UI component testing, visual regression, and documenting component states, as established in the frontend refactor.
  - Use **integration tests** for verifying API endpoints and critical user workflows.

## 4. Actionable Plan

The rewrite will be executed in four distinct phases.

### Phase 1: Cleanup and Preparation

The first step is to establish a clean slate by removing obsolete files and ensuring the testing environment is correctly configured.

- **Task 1.1: Purge Obsolete Test Files:** Delete all `*.test.ts` and `*.test.tsx` files within `apps/api/test/` and `apps/web/test/`. This is not a refactor but a fresh start, and removing these files prevents confusion and noise.
- **Task 1.2: Verify Dependencies:** Audit `package.json` to ensure `vitest`, `storybook`, `@testing-library/react`, and other testing-related dependencies are up-to-date and correctly configured for the monorepo.
- **Task 1.3: Configure Test Runners:** Review and update `vitest.config.ts` in each workspace (`apps/api`, `apps/web`, `packages/*`) to ensure they have the correct setup, including path aliases, environment setup, and test file patterns.

### Phase 2: Backend API Test Implementation

This phase focuses on building a solid test foundation for the new metrics and API services, based on the `METRICS_ARCHITECTURE.md` document.

- **Task 2.1: Core Services Unit Tests:**
  - Create `sentimentService.test.ts` to test both `fast` (VADER) and `accurate` (DistilBERT) modes and the fallback mechanism.
  - Create `readabilityService.test.ts` to validate the calculations for all readability metrics.
  - Create `textWorker.test.ts` to test text preprocessing and tokenization utilities.
  - Create `keywordMetrics.test.ts` to test keyword matching, weighting, and scoring.
- **Task 2.2: Orchestrator Integration Tests:**
  - Create `metrics.test.ts` to test the main `calculateMetrics` orchestrator. Mock the individual services (Sentiment, Readability, etc.) to ensure they are being called correctly based on the input.
- **Task 2.3: API Endpoint Integration Tests:**
  - Create `quality-summary.integration.test.ts` to perform end-to-end tests on the `/api/quality-summary` endpoint. This will involve setting up a test database or mocking the `db` layer to test filtering, caching, and aggregation logic.

### Phase 3: Frontend Test Implementation

This phase implements the testing strategy outlined in `refactor_plan_v2.md`, with a strong focus on Storybook and targeted unit tests for business logic.

- **Task 3.1: Component Testing with Storybook:**
  - Create comprehensive Storybook stories for all major UI components in `apps/web/src/components`.
  - For each component, create stories that cover all relevant states: default, loading, error, disabled, and with various props.
  - Utilize Storybook's `play` functions to test user interactions (e.g., button clicks, form inputs).
- **Task 3.2: State Management and Hooks Unit Tests:**
  - Create `workspaceStore.test.ts` to test the Zustand store logic, including actions like `executeJob` and `startWithExample`. Mock API calls to isolate the store's behavior.
  - Create tests for any custom hooks in `apps/web/src/hooks` that contain complex, non-trivial logic.
- **Task 3.3: Workflow Integration Tests:**
  - Create integration tests for critical user workflows, such as:
    - The full "Run Job" flow: from entering a prompt to displaying results and metrics.
    - The "Diff" workflow.
  - These tests will use Vitest with `@testing-library/react` to render pages/components and mock the backend API to verify that the frontend behaves correctly in response to different API states (loading, success, error).

### Phase 4: CI Integration and Finalization

The final phase ensures that the new test suite is fully integrated into the development lifecycle.

- **Task 4.1: Update CI Pipeline:** Modify the `ci.yml` workflow in `.github/workflows/` to execute the new test suites. Create separate jobs for backend and frontend tests to run in parallel.
- **Task 4.2: Enforce Quality Gates:** Configure the CI pipeline to fail if any test fails, blocking pull requests that introduce regressions.
- **Task 4.3: Full Suite Verification:** Perform a final run of the entire test suite both locally and in CI to confirm that all tests are passing reliably.
- **Task 4.4: Document Testing Strategy:** Create a `TESTING.md` file in the `docs` directory that explains the testing philosophy, how to run the different test suites, and how to add new tests.

## 5. Success Criteria

The project will be considered "green" and this plan complete when:

- All tasks in Phases 1-4 are completed.
- The CI pipeline passes consistently for all pull requests.
- Unit test coverage for critical backend services (`packages/api/src/lib`) is above 85%.
- All shared UI components have comprehensive Storybook stories covering their primary states and interactions.
- The `TESTING.md` documentation is published.
