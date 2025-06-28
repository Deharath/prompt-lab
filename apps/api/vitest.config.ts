import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

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
      '@prompt-lab/api': new URL('../../packages/api/src', import.meta.url)
        .pathname,
    },
  },
});
