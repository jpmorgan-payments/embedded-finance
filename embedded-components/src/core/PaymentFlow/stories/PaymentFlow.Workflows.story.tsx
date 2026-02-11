/**
 * PaymentFlow - Interactive Workflows
 *
 * Automated demonstrations of complete user flows using Storybook play functions.
 * These stories automatically interact with the component to show key workflows.
 *
 * Each story demonstrates a specific user journey through the payment flow.
 *
 * Current PaymentFlow component structure (Feb 2026):
 * - Step 1: From (Account) - Select source account
 * - Step 2: To (Payee) - Select recipient or linked account via tabs
 * - Step 3: Payment Method - Select ACH, Wire, or RTP
 * - Amount & Memo - Always visible at bottom
 * - Review Panel - Right side on desktop, bottom sheet on mobile
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { PaymentFlow } from '../PaymentFlow';
import {
  commonArgs,
  commonArgTypes,
  createPaymentFlowHandlers,
  singleAccount,
} from './story-utils';

// ============================================================================
// Helper Functions
// ============================================================================

/** Delay between interactions for visibility */
const delay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const STEP_DELAY = 800;

/** Get the dialog container */
const getDialog = () =>
  within(document.querySelector('[role="dialog"]') as HTMLElement);

/** Wait for dialog to be ready */
const waitForDialog = async () => {
  await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) throw new Error('Dialog not found');
    },
    { timeout: 5000 }
  );
};

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Core/PaymentFlow/Interactive Workflows',
  component: PaymentFlow,
  tags: ['@core', '@payments'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: createPaymentFlowHandlers(),
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    docs: {
      description: {
        component:
          'Interactive workflows that automatically demonstrate complete payment flows. Watch each story to see the user journey.',
      },
    },
  },
  args: {
    ...commonArgs,
    open: true,
  },
  argTypes: commonArgTypes,
} satisfies Meta<typeof PaymentFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Complete Payment Flow
// ============================================================================

/**
 * Complete payment flow from start to finish.
 * Demonstrates selecting an account, payee, payment method, entering amount, and submitting.
 *
 * Flow order:
 * 1. Select From Account (Step 1)
 * 2. Select Payee/Recipient (Step 2)
 * 3. Select Payment Method (Step 3)
 * 4. Enter Amount and Memo
 * 5. Submit and verify success
 */
