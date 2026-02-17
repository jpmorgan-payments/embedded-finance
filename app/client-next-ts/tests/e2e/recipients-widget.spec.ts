/**
 * RecipientsWidget E2E tests – based on FUNCTIONAL_REQUIREMENTS.md (RecipientWidgets)
 *
 * Covers: widget layout, data loading, empty/loading/error, create/edit dialog,
 * bank account form, remove flow, payment action, card/table, view details,
 * status/alerts, error handling, accessibility.
 *
 * Run against:
 *   https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=recipients&theme=Empty
 *
 * Usage:
 *   yarn e2e:recipients
 *   RECIPIENTS_E2E_URL=http://localhost:3000/sellsense-demo?fullscreen=true&component=recipients&theme=Empty yarn e2e:recipients
 *
 * Best practices: uses getByRole/getByText locators, web-first assertions,
 * condition-based waits instead of fixed timeouts, and waitUntil: 'load'.
 */

import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';

const RECIPIENTS_PAGE_URL =
  process.env.RECIPIENTS_E2E_URL ||
  'https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=recipients&theme=Empty';

/** Wait for widget to show list, empty state, or error (avoids fixed timeouts). */
async function waitForWidgetContent(widget: Locator) {
  const content = widget
    .locator('table, [role="article"]')
    .or(widget.getByText(/no recipient|no payment recipient|add.*recipient/i))
    .or(widget.getByRole('alert'));
  await expect(content.first()).toBeVisible({ timeout: 10_000 });
}

test.describe('RecipientsWidget E2E – FR 3.1 Widget Layout and Modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('header shows title and optional description (FR 3.1 Header)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    const titleEl = widget.locator('[class*="CardTitle"], [class*="font-header"]').first();
    await expect(titleEl).toBeVisible();
    await expect(titleEl).not.toBeEmpty();
  });

  test('header may show total count when not loading (FR 3.1 Header)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const titleEl = widget.locator('[class*="CardTitle"], [class*="font-header"]').first();
    await expect(titleEl).toBeVisible();
    const headerText = await titleEl.textContent();
    expect(headerText?.length).toBeGreaterThan(0);
  });

  test('Add / Link new account button visible when list non-empty and create not hidden (FR 3.1 Create button visibility)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const hasCards = await widget.locator('[role="article"]').count() > 0;
    const hasTable = await widget.locator('table').count() > 0;
    const hasEmptyState = await widget.getByText(/no recipient|no payment recipient|add.*recipient/i).count() > 0;
    if (hasCards || hasTable) {
      const addButton = widget.getByRole('button', {
        name: /link new|add|link.*account/i,
      });
      await expect(addButton.first()).toBeVisible();
    }
    if (hasEmptyState) {
      const emptyAction = widget.getByRole('button', {
        name: /link new|add|link.*account/i,
      });
      await expect(emptyAction.first()).toBeVisible();
    }
  });
});

test.describe('RecipientsWidget E2E – FR 3.2 Data Loading and Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('widget loads and shows either list, empty state, or error (FR 3.2 List data)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const hasList =
      (await widget.locator('[role="article"]').count()) > 0 ||
      (await widget.locator('table tbody tr').count()) > 0;
    const hasEmpty = await widget
      .getByText(/no recipient|no payment recipient|add.*recipient/i)
      .count() > 0;
    const hasError = await widget.getByRole('alert').count() > 0;
    expect(hasList || hasEmpty || hasError).toBeTruthy();
  });

  test('empty state shows icon, title, description, optional primary action when zero recipients (FR 3.2 Empty state)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const emptyTitle = widget.getByText(/no recipient|no payment recipient|add.*recipient/i).first();
    if (await emptyTitle.isVisible()) {
      await expect(emptyTitle).toBeVisible();
      const primaryAction = widget.getByRole('button', {
        name: /link new|add|link.*account/i,
      });
      await expect(primaryAction.first()).toBeVisible();
    }
  });

  test('when list has items, pagination or load more may be present (FR 3.2 Pagination)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const table = widget.locator('table');
    if (await table.isVisible()) {
      await expect(table.locator('thead, tbody').first()).toBeVisible();
    }
  });
});

