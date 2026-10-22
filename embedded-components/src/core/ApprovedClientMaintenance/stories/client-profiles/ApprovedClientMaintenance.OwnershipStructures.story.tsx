import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  CORPORATION_AT_OWNER_LIMIT,
  LLC_WITH_DIRECT_OWNERS,
  LLC_WITH_INDIRECT_OWNERS_ONLY,
  LLC_WITH_MIXED_OWNERSHIP,
  NON_PROFIT_WITHOUT_OWNERS,
  PARTNERSHIP_WITH_INTERMEDIARY_CHAIN,
} from '../support/maintenanceStoryClients';
import {
  maintenanceStoryMetaBase,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

/**
 * Approved clients with different ownership structures. Open View ownership
 * structure to see the tree and its actions.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Client profiles/Ownership structures',
  ...maintenanceStoryMetaBase,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** Two people own the business directly. */
export const DirectOwnersOnly: Story = {
  parameters: withScenario({ client: LLC_WITH_DIRECT_OWNERS }),
};

/** Every owner holds their stake through one intermediary business. */
export const IndirectOwnersOnly: Story = {
  parameters: withScenario({ client: LLC_WITH_INDIRECT_OWNERS_ONLY }),
};

/** A direct owner next to an intermediary business with its own owner. */
export const DirectAndIndirectOwners: Story = {
  parameters: withScenario({ client: LLC_WITH_MIXED_OWNERSHIP }),
};

/** Owners hold their stakes through two levels of intermediary businesses. */
export const IntermediaryChain: Story = {
  parameters: withScenario({ client: PARTNERSHIP_WITH_INTERMEDIARY_CHAIN }),
};

/**
 * Four direct owners reach the limit, so Add beneficial owner is disabled
 * with an explanation.
 */
export const AtOwnerLimit: Story = {
  parameters: withScenario({ client: CORPORATION_AT_OWNER_LIMIT }),
};

/** Nobody owns 25% or more, so the controller is the only related party. */
export const NoBeneficialOwners: Story = {
  parameters: withScenario({ client: NON_PROFIT_WITHOUT_OWNERS }),
};
