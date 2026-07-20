/**
 * PaymentFlowFX - Interactive Stories
 *
 * Play-driven stories that emulate the end-to-end creation of a new cross-border
 * (FX) recipient (SPECIFICATION.md FR-FX-10). These mirror the domestic
 * `Core/PaymentFlow/Interactive Workflows` → "Add New Recipient" journey and add
 * the FX-specific "Recipient's account currency" capture, exercising the 16 PDP
 * credit currencies plus the domestic USD default.
 *
 * Two full end-to-end journeys are included:
 *   - `CreateInternationalRecipientEndToEnd` — creates a EUR recipient from the
 *     add-recipient form (currency → payment method → account details → save)
 *     and verifies the new payee is auto-selected on return.
 *   - `CompleteFxPaymentEndToEnd` — submits a cross-border payment for an
 *     existing GBP recipient (account → payee → method → amount → confirm) in
 *     `ratesheet` mode and verifies the success screen.
 *
 * NOTE: play functions here run as CI tests via the Storybook Vitest addon, so
 * the assertions favour resilient, accessible-role selectors over brittle DOM
 * queries.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { PaymentFlowFX } from '../PaymentFlowFX';
import { SUPPORTED_TARGET_CURRENCIES } from '../PaymentFlowFX.constants';
import {
  commonFxArgs,
  commonFxArgTypes,
  createPaymentFlowFXHandlers,
  ratesheetFxConfig,
  realtimeFxConfig,
} from './story-utils';

// ============================================================================
// Test helpers
// ============================================================================

/** Delay between interactions so the journey is watchable in Storybook. */
const delay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const STEP_DELAY = 600;

/** Scope queries to the open dialog. */
const getDialog = () =>
  within(document.querySelector('[role="dialog"]') as HTMLElement);

/** Radix Select renders its options in a portal on `document.body`. */
const getPortal = () => within(document.body);

/** Wait for the dialog to mount. */
const waitForDialog = async () => {
  await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) throw new Error('Dialog not found');
    },
    { timeout: 5000 }
  );
};

/** Structural match for Storybook's play `step` helper. */
type StepFn = (
  name: string,
  fn: () => void | Promise<void>
) => void | Promise<void>;

/**
 * Shared navigation: select the funding account, wait for the recipient list,
 * click "Add recipient", and confirm the inline recipient form is open with the
 * FX currency selector visible.
 */
const openAddRecipientForm = async (step: StepFn) => {
  await waitForDialog();
  const dialog = getDialog();

  await step('Select the funding account', async () => {
    await delay(STEP_DELAY);
    await waitFor(
      () => dialog.getAllByRole('button', { name: /main payments account/i }),
      { timeout: 5000 }
    );
    const accountButtons = dialog.getAllByRole('button', {
      name: /main payments account/i,
    });
    await userEvent.click(accountButtons[0]);
  });

  await step('Wait for recipients to load', async () => {
    await delay(STEP_DELAY);
    await waitFor(
      () => dialog.getByRole('button', { name: /alice johnson/i }),
      { timeout: 5000 }
    );
  });

  await step('Click "Add recipient"', async () => {
    await delay(STEP_DELAY);
    const addButton = await waitFor(
      () => dialog.getByRole('button', { name: /add.*recipient/i }),
      { timeout: 3000 }
    );
    await userEvent.click(addButton);
  });

  await step('Confirm the FX currency selector is shown', async () => {
    await delay(STEP_DELAY);
    const currencyTrigger = await waitFor(
      () => dialog.getByRole('combobox', { name: /account currency/i }),
      { timeout: 3000 }
    );
    // Defaults to USD (domestic) so existing behaviour is unchanged.
    expect(currencyTrigger).toHaveTextContent(/US Dollar/i);
  });

  return dialog;
};

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Beta/PaymentFlowFX/Interactive',
  component: PaymentFlowFX,
  tags: ['@core', '@payments'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: createPaymentFlowFXHandlers(),
    },
    // Interactive flows trigger background React Query refetches; ignore those
    // unhandled rejections so the deterministic assertions drive the result.
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    docs: {
      description: {
        component:
          'Interactive journeys that emulate creating a new international (FX) recipient and selecting from the 16 supported credit currencies (FR-FX-10).',
      },
    },
  },
  args: {
    ...commonFxArgs,
    open: true,
    fxConfig: realtimeFxConfig,
  },
  argTypes: commonFxArgTypes,
} satisfies Meta<typeof PaymentFlowFX>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Emulates creating a new EUR recipient: open the add-recipient form, pick
 * **EUR — Euro** from the currency selector, and confirm the cross-border hint
 * appears. Then switch to **VND — Vietnamese Dong** (the ISO code corrected from
 * the PDP "VDN" typo) to show the hint tracking the selection.
 */
