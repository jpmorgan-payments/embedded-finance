/**
 * SellSense Demo – URL configuration tests (subagent-style)
 *
 * Covers all scenarios, themes, content tones, views, and fullscreen+component
 * combinations. Run against a deployed or local SellSense demo.
 *
 * Usage:
 *   npx playwright test tests/e2e/sellsense-demo-urls.spec.ts
 *   BASE_URL=https://embedded-finance-dev.com npx playwright test tests/e2e/sellsense-demo-urls.spec.ts
 */

import { expect, test } from '@playwright/test';

const BASE_URL =
  process.env.BASE_URL || 'https://embedded-finance-dev.com/sellsense-demo';

const SCENARIOS = [
  'New Seller - Onboarding',
  'Onboarding - Seller with prefilled data',
  'Onboarding - Docs Needed',
  'Linked Bank Account',
  'Seller with Limited DDA',
  'Seller with Payments DDA',
];

const THEMES = [
  'Empty',
  'Default Blue',
  'Salt Theme',
  'Create Commerce',
  'SellSense',
  'PayFicient',
];

const CONTENT_TONES = ['Standard', 'Friendly'];

const VIEWS_ACTIVE = ['wallet', 'overview', 'transactions', 'linked-accounts', 'payout'];

const FULLSCREEN_COMPONENTS = [
  'accounts',
  'linked-accounts',
  'recipients',
  'make-payment',
  'transactions',
  'onboarding',
];

function scenarioToQuery(s: string) {
  return encodeURIComponent(s).replace(/%20/g, '+');
}

test.describe('SellSense Demo – Scenarios (subagent 1)', () => {
  for (const scenario of SCENARIOS) {
    test(`scenario: ${scenario}`, async ({ page }) => {
      const q = `scenario=${scenarioToQuery(scenario)}`;
      await page.goto(`${BASE_URL}?${q}`, { waitUntil: 'domcontentloaded' });
      expect(page.url()).toContain('sellsense-demo');
      expect(page.url()).toContain('scenario=');
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('SellSense Demo – Themes (subagent 2)', () => {
  for (const theme of THEMES) {
    test(`theme: ${theme}`, async ({ page }) => {
      const q =
        theme === 'Custom'
          ? 'theme=Custom&customTheme=%7B%22baseTheme%22%3A%22SellSense%22%2C%22variables%22%3A%7B%7D%7D'
          : `theme=${encodeURIComponent(theme).replace(/%20/g, '+')}`;
      await page.goto(`${BASE_URL}?${q}`, { waitUntil: 'domcontentloaded' });
      expect(page.url()).toContain('sellsense-demo');
      expect(page.url()).toContain('theme=');
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('SellSense Demo – Content tone (subagent 3)', () => {
  for (const tone of CONTENT_TONES) {
    test(`contentTone: ${tone}`, async ({ page }) => {
      await page.goto(`${BASE_URL}?contentTone=${tone}`, {
        waitUntil: 'domcontentloaded',
      });
      expect(page.url()).toContain('contentTone=');
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('SellSense Demo – Views (subagent 4)', () => {
  const scenario = 'Seller+with+Payments+DDA';
  for (const view of VIEWS_ACTIVE) {
    test(`view: ${view}`, async ({ page }) => {
      await page.goto(`${BASE_URL}?scenario=${scenario}&view=${view}`, {
        waitUntil: 'domcontentloaded',
      });
      expect(page.url()).toContain(`view=${view}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
  test('view: onboarding (New Seller)', async ({ page }) => {
    await page.goto(
      `${BASE_URL}?scenario=New+Seller+-+Onboarding&view=onboarding`,
      { waitUntil: 'domcontentloaded' }
    );
    expect(page.url()).toContain('view=onboarding');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('SellSense Demo – Fullscreen + component (subagent 5)', () => {
  for (const component of FULLSCREEN_COMPONENTS) {
    test(`fullscreen component: ${component}`, async ({ page }) => {
      const view = component === 'onboarding' ? '&view=onboarding' : '';
      await page.goto(
        `${BASE_URL}?fullscreen=true&component=${component}&theme=Empty${view}`,
        { waitUntil: 'domcontentloaded' }
      );
      expect(page.url()).toContain('fullscreen=true');
      expect(page.url()).toContain(`component=${component}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('SellSense Demo – Combined (subagent 6)', () => {
  test('scenario + theme + contentTone + view', async ({ page }) => {
    await page.goto(
      `${BASE_URL}?scenario=Seller+with+Payments+DDA&theme=SellSense&contentTone=Friendly&view=wallet`,
      { waitUntil: 'domcontentloaded' }
    );
    expect(page.url()).toContain('theme=SellSense');
    expect(page.url()).toContain('contentTone=Friendly');
    expect(page.url()).toContain('view=wallet');
    await expect(page.locator('body')).toBeVisible();
  });
});
