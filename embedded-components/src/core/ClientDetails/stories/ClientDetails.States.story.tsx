/**
 * ClientDetails - States
 *
 * Loading, error, and client status variants.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { ClientDetails } from '../ClientDetails';
import type { ClientDetailsProps } from '../ClientDetails.types';
import {
  commonArgs,
  commonArgTypes,
  createClientDetailsHandlers,
  mockClientDetails,
} from './story-utils';

type ClientDetailsStoryArgs = Omit<BaseStoryArgs, 'clientId'> &
  ClientDetailsProps;

const meta: Meta<ClientDetailsStoryArgs> = {
  title: 'Beta/ClientDetails/States',
  component: ClientDetails,
  tags: ['@core', '@client-details'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createClientDetailsHandlers(),
    },
  },
  args: {
    ...commonArgs,
  },
  argTypes: {
    ...commonArgTypes,
  },
  render: (args) => (
    <div className="eb-max-w-2xl">
      <ClientDetails
        {...args}
        clientId={args.clientId || commonArgs.clientId}
      />
    </div>
  ),
};

export default meta;
type Story = StoryObj<ClientDetailsStoryArgs>;

// =============================================================================
// LOADING & ERROR STATES
// =============================================================================

/**
 * **Loading - Summary**
 *
 * Skeleton loading state for summary view mode.
 */
export const LoadingSummary: Story = {
  name: 'Loading - Summary',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({ delayMs: 60000 }),
    },
  },
  args: {
    viewMode: 'summary',
  },
};

/**
 * **Loading - Accordion**
 *
 * Skeleton loading state for accordion view mode.
 */
export const LoadingAccordion: Story = {
  name: 'Loading - Accordion',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({ delayMs: 60000 }),
    },
  },
  args: {
    viewMode: 'accordion',
    title: 'Client Details',
  },
};

/**
 * **Loading - Cards**
 *
 * Skeleton loading state for cards view mode.
 */
export const LoadingCards: Story = {
  name: 'Loading - Cards',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({ delayMs: 60000 }),
    },
  },
  args: {
    viewMode: 'cards',
    title: 'Client Details',
  },
};

/**
 * **Error State**
 *
 * Displays error message when client fetch fails.
 */
export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({ status: 404 }),
    },
  },
  args: {
    clientId: 'invalid-client-id',
    viewMode: 'summary',
  },
};

// =============================================================================
// CLIENT STATUS VARIANTS
// =============================================================================

/**
 * **Status - Approved**
 *
 * Fully approved client - all checks passed.
 */
export const StatusApproved: Story = {
  name: 'Status - Approved',
  args: {
    viewMode: 'summary',
  },
};

/**
 * **Status - In Review**
 *
 * Client application is being reviewed.
 */
export const StatusInReview: Story = {
  name: 'Status - In Review',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({
        client: {
          ...mockClientDetails,
          status: 'REVIEW_IN_PROGRESS',
          results: {
            customerIdentityStatus: 'REVIEW_IN_PROGRESS',
          },
        },
      }),
    },
  },
  args: {
    viewMode: 'summary',
  },
};

/**
 * **Status - Information Requested**
 *
 * Additional information needed - shows warning indicators.
 */
export const StatusInfoRequested: Story = {
  name: 'Status - Info Requested',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({
        client: {
          ...mockClientDetails,
          status: 'INFORMATION_REQUESTED',
          results: {
            customerIdentityStatus: 'INFORMATION_REQUESTED',
          },
          outstanding: {
            documentRequestIds: ['doc-1', 'doc-2'],
            questionIds: ['q-1'],
            partyIds: [],
            partyRoles: [],
          },
        },
      }),
    },
  },
  args: {
    viewMode: 'summary',
  },
};

/**
 * **Status - Declined**
 *
 * Client application was declined.
 */
export const StatusDeclined: Story = {
  name: 'Status - Declined',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({
        client: {
          ...mockClientDetails,
          status: 'DECLINED',
          results: {
            customerIdentityStatus: 'INFORMATION_REQUESTED',
          },
        },
      }),
    },
  },
  args: {
    viewMode: 'summary',
  },
};

/**
 * **Status - New**
 *
 * Newly created client that hasn't been submitted yet.
 */
export const StatusNew: Story = {
  name: 'Status - New',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({
        client: {
          ...mockClientDetails,
          status: 'NEW',
          results: undefined,
        },
      }),
    },
  },
  args: {
    viewMode: 'summary',
  },
};
