import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  LLC_WITH_DIRECT_OWNERS,
  LLC_WITH_UNREVIEWED_OWNER,
} from '../support/maintenanceStoryClients';
import {
  maintenanceStoryMetaBase,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

/** Responses the API shouldn't return, or failures loading them. */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Edge cases/Data and API',
  ...maintenanceStoryMetaBase,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** The client can't be loaded; the component offers a retry. */
export const ClientLoadFailure: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    failClientLoad: true,
  }),
};

/**
 * John Darling's addition ended without review, leaving him active but never
 * approved. `ClientExperience` sends this client to onboarding; rendered
 * directly, maintenance marks him Not reviewed and offers no changes.
 */
export const UnreviewedParty: Story = {
  parameters: withScenario({ client: LLC_WITH_UNREVIEWED_OWNER }),
};
