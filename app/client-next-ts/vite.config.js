import { resolve } from 'node:path';
import viteReact from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: './coverage',
      // Showcase app: SellSense + landing + shared UI + MSW + lib (not auxiliary demos)
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        '**/routeTree.gen.ts',
        '**/vitest.setup.ts',
        'src/components/year-in-review/**',
        'src/components/rum-dashboard/**',
        'src/components/embedded-payments-flow/**',
        'src/components/api-flow-explorer/**',
        'src/components/webhook-explorer/**',
        'src/components/partially-hosted/**',
        'src/components/custom/**',
        'src/content/**',
        'src/data/year-in-review-2025.ts',
        // Very large drawer UIs; behaviour covered by Playwright / manual QA
        'src/components/sellsense/theme-customization-drawer.tsx',
        'src/components/sellsense/content-token-editor-drawer.tsx',
        'src/components/sellsense/mock-api-editor-drawer.tsx',
        // TanStack route modules are thin re-exports; E2E covers navigation
        'src/routes/**',
        // Large layout shells wired to embedded library — smoke-tested via demo, not unit-isolated
        'src/components/sellsense/dashboard-layout.tsx',
        'src/components/sellsense/wallet-overview.tsx',
        'src/components/sellsense/info-modal.tsx',
        'src/components/sellsense/header.tsx',
        'src/components/sellsense/dashboard-overview.tsx',
        'src/components/sellsense/kyc-onboarding.tsx',
        'src/components/sellsense/theme-a11y-panel.tsx',
        'src/components/sellsense/ai-prompt-dialog.tsx',
        'src/components/sellsense/settings-drawer.tsx',
        'src/msw/browser.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@ef-docs': resolve(__dirname, '../../embedded-components/docs'),
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
