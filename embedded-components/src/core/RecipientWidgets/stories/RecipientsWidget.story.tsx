/**
 * RecipientsWidget - Main Stories
 *
 * Basic configurations and layout options for the RecipientsWidget.
 * This widget manages payment recipients (RECIPIENT type) without microdeposit verification.
 *
 * For linked accounts with microdeposit verification, see LinkedAccountWidget.
 */

import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecipientsWidget } from '../RecipientsWidget/RecipientsWidget';
import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  seedRecipientData,
} from './story-utils';

const meta = {
  title: 'Core/RecipientsWidget',
  component: RecipientsWidget,
  tags: ['@core', '@recipients'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createRecipientHandlers({ recipientType: 'RECIPIENT' }),
    },
  },
  args: {
    ...commonArgs,
  },
  argTypes: {
    ...commonArgTypes,
    // Override callback names for RECIPIENT type
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
 * Default view showing multiple payment recipients in a responsive grid.
 * This is the standard configuration for most applications.
 *
 * **Try it:**
 * - Click "Add New Recipient" to see the creation flow
 * - Interact with recipient cards to see available actions
 * - Resize viewport to see responsive behavior
 */
export const Default: Story = {
  args: {
    mode: 'list',
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status:
              r.status === 'MICRODEPOSITS_INITIATED' ? 'ACTIVE' : r.status,
          })) ?? [],
      });
    },
  ],
};

/**
 * Optimized for apps that only need one recipient.
 * The create button automatically hides when an active recipient exists.
 *
 * **Use this when:**
 * - Your app only needs one recipient (e.g., single payee payment flow)
 * - You want to prevent users from adding multiple recipients
 */
export const SingleRecipientMode: Story = {
  args: {
    mode: 'single',
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.slice(0, 1).map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status: 'ACTIVE',
          })) ?? [],
      });
    },
  ],
};

/**
 * First-time user experience with no recipients.
 * Shows helpful onboarding messaging and clear call-to-action.
 *
 * **Use this to test:**
 * - Empty state messaging
 * - First-time user onboarding
 * - Recipient creation flow from scratch
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
 * Shows recipients as edge-to-edge rows with reduced padding.
 *
 * **Use this when:**
 * - Space is limited (e.g., sidebars, modals, mobile views)
 * - You need to display more recipients in less vertical space
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
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status: 'ACTIVE',
          })) ?? [],
      });
    },
  ],
};

/**
 * Page-based pagination for cards view.
 * Shows navigation controls similar to the table view instead of "Load More".
 *
 * **Use this when:**
 * - You want users to navigate directly to specific pages
 * - You prefer page-based navigation over infinite scroll
 * - You need to show page size selector
 *
 * **Features:**
 * - First/previous/next/last page buttons
 * - Page size selector (5, 10, 20, 30, 50)
 * - Shows current page and total pages
 * - Shows "Showing X to Y of Z" info
 */
export const PagesPagination: Story = {
  args: {
    mode: 'list',
    viewMode: 'cards',
    paginationStyle: 'pages',
    pageSize: 5,
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status: 'ACTIVE',
          })) ?? [],
      });
    },
  ],
};

/**
 * Page-based pagination with compact cards.
 * Combines compact card layout with page navigation controls.
 *
 * **Use this when:**
 * - You want compact layout with traditional pagination
 * - Space is limited but you need page navigation
 */
export const CompactWithPagesPagination: Story = {
  args: {
    mode: 'list',
    viewMode: 'compact-cards',
    paginationStyle: 'pages',
    pageSize: 5,
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status: 'ACTIVE',
          })) ?? [],
      });
    },
  ],
};

/**
 * Virtualized scrolling for handling large lists efficiently.
 * Uses virtual scrolling to render only visible items for performance.
 *
 * **Use this when:**
 * - You have many recipients (10+)
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
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status: 'ACTIVE',
          })) ?? [],
      });
    },
  ],
};

/**
 * Table view for structured data display.
 * Shows recipients in a sortable, paginated table with server-side pagination.
 *
 * **Use this when:**
 * - You need sorting capabilities
 * - Users expect a traditional table interface
 * - You want to show many data points per recipient
 *
 * **Features:**
 * - Sortable columns
 * - Server-side pagination
 * - Compact, dense layout
 * - Full recipient details in each row
 */
export const TableView: Story = {
  args: {
    mode: 'list',
    viewMode: 'table',
    pageSize: 10,
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status: 'ACTIVE',
          })) ?? [],
      });
    },
  ],
};

/**
 * Hide the create button.
 * Useful when recipient creation is managed elsewhere in your app.
 *
 * **Use this when:**
 * - Recipients are created through a different flow
 * - You only want to display existing recipients
 * - Create functionality should be disabled for certain users
 */
export const HideCreateButton: Story = {
  args: {
    mode: 'list',
    hideCreateButton: true,
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status: 'ACTIVE',
          })) ?? [],
      });
    },
  ],
};
