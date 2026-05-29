import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for E2E tests (e.g. SellSense demo URL/config tests).
 * Base URL is configurable via BASE_URL (default: deployed showcase).
 *
 * Best practices: use locators with auto-waiting, web-first assertions,
 * trace on first retry for debugging. Prefer 'load' over 'networkidle' in tests.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'https://embedded-finance-dev.com',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
  },
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
