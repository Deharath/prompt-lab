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

### Phase 2: Consolidate provider implementations (NEXT STEPS)
1. **Compare and merge** provider implementations:
   - `apps/api/src/providers/openai.ts` vs `packages/api/src/providers/openai.ts`
   - `apps/api/src/providers/gemini.ts` vs `packages/api/src/providers/gemini.ts`
2. **Keep the better implementation** in `packages/api`
3. **Update apps/api** to import from `@prompt-lab/api`
4. **Remove duplicate** provider files from `apps/api`

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
