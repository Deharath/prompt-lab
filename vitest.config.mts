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
    exclude: ['node_modules/**', '**/dist/**'],
    // Vitest will automatically look for workspace configs
    // and run them appropriately.
  },
});
