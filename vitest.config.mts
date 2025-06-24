import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    allowOnly: false,
    mockReset: true,
    hookTimeout: 5000,
    deps: { inline: [/vitest/] },
    coverage: { reporter: ['text', 'json'] },
  },
});
