// ============================================================
//  vite.config.js — Vite build/dev configuration
//  ============================================================
//  Vite is the build tool + dev server for the frontend.
//
//  Key pieces:
//  - react(): enables JSX and React fast-refresh during dev.
//  - server.proxy: during DEV ONLY, forwards /api requests to the
//    backend at localhost:5000. This avoids CORS headaches in dev and
//    lets the browser call same-origin /api/... URLs.
//    (In production, nginx does this proxying instead — see nginx.conf.)
// ============================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on all interfaces (reachable from containers)
    port: 3000,
    // Proxy API calls to the backend during development.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
