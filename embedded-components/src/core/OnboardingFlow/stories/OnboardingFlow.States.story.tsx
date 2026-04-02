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
  mockClientDeclined,
  mockClientInfoRequested,
  mockClientInReview,
  mockClientNew,
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
  loaders: [() => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,

    disclosureConfig: {
      platformName: 'SellSense',
      jpMorganAccountTermsUrl: 'https://example.com/jpmorgan-account-terms',
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
 * **Information Requested**
 *
 * Additional documents or information needed from the client.
 * User sees outstanding requirements and can upload documents.
 */
export const InformationRequested: Story = {
  loaders: [
    () => resetAndSeedClient(mockClientInfoRequested, DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
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
