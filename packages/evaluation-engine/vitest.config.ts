import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.{js,ts}'],
    exclude: ['test/**/*.integration.test.ts'], // Run integration tests separately
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
