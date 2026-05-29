/**
 * PaymentFlowInline - Stories
 *
 * Inline/embedded version of PaymentFlow that renders directly on the page
 * without a modal dialog. Use this when you want to integrate the payment
 * flow into a regular page layout.
 *
 * ## When to use PaymentFlowInline vs PaymentFlow:
 * - **PaymentFlow**: Modal dialog that opens on top of your content
 * - **PaymentFlowInline**: Embedded directly into your page layout
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardContent } from '@/components/ui/card';

import { PaymentFlowInline } from '../PaymentFlow';
import {
  achOnlyPaymentMethods,
  commonArgTypes,
  createPaymentFlowHandlers,
  paymentMethodsWithFees,
} from './story-utils';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Core/PaymentFlow/Inline',
  component: PaymentFlowInline,
  tags: ['@core', '@payments', 'autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createPaymentFlowHandlers(),
    },
    docs: {
      description: {
        component: `
The PaymentFlowInline component provides the same payment/transfer experience as PaymentFlow,
but renders inline on the page instead of in a modal dialog.

## Key Features

- **Inline rendering**: Embeds directly into your page layout
- **Same functionality**: All features of PaymentFlow are available
- **Customizable header**: Hide the header when embedding in a page with its own header
- **Flexible sizing**: Container takes full width/height of parent

## Usage

\`\`\`tsx
<PaymentFlowInline
  onTransactionComplete={(response, error) => {
    if (error) console.error('Failed:', error);
    else console.log('Success:', response);
  }}
/>
\`\`\`

## Comparison with PaymentFlow

| Feature | PaymentFlow | PaymentFlowInline |
|---------|-------------|-------------------|
| Rendering | Modal dialog | Inline on page |
| Trigger | Button/element opens dialog | Always visible |
| Use case | Quick actions, overlays | Dedicated payment pages |
| Open state | Controlled/uncontrolled | Always open |
        `,
      },
    },
  },
  args: {
    showFees: false,
  },
  argTypes: {
    ...commonArgTypes,
    // Add inline-specific props
    hideHeader: {
      control: 'boolean',
      description:
        'Hide the header (useful when embedding in a page with its own header)',
    },
    showContainer: {
      control: 'boolean',
      description:
        'Whether to show a visible container (border, shadow). Default: true',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the container',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '1200px', height: '700px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaymentFlowInline>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Configurations
// ============================================================================

/**
 * Default inline configuration.
 * The payment flow renders directly on the page.
 *
 * **Features shown:**
 * - Two-column layout (form + review panel)
 * - All payment methods available
 * - Tabbed payee selection (Recipients / Linked Accounts)
 */
export const Default: Story = {
  args: {},
};

/**
 * Inline flow without header.
 * Use when embedding in a page that has its own header/title.
 *
 * **Use this when:**
 * - Page already has a "Transfer Funds" or similar heading
 * - You want maximum vertical space for the form
 */
export const WithoutHeader: Story = {
  args: {
    hideHeader: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hide the built-in header when your page already has its own title/header.',
      },
    },
  },
};

/**
 * Embedded in a Card container.
 * Demonstrates how to integrate into existing UI components.
 * Set `showContainer={false}` when embedding in your own container.
 */
export const EmbeddedInCard: Story = {
  decorators: [
    (Story) => (
      <div className="eb-flex eb-justify-center eb-bg-muted/50 eb-p-8">
        <Card className="eb-w-full eb-max-w-md eb-border-2 eb-shadow-lg">
          <CardContent className="eb-p-0">
            <div style={{ height: '600px' }}>
              <Story />
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  ],
  args: {
    hideHeader: false,
    showContainer: false, // Card provides the container styling
  },
  parameters: {
    docs: {
      description: {
        story:
          'When embedding inside a Card or similar container, set `showContainer={false}` to avoid double borders. The parent container provides the visual boundary.',
      },
    },
  },
};

// ============================================================================
// Initial State Configurations
// ============================================================================

/**
 * Pre-select an account to transfer from.
 * Useful when navigating from a specific account's page.
 */
export const WithInitialAccount: Story = {
  args: {
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
 */
export const WithInitialPayee: Story = {
  args: {
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
 */
export const WithAllInitialValues: Story = {
  args: {
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-techsolutions',
    initialPaymentMethod: 'ACH',
    initialAmount: '500.00',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pre-fill account, payee, payment method, and amount. Ready to submit immediately.',
      },
    },
  },
};

// ============================================================================
// Payment Method Configurations
// ============================================================================

/**
 * Show only ACH transfers.
 */
export const AchOnly: Story = {
  args: {
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
 */
export const WithFees: Story = {
  args: {
    paymentMethods: paymentMethodsWithFees,
    showFees: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enable `showFees` to display fee breakdown in the review panel.',
      },
    },
  },
};

// ============================================================================
// Page Integration Examples
// ============================================================================

/**
 * Full page layout example.
 * Demonstrates how PaymentFlowInline might look on a dedicated payments page.
 */
export const FullPageLayout: Story = {
  decorators: [
    (Story) => (
      <div className="eb-flex eb-min-h-[700px] eb-flex-col eb-gap-4">
        {/* Page header */}
        <div className="eb-border-b eb-pb-4">
          <h1 className="eb-text-2xl eb-font-bold">Transfer Funds</h1>
          <p className="eb-text-muted-foreground">
            Send money to recipients or linked accounts
          </p>
        </div>
        {/* Payment flow content */}
        <div className="eb-flex-1">
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    hideHeader: true, // Page already has a header
  },
  parameters: {
    docs: {
      description: {
        story:
          'A full-page layout example with a custom page header. Set `hideHeader={true}` to avoid duplicate headers.',
      },
    },
  },
};
