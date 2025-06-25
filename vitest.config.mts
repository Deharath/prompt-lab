import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@prompt-lab/evaluator': resolve('packages/evaluator/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    exclude: ['apps/web/test/**', 'node_modules/**'],
    allowOnly: false,
    mockReset: true,
    hookTimeout: 5000,
    deps: { inline: [/vitest/] },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json'],
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
        'packages/evaluator/**': {
          statements: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
