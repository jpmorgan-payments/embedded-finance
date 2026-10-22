import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  LLC_WITH_DIRECT_OWNERS,
  PETER,
  renamePeter,
} from '../support/maintenanceStoryClients';
import { identityDocumentRequest } from '../support/maintenanceStoryHandlers';
import {
  maintenanceStoryMetaBase,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

// From the onboarding question mock: annual revenue, sanctioned regions with its
// follow-up, and a two-level chain of follow-ups about covered goods.
const QUESTION_TREE = ['30005', '30026', '30027', '30088', '30089', '30090'];
// The same questions without their follow-ups, which the API adds once an answer opens them.
const TOP_LEVEL_QUESTIONS = ['30005', '30026', '30088'];

/**
 * Client-level questions the API lists in `outstanding.questionIds`, before
 * submission and after review asks for more information. Answers clear each
 * question; a "Yes" can open follow-ups.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title:
    'Draft/ApprovedClientMaintenance/Maintenance requests/Outstanding questions',
  ...maintenanceStoryMetaBase,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/**
 * A draft request whose changes raised questions. Submission stays blocked
 * until they're answered; follow-ups appear as soon as an answer opens them.
 */
export const DraftRequest: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [renamePeter()],
    questionIds: QUESTION_TREE,
  }),
};

/**
 * Only top-level questions are outstanding. Saving a "Yes" returns new
 * follow-ups, so the page stays open and says more questions were added.
 */
export const FollowUpsAfterSaving: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [renamePeter()],
    questionIds: TOP_LEVEL_QUESTIONS,
  }),
};

/** One question with no follow-ups. */
export const SingleQuestion: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [renamePeter()],
    questionIds: ['30005'],
  }),
};

/** The product upgrade raised questions on its own, with no profile changes. */
export const ProductUpgradeOnly: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'NEW',
    questionIds: QUESTION_TREE,
  }),
};

/**
 * Review asked for answers after submission. Editing stays locked; once every
 * question is answered, review resumes without submitting again.
 */
export const InformationRequested: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'INFORMATION_REQUESTED',
    proposals: [renamePeter('INFORMATION_REQUESTED')],
    questionIds: QUESTION_TREE,
  }),
};

/** Review asked for answers and an identity document; review resumes once both are done. */
export const InformationRequestedWithDocuments: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'INFORMATION_REQUESTED',
    proposals: [renamePeter('INFORMATION_REQUESTED')],
    questionIds: QUESTION_TREE,
    documentRequests: [identityDocumentRequest(PETER.id!, 'Peter Pan')],
  }),
};

/** Review asked for answers about the product upgrade alone. */
export const ProductInformationRequested: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    productUpgrade: 'INFORMATION_REQUESTED',
    questionIds: QUESTION_TREE,
  }),
};

/** The questions can't be loaded, so they can't be answered and submission stays blocked. */
export const QuestionsFailToLoad: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [renamePeter()],
    questionIds: QUESTION_TREE,
    failQuestionLoad: true,
  }),
};

/** Saving answers fails; the answers stay on the page with the error. */
export const AnswersFailToSave: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    proposals: [renamePeter()],
    questionIds: QUESTION_TREE,
    failQuestionSave: true,
  }),
};
