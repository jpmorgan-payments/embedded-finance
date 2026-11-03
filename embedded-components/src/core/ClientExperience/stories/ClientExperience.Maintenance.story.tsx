import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  LLC_WITH_DIRECT_OWNERS,
  PETER,
  renamePeter,
  renameTinker,
  TINKER,
} from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryClients';
import { identityDocumentRequest } from '@/core/ApprovedClientMaintenance/stories/support/maintenanceStoryHandlers';

import {
  clientExperienceMetaBase,
  maintenanceScenario,
  type ClientExperienceStoryArgs,
} from './support/clientExperienceStoryMeta';

/**
 * Approved clients with something open: `ClientExperience` resolves
 * `maintenance`, either for a maintenance request in progress or for a request
 * for information on the approved profile.
 */
const meta: Meta<ClientExperienceStoryArgs> = {
  title: 'Draft/ClientExperience/Maintenance',
  ...clientExperienceMetaBase,
};

export default meta;
type Story = StoryObj<ClientExperienceStoryArgs>;

/** A draft with saved changes. The overview offers to review and submit it. */
export const Draft: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  proposals: [renamePeter()],
});

/** A draft that can't be submitted until a document is uploaded. */
export const DraftWithRequiredDocuments: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  proposals: [renamePeter()],
  documentRequests: [identityDocumentRequest(PETER.id!, 'Peter Pan')],
});

/** The request is submitted and under review; nothing can change until it's decided. */
export const UnderReview: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  proposals: [renamePeter('REVIEW_IN_PROGRESS')],
});

/** Review asked for an identity document for each renamed person. */
export const InformationRequested: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  proposals: [
    renamePeter('INFORMATION_REQUESTED'),
    renameTinker('INFORMATION_REQUESTED'),
  ],
  documentRequests: [
    identityDocumentRequest(PETER.id!, 'Peter Pan'),
    identityDocumentRequest(TINKER.id!, 'Tinker Bell'),
  ],
});

/**
 * No request is open, but review asked questions and a document for a
 * related party. The request shows at the top of the overview.
 */
export const ApprovedWithInformationRequest: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  questionIds: ['500096', '500099'],
  documentRequests: [identityDocumentRequest(PETER.id!, 'Peter Pan')],
});

/** Review asked questions only. */
export const ApprovedWithQuestions: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  questionIds: ['500096', '500099'],
});

/** Review asked for a document only. */
export const ApprovedWithDocumentRequest: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  documentRequests: [identityDocumentRequest(PETER.id!, 'Peter Pan')],
});

/**
 * A draft is open and review also asked a question. The overview counts only
 * the question from review; the draft's own questions stay with the request.
 */
export const DraftWithInformationRequest: Story = maintenanceScenario({
  client: LLC_WITH_DIRECT_OWNERS,
  proposals: [renamePeter()],
  questionIds: ['30005', '500096'],
});
