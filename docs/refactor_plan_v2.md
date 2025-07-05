# Frontend Refactoring Plan v2

## **Introduction**

This document outlines a revised and expanded plan to complete the frontend refactoring initiative. It builds upon the original `plan_for_frontend_refactor.md` and incorporates findings from a recent code audit. The goal is to address all remaining technical debt, improve code quality, and establish a solid foundation for future development.

## **Overall Status: Partially Completed**

The team has made significant progress in refactoring the frontend, but several key action items from the original plan were not fully addressed. The most critical omission is the incomplete refactoring of `Home.tsx`, which remains a complex component with too many responsibilities.

---

### **Phase 1: Complete the `Home.tsx` Takedown**

*   **Objective:** Fully refactor `Home.tsx` into a simple layout component and make `PromptWorkspace.tsx` a self-contained and reusable component.
*   **Priority:** High
*   **Status:** In Progress
*   **Tasks:**
    1.  **Move State and Logic:**
        *   **[COMPLETED]** Relocate the `template`, `inputData`, `provider`, and `model` state from `Home.tsx` to `PromptWorkspace.tsx`.
        *   **[COMPLETED]** Move the `handleRun` and `handleStartWithExample` functions into `PromptWorkspace.tsx`.
    2.  **Simplify `Home.tsx`:**
        *   **[PENDING]** Remove all state and logic that is not directly related to layout management (e.g., sidebar visibility).
        *   **[PENDING]** `Home.tsx` should only be responsible for rendering the main layout components.
    3.  **Cleanup:**
        *   **[PENDING]** Delete the legacy `apps/web/src/components/Workspace/PromptWorkspace.tsx` file.

---

### **Phase 2: Finalize Code Organization**

*   **Objective:** Eliminate all remaining legacy code and ensure the codebase adheres to the documented standards.
*   **Priority:** Medium
*   **Status:** Completed
*   **Tasks:**
    1.  **Remove Legacy API Exports:**
        *   **[COMPLETED]** Delete the legacy exports from `apps/web/src/api.ts`.
        *   **[COMPLETED]** Perform a global search to ensure no part of the application still relies on these exports.
        *   **[COMPLETED]** Run a full regression test to verify that all API interactions continue to function correctly.

---

### **Phase 3: Enhance Test Coverage and Automation**

*   **Objective:** Ensure the long-term stability and maintainability of the codebase with a robust testing strategy and more comprehensive automation.
*   **Priority:** Medium
*   **Tasks:**
    1.  **Write Comprehensive Tests:**
        *   Review the existing tests for `useJobStreaming`, `Header`, and `PromptWorkspace` and add any missing test cases to ensure full coverage of their functionality.
    2.  **Strengthen Pre-Commit Hooks:**
        *   Update the pre-commit hook to run not only the linter but also the full test suite (`pnpm test`) to prevent broken code from being committed.

---

### **Phase 4: Proactive Code Quality Improvements (New)**

*   **Objective:** Introduce new tools and practices to further improve code quality and developer experience.
*   **Priority:** Low
*   **Tasks:**
    1.  **Implement a More Opinionated Formatter:**
        *   Consider adopting a tool like `prettier-plugin-tailwindcss` to automatically sort Tailwind CSS classes, which can improve readability and consistency.
    2.  **Introduce Storybook:**
        *   Set up Storybook to create a living style guide and component library. This will make it easier to develop, test, and reuse components in isolation.
