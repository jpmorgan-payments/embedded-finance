/**
 * PaymentFlowFX - State & Edge-Case Stories
 *
 * Error, empty, and degraded-rate scenarios. All FX failure paths are
 * non-blocking: the payment can still submit at the market rate when a quote is
 * unavailable (SPECIFICATION.md §11).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { PaymentFlowFX } from '../PaymentFlowFX';
import {
  commonFxArgs,
  commonFxArgTypes,
  createPaymentFlowFXHandlers,
  ratesheetFxConfig,
  realtimeFxConfig,
} from './story-utils';

const meta = {
  title: 'Beta/PaymentFlowFX/States',
  component: PaymentFlowFX,
  tags: ['@core', '@payments', 'autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    ...commonFxArgs,
    open: true,
  },
  argTypes: commonFxArgTypes,
} satisfies Meta<typeof PaymentFlowFX>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * **Rate unavailable** — the rate sheet returns a 200-with-errors body. The
 * quote degrades to "determined at processing" and the payment can still submit.
 */
export const RateUnavailable: Story = {
  args: {
    fxConfig: ratesheetFxConfig,
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-eur-isabelle',
  },
  parameters: {
    msw: {
      handlers: createPaymentFlowFXHandlers({ ratesheetError: true }),
    },
    docs: {
      description: {
        story:
          'The rate sheet responds with `errors[]`. FX remains active but no rate is locked (§3.3 / §11).',
      },
    },
  },
};

/**
 * **Transaction failure** — the V3 create call returns a 422 with an expired-rate
 * error. The review panel surfaces the error and offers a retry.
 */
export const TransactionError: Story = {
  args: {
    fxConfig: realtimeFxConfig,
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-eur-isabelle',
  },
  parameters: {
    msw: {
      handlers: createPaymentFlowFXHandlers({ simulateTransactionError: true }),
    },
    docs: {
      description: {
        story:
          'Submitting returns HTTP 422 with an `FX_RATE_EXPIRED` context error, parsed into a user-facing message.',
      },
    },
  },
};

/**
 * **No accounts** — the empty state renders when the client has no eligible
 * funding accounts.
 */
export const NoAccounts: Story = {
  args: {
    fxConfig: realtimeFxConfig,
  },
  parameters: {
    msw: {
      handlers: createPaymentFlowFXHandlers({ recipients: [] }),
    },
  },
};

/**
 * **Slow network** — a 2s delay exercises the loading skeletons.
 */
export const SlowNetwork: Story = {
  args: {
    fxConfig: realtimeFxConfig,
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-eur-isabelle',
  },
  parameters: {
    msw: {
      handlers: createPaymentFlowFXHandlers({ delayMs: 2000 }),
    },
  },
};
