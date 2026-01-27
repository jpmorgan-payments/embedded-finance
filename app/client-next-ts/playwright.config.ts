import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for E2E tests (e.g. SellSense demo URL/config tests).
 * Base URL is configurable via BASE_URL (default: deployed showcase).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'https://embedded-finance-dev.com',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
