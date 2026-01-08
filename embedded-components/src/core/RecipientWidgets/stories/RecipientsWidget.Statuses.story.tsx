/**
 * RecipientsWidget - Account Statuses
 *
 * Comprehensive showcase of all recipient states.
 * Recipients use simpler status flow without microdeposit verification.
 */

import {
  linkedAccountActiveMock,
  linkedAccountBusinessMock,
  linkedAccountInactiveMock,
  linkedAccountListMock,
  linkedAccountRejectedMock,
} from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecipientsWidget } from '../RecipientsWidget/RecipientsWidget';
import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  seedRecipientData,
} from './story-utils';

const meta = {
  title: 'Core/RecipientsWidget/Account Statuses',
  component: RecipientsWidget,
  tags: ['@core', '@recipients'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createRecipientHandlers({ recipientType: 'RECIPIENT' }),
    },
  },
  args: commonArgs,
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
 * Active recipient - ready for transactions.
 * This is the standard state for recipients after creation.
 */
export const Active: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountActiveMock,
        recipients: linkedAccountActiveMock.recipients?.map((r) => ({
          ...r,
          type: 'RECIPIENT',
          status: 'ACTIVE',
        })),
      });
    },
  ],
};

/**
 * Verification failed - recipient rejected.
 * Recipient cannot be used for transactions.
 */
export const Rejected: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountRejectedMock,
        recipients: linkedAccountRejectedMock.recipients?.map((r) => ({
          ...r,
          type: 'RECIPIENT',
          status: 'REJECTED',
        })),
      });
    },
  ],
};

/**
 * Previously active recipient that was manually deactivated.
 * Can be reactivated if needed.
 */
export const Inactive: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountInactiveMock,
        recipients: linkedAccountInactiveMock.recipients?.map((r) => ({
          ...r,
          type: 'RECIPIENT',
          status: 'INACTIVE',
        })),
      });
    },
  ],
};

/**
 * Business recipients showing organization names.
 * Displays business name instead of individual names.
 */
export const Business: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountBusinessMock,
        recipients: linkedAccountBusinessMock.recipients?.map((r) => ({
          ...r,
          type: 'RECIPIENT',
          status: 'ACTIVE',
        })),
      });
    },
  ],
};

/**
 * Real-world scenario with multiple recipients in different states.
 * Demonstrates visual hierarchy and status differentiation.
 */
export const MixedStatuses: Story = {
  loaders: [
    async () => {
      const mixedData = {
        ...linkedAccountListMock,
        recipients: [
          ...(linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT' as const,
            status: 'ACTIVE' as const,
          })) || []),
          ...(linkedAccountRejectedMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT' as const,
            status: 'REJECTED' as const,
          })) || []),
          ...(linkedAccountInactiveMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT' as const,
            status: 'INACTIVE' as const,
          })) || []),
        ],
      };
      await seedRecipientData(mixedData);
    },
  ],
};