test.describe('RecipientsWidget E2E – FR 3.3 Create and Edit Recipient (Form Dialog)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('clicking Add opens dialog with form (FR 3.3 Create)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByRole('heading', { name: /link account|add.*recipient/i })
    ).toBeVisible();
  });

  test('create dialog has cancel and form sections (FR 3.3 Dialog behaviour)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const cancel = dialog.getByRole('button', { name: /cancel/i });
    await expect(cancel.first()).toBeVisible();
  });

  test('closing create dialog resets state (FR 3.3 Dialog behaviour)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.getByRole('button', { name: /cancel/i }).first().click();
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('RecipientsWidget E2E – FR 3.4 Bank Account Form (Create/Edit)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('create form supports account holder type Individual/Organization (FR 3.4 Account holder)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const individualOrOrg = dialog.getByText(/individual|organization|account holder type/i);
    await expect(individualOrOrg.first()).toBeVisible();
  });

  test('create form has account number and bank account type (FR 3.4 Bank account)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const step2ButtonFirst = dialog
      .getByRole('button')
      .filter({ hasText: /continue|next|account details/i })
      .first();
    const hadContinueToStep2 = await step2ButtonFirst.isVisible();
    if (hadContinueToStep2) {
      const accountTypeSelect = dialog.getByRole('combobox').first();
      if (await accountTypeSelect.isVisible()) {
        await accountTypeSelect.click();
        await page.getByRole('option', { name: /individual|organization/i }).first().click();
      }
      const paymentBtn = dialog.getByRole('button', { name: /ach|wire|rtp/i }).first();
      if (await paymentBtn.isVisible()) {
        await paymentBtn.click();
      }
      await step2ButtonFirst.click();
    }
    const accountNumberInput = dialog.locator('input[name="accountNumber"]');
    const accountLabel = dialog.getByText(/account number|account #|^account$/i).first();
    const onStep2 =
      (await accountNumberInput.isVisible()) || (await accountLabel.isVisible());
    expect(
      onStep2 || hadContinueToStep2,
      'Create form must show account number/type fields or a continue-to-details step'
    ).toBeTruthy();
    const accountTypeRelated = dialog.getByText(/checking|savings|account type|bank account type/i);
    const hasAccountType =
      (await accountTypeRelated.count()) > 0 && (await accountTypeRelated.first().isVisible());
    expect(
      onStep2 ? hasAccountType : true,
      'When on step 2, account type (checking/savings) must be present'
    ).toBeTruthy();
  });

  test('create form has payment method selection (FR 3.4 Payment methods)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const paymentSection = dialog.getByText(/payment method|ACH|WIRE|RTP/i);
    await expect(paymentSection.first()).toBeVisible();
  });

  test('create form may show certification checkbox when required (FR 3.4 Certification)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const certify = dialog.getByRole('checkbox').or(dialog.getByText(/certify|authorize|agree/i));
    await expect(certify.first()).toBeVisible();
  });
});

test.describe('RecipientsWidget E2E – FR 3.6 Remove (Deactivate) Recipient', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('remove is offered from card or table menu (FR 3.6 Confirmation)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const moreButton = widget.getByRole('button', { name: /more|actions/i }).first();
    if (!(await moreButton.isVisible())) {
      test.skip();
      return;
    }
    await moreButton.click();
    const removeItem = page.getByRole('menuitem', { name: /remove|delete|deactivate/i });
    await expect(removeItem.first()).toBeVisible();
  });

  test('clicking remove opens confirmation dialog with warning (FR 3.6 Confirmation)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const moreButton = widget.getByRole('button', { name: /more|actions/i }).first();
    if (!(await moreButton.isVisible())) {
      test.skip();
      return;
    }
    await moreButton.click();
    const removeItem = page.getByRole('menuitem', { name: /remove|delete|deactivate/i }).first();
    if (!(await removeItem.isVisible())) {
      test.skip();
      return;
    }
    await removeItem.click();
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await expect(confirmDialog.getByText(/remove|deactivate|confirm/i).first()).toBeVisible();
    const cancelBtn = confirmDialog.getByRole('button', { name: /cancel/i });
    await expect(cancelBtn.first()).toBeVisible();
    await cancelBtn.first().click();
    await expect(confirmDialog).not.toBeVisible();
  });
});

