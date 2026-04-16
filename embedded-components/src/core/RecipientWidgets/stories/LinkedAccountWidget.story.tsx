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

import type { Recipient } from '@/api/generated/ep-recipients.schemas';

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
 * Same optional `reviewAcknowledgements` checklist as onboarding `linkAccountStepOptions` (editable mode):
 * agreements render on step 2 of the link dialog above the certification checkbox.
 */
export const WithReviewAcknowledgements: Story = {
  args: {
    mode: 'list',
    linkAccountReviewAcknowledgements: [
      {
        id: 'businessPurpose',
        labelKey:
          'screens.linkAccount.prefillSummary.acknowledgements.businessPurpose',
      },
      {
        id: 'verifyAndAccuracy',
        labelKey:
          'screens.linkAccount.prefillSummary.acknowledgements.verifyAndAccuracy',
      },
      {
        id: 'debitAndTerms',
        labelKey:
          'screens.linkAccount.prefillSummary.acknowledgements.debitAndTerms',
        linkHrefs: {
          jpTermsLink: 'https://www.jpmorgan.com',
          platformAgreementLink: 'https://example.com/platform-agreement',
        },
      },
    ],
    showLinkAccountAcknowledgementsIntro: true,
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

// ============================================================================
// Rejected Accounts
// ============================================================================

/**
 * Helper to create rejected recipient mock data with recent `updatedAt` dates
 * so they appear within the 30-day window shown by the rejected accounts section.
 */
function createRecentRejectedRecipients(): Recipient[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  return [
    {
      id: 'rejected-001',
      type: 'LINKED_ACCOUNT',
      status: 'REJECTED',
      createdAt: new Date(now - 5 * oneDay).toISOString(),
      updatedAt: new Date(now - 2 * oneDay).toISOString(),
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'Alex',
        lastName: 'James',
        contacts: [{ contactType: 'EMAIL', value: 'alex.james@example.com' }],
        address: {
          addressLine1: '451 Rose Garden',
          city: 'New York City',
          state: 'NY',
          postalCode: '10007',
          countryCode: 'US',
        },
      },
      account: {
        number: '12345678901234567',
        type: 'CHECKING',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '154135115',
            transactionType: 'ACH',
          },
        ],
      },
    },
    {
      id: 'rejected-002',
      type: 'LINKED_ACCOUNT',
      status: 'REJECTED',
      createdAt: new Date(now - 10 * oneDay).toISOString(),
      updatedAt: new Date(now - 7 * oneDay).toISOString(),
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'Maria',
        lastName: 'Garcia',
        contacts: [{ contactType: 'EMAIL', value: 'maria.garcia@example.com' }],
        address: {
          addressLine1: '789 Oak Avenue',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          countryCode: 'US',
        },
      },
      account: {
        number: '98765432109876543',
        type: 'SAVINGS',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '121000248',
            transactionType: 'ACH',
          },
        ],
      },
    },
    {
      id: 'rejected-003',
      type: 'LINKED_ACCOUNT',
      status: 'REJECTED',
      createdAt: new Date(now - 20 * oneDay).toISOString(),
      updatedAt: new Date(now - 15 * oneDay).toISOString(),
      partyDetails: {
        type: 'ORGANIZATION',
        businessName: 'Sunset Trading Co.',
        contacts: [
          { contactType: 'EMAIL', value: 'accounts@sunsettrading.com' },
        ],
        address: {
          addressLine1: '1200 Commerce St',
          city: 'Dallas',
          state: 'TX',
          postalCode: '75201',
          countryCode: 'US',
        },
      },
      account: {
        number: '55566677788899900',
        type: 'CHECKING',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: '111000025',
            transactionType: 'ACH',
          },
        ],
      },
    },
  ] as Recipient[];
}

/**
 * Shows the optional rejected accounts section below the main list.
 * Displays accounts rejected in the last 30 days in a collapsible panel.
 *
 * **Enable with:** `showRejectedAccounts={true}`
 *
 * **Features:**
 * - Collapsible section (collapsed by default)
 * - Shows rejection count in a badge
 * - Inline summary of the most recent rejection when collapsed
 * - Sorted most-recent-first by `updatedAt`
 * - Only shows rejections from the last 30 days
 *
 * **Try it:**
 * - Click the "Rejected Accounts" header to expand/collapse
 * - Notice the badge count and inline summary
 */
export const WithRejectedAccounts: Story = {
  args: {
    mode: 'list',
    showRejectedAccounts: true,
  },
  loaders: [
    async () => {
      // Seed active accounts + rejected accounts together
      const rejectedRecipients = createRecentRejectedRecipients();
      const combinedMock = {
        ...linkedAccountListMock,
        recipients: [
          ...(linkedAccountListMock.recipients ?? []),
          ...rejectedRecipients,
        ],
      };
      await seedRecipientData(combinedMock);
    },
  ],
};