export const CompletePaymentFlow: Story = {
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Wait for accounts to load', async () => {
      // Wait for the From section to show an account (Main Payments Account)
      await waitFor(
        () => {
          const accountButton = dialog.getByRole('button', {
            name: /main payments account/i,
          });
          expect(accountButton).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await step('Select from account', async () => {
      await delay(STEP_DELAY);
      // Click on the Main Payments Account
      const accountButton = dialog.getByRole('button', {
        name: /main payments account/i,
      });
      await userEvent.click(accountButton);
    });

    await step('Wait for To section and select recipient', async () => {
      await delay(STEP_DELAY);
      // To section auto-opens after account selection - wait for recipients to load
      await waitFor(
        () => dialog.getByRole('button', { name: /alice johnson/i }),
        { timeout: 5000 }
      );
      const aliceButton = dialog.getByRole('button', {
        name: /alice johnson/i,
      });
      await userEvent.click(aliceButton);
    });

    await step('Wait for Payment Method section and select ACH', async () => {
      await delay(STEP_DELAY);
      // Payment Method section auto-opens after payee selection - wait for options
      const achButton = await waitFor(
        () => dialog.getByRole('button', { name: /ach/i }),
        { timeout: 5000 }
      );
      await userEvent.click(achButton);
    });

    await step('Enter payment amount', async () => {
      await delay(STEP_DELAY);
      const amountInput = await dialog.findByLabelText(/amount/i);
      await userEvent.clear(amountInput);
      await userEvent.type(amountInput, '250.00');
    });

    await step('Add optional memo', async () => {
      await delay(STEP_DELAY);
      const memoInput = await dialog.findByLabelText(/memo/i);
      await userEvent.type(memoInput, 'Monthly payment');
    });

    await step('Review and submit', async () => {
      await delay(STEP_DELAY);
      // Verify the review shows correct total amount (use getAllByText since amount shows twice)
      await waitFor(() => {
        const amounts = dialog.getAllByText('$250.00');
        expect(amounts.length).toBeGreaterThan(0);
      });

      const submitButton = dialog.getByRole('button', {
        name: /confirm payment/i,
      });
      await userEvent.click(submitButton);
    });

    await step('Verify success', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(dialog.getByText(/payment sent/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  },
};

// ============================================================================
// Single Account Flow (Auto-selects account)
// ============================================================================

/**
 * Payment flow with single account - auto-selects and starts at payee step.
 * Demonstrates streamlined flow when user only has one account.
 */
export const SingleAccountFlow: Story = {
  parameters: {
    msw: {
      handlers: createPaymentFlowHandlers({ accounts: singleAccount }),
    },
  },
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Verify account is auto-selected', async () => {
      await delay(STEP_DELAY);
      // With single account, it should auto-select and show in the From step
      await waitFor(
        () => {
          // The account name may appear in multiple places (step summary and review panel)
          const accountTexts = dialog.getAllByText(/main payments account/i);
          expect(accountTexts.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );
    });

    await step('Select a recipient', async () => {
      await delay(STEP_DELAY);
      // With auto-selected account, To section should be active
      await waitFor(
        () => dialog.getByRole('button', { name: /alice johnson/i }),
        { timeout: 5000 }
      );
      const aliceButton = dialog.getByRole('button', {
        name: /alice johnson/i,
      });
      await userEvent.click(aliceButton);
    });

    await step('Select payment method', async () => {
      await delay(STEP_DELAY);
      // Payment Method section auto-opens after payee selection - wait for options
      const achButton = await waitFor(
        () => dialog.getByRole('button', { name: /ach/i }),
        { timeout: 5000 }
      );
      await userEvent.click(achButton);
    });
  },
};

// ============================================================================
// Payee Selection Workflows
// ============================================================================

/**
 * Switch between Recipients and Linked Accounts tabs.
 * Demonstrates the tabbed payee selection interface.
 */
export const SwitchPayeeTabs: Story = {
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Select an account first', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => dialog.getAllByRole('button', { name: /main payments account/i }),
        { timeout: 5000 }
      );
      // Use getAllByRole since account name appears in both step and review panel
      const accountButtons = dialog.getAllByRole('button', {
        name: /main payments account/i,
      });
      await userEvent.click(accountButtons[0]);
    });

    await step(
      'Wait for To section and view Recipients tab (default)',
      async () => {
        await delay(STEP_DELAY);
        // To section auto-opens after account selection - wait for tabs
        const recipientsTab = await waitFor(
          () => dialog.getByRole('tab', { name: /recipients/i }),
          { timeout: 5000 }
        );
        expect(recipientsTab).toHaveAttribute('data-state', 'active');
      }
    );

    await step('Switch to Linked Accounts tab', async () => {
      await delay(STEP_DELAY);
      const linkedTab = dialog.getByRole('tab', { name: /linked accounts/i });
      await userEvent.click(linkedTab);
      expect(linkedTab).toHaveAttribute('data-state', 'active');
    });

    await step('Select a linked account', async () => {
      await delay(STEP_DELAY);
      // Use getAllByRole since name may appear in both list and review panel
      const johnButtons = await waitFor(
        () => dialog.getAllByRole('button', { name: /john doe/i }),
        { timeout: 3000 }
      );
      await userEvent.click(johnButtons[0]);
    });

    await step('Verify linked account is selected', async () => {
      await delay(STEP_DELAY);
      await waitFor(() => {
        // The To step should show John Doe in summary (may appear multiple places)
        const johnTexts = dialog.getAllByText(/john doe/i);
        expect(johnTexts.length).toBeGreaterThan(0);
      });
    });
  },
};

/**
 * Search for a specific recipient.
 * Demonstrates the search functionality in the payee list.
 */
