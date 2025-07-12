import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss(), wasm(), topLevelAwait()],
  resolve: {
    alias: {
      '@prompt-lab/shared-types': resolve(__dirname, '../../packages/shared-types/src'),
    },
  },
  server: {
    proxy: {
      '/jobs': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/dashboard': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/dashboard/, '/api/dashboard'),
      },
    },
  },
});