export const CreateInternationalRecipient: Story = {
  play: async ({ step }) => {
    const dialog = await openAddRecipientForm(step);

    await step('Open the currency selector and choose EUR', async () => {
      await delay(STEP_DELAY);
      const currencyTrigger = dialog.getByRole('combobox', {
        name: /account currency/i,
      });
      await userEvent.click(currencyTrigger);

      const eurOption = await getPortal().findByRole(
        'option',
        { name: /EUR — Euro/i },
        { timeout: 3000 }
      );
      await userEvent.click(eurOption);

      // Trigger now reflects the selected non-USD currency.
      expect(currencyTrigger).toHaveTextContent(/EUR — Euro/i);
    });

    await step('Verify the cross-border hint for EUR', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          expect(
            dialog.getByText(/cross-border payout in EUR/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    await step('Switch the currency to VND', async () => {
      await delay(STEP_DELAY);
      const currencyTrigger = dialog.getByRole('combobox', {
        name: /account currency/i,
      });
      await userEvent.click(currencyTrigger);

      const vndOption = await getPortal().findByRole(
        'option',
        { name: /VND — Vietnamese Dong/i },
        { timeout: 3000 }
      );
      await userEvent.click(vndOption);

      expect(currencyTrigger).toHaveTextContent(/VND — Vietnamese Dong/i);
    });

    await step('Verify the cross-border hint updates to VND', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          expect(
            dialog.getByText(/cross-border payout in VND/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  },
};

/**
 * Opens the "Recipient's account currency" selector and verifies the full PDP
 * catalog is offered: USD (domestic) plus the 16 supported credit currencies,
 * each rendered with a friendly label (e.g. "AED — UAE Dirham").
 */
export const AddRecipientCurrencyCatalog: Story = {
  play: async ({ step }) => {
    const dialog = await openAddRecipientForm(step);

    await step('Open the currency selector', async () => {
      await delay(STEP_DELAY);
      const currencyTrigger = dialog.getByRole('combobox', {
        name: /account currency/i,
      });
      await userEvent.click(currencyTrigger);
      // Wait for the portal listbox to render its options.
      await getPortal().findByRole(
        'option',
        { name: /US Dollar/i },
        { timeout: 3000 }
      );
    });

    await step('Verify USD + 16 credit currencies are offered', async () => {
      const options = getPortal().getAllByRole('option');
      // 16 supported currencies + the domestic USD default.
      expect(options).toHaveLength(SUPPORTED_TARGET_CURRENCIES.length + 1);
    });

    await step('Spot-check friendly currency labels', async () => {
      const portal = getPortal();
      expect(
        portal.getByRole('option', { name: /AED — UAE Dirham/i })
      ).toBeInTheDocument();
      expect(
        portal.getByRole('option', { name: /BRL — Brazilian Real/i })
      ).toBeInTheDocument();
      expect(
        portal.getByRole('option', { name: /MXN — Mexican Peso/i })
      ).toBeInTheDocument();
      // The PDP lists Vietnam as "VDN"; we surface the correct ISO 4217 "VND".
      expect(
        portal.getByRole('option', { name: /VND — Vietnamese Dong/i })
      ).toBeInTheDocument();
    });
  },
};

// ============================================================================
// End-to-end journeys
// ============================================================================

/**
 * Full end-to-end creation of a new international recipient. Starting from the
 * add-recipient form, this journey picks EUR as the account currency, enables
 * the ACH method, advances to the account-details step, fills the recipient and
 * bank details, and saves. On success `PaymentFlowFX` selects the freshly
 * created payee and returns to the payment view (FR-FX-10).
 */
export const CreateInternationalRecipientEndToEnd: Story = {
  play: async ({ step }) => {
    const dialog = await openAddRecipientForm(step);
    const portal = getPortal();

    await step('Choose EUR as the recipient account currency', async () => {
      await delay(STEP_DELAY);
      const currencyTrigger = dialog.getByRole('combobox', {
        name: /account currency/i,
      });
      await userEvent.click(currencyTrigger);

      const eurOption = await portal.findByRole(
        'option',
        { name: /EUR — Euro/i },
        { timeout: 3000 }
      );
      await userEvent.click(eurOption);
      expect(currencyTrigger).toHaveTextContent(/EUR — Euro/i);
    });

    await step('Enable the ACH payment method', async () => {
      await delay(STEP_DELAY);
      const achCheckbox = await waitFor(
        () => dialog.getByRole('checkbox', { name: /ach/i }),
        { timeout: 3000 }
      );
      await userEvent.click(achCheckbox);
    });

    await step('Continue to the account-details step', async () => {
      await delay(STEP_DELAY);
      const continueButton = dialog.getByRole('button', {
        name: /continue to account details/i,
      });
      await userEvent.click(continueButton);
    });

    await step('Fill the recipient name', async () => {
      await delay(STEP_DELAY);
      const firstName = await dialog.findByLabelText(/first name/i, undefined, {
        timeout: 3000,
      });
      await userEvent.type(firstName, 'Jean');
      const lastName = dialog.getByLabelText(/last name/i);
      await userEvent.type(lastName, 'Dupont');
    });

    await step('Fill the bank account details', async () => {
      await delay(STEP_DELAY);
      const accountNumber = dialog.getByLabelText(/account number/i);
      await userEvent.type(accountNumber, '12345678901234567');

      // Only ACH is enabled, so a single "ACH Routing Number" field renders.
      const routing = dialog.getByLabelText(/ach routing number/i);
      await userEvent.type(routing, '021000021');
    });

    await step('Save the recipient', async () => {
      await delay(STEP_DELAY);
      const addButton = dialog.getByRole('button', {
        name: /add recipient/i,
      });
      await userEvent.click(addButton);
    });

    await step('Verify the new recipient is selected', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          expect(dialog.getAllByText(/jean dupont/i).length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );
    });
  },
};

/**
 * Full end-to-end cross-border payment submission. Selects the funding account,
 * an existing international recipient (Thames Trading, GBP), the ACH method, and
 * enters an amount, then confirms the payment and lands on the success screen.
 *
 * Uses `ratesheet` mode so the flow fetches `GET /accounts/{id}/ratesheets/current`,
 * locks the EXECUTABLE GBP rate, and submits `fxInformation.rateId` with the V3
 * transaction (SPECIFICATION.md §3.3).
 */
export const CompleteFxPaymentEndToEnd: Story = {
  args: {
    fxConfig: ratesheetFxConfig,
  },
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Select the funding account', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => dialog.getAllByRole('button', { name: /main payments account/i }),
        { timeout: 5000 }
      );
      const accountButtons = dialog.getAllByRole('button', {
        name: /main payments account/i,
      });
      await userEvent.click(accountButtons[0]);
    });

    await step('Select the GBP recipient (Thames Trading)', async () => {
      await delay(STEP_DELAY);
      const payeeButtons = await waitFor(
        () => dialog.getAllByRole('button', { name: /thames trading/i }),
        { timeout: 5000 }
      );
      await userEvent.click(payeeButtons[0]);
    });

    await step('Select the ACH payment method', async () => {
      await delay(STEP_DELAY);
      const achButtons = await waitFor(
        () => dialog.getAllByRole('button', { name: /ach/i }),
        { timeout: 5000 }
      );
      await userEvent.click(achButtons[0]);
    });

    await step('Enter the amount to send', async () => {
      await delay(STEP_DELAY);
      const amountInput = await dialog.findByLabelText(/you send/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '1000');
    });

    await step('Confirm the payment', async () => {
      await delay(STEP_DELAY);
      const confirmButtons = await dialog.findAllByRole('button', {
        name: /confirm payment/i,
      });
      await waitFor(() => expect(confirmButtons[0]).toBeEnabled(), {
        timeout: 5000,
      });
      await userEvent.click(confirmButtons[0]);
    });

    await step('Verify the success screen', async () => {
      await waitFor(
        () =>
          expect(dialog.getAllByText(/payment sent/i).length).toBeGreaterThan(
            0
          ),
        { timeout: 10000 }
      );
    });
  },
};
