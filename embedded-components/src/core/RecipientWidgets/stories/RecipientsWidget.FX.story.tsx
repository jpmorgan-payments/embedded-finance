/**
 * RecipientsWidget - FX Payments Stories
 *
 * Demonstrates non-breaking FX props: `paymentFlowVariant="fx"` opens
 * PaymentFlowFX on Pay and auto-enables recipient currency display
 * (column, badges, details) unless `showRecipientCurrency` is overridden.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  createPaymentFlowFXHandlers,
  mockFxRecipients,
  mockInternationalRecipients,
  ratesheetFxConfig,
} from '../../PaymentFlowFX/stories/story-utils';
import { RecipientsWidget } from '../RecipientsWidget/RecipientsWidget';
import { commonArgs, commonArgTypes } from './story-utils';

/** EUR / GBP / SGD payees that activate FX (from PaymentFlowFX story fixtures). */
const fxStoryRecipients = [
  ...mockInternationalRecipients,
] as typeof mockFxRecipients;

const meta = {
  title: 'Core/RecipientsWidget/FX Payments',
  component: RecipientsWidget,
  tags: ['@core', '@recipients', '@fx'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createPaymentFlowFXHandlers({
        recipients: fxStoryRecipients,
      }),
    },
    docs: {
      description: {
        story: `
Set \`paymentFlowVariant="fx"\` to open **PaymentFlowFX** when Pay is clicked.
Currency column/badges/details auto-enable for the FX variant (no need to pass
\`showRecipientCurrency\`). Optional \`fxConfig\` and \`supportedTargetCurrencies\`
are forwarded to the FX flow.

MSW uses \`createPaymentFlowFXHandlers\` with international recipients (EUR/GBP/SGD).
        `,
      },
    },
  },
  args: {
    ...commonArgs,
  },
  argTypes: {
    ...commonArgTypes,
    onRecipientAdded: {
      description:
        'Callback fired when a recipient is successfully added or when adding fails.',
      table: {
        category: 'Callbacks',
        type: { summary: '(recipient?: Recipient, error?: unknown) => void' },
      },
    },
  },
} satisfies Meta<typeof RecipientsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Table of international recipients with currency column visible.
 * Pay opens PaymentFlowFX (ratesheet mode). Currency display is auto-on
 * because `paymentFlowVariant="fx"` — `showRecipientCurrency` is not required.
 *
 * **Try it:**
 * - Confirm the Currency column shows EUR / GBP / SGD badges
 * - Click Pay on a row to open the FX payment flow
 * - Toggle `showRecipientCurrency` in Controls to force hide/show
 */
export const FXPayments: Story = {
  args: {
    mode: 'list',
    viewMode: 'table',
    paymentFlowVariant: 'fx',
    fxConfig: ratesheetFxConfig,
    pageSize: 10,
  },
};
