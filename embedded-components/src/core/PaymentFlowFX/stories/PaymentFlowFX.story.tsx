/**
 * PaymentFlowFX - Main Stories
 *
 * Cross-border / multicurrency variant of PaymentFlow. Preserves every domestic
 * behaviour and layers in FX eligibility, currency-aware amounts, a rate quote
 * preview, and V3 transaction submission (SPECIFICATION.md).
 *
 * ## Story Organization:
 * - **Main Stories** (this file): Basic configurations and initial states
 * - **Workflows**: Rate-acquisition modes (realtime / provider / ratesheet)
 * - **States**: Error, empty, and rate-expired edge cases
 * - **Inline**: Embedded (non-modal) variant
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@/components/ui/button';

import { PaymentFlowFX } from '../PaymentFlowFX';
import {
  commonFxArgs,
  commonFxArgTypes,
  createPaymentFlowFXHandlers,
  ratesheetFxConfig,
} from './story-utils';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Core/PaymentFlowFX',
  component: PaymentFlowFX,
  tags: ['@core', '@payments', 'autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: createPaymentFlowFXHandlers(),
    },
    docs: {
      description: {
        component: `
The PaymentFlowFX component extends PaymentFlow with cross-border (multicurrency)
payout support. When the selected payee holds a non-USD account, the flow activates
FX behaviours; otherwise it behaves exactly like the domestic PaymentFlow.

## Key Features

- **Automatic FX activation**: Detected from the recipient's account currency (FR-FX-1)
- **Rate acquisition modes**: \`realtime\`, \`ratesheet\`, and \`provider\` (FR-FX-6)
- **Currency-aware review**: Estimated recipient amount and locked/indicative rate
- **International recipient capture**: Add a non-USD recipient inline (FR-FX-10)
- **V3 submission**: Uses \`createTransactionV3\` with counterparty + FX metadata
- **Best-effort enrichment**: Settled amount and rate shown on the success screen

## Usage

\`\`\`tsx
<PaymentFlowFX
  trigger={<Button>Send international payment</Button>}
  fxConfig={{ mode: 'ratesheet' }}
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
  args: commonFxArgs,
  argTypes: commonFxArgTypes,
} satisfies Meta<typeof PaymentFlowFX>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Configurations
// ============================================================================

/**
 * Default configuration with a trigger button. Click to open the FX payment
 * dialog. Selecting the EUR/GBP/SGD recipient activates the cross-border flow.
 *
 * Uses `ratesheet` mode (SPECIFICATION.md §3.3): opening the flow calls
 * `GET /accounts/{id}/ratesheets/current`, locks the EXECUTABLE rate, and submits
 * `fxInformation.rateId` with the V3 transaction. Watch the network tab for the
 * rate-sheet request and the `fxInformation.rateId` on the create-transaction POST.
 */
export const Default: Story = {
  args: {
    trigger: <Button>Send international payment</Button>,
    fxConfig: ratesheetFxConfig,
  },
};

/**
 * Dialog opens immediately without a trigger button. Use when you control the
 * open state externally.
 */
export const ControlledOpen: Story = {
  args: {
    open: true,
    fxConfig: ratesheetFxConfig,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Control the dialog state externally using `open` and `onOpenChange`.',
      },
    },
  },
};

/**
 * Pre-select an account and an international (EUR) recipient so the flow opens
 * straight into the cross-border experience.
 */
export const PreselectedInternationalPayee: Story = {
  args: {
    open: true,
    fxConfig: ratesheetFxConfig,
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-eur-isabelle',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Launch with an FX-eligible account and a EUR recipient already selected (FR-FX-1).',
      },
    },
  },
};

/**
 * Restrict the currencies offered when adding a new international recipient.
 */
export const LimitedTargetCurrencies: Story = {
  args: {
    open: true,
    fxConfig: ratesheetFxConfig,
    supportedTargetCurrencies: ['EUR', 'GBP', 'CAD'],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only the provided currencies appear in the "Recipient\'s account currency" selector (FR-FX-10).',
      },
    },
  },
};

/**
 * Show fees in the review panel alongside the FX conversion summary.
 */
export const WithFees: Story = {
  args: {
    open: true,
    fxConfig: ratesheetFxConfig,
    showFees: true,
  },
};
