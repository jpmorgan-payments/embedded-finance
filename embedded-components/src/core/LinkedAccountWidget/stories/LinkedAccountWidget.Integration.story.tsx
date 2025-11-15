/**
 * LinkedAccountWidget - Integration Examples
 *
 * Examples of integrating LinkedAccountWidget with other components and handling events.
 */

import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MakePayment } from '@/core/MakePayment';

import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  LinkedAccountWidgetStory,
} from './story-utils';

const meta = {
  title: 'Core/LinkedAccountWidget/Integration',
  component: LinkedAccountWidgetStory,
  tags: ['@core', '@linked-accounts'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createRecipientHandlers(linkedAccountListMock),
    },
  },
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof LinkedAccountWidgetStory>;

export default meta;
type Story = StoryObj<typeof LinkedAccountWidgetStory>;

/**
 * Integrated with MakePayment component for complete payment workflow.
 * Each active account card includes a payment button.
 */
export const MakePayment_Integration: Story = {
  args: {
    variant: 'default',
    makePaymentComponent: (
      <MakePayment
        triggerButtonVariant="ghost"
        onTransactionSettled={(response, error) => {
          // eslint-disable-next-line no-console
          console.log('Payment settled:', { response, error });
        }}
      />
    ),
  },
  name: 'Make Payment',
};

/**
 * With callback handlers for tracking account lifecycle events.
 * Check the console to see event logging.
 */
export const WithCallbacks: Story = {
  args: {
    variant: 'default',
    onLinkedAccountSettled: (recipient, error) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Account linking failed:', error);
      } else {
        // eslint-disable-next-line no-console
        console.log('Account linked successfully:', recipient);
      }
    },
  },
};
