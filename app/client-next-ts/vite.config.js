import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({ autoCodeSplitting: true }), viteReact()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Exclude Playwright e2e specs (they use @playwright/test, not Vitest)
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // OAS-generated types from embedded-components (for MSW handlers and type-safe mocks)
      '@ef-api/smbdo-schemas': resolve(
        __dirname,
        '../../embedded-components/src/api/generated/smbdo.schemas.ts'
      ),
      '@ef-api/ef-v1-schemas': resolve(
        __dirname,
        '../../embedded-components/src/api/generated/ef-v1.schemas.ts'
      ),
      '@ef-api/ep-recipients-schemas': resolve(
        __dirname,
        '../../embedded-components/src/api/generated/ep-recipients.schemas.ts'
      ),
      '@ef-api/ep-transactions-schemas': resolve(
        __dirname,
        '../../embedded-components/src/api/generated/ep-transactions.schemas.ts'
      ),
      '@ef-api/ep-accounts-schemas': resolve(
        __dirname,
        '../../embedded-components/src/api/generated/ep-accounts.schemas.ts'
      ),
    },
  },
});
