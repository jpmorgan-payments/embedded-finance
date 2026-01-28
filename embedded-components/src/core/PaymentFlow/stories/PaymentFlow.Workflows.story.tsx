/**
 * PaymentFlow - Interactive Workflows
 *
 * Automated demonstrations of complete user flows using Storybook play functions.
 * These stories automatically interact with the component to show key workflows.
 *
 * Each story demonstrates a specific user journey through the payment flow.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { PaymentFlow } from '../PaymentFlow';
import {
  commonArgs,
  commonArgTypes,
  createPaymentFlowHandlers,
  defaultPaymentMethods,
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
 * Demonstrates selecting a payee, payment method, account, entering amount, and submitting.
 */
export const CompletePaymentFlow: Story = {
  args: {
    paymentMethods: defaultPaymentMethods,
  },
  play: async ({ step }) => {
    // Wait for dialog to open
    await waitFor(
      async () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) throw new Error('Dialog not found');
      },
      { timeout: 5000 }
    );

    const dialog = within(
      document.querySelector('[role="dialog"]') as HTMLElement
    );

    await step('Select a recipient', async () => {
      await delay(STEP_DELAY);
      // Click on Alice Johnson in the recipients list
      const aliceButton = await waitFor(
        () => dialog.getByRole('button', { name: /alice johnson/i }),
        { timeout: 5000 }
      );
      await userEvent.click(aliceButton);
    });

    await step('Select ACH payment method', async () => {
      await delay(STEP_DELAY);
      const achButton = await waitFor(
        () => dialog.getByRole('button', { name: /ach transfer/i }),
        { timeout: 3000 }
      );
      await userEvent.click(achButton);
    });

    await step('Select from account', async () => {
      await delay(STEP_DELAY);
      const accountButton = await waitFor(
        () => dialog.getByRole('button', { name: /main checking/i }),
        { timeout: 3000 }
      );
      await userEvent.click(accountButton);
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
      // Verify the review panel shows correct info
      await waitFor(() => {
        expect(dialog.getByText('$250.00')).toBeInTheDocument();
      });

      const submitButton = dialog.getByRole('button', {
        name: /send payment/i,
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
// Payee Selection Workflows
// ============================================================================

/**
 * Switch between Recipients and Linked Accounts tabs.
 * Demonstrates the tabbed payee selection interface.
 */
export const SwitchPayeeTabs: Story = {
  play: async ({ step }) => {
    await waitFor(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) throw new Error('Dialog not found');
      },
      { timeout: 5000 }
    );

    const dialog = within(
      document.querySelector('[role="dialog"]') as HTMLElement
    );

    await step('View Recipients tab (default)', async () => {
      await delay(STEP_DELAY);
      const recipientsTab = await waitFor(
        () => dialog.getByRole('tab', { name: /recipients/i }),
        { timeout: 5000 }
      );
      expect(recipientsTab).toHaveAttribute('data-state', 'active');
    });

    await step('Switch to Linked Accounts tab', async () => {
      await delay(STEP_DELAY);
      const linkedTab = dialog.getByRole('tab', { name: /linked accounts/i });
      await userEvent.click(linkedTab);
      expect(linkedTab).toHaveAttribute('data-state', 'active');
    });

    await step('Select a linked account', async () => {
      await delay(STEP_DELAY);
      const johnButton = await waitFor(
        () => dialog.getByRole('button', { name: /john doe/i }),
        { timeout: 3000 }
      );
      await userEvent.click(johnButton);
    });

    await step('Verify linked account is selected', async () => {
      await delay(STEP_DELAY);
      // The payee section should show John Doe as selected
      await waitFor(() => {
        const selectedIndicator = dialog.queryByText(/john doe/i);
        expect(selectedIndicator).toBeInTheDocument();
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
    await waitFor(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) throw new Error('Dialog not found');
      },
      { timeout: 5000 }
    );

    const dialog = within(
      document.querySelector('[role="dialog"]') as HTMLElement
    );

    await step('Wait for recipients to load', async () => {
      await waitFor(
        () => dialog.getByRole('button', { name: /alice johnson/i }),
        { timeout: 5000 }
      );
    });

    await step('Search for "Tech"', async () => {
      await delay(STEP_DELAY);
      const searchInput = await waitFor(
        () => dialog.getByPlaceholderText(/search recipients/i),
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
      const searchInput = dialog.getByPlaceholderText(/search recipients/i);
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
    await waitFor(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) throw new Error('Dialog not found');
      },
      { timeout: 5000 }
    );

    const dialog = within(
      document.querySelector('[role="dialog"]') as HTMLElement
    );

    await step('Click "Add New Recipient"', async () => {
      await delay(STEP_DELAY);
      const addButton = await waitFor(
        () => dialog.getByRole('button', { name: /add new recipient/i }),
        { timeout: 5000 }
      );
      await userEvent.click(addButton);
    });

    await step('Verify recipient form opens', async () => {
      await delay(STEP_DELAY);
      await waitFor(() => {
        // Should show the add recipient form with back button
        const backButton = document.querySelector('[aria-label*="back" i]');
        expect(backButton).toBeInTheDocument();
      });
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
    await waitFor(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) throw new Error('Dialog not found');
      },
      { timeout: 5000 }
    );

    const dialog = within(
      document.querySelector('[role="dialog"]') as HTMLElement
    );

    await step('Switch to Linked Accounts tab', async () => {
      await delay(STEP_DELAY);
      const linkedTab = await waitFor(
        () => dialog.getByRole('tab', { name: /linked accounts/i }),
        { timeout: 5000 }
      );
      await userEvent.click(linkedTab);
    });

    await step('Click "Link New Account"', async () => {
      await delay(STEP_DELAY);
      const linkButton = await waitFor(
        () => dialog.getByRole('button', { name: /link new account/i }),
        { timeout: 3000 }
      );
      await userEvent.click(linkButton);
    });

    await step('Verify link account form opens', async () => {
      await delay(STEP_DELAY);
      await waitFor(() => {
        const backButton = document.querySelector('[aria-label*="back" i]');
        expect(backButton).toBeInTheDocument();
      });
    });
  },
};

// ============================================================================
// Payment Method Workflows
// ============================================================================

/**
 * Select different payment methods and see fee updates.
 * Demonstrates how fees update in the review panel.
 */
export const SelectPaymentMethods: Story = {
  args: {
    initialPayeeId: 'linked-company', // Has all payment methods available
    showFees: true,
  },
  play: async ({ step }) => {
    await waitFor(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) throw new Error('Dialog not found');
      },
      { timeout: 5000 }
    );

    const dialog = within(
      document.querySelector('[role="dialog"]') as HTMLElement
    );

    await step('Wait for payment methods to load', async () => {
      await waitFor(
        () => dialog.getByRole('button', { name: /ach transfer/i }),
        { timeout: 5000 }
      );
    });

    await step('Select ACH (no fee)', async () => {
      await delay(STEP_DELAY);
      const achButton = dialog.getByRole('button', { name: /ach transfer/i });
      await userEvent.click(achButton);
    });

    await step('Select Wire Transfer', async () => {
      await delay(STEP_DELAY);
      const wireButton = await waitFor(
        () => dialog.getByRole('button', { name: /wire transfer/i }),
        { timeout: 3000 }
      );
      await userEvent.click(wireButton);
    });

    await step('Select RTP', async () => {
      await delay(STEP_DELAY);
      const rtpButton = await waitFor(
        () => dialog.getByRole('button', { name: /real-time payment/i }),
        { timeout: 3000 }
      );
      await userEvent.click(rtpButton);
    });
  },
};

// ============================================================================
// Navigation Workflows
// ============================================================================

/**
 * Navigate back from sub-views.
 * Demonstrates the back button behavior in nested views.
 */
export const NavigateBackFromSubViews: Story = {
  play: async ({ step }) => {
    await waitFor(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) throw new Error('Dialog not found');
      },
      { timeout: 5000 }
    );

    const dialog = within(
      document.querySelector('[role="dialog"]') as HTMLElement
    );

    await step('Open add recipient form', async () => {
      await delay(STEP_DELAY);
      const addButton = await waitFor(
        () => dialog.getByRole('button', { name: /add new recipient/i }),
        { timeout: 5000 }
      );
      await userEvent.click(addButton);
    });

    await step('Verify header shows back button', async () => {
      await delay(STEP_DELAY);
      await waitFor(() => {
        const backButton = document.querySelector('[aria-label*="back" i]');
        expect(backButton).toBeInTheDocument();
      });
    });

    await step('Click back button', async () => {
      await delay(STEP_DELAY);
      const backButton = document.querySelector(
        '[aria-label*="back" i]'
      ) as HTMLElement;
      await userEvent.click(backButton);
    });

    await step('Verify returned to main view', async () => {
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
 * Close dialog and verify cleanup.
 * Demonstrates proper dialog dismissal behavior.
 */
export const CloseDialog: Story = {
  play: async ({ step }) => {
    await waitFor(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) throw new Error('Dialog not found');
      },
      { timeout: 5000 }
    );

    await step('Make some selections', async () => {
      await delay(STEP_DELAY);
      const dialog = within(
        document.querySelector('[role="dialog"]') as HTMLElement
      );
      const aliceButton = await waitFor(
        () => dialog.getByRole('button', { name: /alice johnson/i }),
        { timeout: 5000 }
      );
      await userEvent.click(aliceButton);
    });

    await step('Close dialog with X button', async () => {
      await delay(STEP_DELAY);
      const closeButton = document.querySelector(
        '[aria-label*="close" i]'
      ) as HTMLElement;
      if (closeButton) {
        await userEvent.click(closeButton);
      }
    });

    await step('Verify dialog is closed', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const dialog = document.querySelector('[role="dialog"]');
          expect(dialog).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  },
};
