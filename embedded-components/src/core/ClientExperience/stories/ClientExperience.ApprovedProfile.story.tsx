import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  LLC_WITH_DIRECT_OWNERS,
  LLC_WITH_MIXED_OWNERSHIP,
  renamePeter,
} from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryClients';

import {
  clientExperienceMetaBase,
  maintenanceScenario,
  type ClientExperienceStoryArgs,
} from './support/clientExperienceStoryMeta';

/**
 * Approved clients with nothing open: `ClientExperience` resolves
 * `approved-profile` and shows the read-only profile. Every change starts from
 * "Request a change" on the overview.
 */
const meta: Meta<ClientExperienceStoryArgs> = {
  title: 'Draft/ClientExperience/Approved profile',
  ...clientExperienceMetaBase,
};

export default meta;
type Story = StoryObj<ClientExperienceStoryArgs>;

/** No maintenance request has ever been made. */
export const NoMaintenanceHistory: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
});

/**
 * An earlier request was approved. The resolution reports
 * `hasMaintenanceHistory: true`; the profile itself shows only approved values.
 */
export const AfterApprovedRequest: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  proposals: [renamePeter('APPROVED')],
});

/** An earlier request was declined; nothing from it reached the profile. */
export const AfterDeclinedRequest: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  proposals: [renamePeter('DECLINED')],
});

/** Direct and indirect owners, so the change list includes the ownership structure. */
export const WithIndirectOwnership: Story = maintenanceScenario({
  client: LLC_WITH_MIXED_OWNERSHIP,
});

/** Eligibility allows no changes, so the profile is view-only with no "Request a change". */
export const ViewOnly: Story = maintenanceScenario(
  { client: LLC_WITH_DIRECT_OWNERS },
  { eligibility: [] }
);

/**
 * `changeActions="inline"`: each profile page also offers its own changes,
 * for hosts whose users manage the profile often.
 */
export const InlineChangeActions: Story = maintenanceScenario(
  { client: LLC_WITH_DIRECT_OWNERS },
  { changeActions: 'inline' }
);
