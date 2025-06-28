import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@prompt-lab/api': resolve('packages/api/src/index.ts'),
      '@prompt-lab/evaluator': resolve('packages/evaluator/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    exclude: ['node_modules/**', '**/dist/**', 'apps/web/**'],
    coverage: {
      exclude: ['**/dist/**'],
      thresholds: {
        'apps/web': {
          lines: 30,
        },
      },
    },
    // Vitest will automatically look for workspace configs
    // and run them appropriately.
  },
});
