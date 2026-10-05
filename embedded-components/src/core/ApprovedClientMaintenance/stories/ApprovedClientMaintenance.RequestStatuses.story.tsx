import type { Meta, StoryObj } from '@storybook/react-vite';

import type { KycUpdateRequestStatus } from '@/api/generated/smbdo.schemas';

import { ApprovedClientMaintenance } from '../ApprovedClientMaintenance';
import type { MaintenanceParty } from '../models/maintenanceApi.types';
import {
  LLC_WITH_DIRECT_OWNERS,
  person,
  PETER,
  TINKER,
} from './support/maintenanceStoryClients';
import {
  identityDocumentRequest,
  pendingUpdate,
} from './support/maintenanceStoryHandlers';
import {
  maintenanceStoryArgs,
  maintenanceStoryArgTypes,
  maintenanceStoryDecorator,
  withScenario,
  type MaintenanceStoryArgs,
} from './support/maintenanceStoryMeta';

const renamePeter = (
  status: KycUpdateRequestStatus = 'NEW'
): MaintenanceParty => ({
  id: PETER.id,
  individualDetails: { lastName: 'Pan-Darling' },
  updateRequest: pendingUpdate(status),
});

const renameTinker = (
  status: KycUpdateRequestStatus = 'NEW'
): MaintenanceParty => ({
  id: TINKER.id,
  individualDetails: { firstName: 'Tinkerbell' },
  updateRequest: pendingUpdate(status),
});

/**
 * One LLC (Peter Pan controls and owns it, Tinker Bell owns part) moving
 * through each state of a maintenance request.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Maintenance request statuses',
  component: ApprovedClientMaintenance,
  decorators: [maintenanceStoryDecorator],
  parameters: { layout: 'padded' },
  args: maintenanceStoryArgs,
  argTypes: maintenanceStoryArgTypes,
  render: (args) => <ApprovedClientMaintenance {...args} />,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** No maintenance request; the profile shows approved values only. */
export const NoMaintenanceRequest: Story = {
  parameters: withScenario({ client: LLC_WITH_DIRECT_OWNERS }),
};

/** A draft maintenance request with saved edits. Review and submit is available. */
export const DraftEdits: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [renamePeter()],
  }),
};

/** A new owner is being added and an existing owner removed. */
export const DraftAdditionAndRemoval: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [
      {
        ...person({
          id: '2200000109',
          firstName: 'Wendy',
          lastName: 'Darling',
          roles: ['BENEFICIAL_OWNER'],
        }),
        updateRequest: pendingUpdate('NEW', 'ADD'),
      },
      {
        id: TINKER.id,
        active: false,
        updateRequest: pendingUpdate(),
      },
    ],
  }),
};

/**
 * Control is being handed from Peter Pan to Tinker Bell. Undoing either side
 * restores both.
 */
export const DraftControllerReplacement: Story = {
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

/** Only the Limited DDA Payments upgrade is pending. */
export const DraftProductUpgrade: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'NEW',
  }),
};

/** The product upgrade and a maintenance request are submitted together. */
export const DraftProductUpgradeWithProfileChanges: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'NEW',
    proposals: [renamePeter()],
  }),
};

/** A draft maintenance request blocked by a document request for the person being renamed. */
export const DraftWithRequiredDocuments: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [renamePeter()],
    documentRequests: [identityDocumentRequest(PETER.id!, 'Peter Pan')],
  }),
};

/** The maintenance request is submitted and under review. Editing and discarding are locked. */
export const Submitted: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'REVIEW_IN_PROGRESS',
    proposals: [renamePeter('REVIEW_IN_PROGRESS')],
  }),
};

/**
 * Review asked for more information: each renamed person needs an identity
 * document, completed from their page or the request details page.
 */
export const InformationRequested: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [
      renamePeter('INFORMATION_REQUESTED'),
      renameTinker('INFORMATION_REQUESTED'),
    ],
    documentRequests: [
      identityDocumentRequest(PETER.id!, 'Peter Pan'),
      identityDocumentRequest(TINKER.id!, 'Tinker Bell'),
    ],
  }),
};
