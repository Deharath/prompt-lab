/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  resolve: {
    alias: {
      '@prompt-lab/shared-types': path.resolve(
        dirname,
        '../../packages/shared-types/dist',
      ),
    },
  },
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
  },
  optimizeDeps: {
    include: [
      'markdown-to-jsx',
      'react-markdown',
      'react-diff-viewer-continued',
    ],
  },
  test: {
    environment: process.env.VITEST_BROWSER === 'true' ? 'jsdom' : 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    silent: false,
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Simplified configuration - removed complex dual-project setup
    browser: process.env.VITEST_BROWSER === 'true' ? {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    } : undefined,
  },
});