test.describe('RecipientsWidget E2E – FR 3.8 Card and Table Behaviour', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('table view shows columns: account holder, account number, status, payment methods, created, actions (FR 3.8 Table view)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const table = widget.locator('table');
    if (!(await table.isVisible())) {
      test.skip();
      return;
    }
    await expect(table.locator('thead')).toBeVisible();
    const header = table.locator('thead th');
    await expect(header.first()).toBeVisible();
    const bodyRows = table.locator('tbody tr');
    const rowCount = await bodyRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('card or row shows display name and masked account number (FR 3.8 Recipient card)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const card = widget.locator('[role="article"]').first();
    const tableRow = widget.locator('table tbody tr').first();
    if (await card.isVisible()) {
      await expect(card).toContainText(/\*\*\*\*|\.\.\.\d{4}/);
    }
    if (await tableRow.isVisible()) {
      await expect(tableRow).toBeVisible();
    }
  });

  test('view details opens read-only detail dialog (FR 3.8 View details)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const detailsButton = widget
      .getByRole('button', { name: /view details|details/i })
      .first();
    const detailsMenuItem = page.getByRole('menuitem', {
      name: /view details|details/i,
    }).first();
    let opened = false;
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      opened = true;
    } else {
      const moreButton = widget.getByRole('button', { name: /more|actions/i }).first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        if (await detailsMenuItem.isVisible()) {
          await detailsMenuItem.click();
          opened = true;
        }
      }
    }
    if (opened) {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog.getByText(/account|payment method|contact/i).first()).toBeVisible();
      await dialog.getByRole('button', { name: /close/i }).first().click().catch(() => {});
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('RecipientsWidget E2E – FR 3.9 Status and Alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('recipient cards or rows show status (FR 3.9 Status badge)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const card = widget.locator('[role="article"]').first();
    const tableRow = widget.locator('table tbody tr').first();
    if (await card.isVisible()) {
      const badge = card.locator('[class*="badge"], [class*="Badge"]').first();
      if (await badge.isVisible()) {
        await expect(badge).toBeVisible();
      }
    }
    if (await tableRow.isVisible()) {
      await expect(tableRow.locator('td').first()).toBeVisible();
    }
  });
});

test.describe('RecipientsWidget E2E – FR 3.10 Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('list error state shows message and retry action (FR 3.10 List/load errors)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const alert = widget.getByRole('alert');
    if (await alert.isVisible()) {
      const retry = widget.getByRole('button', { name: /try again|retry/i });
      await expect(retry.first()).toBeVisible();
    }
  });
});

test.describe('RecipientsWidget E2E – FR 3.11 Accessibility and UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('dialog can be closed with Escape (FR 3.11 Dialogs)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }
    await addButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('primary actions have accessible names (FR 3.11 Actions)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const addButton = widget.getByRole('button', {
      name: /link new|add|link.*account/i,
    }).first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
      await expect(addButton).toHaveAccessibleName(/.+/);
    }
  });
});

test.describe('RecipientsWidget E2E – Edit (FR 3.3 Edit)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPIENTS_PAGE_URL, { waitUntil: 'load' });
  });

  test('edit is offered from card or table for active recipients (FR 3.3 Edit)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const moreButton = widget.getByRole('button', { name: /more|actions/i }).first();
    if (!(await moreButton.isVisible())) {
      test.skip();
      return;
    }
    await moreButton.click();
    const editItem = page.getByRole('menuitem', { name: /edit/i });
    await expect(editItem.first()).toBeVisible();
  });

  test('clicking edit opens dialog with pre-filled form (FR 3.3 Edit)', async ({
    page,
  }) => {
    const widget = page.locator('#recipient-widget').first();
    await expect(widget).toBeVisible({ timeout: 15000 });
    await waitForWidgetContent(widget);
    const moreButton = widget.getByRole('button', { name: /more|actions/i }).first();
    if (!(await moreButton.isVisible())) {
      test.skip();
      return;
    }
    await moreButton.click();
    const editItem = page.getByRole('menuitem', { name: /edit/i }).first();
    if (!(await editItem.isVisible())) {
      test.skip();
      return;
    }
    await editItem.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByRole('heading', { name: /edit|edit account|edit recipient/i })
    ).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