export const SearchPayee: Story = {
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Select an account first', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => dialog.getAllByRole('button', { name: /main payments account/i }),
        { timeout: 5000 }
      );
      // Use getAllByRole since account name appears in both step and review panel
      const accountButtons = dialog.getAllByRole('button', {
        name: /main payments account/i,
      });
      await userEvent.click(accountButtons[0]);
    });

    await step('Wait for To section and recipients to load', async () => {
      await delay(STEP_DELAY);
      // To section auto-opens after account selection - wait for recipients
      await waitFor(
        () => dialog.getByRole('button', { name: /alice johnson/i }),
        { timeout: 5000 }
      );
    });

    await step('Search for "Tech"', async () => {
      await delay(STEP_DELAY);
      const searchInput = await waitFor(
        () => dialog.getByPlaceholderText(/search/i),
        { timeout: 3000 }
      );
      await userEvent.type(searchInput, 'Tech');
    });

    await step('Verify filtered results', async () => {
      await delay(STEP_DELAY);
      await waitFor(() => {
        // Tech Solutions should be visible
        expect(dialog.getByText(/tech solutions/i)).toBeInTheDocument();
        // Alice should not be visible
        expect(dialog.queryByText(/alice johnson/i)).not.toBeInTheDocument();
      });
    });

    await step('Clear search', async () => {
      await delay(STEP_DELAY);
      const searchInput = dialog.getByPlaceholderText(/search/i);
      await userEvent.clear(searchInput);
    });

    await step('Verify all recipients visible again', async () => {
      await delay(STEP_DELAY);
      await waitFor(() => {
        expect(dialog.getByText(/alice johnson/i)).toBeInTheDocument();
        expect(dialog.getByText(/tech solutions/i)).toBeInTheDocument();
      });
    });
  },
};

// ============================================================================
// Add New Payee Workflows
// ============================================================================

/**
 * Add a new recipient during the payment flow.
 * Demonstrates the inline recipient creation experience.
 */
export const AddNewRecipient: Story = {
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Select an account first', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => dialog.getAllByRole('button', { name: /main payments account/i }),
        { timeout: 5000 }
      );
      // Use getAllByRole since account name appears in both step and review panel
      const accountButtons = dialog.getAllByRole('button', {
        name: /main payments account/i,
      });
      await userEvent.click(accountButtons[0]);
    });

    await step('Wait for To section and recipients to load', async () => {
      await delay(STEP_DELAY);
      // To section auto-opens after account selection - wait for recipients
      await waitFor(
        () => dialog.getByRole('button', { name: /alice johnson/i }),
        { timeout: 5000 }
      );
    });

    await step('Click "Add Recipient" button', async () => {
      await delay(STEP_DELAY);
      // Look for the add button in the Recipients tab
      const addButton = await waitFor(
        () => dialog.getByRole('button', { name: /add.*recipient/i }),
        { timeout: 3000 }
      );
      await userEvent.click(addButton);
    });

    await step('Verify recipient form opens', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          // Should show the add recipient form - look for form header or back button
          const backButton = document.querySelector('[aria-label*="back" i]');
          expect(backButton).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    await step('Navigate back to payee selection', async () => {
      await delay(STEP_DELAY);
      const backButton = document.querySelector(
        '[aria-label*="back" i]'
      ) as HTMLElement;
      if (backButton) {
        await userEvent.click(backButton);
      }
    });

    await step('Verify back at payee list', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          expect(
            dialog.getByRole('tab', { name: /recipients/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  },
};

/**
 * Link a new external account during the payment flow.
 * Demonstrates the inline linked account creation experience.
 */
export const LinkNewAccount: Story = {
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Select an account first', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => dialog.getAllByRole('button', { name: /main payments account/i }),
        { timeout: 5000 }
      );
      // Use getAllByRole since account name appears in both step and review panel
      const accountButtons = dialog.getAllByRole('button', {
        name: /main payments account/i,
      });
      await userEvent.click(accountButtons[0]);
    });

    await step(
      'Wait for To section and switch to Linked Accounts tab',
      async () => {
        await delay(STEP_DELAY);
        // To section auto-opens after account selection - wait for tabs
        const linkedTab = await waitFor(
          () => dialog.getByRole('tab', { name: /linked accounts/i }),
          { timeout: 5000 }
        );
        await userEvent.click(linkedTab);
      }
    );

    await step('Click "Link Account" button', async () => {
      await delay(STEP_DELAY);
      const linkButton = await waitFor(
        () => dialog.getByRole('button', { name: /link.*account/i }),
        { timeout: 3000 }
      );
      await userEvent.click(linkButton);
    });

    await step('Verify link account form opens', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const backButton = document.querySelector('[aria-label*="back" i]');
          expect(backButton).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  },
};

