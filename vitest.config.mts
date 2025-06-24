import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
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
