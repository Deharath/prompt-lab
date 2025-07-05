# Refactoring Plan: ApiClient to Modern Hook-Based Architecture

This document outlines the step-by-step process for refactoring the legacy `ApiClient` into a modern, hook-based data fetching architecture using React Query. Each phase is designed to be a small, incremental, and verifiable step.

**Objective:** Replace the static `ApiClient` with a set of modular API functions and corresponding React Query hooks to improve testability, maintainability, and developer experience.

---

### **Phase 0: Preparation and Setup**

1.  **Create Directory Structure:**
    - Create the directory `apps/web/src/api/` to house the new API layer functions.
    - Create the directory `apps/web/src/hooks/api/` to house the new React Query hooks.

2.  **Create a Shared API Client:**
    - Create a new file: `apps/web/src/api/api-client.ts`.
    - Copy the `makeRequest` function, `ApiError` interface, and `parseDatesInObject` helper from the legacy `apps/web/src/api.ts` into this new file. Export them. This centralizes the core fetch logic and error handling.

---

### **Phase 1: Refactor `listJobs`**

1.  **API Layer:**
    - Create a new file: `apps/web/src/api/jobs.ts`.
    - Import `makeRequest` from `api-client.ts`.
    - Create and export an async function `listJobs` that calls `makeRequest<JobSummary[]>('/jobs')`.

2.  **Hook Layer:**
    - Create a new file: `apps/web/src/hooks/api/useListJobs.ts`.
    - Create a `useListJobs` hook that uses `useQuery` from React Query.
    - Set the `queryKey` to `['jobs']`.
    - Set the `queryFn` to the `listJobs` function from `apps/web/src/api/jobs.ts`.

3.  **Component Layer:**
    - Refactor `apps/web/src/components/HistoryDrawer.tsx` to use the `useListJobs` hook instead of `ApiClient.listJobs`.
    - Refactor `apps/web/src/store/jobStore.ts` to use the new hook for fetching the job history.

---

### **Phase 2: Refactor `fetchJob`**

1.  **API Layer:**
    - In `apps/web/src/api/jobs.ts`, add a `fetchJob(id: string)` function that calls `makeRequest<JobDetails>(`/jobs/${id}`)`.

2.  **Hook Layer:**
    - Create `apps/web/src/hooks/api/useFetchJob.ts`.
    - Create a `useFetchJob(jobId: string)` hook.
    - Set the `queryKey` to `['job', jobId]`.
    - Set the `queryFn` to `() => fetchJob(jobId)`.
    - Enable the query only when `jobId` is truthy.

3.  **Component/Store Layer:**
    - Refactor `apps/web/src/pages/RunViewerPage/useRunViewer.ts` to use the `useFetchJob` hook.
    - Refactor `apps/web/src/store/workspaceStore.ts` (`loadJobData` function) to use `fetchJob`.

---

### **Phase 3: Refactor `diffJobs`**

1.  **API Layer:**
    - In `apps/web/src/api/jobs.ts`, add a `diffJobs(baseId: string, compareId: string)` function.

2.  **Hook Layer:**
    - Create `apps/web/src/hooks/api/useDiffJobs.ts`.
    - Create a `useDiffJobs(baseId, compareId)` hook.
    - Set the `queryKey` to `['diff', baseId, compareId]`.
    - Set the `queryFn` to `() => diffJobs(baseId, compareId)`.

3.  **Component Layer:**
    - Refactor `apps/web/src/components/DiffView.tsx` to use the `useDiffJobs` hook.
    - Refactor all `DiffPage` variants (`DiffPage.tsx`, `DiffPageNew.tsx`, `DiffPageOld.tsx`) to use the hook.

---

### **Phase 4: Refactor `createJob` (Mutation)**

1.  **API Layer:**
    - In `apps/web/src/api/jobs.ts`, add a `createJob(body: JobRequest)` function.

2.  **Hook Layer:**
    - Create `apps/web/src/hooks/api/useCreateJob.ts`.
    - Create a `useCreateJob` hook using `useMutation`.
    - Set the `mutationFn` to `createJob`.
    - In the `onSuccess` callback, use `queryClient.invalidateQueries({ queryKey: ['jobs'] })` to trigger a refetch of the job list.

3.  **Component Layer:**
    - Refactor `apps/web/src/hooks/useJobStreaming.ts` to use the `useCreateJob` mutation hook.

---

### **Phase 5: Refactor `deleteJob` (Mutation)**

1.  **API Layer:**
    - In `apps/web/src/api/jobs.ts`, add a `deleteJob(id: string)` function.

2.  **Hook Layer:**
    - Create `apps/web/src/hooks/api/useDeleteJob.ts`.
    - Create a `useDeleteJob` hook using `useMutation`.
    - Set the `mutationFn` to `deleteJob`.
    - In the `onSuccess` callback, invalidate the `['jobs']` query.

3.  **Component Layer:**
    - Refactor `apps/web/src/components/AppSidebar/useAppSidebar.ts` to use the `useDeleteJob` hook.

---

### **Phase 6: Refactor `streamJob`**

1.  **API Layer:**
    - In `apps/web/src/api/jobs.ts`, move the `streamJob` function from `ApiClient`.

2.  **Hook Layer:**
    - Create `apps/web/src/hooks/api/useStreamJob.ts`.
    - This hook will not use `useQuery`. It will wrap the `streamJob` logic, manage the `EventSource` lifecycle with `useEffect`, and expose the stream's state (`data`, `error`, `isDone`) using `useState`.

3.  **Component Layer:**
    - Refactor `apps/web/src/hooks/useJobStreaming.ts` to use the new `useStreamJob` hook instead of calling `ApiClient.streamJob` directly.

---

### **Phase 7: Refactor Remaining Endpoints**

1.  **API Layer:**
    - Create `apps/web/src/api/dashboard.ts` and move `fetchDashboardStats`.
    - Create `apps/web/src/api/quality.ts` and move `fetchQualitySummary`.

2.  **Hook Layer:**
    - Create `useDashboardStats` and `useQualitySummary` hooks.

3.  **Store/Component Layer:**
    - Refactor `dashboardStore.ts` and `useQualitySummary.ts` to use their respective new hooks.

---

### **Phase 8: Final Cleanup**

1.  **Verify Removal:**
    - Perform a global search for `ApiClient`. Ensure there are no remaining usages in the application code (mocks in test files are acceptable for now).

2.  **Delete Legacy File:**
    - Delete the old `apps/web/src/api.ts` file.

3.  **Final Verification:**
    - Run the full test suite (`pnpm test`).
    - Run the linter (`pnpm lint`).
    - Manually test the application to ensure all functionality related to data fetching works as expected.
