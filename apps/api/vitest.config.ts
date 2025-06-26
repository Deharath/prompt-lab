import { defineConfig } from 'vitest/config';

export default defineConfig({
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
