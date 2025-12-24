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

import { LinkedAccountWidget } from '../LinkedAccountWidget';
import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  seedRecipientData,
} from './story-utils';

const meta = {
  title: 'Core/LinkedAccountWidget',
  component: LinkedAccountWidget,
  tags: ['@core', '@linked-accounts'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createRecipientHandlers(),
    },
  },
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof LinkedAccountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    mode: 'list',
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Optimized for apps that only need one linked account.
 * The create button automatically hides when an active account exists.
 *
 * **Use this when:**
 * - Your app only needs one linked account (e.g., single beneficiary payment flow)
 * - You want to prevent users from linking multiple accounts
 */
export const SingleAccountMode: Story = {
  args: {
    mode: 'single',
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients: linkedAccountListMock.recipients?.slice(0, 1) ?? [],
      });
    },
  ],
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
    mode: 'list',
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients: [],
      });
    },
  ],
};

/**
 * Compact layout optimized for space-constrained UIs.
 * Shows accounts as edge-to-edge rows with reduced padding.
 *
 * **Use this when:**
 * - Space is limited (e.g., sidebars, modals, mobile views)
 * - You need to display more accounts in less vertical space
 * - You want a denser, list-style layout
 *
 * **Features:**
 * - No padding between cards (edge-to-edge)
 * - Compact header with hidden description
 * - Inline status messages instead of alerts
 * - Horizontal layout with icon, name, and actions
 */
export const CompactLayout: Story = {
  args: {
    mode: 'list',
    viewMode: 'compact-cards',
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Virtualized scrolling for handling large lists efficiently.
 * Uses virtual scrolling to render only visible items for performance.
 *
 * **Use this when:**
 * - You have many linked accounts (10+)
 * - You want to limit the widget's height
 * - Performance with large lists is a concern
 *
 * **Features:**
 * - Fixed height container with scrolling
 * - Only renders visible items (virtualized)
 * - Smooth scrolling experience
 * - Automatic height calculation for dynamic content
 */
export const ScrollableList: Story = {
  args: {
    mode: 'list',
    scrollable: true,
    maxHeight: '400px',
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};
