/**
 * PaymentFlowFXInline - Stories
 *
 * Inline (non-modal) variant of PaymentFlowFX. Renders the cross-border payment
 * experience directly in the page layout instead of a dialog.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardContent } from '@/components/ui/card';

import { PaymentFlowFXInline } from '../PaymentFlowFX';
import {
  commonFxArgTypes,
  createPaymentFlowFXHandlers,
  ratesheetFxConfig,
} from './story-utils';

const meta = {
  title: 'Core/PaymentFlowFX/Inline',
  component: PaymentFlowFXInline,
  tags: ['@core', '@payments', 'autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createPaymentFlowFXHandlers(),
    },
    docs: {
      description: {
        component: `
The PaymentFlowFXInline component provides the same cross-border payment experience
as PaymentFlowFX, but renders inline on the page instead of in a modal dialog.

## Usage

\`\`\`tsx
<PaymentFlowFXInline
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
  args: {
    fxConfig: ratesheetFxConfig,
  },
  argTypes: commonFxArgTypes,
} satisfies Meta<typeof PaymentFlowFXInline>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default inline rendering.
 */
export const Default: Story = {};

/**
 * Embedded inside a card, with the header hidden — typical for a dedicated
 * "Send international payment" page section.
 */
export const InsideCard: Story = {
  render: (args) => (
    <Card className="eb-mx-auto eb-max-w-3xl">
      <CardContent className="eb-p-6">
        <PaymentFlowFXInline {...args} />
      </CardContent>
    </Card>
  ),
};

/**
 * Pre-selected international recipient so the inline surface opens straight into
 * the cross-border experience.
 */
export const PreselectedInternationalPayee: Story = {
  args: {
    initialAccountId: 'acc-payments-main',
    initialPayeeId: 'recipient-eur-isabelle',
  },
};
