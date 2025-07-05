### **Actionable Frontend Refactoring Plan**

#### **Introduction**

This document outlines a strategic plan to refactor and enhance the frontend codebase, based on the findings of the recent code audit. The audit confirmed that the application is built on a solid foundation with a modern tech stack. The following plan is designed to address the identified areas for improvement, focusing on reducing complexity, standardizing organization, and ensuring long-term maintainability and scalability.

The work is broken down into three phases:

- **Phase 1: High-Impact Refactoring:** Addressing the most critical complexity in `Home.tsx`.
- **Phase 2: Code Organization & Housekeeping:** Implementing consistent patterns and cleaning up minor redundancies.
- **Phase 3: Future-Proofing & Best Practices:** Establishing processes to maintain code quality as the application grows.

---

### **Phase 1: High-Impact Refactoring (The `Home.tsx` Takedown)**

**Goal:** Drastically reduce the complexity of the `Home.tsx` component to improve readability, testability, and separation of concerns. This is the highest priority item.

---

#### **Action Item 1.1: Decompose `Home.tsx` into Logical Components & Hooks**


- **Objective:** Break down the monolithic `Home.tsx` into smaller, single-responsibility components and abstract complex logic into custom hooks.
- **Priority:** **High**
- **Estimated Effort:** Large
- **Key Tasks / User Stories:**
  1.  **Extract the Header Component:**
      - Create a new component `apps/web/src/components/Layout/Header.tsx`.
      - Move all header-related UI and logic into this component, including:
        - `AppSidebar` mobile toggle button (`<Sheet>`).
        - `navigationItems` and the desktop navigation bar.
        - The `TokenSummary` display.
        - The `DarkModeToggle`.
      - The `Header` component will receive necessary state and callbacks as props (e.g., `onMenuClick`).

  2.  **Create a `PromptWorkspace` Component:**
      - Create a new component `apps/web/src/components/Workspace/PromptWorkspace.tsx`.
      - This component will encapsulate the core interactive area of the application.
      - Move the `UnifiedPanel` and `ModernLiveOutput` sections into it.
      - Migrate the state and logic directly related to these two panels, such as `input`, `prompt`, `jobResult`, and the token/cost calculation logic (`useMemo` hooks) into `PromptWorkspace`.

  3.  **Develop a `useJobStreaming` Custom Hook:**
      - Create a new hook at `apps/web/src/hooks/useJobStreaming.ts`.
      - Abstract all logic related to job execution and Server-Sent Events (SSE) streaming from `Home.tsx`.
      - This hook will manage:
        - The `EventSource` instance and its lifecycle.
        - State related to the streaming job (`isExecuting`, `jobResult`, `error`).
        - API calls to `createJob` and `streamJob`.
      - It should return a clean interface, e.g., `{ executeJob, jobResult, isExecuting, error, reset }`.

- **Acceptance Criteria:**
  - `Home.tsx` is reduced to a layout component, primarily orchestrating the `Header`, `AppSidebar`, and `PromptWorkspace` components.
  - The `Header.tsx` and `PromptWorkspace.tsx` components are created and functional.
  - The `useJobStreaming.ts` hook contains all streaming logic and is used by `PromptWorkspace.tsx`.
  - All original functionality, including real-time updates and calculations, remains intact.
  - The application is fully testable at the component and hook level.

---

### **Phase 2: Code Organization & Housekeeping**

**Goal:** Enforce consistent code organization patterns and eliminate minor redundancies to improve developer experience and code discoverability.

---

#### **Action Item 2.1: Standardize Component Directory Structure**


- **Objective:** Create a predictable and consistent file structure for all components.
- **Priority:** **Medium**
- **Estimated Effort:** Small
- **Key Tasks / User Stories:**
  1.  **Define and Document the Rule:** Establish a clear rule in the project's `CONTRIBUTING.md`:
      > "A component must be placed in its own directory (e.g., `components/MyComponent/index.tsx`) if it has, or is expected to have, any of the following: sub-components, dedicated hooks, style files, or test files. Simple, single-file components can reside in a shared directory (e.g., `components/ui/Button.tsx`)."
  2.  **Refactor Existing Components:** Apply this rule to the codebase.
      - Move components like `DarkModeToggle.tsx` into the `components/ui/` directory, as it's a generic, reusable element.
      - Ensure `AppSidebar` is correctly structured as `components/AppSidebar/index.tsx` if it's a major component, or consolidate if it's just a single file with no sub-dependencies.

