/**
 * PaymentFlow - Main Stories
 *
 * Basic configurations and layout options for the PaymentFlow component.
 * This component provides a complete payment/transfer flow within a modal dialog.
 *
 * ## Story Organization:
 * - **Main Stories** (this file): Basic configurations, layouts, initial states
 * - **Workflows**: Interactive demonstrations with play functions
 * - **Edge Cases**: Error states, empty states, network issues
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@/components/ui/button';

import { PaymentFlow } from '../PaymentFlow';
import {
  achOnlyPaymentMethods,
  commonArgs,
  commonArgTypes,
  createPaymentFlowHandlers,
  paymentMethodsWithFees,
} from './story-utils';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Core/PaymentFlow',
  component: PaymentFlow,
  tags: ['@core', '@payments', 'autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: createPaymentFlowHandlers(),
    },
    docs: {
      description: {
        component: `
The PaymentFlow component provides a complete payment/transfer experience within a modal dialog.

## Key Features

- **Two-column layout**: Form on left, review summary on right (desktop)
- **Mobile-optimized**: Full-screen dialog with responsive layout
- **Tabbed payee selection**: Switch between Recipients and Linked Accounts
- **Progressive disclosure**: Payment methods unlock after payee selection
- **Inline payee creation**: Add new recipients or link accounts without leaving the flow
- **Real-time validation**: Form validates as user enters data
- **Configurable fees**: Show/hide fee breakdown in review panel

## Usage

\`\`\`tsx
<PaymentFlow
  clientId="your-client-id"
  trigger={<Button>Transfer Funds</Button>}
  onTransactionComplete={(response, error) => {
    if (error) console.error('Failed:', error);
    else console.log('Success:', response);
  }}
/>
\`\`\`
        `,
      },
    },
  },
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof PaymentFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Configurations
// ============================================================================

/**
 * Default configuration with trigger button.
 * Click the button to open the payment flow dialog.
 *
 * **Features shown:**
 * - Trigger button that opens the dialog
 * - Two-column layout (form + review panel)
 * - All payment methods available
 * - Tabbed payee selection (Recipients / Linked Accounts)
 */
export const Default: Story = {
  args: {
    trigger: <Button>Transfer Funds</Button>,
  },
};

/**
 * Dialog opens immediately without a trigger button.
 * Use this when you control the open state externally.
 *
 * **Use this when:**
 * - Opening PaymentFlow from another component's action
 * - Managing open state in parent component
 * - Integrating into existing navigation flows
 */
export const ControlledOpen: Story = {
  args: {
    open: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Control the dialog state externally using `open` and `onOpenChange` props. Useful when integrating into existing UI flows.',
      },
    },
  },
};

// ============================================================================
// Initial State Configurations
// ============================================================================

/**
 * Pre-select an account to transfer from.
 * Useful when launching from a specific account's page.
 *
 * **Use this when:**
 * - User navigates from an account detail page
 * - You want to streamline the flow for a specific account
 */
export const WithInitialAccount: Story = {
  args: {
    trigger: <Button>Transfer from Main Checking</Button>,
    initialAccountId: 'acc-payments-main',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pre-select the "From Account" to skip account selection. The account section will show the selected account.',
      },
    },
  },
};

/**
 * Pre-select a payee (recipient or linked account).
 * Useful for "Pay Again" or quick transfer scenarios.
 *
 * **Use this when:**
 * - User clicks "Pay" on a specific recipient
 * - Implementing "Pay Again" from transaction history
 */
export const WithInitialPayee: Story = {
  args: {
    trigger: <Button>Pay Alice Johnson</Button>,
    initialPayeeId: 'recipient-alice',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pre-select a payee to skip the payee selection step. The payee section will show the selected recipient.',
      },
    },
  },
};

/**
 * Pre-fill multiple fields for a quick repeat payment.
 * Useful for "Pay Again" scenarios with full context.
 *
 * **Use this when:**
 * - Implementing "Pay Again" functionality
 * - Creating payment shortcuts
 */
export const WithAllInitialValues: Story = {
  args: {
    trigger: <Button>Repeat Last Payment</Button>,
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-techsolutions',
    initialPaymentMethod: 'ACH',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pre-fill account, payee, and payment method. User only needs to enter amount and submit.',
      },
    },
  },
};

// ============================================================================
// Payment Method Configurations
// ============================================================================

/**
 * Show only ACH transfers (no wire or RTP).
 * Use when other payment methods aren't available.
 *
 * **Use this when:**
 * - Only ACH is supported for your use case
 * - You want to simplify the payment method selection
 */
export const AchOnly: Story = {
  args: {
    trigger: <Button>ACH Transfer</Button>,
    paymentMethods: achOnlyPaymentMethods,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Limit available payment methods by passing a filtered `paymentMethods` array.',
      },
    },
  },
};

/**
 * Display fees for each payment method.
 * Shows fee breakdown in the review panel.
 *
 * **Use this when:**
 * - Payment methods have associated fees
 * - You want transparent pricing for users
 */
export const WithFees: Story = {
  args: {
    trigger: <Button>Transfer Funds</Button>,
    paymentMethods: paymentMethodsWithFees,
    showFees: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enable `showFees` to display fee breakdown in the review panel. Fees are configured per payment method.',
      },
    },
  },
};

// ============================================================================
// Responsive Layouts
// ============================================================================

/**
 * Mobile viewport display.
 * Shows how the flow adapts to small screens.
 *
 * **Responsive features:**
 * - Full-screen dialog
 * - Stacked layout (form above review)
 * - Vertically stacked tabs
 * - Touch-friendly controls
 */
export const MobileView: Story = {
  args: {
    open: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile viewports (< 640px), the dialog becomes full-screen and the review panel moves below the form.',
      },
    },
  },
};

/**
 * Tablet viewport display.
 * Shows the two-column layout on medium screens.
 */
export const TabletView: Story = {
  args: {
    open: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'On tablet viewports, the dialog uses the standard two-column layout with adequate spacing.',
      },
    },
  },
};

// ============================================================================
// Account Type Variations
// ============================================================================

/**
 * Limited DDA account selected.
 * Shows the recipient restriction behavior for LIMITED_DDA accounts.
 *
 * **Key behavior:**
 * - Recipients tab shows "locked" state
 * - User can only select from Linked Accounts
 * - Warning banner explains the restriction
 */
export const LimitedDDAAccount: Story = {
  args: {
    trigger: <Button>Transfer from Payroll</Button>,
    initialAccountId: 'acc-limited-dda',
  },
  parameters: {
    docs: {
      description: {
        story:
          'LIMITED_DDA accounts can only transfer to Linked Accounts, not Recipients. The Recipients tab shows a lock icon and restriction message.',
      },
    },
  },
};
