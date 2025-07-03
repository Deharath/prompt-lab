import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [react(), tailwindcss(), wasm(), topLevelAwait()],
  server: {
    proxy: {
      '/jobs': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/dashboard': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/dashboard/, '/api/dashboard'),
      },
    },
  },
});
