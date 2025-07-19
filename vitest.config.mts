import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait(), tsconfigPaths()],
  resolve: {
    alias: {
      '@prompt-lab/evaluation-engine': resolve('packages/evaluation-engine/src/index.ts'),
      '@prompt-lab/shared-types': resolve('packages/shared-types/src/index.ts'),
    },
  },
  test: {
    // Run tests sequentially to prevent mock contamination
    sequence: {
      concurrent: false,
    },
    // Use projects for proper environment isolation
    projects: [
      // Node environment tests (evaluation-engine and API)
      {
        name: 'node-tests',
        plugins: [tsconfigPaths()],
        environment: 'node',
        globals: true,
        isolate: true,
        pool: 'threads',
        poolOptions: {
          threads: {
            singleThread: true,
            isolate: true,
          },
        },
        include: [
          'packages/evaluation-engine/test/**/*.{test,spec}.{js,ts}',
          'apps/api/test/**/*.{test,spec}.{js,ts}',
        ],
        exclude: ['src/**', '**/*.d.ts'],
        setupFiles: [resolve('./apps/api/test/setupTests.ts')],
        resolve: {
          alias: {
            '@prompt-lab/evaluation-engine': resolve('packages/evaluation-engine/src/index.ts'),
            '@prompt-lab/shared-types': resolve('packages/shared-types/src/index.ts'),
          },
        },
      },
      // Browser environment tests (web)
      {
        name: 'web-tests',
        plugins: [react(), wasm(), topLevelAwait()],
        environment: 'jsdom',
        globals: true,
        isolate: true,
        pool: 'threads',
        poolOptions: {
          threads: {
            isolate: true,
          },
        },
        include: [
          'apps/web/test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        exclude: ['src/**', '**/*.d.ts'],
        setupFiles: [resolve('./apps/web/src/setupTests.ts')],
        resolve: {
          alias: {
            '@prompt-lab/evaluation-engine': resolve('packages/evaluation-engine/src/index.ts'),
            '@prompt-lab/shared-types': resolve('packages/shared-types/src/index.ts'),
          },
        },
      },
    ],
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
      ignoreEmptyLines: true,
    },
  },
});
