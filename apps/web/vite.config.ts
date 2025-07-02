import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
