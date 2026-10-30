import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite only exposes VITE_-prefixed env vars to client code by default
  // (a deliberate safeguard against accidentally bundling server secrets).
  // Explicitly allowing the ACADEMY_ prefix too lets the directory project's
  // config use shorter names without disabling that safeguard for anything
  // else — only vars starting with one of these two prefixes are exposed.
  envPrefix: ['VITE_', 'ACADEMY_'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        deleteAccountDir: resolve(__dirname, 'delete-account/index.html'),
        deleteAccountHtml: resolve(__dirname, 'delete-account.html'),
      },
    },
  },
});

