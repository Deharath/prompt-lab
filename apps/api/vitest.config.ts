import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Use direct file path for reliable test resolution
      '@prompt-lab/api': path.resolve(
        __dirname,
        '../../packages/api/dist/index.js',
      ),
    },
  },
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**', '**/*.d.ts'],
    environment: 'node',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
