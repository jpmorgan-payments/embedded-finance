/**
 * LinkedAccountWidget - Account Statuses
 *
 * Comprehensive showcase of all account states in the microdeposit verification flow.
 * See how accounts progress from creation through verification to active status.
 */

import {
  linkedAccountBusinessMock,
  linkedAccountInactiveMock,
  linkedAccountListMock,
  linkedAccountMicrodepositListMock,
  linkedAccountReadyForValidationMock,
  linkedAccountRejectedMock,
} from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  LinkedAccountWidgetStory,
} from './story-utils';

const meta = {
  title: 'Core/LinkedAccountWidget/Account Statuses',
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
 * Active account - fully verified and ready for transactions.
 * This is the goal state after successful microdeposit verification.
 */
export const Active: Story = {
  args: {
    variant: 'default',
  },
};

/**
 * Waiting for microdeposits to arrive (1-2 business days).
 * User cannot take action yet - just needs to wait for JPMorgan deposits.
 */
export const PendingMicrodeposits: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers(linkedAccountMicrodepositListMock),
    },
  },
};

/**
 * Microdeposits arrived - user needs to verify amounts.
 * Click the verify button to see the verification dialog.
 */
export const ReadyToVerify: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers(linkedAccountReadyForValidationMock),
    },
  },
};

/**
 * Verification failed - account rejected.
 * User entered wrong amounts or exceeded max attempts.
 */
export const Rejected: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers(linkedAccountRejectedMock),
    },
  },
};

/**
 * Previously active account that was manually deactivated.
 * Can be reactivated if needed.
 */
export const Inactive: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers(linkedAccountInactiveMock),
    },
  },
};

/**
 * Business accounts showing organization names.
 * Displays business name instead of individual names.
 */
export const Business: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers(linkedAccountBusinessMock),
    },
  },
};

/**
 * Real-world scenario with multiple accounts in different states.
 * Demonstrates visual hierarchy and status differentiation.
 */
export const MixedStatuses: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers({
        ...linkedAccountListMock,
        recipients: [
          ...(linkedAccountListMock.recipients || []),
          ...(linkedAccountMicrodepositListMock.recipients || []),
          ...(linkedAccountReadyForValidationMock.recipients || []),
          ...(linkedAccountRejectedMock.recipients || []),
          ...(linkedAccountInactiveMock.recipients || []),
        ],
      }),
    },
  },
};