- **Acceptance Criteria:**
  - All components in `apps/web/src/components` follow the documented organizational rule.
  - The project's file tree is cleaner and more intuitive to navigate.

#### **Action Item 2.2: Centralize Application Constants**


- **Objective:** Declutter components by moving static data to a dedicated constants file.
- **Priority:** **High** (Easy win)
- **Estimated Effort:** Small
- **Key Tasks / User Stories:**
  1.  Create a new file: `apps/web/src/constants/app.ts`.
  2.  Move static data like `SAMPLE_PROMPT`, `SAMPLE_INPUT`, and `navigationItems` from `Home.tsx` into this new file and export them.
  3.  Update `Home.tsx` (or other relevant components) to import these values from `@/constants/app`.

- **Acceptance Criteria:**
  - No static, reusable data is hardcoded within component files.
  - All such constants are imported from a central, discoverable location.

#### **Action Item 2.3: Review and Refine `useUtilities.ts`**


- **Objective:** Proactively prevent `useUtilities.ts` from becoming a "junk drawer" for miscellaneous hooks.
- **Priority:** **Low**
- **Estimated Effort:** Small
- **Key Tasks / User Stories:**
  1.  **Analyze `useUtilities.ts`:** Review the current hooks within the file.
  2.  **Split if Necessary:** If the file contains more than one distinct, unrelated hook, split each one into its own file (e.g., `useToggle.ts`, `useWindowEvent.ts`).
  3.  **Establish a Guideline:** Add to `CONTRIBUTING.md`: "New hooks should be created in their own file within the `hooks/` directory and have a single, clear responsibility."

- **Acceptance Criteria:**
  - Every hook in the `hooks/` directory has a single, well-defined purpose.
  - The team has a clear guideline for creating future hooks.

#### **Action Item 2.4: Clean Up Legacy API Exports**


- **Objective:** Remove redundant code from the API client to simplify the codebase.
- **Priority:** **Low**
- **Estimated Effort:** Small
- **Key Tasks / User Stories:**
  1.  **Confirm Requirement:** Verify with the development team that backward compatibility for the legacy exports is no longer required.
  2.  **Remove Code:** Delete the legacy exports from `api.ts` (e.g., `export const createJob = ApiClient.createJob.bind(ApiClient);`).
  3.  **Verify Integrity:** Perform a global search to ensure no part of the application still relies on these exports and run a full regression test.

- **Acceptance Criteria:**
  - The legacy exports are removed from `api.ts`.
  - The application continues to function correctly with all API interactions.

---

### **Phase 3: Future-Proofing & Best Practices**

**Goal:** Enhance the codebase with automated checks and documentation to ensure these new standards are maintained over time.

---

#### **Action Item 3.1: Enhance Test Coverage**


- **Objective:** Ensure the newly refactored code is robust and maintainable by writing comprehensive tests.
- **Priority:** **Medium**
- **Estimated Effort:** Medium
- **Key Tasks / User Stories:**
  1.  Write unit tests for the new `useJobStreaming` hook, mocking the API client to test its state management and lifecycle logic.
  2.  Write component tests for the new `Header` and `PromptWorkspace` components to verify rendering and user interactions.
  3.  Establish a policy requiring new features and refactors to be accompanied by corresponding tests.

- **Acceptance Criteria:**
  - The critical logic in `useJobStreaming` is covered by unit tests.
  - The new major components have component/integration tests.
  - Code coverage either increases or remains at an acceptable, agreed-upon level.

#### **Action Item 3.2: Implement Automated Code Quality Checks**


- **Objective:** Automatically enforce code quality standards to prevent issues like high complexity from recurring.
- **Priority:** **Medium**
- **Estimated Effort:** Medium
- **Key Tasks / User Stories:**
  1.  **Configure ESLint for Complexity:** Add a rule to your ESLint configuration to flag functions or components that exceed a defined complexity threshold (e.g., using `"complexity": ["error", 10]`).
  2.  **Set Up Pre-Commit Hooks:** Use a tool like Husky to run linters (ESLint, Prettier) and tests automatically before a commit is made, providing immediate feedback to developers.

- **Acceptance Criteria:**
  - The CI/CD pipeline or pre-commit hook will fail if a component's complexity exceeds the set threshold.
  - Code formatting and linting are automatically enforced across the team.
