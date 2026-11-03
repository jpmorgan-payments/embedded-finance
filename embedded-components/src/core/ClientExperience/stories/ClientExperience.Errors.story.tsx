import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';

import { LLC_WITH_DIRECT_OWNERS } from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryClients';
import {
  createMaintenanceStoryHandlers,
  STORY_CLIENT_ID,
} from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryHandlers';

import {
  clientExperienceMetaBase,
  maintenanceScenario,
  type ClientExperienceStoryArgs,
} from './support/clientExperienceStoryMeta';

/**
 * Before a route is chosen: while the client and its maintenance requests
 * load, and when either can't be loaded. `onExperienceResolved` isn't called.
 */
const meta: Meta<ClientExperienceStoryArgs> = {
  title: 'Draft/ClientExperience/Loading and errors',
  ...clientExperienceMetaBase,
};

export default meta;
type Story = StoryObj<ClientExperienceStoryArgs>;

/** The client never finishes loading. */
export const Loading: Story = {
  args: { clientId: STORY_CLIENT_ID },
  parameters: {
    msw: {
      handlers: [
        http.get('/clients/:clientId', async () => {
          await delay('infinite');
        }),
        ...createMaintenanceStoryHandlers({ client: LLC_WITH_DIRECT_OWNERS }),
      ],
    },
  },
};

/** The client can't be loaded, so a retry is offered. */
export const ClientLoadFailure: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  failClientLoad: true,
});

/** Maintenance requests can't be loaded, so the route is unknown and a retry is offered. */
export const MaintenanceRequestsLoadFailure: Story = {
  args: { clientId: STORY_CLIENT_ID },
  parameters: {
    msw: {
      handlers: [
        http.get('/maintenance-requests', () =>
          HttpResponse.json(
            { title: 'Service unavailable', httpStatus: 503 },
            { status: 503 }
          )
        ),
        ...createMaintenanceStoryHandlers({ client: LLC_WITH_DIRECT_OWNERS }),
      ],
    },
  },
};

/** The provider has no client ID, so there is nothing to load. */
export const MissingClientId: Story = {
  args: { clientId: '' },
};
