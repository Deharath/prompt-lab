import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@prompt-lab/evaluation-engine': resolve('packages/evaluation-engine/src/index.ts'),
      '@prompt-lab/evaluator': resolve('packages/evaluator/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'apps/web/src/setupTests.ts',
    exclude: ['node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      exclude: [
        '**/dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/coverage/**',
        '**/*.config.*',
        '**/scripts/**',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        'apps/web': {
          lines: 30,
        },
      },
      // Ignore missing source maps for .d.ts files
      ignoreEmptyLines: true,
    },
    // Vitest will automatically look for workspace configs
    // and run them appropriately.
  },
});
