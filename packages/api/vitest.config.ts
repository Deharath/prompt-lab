import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@prompt-lab/evaluator': resolve('../../evaluator/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./setupTests.ts'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    exclude: ['node_modules/**', '**/dist/**'],
    allowOnly: false,
    mockReset: false,
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
      },
    },
  },
});
