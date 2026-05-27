/**
 * OnboardingFlow – SellSense showcase scenario smoke tests.
 *
 * Covers four representative journeys:
 * - US LLC from empty DB (gateway → LLC → overview).
 * - US Sole proprietorship from empty DB (gateway → sole owner → overview).
 * - US LLC with rich prefilled client (overview landing; section tiles + verify-business copy).
 * - US LLC documents-needed / doc-upload-only (Supporting documents screen).
 *
 * Run against deployed demo or local dev (MSW):
 *   yarn e2e:onboarding
 *   ONBOARDING_E2E_URL=http://localhost:3000/sellsense-demo yarn e2e:onboarding
 *
 * Scenario display names must match `SCENARIOS_CONFIG` in
 * `src/components/sellsense/scenarios-config.ts`.
 */

import { expect, test } from '@playwright/test';

const DEMO_BASE = (
  process.env.ONBOARDING_E2E_URL ?? 'https://embedded-finance-dev.com/sellsense-demo'
).replace(/\/$/, '');

function fullscreenOnboardingUrl(scenarioDisplayName: string): string {
  const params = new URLSearchParams({
    fullscreen: 'true',
    component: 'onboarding',
    theme: 'Empty',
    scenario: scenarioDisplayName,
  });
  return `${DEMO_BASE}?${params.toString()}`;
}

test.describe('OnboardingFlow – SellSense scenarios', () => {
  test.describe.configure({ timeout: 120_000 });

  test('LLC minimal data: gateway → Registered business → LLC → Overview', async ({
    page,
  }) => {
    await page.goto(fullscreenOnboardingUrl('New Seller - Onboarding'), {
      waitUntil: 'load',
    });

    const shell = page.locator('#embedded-component-layout');
    await expect(shell).toBeVisible({ timeout: 45_000 });

    await expect(
      page.getByRole('heading', {
        name: /Let's help you get started/i,
      })
    ).toBeVisible({ timeout: 30_000 });

    await page
      .getByRole('radio', { name: /Registered business/i })
      .click();

    await page
      .getByRole('combobox', {
        name: /Select the specific legal structure/i,
      })
      .click();

    await page
      .getByRole('option', {
        name: /Limited Liability Company \(LLC\)/i,
      })
      .click();

    await page.getByRole('button', { name: /get started/i }).click();

    await expect(
      page.getByText(/Verify your business/i).first()
    ).toBeVisible({ timeout: 45_000 });
  });

  test('Sole proprietorship minimal data: gateway → sole owner → Overview', async ({
    page,
  }) => {
    await page.goto(fullscreenOnboardingUrl('New Seller - Onboarding'), {
      waitUntil: 'load',
    });

    const shell = page.locator('#embedded-component-layout');
    await expect(shell).toBeVisible({ timeout: 45_000 });

    await expect(
      page.getByRole('heading', {
        name: /Let's help you get started/i,
      })
    ).toBeVisible({ timeout: 30_000 });

    await page
      .getByRole('radio', {
        name: /I'm the sole owner of my business/i,
      })
      .click();

    await page.getByRole('button', { name: /get started/i }).click();

    await expect(
      page.getByText(/Verify your business/i).first()
    ).toBeVisible({ timeout: 45_000 });
  });

  test('LLC almost complete (prefilled client): Overview with section shortcuts', async ({
    page,
  }) => {
    await page.goto(
      fullscreenOnboardingUrl('Onboarding - Seller with prefilled data'),
      { waitUntil: 'load' }
    );

    const shell = page.locator('#embedded-component-layout');
    await expect(shell).toBeVisible({ timeout: 45_000 });

    // Gateway is skipped when the client already exists; Overview renders section CTAs.
    await expect(page.getByTestId('business-section-button')).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId('personal-section-button')).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.getByText(/Verify your business/i).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test('LLC documents needed (doc-upload-only): Supporting documents screen', async ({
    page,
  }) => {
    await page.goto(fullscreenOnboardingUrl('Onboarding - Docs Needed'), {
      waitUntil: 'load',
    });

    const shell = page.locator('#embedded-component-layout');
    await expect(shell).toBeVisible({ timeout: 45_000 });

    await expect(
      page.getByRole('heading', { name: /Supporting documents/i })
    ).toBeVisible({ timeout: 45_000 });
  });
});
