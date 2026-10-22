import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  LLC_WITH_DIRECT_OWNERS,
  PETER,
  renamePeter,
  renameTinker,
  TINKER,
} from '../support/maintenanceStoryClients';
import { identityDocumentRequest } from '../support/maintenanceStoryHandlers';
import {
  maintenanceStoryMetaBase,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

/**
 * One LLC (Peter Pan controls and owns it, Tinker Bell owns part) moving
 * through each state of a maintenance request.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Maintenance requests/Statuses',
  ...maintenanceStoryMetaBase,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** No maintenance request; the profile shows approved values only. */
export const NoMaintenanceRequest: Story = {
  parameters: withScenario({ client: LLC_WITH_DIRECT_OWNERS }),
};

/** A draft maintenance request with saved changes. Review and submit is available. */
export const Draft: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
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
