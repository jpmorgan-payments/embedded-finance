import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  LLC_WITH_DIRECT_OWNERS,
  LLC_WITH_INDIRECT_OWNER_CONTROLLER,
  LLC_WITH_NON_OWNER_CONTROLLER,
  LLC_WITH_SOLE_OWNER_CONTROLLER,
} from '../support/maintenanceStoryClients';
import {
  maintenanceStoryMetaBase,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

/**
 * Approved clients whose controller holds a different ownership position.
 * Open the controller to see which role actions are offered.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Client profiles/Controllers',
  ...maintenanceStoryMetaBase,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/**
 * Wendy Darling controls the business but owns nothing; two other people own
 * directly. The controller offers Add beneficial owner role.
 */
export const ControllerIsNotAnOwner: Story = {
  parameters: withScenario({ client: LLC_WITH_NON_OWNER_CONTROLLER }),
};

/** Peter Pan controls the business and owns directly, next to another owner. */
export const ControllerIsAlsoDirectOwner: Story = {
  parameters: withScenario({ client: LLC_WITH_DIRECT_OWNERS }),
};

/** Peter Pan controls the business and is its only owner. */
export const ControllerIsOnlyOwner: Story = {
  parameters: withScenario({ client: LLC_WITH_SOLE_OWNER_CONTROLLER }),
};

/**
 * Tiger Lily controls the business and owns it through an intermediary
 * business; Tinker Bell owns directly.
 */
export const ControllerOwnsThroughIntermediary: Story = {
  parameters: withScenario({ client: LLC_WITH_INDIRECT_OWNER_CONTROLLER }),
};
