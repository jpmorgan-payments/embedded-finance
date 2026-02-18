/**
 * ClientDetails - Client Statuses
 *
 * Showcase of different client statuses and loading/error states.
 * See how the component displays based on the client's approval status.
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
  title: 'Core/ClientDetails/Client Statuses',
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
 * **Loading State**
 *
 * Shows skeleton loading state while fetching client data.
 */
export const Loading: Story = {
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
 * **Error State**
 *
 * Shows error message when client fetch fails.
 */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({ status: 404 }),
    },
  },
  args: {
    clientId: 'invalid-id',
    viewMode: 'summary',
  },
};

// =============================================================================
// CLIENT STATUS VARIANTS
// =============================================================================

/**
 * **Approved Client**
 *
 * Default state - fully approved client with all sections available.
 */
export const Approved: Story = {
  args: {
    viewMode: 'summary',
  },
};

/**
 * **In Review**
 *
 * Shows how the component displays when client is under review.
 * Status badge indicates "In Review" state.
 */
export const InReview: Story = {
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
 * **Information Requested**
 *
 * Shows warning indicators when additional information is needed.
 * Outstanding items are highlighted in the verification section.
 */
export const InformationRequested: Story = {
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
 * **Declined**
 *
 * Shows how the component displays when client has been declined.
 */
export const Declined: Story = {
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
 * **New (Not Started)**
 *
 * Shows a client that has just been created but not yet submitted.
 */
export const New: Story = {
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
