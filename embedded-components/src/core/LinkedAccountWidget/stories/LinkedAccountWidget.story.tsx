/**
 * LinkedAccountWidget - Main Stories
 *
 * Basic configurations and layout options for the LinkedAccountWidget.
 * Start here to understand the component's primary use cases.
 *
 * For specialized scenarios, see:
 * - Account Statuses/* - All account lifecycle states
 * - Integration/* - Payment integration and callbacks
 * - Workflows/* - Interactive demonstrations
 */

import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  LinkedAccountWidgetStory,
} from './story-utils';

const meta = {
  title: 'Core/LinkedAccountWidget',
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
 * Default view showing multiple linked accounts in a responsive grid.
 * This is the standard configuration for most applications.
 *
 * **Try it:**
 * - Click "Link New Account" to see the creation flow
 * - Interact with account cards to see available actions
 * - Resize viewport to see responsive behavior
 */
export const Default: Story = {
  args: {
    variant: 'default',
  },
};

/**
 * Optimized for apps that only need one linked account.
 * The create button automatically hides when an active account exists.
 *
 * **Use this when:**
 * - Your app only needs one linked account (e.g., single beneficiary payment flow)
 * - You want to prevent users from linking multiple accounts
 */
export const SingleAccountVariant: Story = {
  args: {
    variant: 'singleAccount',
  },
};

/**
 * First-time user experience with no linked accounts.
 * Shows helpful onboarding messaging and clear call-to-action.
 *
 * **Use this to test:**
 * - Empty state messaging
 * - First-time user onboarding
 * - Account creation flow from scratch
 */
export const EmptyState: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers({
        ...linkedAccountListMock,
        recipients: [],
      }),
    },
  },
};
