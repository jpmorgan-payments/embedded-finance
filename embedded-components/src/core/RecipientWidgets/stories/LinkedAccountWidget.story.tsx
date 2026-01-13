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

import { LinkedAccountWidget } from '../LinkedAccountWidget/LinkedAccountWidget';
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
 * Default view showing multiple linked accounts in compact card layout with page-based pagination.
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
 * Full cards layout with rich details.
 * Shows accounts as full cards instead of the default compact layout.
 *
 * **Use this when:**
 * - You want to display more details per account
 * - You have fewer accounts and more screen space
 * - You prefer a richer visual presentation
 *
 * **Features:**
 * - Full card layout with rich details
 * - Description text visible in header
 * - More visual prominence per account
 */
export const CardsLayout: Story = {
  args: {
    mode: 'list',
    viewMode: 'cards',
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Full cards view with "Load More" pagination.
 * Shows accounts as full cards with incremental loading instead of page navigation.
 *
 * **Use this when:**
 * - You want full card layout with incremental loading
 * - You prefer infinite scroll-style loading over page navigation
 *
 * **Features:**
 * - Full card layout with rich details
 * - "Load More" button for incremental loading
 */
export const CardsWithLoadMore: Story = {
  args: {
    mode: 'list',
    viewMode: 'cards',
    paginationStyle: 'loadMore',
    pageSize: 5,
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Compact cards layout with "Load More" pagination.
 * Uses default compact layout with incremental loading instead of page navigation.
 *
 * **Use this when:**
 * - You want the default compact layout with incremental loading
 * - You prefer "Load More" style over page navigation
 *
 * **Features:**
 * - Compact card layout (default)
 * - "Load More" button for incremental loading
 */
export const CompactWithLoadMore: Story = {
  args: {
    mode: 'list',
    viewMode: 'compact-cards',
    paginationStyle: 'loadMore',
    pageSize: 5,
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Table view for structured data display.
 * Shows accounts in a sortable, paginated table with server-side pagination.
 *
 * **Use this when:**
 * - You need sorting capabilities
 * - Users expect a traditional table interface
 * - You want to show many data points per account
 *
 * **Features:**
 * - Sortable columns
 * - Server-side pagination
 * - Compact, dense layout
 * - Full account details in each row
 */
export const TableView: Story = {
  args: {
    mode: 'list',
    viewMode: 'table',
    pageSize: 10,
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
    scrollableMaxHeight: '400px',
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Hide the create button.
 * Useful when account linking is managed elsewhere in your app.
 *
 * **Use this when:**
 * - Accounts are linked through a different flow
 * - You only want to display existing accounts
 * - Create functionality should be disabled for certain users
 */
export const HideCreateButton: Story = {
  args: {
    mode: 'list',
    hideCreateButton: true,
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};
