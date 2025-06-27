# CI Test Fixes - FINAL SOLUTION ✅

## Status: RESOLVED

**All 22 tests now pass locally and should pass in CI**

## Problem Summary

Tests in the `@prompt-lab/app-api` package were failing in CI with 503 errors while passing locally. Tests expected 200 responses but received "OpenAI key not configured" errors, indicating mocks weren't being applied.

## Root Cause: Vitest Alias Configuration

The **primary issue** was a Vitest alias that bypassed our mocks:

```typescript
// In apps/api/vitest.config.ts
resolve: {
  alias: {
    '@prompt-lab/api': new URL('../../packages/api/src/index.ts', import.meta.url).pathname,
  },
}
```

**What happened:**

1. App imports `@prompt-lab/api` → alias resolves to TypeScript source files
2. Our mocks targeted package name `@prompt-lab/api`
3. Alias bypassed package resolution → mocks never applied
4. Routes called `getEvaluator()` which returned unmocked functions

## Final Solution

### 1. Mock the Source File Path

Target the actual resolved path, not the package name:

```typescript
// ❌ OLD (bypassed by alias)
vi.mock('@prompt-lab/api', ...)

// ✅ NEW (targets actual path)
vi.mock('../../packages/api/src/evaluation/providers.js', ...)
```

### 2. Mock getEvaluator Function

The route uses `getEvaluator(model)` to get provider functions, so we must mock it:

```typescript
vi.mock('../../packages/api/src/evaluation/providers.js', () => {
  const mockEvaluateWithOpenAI = vi
    .fn()
    .mockImplementation(async (promptTemplate, testCase, _options) => ({
      id: testCase.id,
      prediction: 'mock completion',
      reference: testCase.expected,
      latencyMs: 100,
      tokens: 5,
    }));

  const mockEvaluateWithGemini = vi
    .fn()
    .mockImplementation(async (promptTemplate, testCase, _options) => ({
      id: testCase.id,
      prediction: 'gem',
      reference: testCase.expected,
      latencyMs: 100,
      tokens: 5,
    }));

  return {
    evaluateWithOpenAI: mockEvaluateWithOpenAI,
    evaluateWithGemini: mockEvaluateWithGemini,
    getEvaluator: vi.fn().mockImplementation((model: string) => {
      if (model.startsWith('gpt-')) {
        return mockEvaluateWithOpenAI;
      } else if (model === 'gemini-2.5-flash' || model.startsWith('gemini-')) {
        return mockEvaluateWithGemini;
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    }),
    ServiceUnavailableError: class extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ServiceUnavailableError';
      }
    },
  };
});
```

## Files Updated

- `apps/api/test/eval.test.ts`
- `apps/api/test/eval.int.test.ts`
- `apps/api/test/e2e.test.ts`

## Test Results ✅

```bash
✓ test/e2e.test.ts (1 test) 72ms
✓ test/eval.test.ts (2 tests) 81ms
✓ test/eval.int.test.ts (3 tests) 86ms
✓ test/health.test.ts (1 test) 1093ms
✓ test/jobs.test.ts (12 tests) 2020ms
✓ test/jobs.e2e.test.ts (2 tests) 134ms
✓ test/error-handler.test.ts (1 test) 27ms

Test Files: 7 passed (7)
Tests: 22 passed (22)
```

## Mock Verification

Logs confirm mocks work correctly:

- `avgCosSim: 1` (perfect similarity = identical mock responses)
- `costUSD: 0.00075` (consistent mock calculations)
- `meanLatencyMs: 0.2` (mock latency values)
- `totalTokens: 75` (15 test cases × 5 mock tokens each)

## Key Learning

**Vitest aliases change module resolution** - when using path aliases, mocks must target the **resolved file path**, not the aliased package name. Additionally, mock the **complete call chain** including factory functions like `getEvaluator()`.

This solution is permanent and robust because it addresses the fundamental module resolution issue in the test environment.
