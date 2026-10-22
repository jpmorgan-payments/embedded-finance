/**
 * OnboardingFlow - Client States
 *
 * Stories demonstrating different client statuses and loading/error states.
 *
 * Linked-account scenarios live under **Core → OnboardingFlow → Linked account**.
 * Each story seeds the MSW db via `loaders` so all CRUD operations work.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  createOnboardingFlowHandlers,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientApproved,
  mockClientApprovedWithOutstandingItems,
  mockClientDeclined,
  mockClientInfoRequested,
  mockClientInfoRequestedQuestionsOnly,
  mockClientInfoRequestedWithQuestions,
  mockClientInReview,
  mockClientNew,
  mockClientNewWithAuthorizedUserParty,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Client States',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: defaultHandlers,
    },
  },
  args: {
    ...commonArgsWithCallbacks,
  },
  argTypes: {
    ...commonArgTypes,
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// =============================================================================
// NEW CLIENT (FRESH ONBOARDING)
// =============================================================================

/**
 * **New Client - No Client ID**
 *
 * Fresh onboarding flow with no existing client data.
 * User starts from the beginning of the onboarding process.
 */
export const NewNoClientId: Story = {
  name: 'New — no client ID',
  args: {
    ...commonArgs,
  },
};

/**
 * **New Client - With Client ID**
 *
 * Resuming an onboarding flow for a NEW status client.
 * Shows existing data pre-filled in forms.
 */
export const NewWithClientId: Story = {
  name: 'New — with client ID',
  loaders: [() => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,

    showDisclosureFooter: true,
    disclosureConfig: {
      platformName: 'SellSense',
      platformAgreementUrl: 'https://example.com/sellsense-program-agreement',
    },
  },
};

/**
 * **New Client - With Client ID (individual party has AUTHORIZED_USER role)**
 *
 * Same as **New Client - With Client ID**, but the controller individual
 * party’s `roles` array includes `AUTHORIZED_USER` (uppercase API enum value).
 */
export const NewWithClientIdAuthorizedUserPartyRole: Story = {
  name: 'New — with client ID (authorized user party role)',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientNewWithAuthorizedUserParty,
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,

    showDisclosureFooter: true,
    disclosureConfig: {
      platformName: 'SellSense',
      platformAgreementUrl: 'https://example.com/sellsense-program-agreement',
    },
  },
};

// =============================================================================
// IN REVIEW STATUS
// =============================================================================

/**
 * **Review In Progress**
 *
 * Client application is currently being reviewed.
 * User sees a status screen indicating review is in progress.
 */
export const ReviewInProgress: Story = {
  loaders: [() => resetAndSeedClient(mockClientInReview, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

// =============================================================================
// INFORMATION REQUESTED STATUS
// =============================================================================

/**
 * **Information requested — documents only**
 *
 * Additional documents or information needed from the client.
 * User sees outstanding requirements and can upload documents.
 * Default `alertOnPreviousStep` is true so Cancel / Return to overview match stepper Back behavior.
 */
export const InformationRequested: Story = {
  name: 'Information requested — documents only',
  loaders: [
    () => resetAndSeedClient(mockClientInfoRequested, DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    alertOnPreviousStep: true,
  },
};

/**
 * **Information requested — documents + questions**
 *
 * The review team asked for documents and answers to questions. The overview
 * shows an **Additional information** card next to **Supporting documents**.
 * Questions are saved with `PATCH /clients`; once every question is answered
 * and every document submitted, the client returns to review.
 */
export const InformationRequestedWithQuestions: Story = {
  name: 'Information requested — documents + questions',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientInfoRequestedWithQuestions,
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    alertOnPreviousStep: true,
  },
};

/**
 * **Information requested — questions only**
 *
 * The information request contains only questions. Answering "Yes" to the
 * sanctions question reveals a follow-up asking which countries.
 */
export const InformationRequestedQuestionsOnly: Story = {
  name: 'Information requested — questions only',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientInfoRequestedQuestionsOnly,
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    alertOnPreviousStep: true,
  },
};

// =============================================================================
// APPROVED STATUS
// =============================================================================

/**
 * **Approved**
 *
 * Client application has been fully approved.
 * User sees success status and next steps.
 */
export const Approved: Story = {
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **Approved — outstanding items (documents + questions)**
 *
 * An information request raised after approval: one business document and
 * the sample questions. The status stays `APPROVED` while the request is open
 * and after it is fulfilled.
 */
export const ApprovedWithOutstandingItems: Story = {
  name: 'Approved — outstanding items (documents + questions)',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientApprovedWithOutstandingItems,
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    alertOnPreviousStep: true,
  },
};

// =============================================================================
// DECLINED STATUS
// =============================================================================

/**
 * **Declined**
 *
 * Client application was declined.
 * User sees declined status with relevant messaging.
 */
export const Declined: Story = {
  loaders: [() => resetAndSeedClient(mockClientDeclined, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

// =============================================================================
// LOADING & ERROR STATES
// =============================================================================

/**
 * **Loading State**
 *
 * Shows skeleton loading state while fetching client data.
 */
export const LoadingState: Story = {
  name: 'Loading',
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        delayMs: 60000,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **Error - Client Not Found**
 *
 * Shows error state when client ID is invalid or not found.
 */
export const ErrorClientNotFound: Story = {
  name: 'Error — client not found',
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        status: 404,
        clientId: 'invalid-client-id',
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: 'invalid-client-id',
  },
};
