import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  intermediary,
  LLC_WITH_DIRECT_OWNERS,
  LLC_WITH_INDIRECT_OWNERS_ONLY,
  LLC_WITH_MIXED_OWNERSHIP,
  LLC_WITH_NON_OWNER_CONTROLLER,
  ORGANIZATION_PARTY_ID,
  person,
  PETER,
  renamePeter,
  TINKER,
  WENDY,
} from '../support/maintenanceStoryClients';
import { pendingUpdate } from '../support/maintenanceStoryHandlers';
import {
  maintenanceStoryMetaBase,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

/**
 * Draft maintenance requests, one kind of change each. Open Review and submit
 * to see how the change is summarized.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Maintenance requests/Draft changes',
  ...maintenanceStoryMetaBase,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** Business and personal details corrected. */
export const DetailEdits: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [
      renamePeter(),
      {
        id: ORGANIZATION_PARTY_ID,
        organizationDetails: { dbaName: 'Neverland Books Co.' },
        updateRequest: pendingUpdate(),
      },
    ],
  }),
};

/** A new owner is being added and an existing owner removed. */
export const OwnerAddedAndRemoved: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [
      {
        ...person({
          id: '2290000101',
          firstName: 'Wendy',
          lastName: 'Darling',
          roles: ['BENEFICIAL_OWNER'],
        }),
        updateRequest: pendingUpdate('NEW', 'ADD'),
      },
      { id: TINKER.id, active: false, updateRequest: pendingUpdate() },
    ],
  }),
};

/**
 * Control is being handed from Peter Pan to Tinker Bell. Undoing either side
 * restores both.
 */
export const ControllerReplaced: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [
      {
        id: TINKER.id,
        roles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
        updateRequest: pendingUpdate(),
      },
      { id: PETER.id, active: false, updateRequest: pendingUpdate() },
    ],
  }),
};

/** Wendy Darling, the controller, now also owns the business directly. */
export const ControllerBecomesDirectOwner: Story = {
  parameters: withScenario({
    client: LLC_WITH_NON_OWNER_CONTROLLER,
    proposals: [
      {
        id: WENDY.id,
        roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
        individualDetails: { natureOfOwnership: 'Direct' },
        updateRequest: pendingUpdate(),
      },
    ],
  }),
};

/** Wendy Darling, the controller, now owns through Black Flag Holdings LLC. */
export const ControllerBecomesIndirectOwner: Story = {
  parameters: withScenario({
    client: LLC_WITH_INDIRECT_OWNERS_ONLY,
    proposals: [
      {
        id: WENDY.id,
        roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
        parentPartyId: '2200000181',
        individualDetails: { natureOfOwnership: 'Indirect' },
        updateRequest: pendingUpdate(),
      },
    ],
  }),
};

/** Peter Pan moves from owning directly to owning through Star Holdings LLC. */
export const OwnerMovedUnderIntermediary: Story = {
  parameters: withScenario({
    client: LLC_WITH_MIXED_OWNERSHIP,
    proposals: [
      {
        id: PETER.id,
        parentPartyId: '2200000141',
        individualDetails: { natureOfOwnership: 'Indirect' },
        updateRequest: pendingUpdate(),
      },
    ],
  }),
};

/** A new intermediary business with a new owner beneath it. */
export const IntermediaryAddedWithOwner: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [
      {
        ...intermediary({
          id: '2290000201',
          name: 'Hangman Tree Holdings LLC',
        }),
        updateRequest: pendingUpdate('NEW', 'ADD'),
      },
      {
        ...person({
          id: '2290000202',
          firstName: 'John',
          lastName: 'Darling',
          roles: ['BENEFICIAL_OWNER'],
          parentPartyId: '2290000201',
          jobTitle: 'Other',
        }),
        updateRequest: pendingUpdate('NEW', 'ADD'),
      },
    ],
  }),
};

/**
 * Star Holdings LLC is being removed, and Tinker Bell, who owned through it,
 * now owns directly.
 */
export const IntermediaryRemovedOwnerKept: Story = {
  parameters: withScenario({
    client: LLC_WITH_MIXED_OWNERSHIP,
    proposals: [
      { id: '2200000141', active: false, updateRequest: pendingUpdate() },
      {
        id: '2200000142',
        parentPartyId: ORGANIZATION_PARTY_ID,
        individualDetails: { natureOfOwnership: 'Direct' },
        updateRequest: pendingUpdate(),
      },
    ],
  }),
};

/** Only the Limited DDA Payments upgrade is pending. */
export const ProductUpgrade: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'NEW',
  }),
};

/** The product upgrade and profile changes are submitted together. */
export const ProductUpgradeWithProfileChanges: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'NEW',
    proposals: [renamePeter()],
  }),
};