// ============================================================================
// Payment Method Workflows
// ============================================================================

/**
 * Select different payment methods.
 * Demonstrates switching between ACH, Wire, and RTP.
 */
export const SelectPaymentMethods: Story = {
  args: {
    showFees: true,
  },
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Select an account', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => dialog.getAllByRole('button', { name: /main payments account/i }),
        { timeout: 5000 }
      );
      // Use getAllByRole since account name appears in both step and review panel
      const accountButtons = dialog.getAllByRole('button', {
        name: /main payments account/i,
      });
      await userEvent.click(accountButtons[0]);
    });

    await step(
      'Wait for To section and select a recipient with multiple payment methods',
      async () => {
        await delay(STEP_DELAY);
        // To section auto-opens after account selection - Alice Johnson has ACH and WIRE enabled
        await waitFor(
          () => dialog.getByRole('button', { name: /alice johnson/i }),
          { timeout: 5000 }
        );
        const aliceButton = dialog.getByRole('button', {
          name: /alice johnson/i,
        });
        await userEvent.click(aliceButton);
      }
    );

    await step('Wait for Payment Method section and select ACH', async () => {
      await delay(STEP_DELAY);
      // Payment Method section auto-opens after payee selection - wait for options
      const achButton = await waitFor(
        () => dialog.getByRole('button', { name: /ach/i }),
        { timeout: 5000 }
      );
      await userEvent.click(achButton);
    });

    await step('Select Wire Transfer', async () => {
      await delay(STEP_DELAY);
      // Check if Wire is available for this recipient
      const wireButton = dialog.queryByRole('button', { name: /wire/i });
      if (wireButton) {
        await userEvent.click(wireButton);
      }
    });

    await step('Select back to ACH', async () => {
      await delay(STEP_DELAY);
      const achButton = dialog.getByRole('button', { name: /ach/i });
      await userEvent.click(achButton);
    });
  },
};

// ============================================================================
// Navigation Workflows
// ============================================================================

/**
 * Navigate through steps using step headers.
 * Demonstrates collapsing and expanding sections.
 */
export const NavigateSteps: Story = {
  play: async ({ step }) => {
    await waitForDialog();
    const dialog = getDialog();

    await step('Wait for content to load', async () => {
      await waitFor(
        () => dialog.getAllByRole('button', { name: /main payments account/i }),
        { timeout: 5000 }
      );
    });

    await step('Select an account', async () => {
      await delay(STEP_DELAY);
      // Use getAllByRole since account name appears in both step and review panel
      const accountButtons = dialog.getAllByRole('button', {
        name: /main payments account/i,
      });
      await userEvent.click(accountButtons[0]);
    });

    await step('Wait for To section and select a payee', async () => {
      await delay(STEP_DELAY);
      // To section auto-opens after account selection - wait for recipients
      await waitFor(
        () => dialog.getByRole('button', { name: /alice johnson/i }),
        { timeout: 5000 }
      );
      const aliceButton = dialog.getByRole('button', {
        name: /alice johnson/i,
      });
      await userEvent.click(aliceButton);
    });

    await step('Go back to From step by clicking header', async () => {
      await delay(STEP_DELAY);
      // Click From header to expand it again
      const fromHeader = dialog.getByRole('button', {
        name: /\bfrom\b.*change/i,
      });
      await userEvent.click(fromHeader);

      // Verify From section content is visible
      await waitFor(() => {
        expect(
          dialog.getByRole('button', { name: /main payments account/i })
        ).toBeInTheDocument();
      });
    });

    await step('Switch to a different account', async () => {
      await delay(STEP_DELAY);
      // Select Payroll Account instead
      const payrollButton = dialog.getByRole('button', {
        name: /payroll account/i,
      });
      await userEvent.click(payrollButton);
    });
  },
};
