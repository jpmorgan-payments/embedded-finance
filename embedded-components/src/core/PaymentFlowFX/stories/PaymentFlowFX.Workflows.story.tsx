/**
 * PaymentFlowFX - Workflow Stories
 *
 * Demonstrates the three rate-acquisition modes (SPECIFICATION.md FR-FX-6):
 * - `realtime`  — optional indicative estimate, submit at market rate
 * - `provider`  — host-supplied locked rate (rateId submitted)
 * - `ratesheet` — built-in getCurrentRatesheet integration
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { PaymentFlowFX } from '../PaymentFlowFX';
import {
  commonFxArgs,
  commonFxArgTypes,
  createPaymentFlowFXHandlers,
  providerFxConfig,
  ratesheetFxConfig,
  realtimeFxConfig,
} from './story-utils';

const meta = {
  title: 'Beta/PaymentFlowFX/Workflows',
  component: PaymentFlowFX,
  tags: ['@core', '@payments', 'autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: createPaymentFlowFXHandlers(),
    },
  },
  args: {
    ...commonFxArgs,
    open: true,
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-eur-isabelle',
  },
  argTypes: commonFxArgTypes,
} satisfies Meta<typeof PaymentFlowFX>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * **Realtime mode** — an indicative estimate is shown while the payment submits
 * at the market rate. No `rateId` is locked.
 */
export const RealtimeMode: Story = {
  args: {
    fxConfig: realtimeFxConfig,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The conversion summary shows an **Indicative** estimate. Submission omits `rateId` and settles at the market rate.',
      },
    },
  },
};

/**
 * **Provider mode** — a host callback returns a locked (executable) rate whose
 * `rateId` is submitted with the transaction.
 */
export const ProviderMode: Story = {
  args: {
    fxConfig: providerFxConfig,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The conversion summary shows a **Locked** rate. The returned `rateId` is included in the V3 request.',
      },
    },
  },
};

/**
 * **Rate sheet mode** — the built-in `getCurrentRatesheet` endpoint provides
 * EXECUTABLE and INDICATIVE rates. EXECUTABLE rates lock a `rateId`.
 */
export const RateSheetMode: Story = {
  args: {
    fxConfig: ratesheetFxConfig,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The flow fetches `/accounts/:id/ratesheets/current`, selects the EXECUTABLE rate for the method, and locks its `rateId`.',
      },
    },
  },
};

/**
 * **Business beneficiary** — pre-selects the GBP organization recipient, which
 * maps to a `BUSINESS` beneficiary type for rate selection.
 */
export const BusinessBeneficiary: Story = {
  args: {
    fxConfig: ratesheetFxConfig,
    initialPayeeId: 'recipient-gbp-thames',
  },
};
