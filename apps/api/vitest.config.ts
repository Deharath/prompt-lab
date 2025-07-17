import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**', '**/*.d.ts'],
    environment: 'node',
    setupFiles: ['./test/setupTests.ts'], // Load global test foundation
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@prompt-lab/evaluation-engine': (() => {
        try {
          return new URL('../../packages/evaluation-engine/src', import.meta.url).pathname;
        } catch {
          return path.resolve(__dirname, '../../packages/evaluation-engine/src');
        }
      })(),
    },
  },
});
