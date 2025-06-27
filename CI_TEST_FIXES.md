# CI Test Fixes Summary

## Problem

The API tests were failing in CI but passing locally due to:

1. **Missing environment variables**: CI doesn't have a `.env` file with API keys, while local development does
2. **Inconsistent import paths**: Some tests imported from source (`../src/index.ts`), others from compiled JS (`../dist/src/index.js`)
3. **Inadequate mocking**: Vitest mocks weren't properly intercepting API calls in all scenarios

## Root Cause Analysis

- **Local environment**: Tests passed because real API keys were present in `.env`, allowing actual API calls
- **CI environment**: Tests failed with 503 errors because no API keys were available and mocks weren't working properly
- **Import inconsistency**: Mixed use of source vs compiled imports broke mocking and dataset loading in different ways

## Solutions Implemented

### 1. Standardized Import Paths

All test files now consistently import from compiled JavaScript:

```javascript
// Before (inconsistent)
import { startServer } from '../src/index.ts'; // Some tests
import { startServer } from '../dist/src/index.js'; // Other tests

// After (consistent)
import { startServer } from '../dist/src/index.js'; // All tests
```

**Files updated:**

- `apps/api/test/eval.test.ts`
- `apps/api/test/eval.int.test.ts`
- `apps/api/test/e2e.test.ts`
- `apps/api/test/health.test.ts`
- `apps/api/test/jobs.test.ts`
- `apps/api/test/jobs.e2e.test.ts`

### 2. Enhanced Vitest Mocking

Implemented robust mocking patterns at multiple levels for maximum reliability:

```javascript
// Primary strategy: Mock the @prompt-lab/api module directly
vi.mock('@prompt-lab/api', async (importOriginal) => {
  const mod = await importOriginal() as any;
  return {
    ...mod,
    // Mock the evaluation function to return fake results
    evaluateWithOpenAI: vi.fn().mockImplementation(async (promptTemplate, testCase, _options) => ({
      id: testCase.id,
      prediction: 'mock completion',
      reference: testCase.expected,
      latencyMs: 100,
      tokens: 5,
    })),
    evaluateWithGemini: vi.fn().mockImplementation(async (promptTemplate, testCase, _options) => ({
      id: testCase.id,
      prediction: 'gem',
      reference: testCase.expected,
      latencyMs: 100,
      tokens: 5,
    })),
  };
});

// Fallback strategy: Also mock OpenAI and Gemini modules for direct usage
vi.mock('openai', () => {
  const mockOpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'mock completion' } }],
          usage: { total_tokens: 5 },
        }),
      },
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: [1, 0] }],
      }),
    },
  }));
  return {
    default: mockOpenAI,
  };
});

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'gem' },
      }),
    }),
  })),
}));
```

**Key improvements:**

- **Two-layer mocking**: Mocks both the high-level API functions and the underlying libraries
- **importOriginal pattern**: Preserves all non-mocked exports while replacing specific functions
- **Consistent mock responses**: All mocked evaluation functions return deterministic test data
- **CI compatibility**: This approach works regardless of Node.js module resolution differences

### 3. Build Dependencies

Ensured that the build step runs before tests to generate the required `dist` files:

- CI already runs `pnpm build` before `pnpm -r test`
- Local development now requires `pnpm build` before running tests that import from `dist`

## Test Results

After implementing these fixes:

- ✅ All 22 tests pass consistently
- ✅ Tests work both locally and should work in CI
- ✅ Mocking properly intercepts API calls when no keys are present
- ✅ Tests complete in ~4-6 seconds

## CI Workflow

The CI workflow now follows this pattern:

1. `pnpm install` - Install dependencies
2. `pnpm build` - Compile TypeScript to JavaScript
3. `pnpm -r test` - Run tests (which import from compiled JS)

This ensures that CI and local environments behave consistently.

## Key Learnings

1. **Import consistency matters**: Mixing source and compiled imports can break mocking
2. **Build-dependent tests**: Tests that import from `dist` require a build step first
3. **Environment parity**: CI and local environments need similar mocking strategies when API keys aren't available
4. **Multi-layer mocking**: Using both high-level API mocks and low-level library mocks ensures compatibility across environments
5. **Module resolution differences**: CI and local environments may resolve modules differently, requiring comprehensive mocking strategies
6. **Mock robustness**: Using `vi.fn().mockImplementation()` with `importOriginal` is more reliable than simple mock returns for complex API interactions

## Files Modified

- `apps/api/test/eval.test.ts` - Updated imports and mocking
- `apps/api/test/eval.int.test.ts` - Updated imports and mocking
- `apps/api/test/e2e.test.ts` - Updated imports and mocking
- `apps/api/test/health.test.ts` - Updated imports only
- `apps/api/test/jobs.test.ts` - Updated imports only
- `apps/api/test/jobs.e2e.test.ts` - Updated imports only

## Verification

Run the following commands to verify the fixes:

```bash
cd apps/api
pnpm clean          # Clean previous builds
pnpm build          # Build the application
pnpm test           # Run all tests
```

All tests should pass consistently with this workflow.
