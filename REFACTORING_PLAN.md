# API Architecture Refactoring Plan

## Current Issue
- Code duplication between `apps/api/src/providers/` and `packages/api/src/providers/`
- `apps/api` (Express server) doesn't use `packages/api` (shared library)
- Both contain similar but slightly different provider implementations

## Proposed Solution

### Phase 1: Establish packages/api as the source of truth
1. ✅ **DONE**: Add missing `tsconfig.json` to `packages/api`
2. ✅ **DONE**: Create main `index.ts` export file for `packages/api`
3. ✅ **DONE**: Add `@prompt-lab/api` path mapping to root tsconfig

### Phase 2: Consolidate provider implementations (COMPLETED ✅)
1. ✅ **DONE**: Compare and merge provider implementations:
   - ✅ Both implementations were nearly identical 
   - ✅ Kept the better implementation in `packages/api` (named exports)
2. ✅ **DONE**: Update apps/api to import from `@prompt-lab/api`
   - ✅ Updated `apps/api/src/routes/jobs.ts` to import `getProvider` from `@prompt-lab/api`
   - ✅ Updated test mocks to use `@prompt-lab/api` instead of local providers
   - ✅ Added path mapping resolution to vitest config
3. ✅ **DONE**: Remove duplicate provider files from `apps/api`
   - ✅ Removed entire `apps/api/src/providers/` directory
4. ✅ **DONE**: Fix build and module resolution issues
   - ✅ Added packages/api reference to apps/api tsconfig
   - ✅ Fixed ES module exports in packages/api
   - ✅ Added proper .js extensions to imports in packages/api

### Phase 3: Migrate other shared logic
1. Move database logic that should be shared
2. Move job service logic that should be shared  
3. Keep Express routes and server-specific code in `apps/api`

## Architecture Goals
```
apps/api/          - Express server, routes, middleware
  └── src/
      ├── index.ts           - Server entry point  
      ├── routes/            - HTTP route handlers
      └── middleware/        - Express-specific middleware

packages/api/      - Shared business logic
  └── src/
      ├── index.ts           - Main exports
      ├── providers/         - LLM provider implementations
      ├── jobs/              - Job processing logic
      └── db/                - Database schema and queries
```

This follows the monorepo pattern where:
- `apps/*` = deployable applications
- `packages/*` = reusable libraries
