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
      '/jobs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn('Proxy error (API server may not be ready):', err.message);
          });
        },
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn('Proxy error (API server may not be ready):', err.message);
          });
        },
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn('Proxy error (API server may not be ready):', err.message);
          });
        },
      },
      '/dashboard': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/dashboard/, '/api/dashboard'),
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn('Proxy error (API server may not be ready):', err.message);
          });
        },
      },
    },
  },
});
