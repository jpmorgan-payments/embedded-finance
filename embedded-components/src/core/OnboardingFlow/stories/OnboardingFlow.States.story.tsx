/**
 * OnboardingFlow - Client States
 *
 * Stories demonstrating different client statuses and loading/error states.
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
  mockExistingLinkedAccount,
  mockLinkAccountPrefillEditable,
  mockLinkAccountPrefillReadonly,
  mockLinkAccountReviewAcknowledgements,
  mockLinkAccountReviewAcknowledgementsMultiple,
  OnboardingFlowTemplate,
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
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientNew,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
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
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientInReview,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
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
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientInfoRequested,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
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
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
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
 * **Approved with Link Account**
 *
 * Client application has been fully approved with the link bank account
 * step enabled. User sees success status and can proceed to link their
 * bank account.
 */
export const ApprovedWithLinkAccount: Story = {
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
  },
};

/**
 * **Approved with link account — editable prefill**
 *
 * Host supplies partial bank fields; user completes the form and submits.
 */
export const ApprovedWithLinkAccountPrefillEditable: Story = {
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    linkAccountStepOptions: {
      completionMode: 'editable',
      initialValues: mockLinkAccountPrefillEditable,
    },
  },
};

/**
 * **Approved with link account — review-only prefill**
 *
 * Host supplies full details; user confirms to POST the linked account.
 */
export const ApprovedWithLinkAccountPrefillReadonly: Story = {
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    linkAccountStepOptions: {
      completionMode: 'readonly',
      initialValues: mockLinkAccountPrefillReadonly,
    },
  },
};

/**
 * **Approved with link account — review-only + legal acknowledgements**
 *
 * Same as review-only prefill, with optional checkbox agreements above confirm (T&C-style copy).
 */
export const ApprovedWithLinkAccountPrefillReadonlyAcknowledgements: Story = {
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    linkAccountStepOptions: {
      completionMode: 'readonly',
      initialValues: mockLinkAccountPrefillReadonly,
      reviewAcknowledgements: mockLinkAccountReviewAcknowledgements,
    },
  },
};

/**
 * **Approved with link account — review-only + multiple acknowledgements**
 *
 * Two (or more) checkbox rows above confirm; every row must be checked before **Confirm and link account** enables.
 */
export const ApprovedWithLinkAccountPrefillReadonlyMultipleAcknowledgements: Story =
  {
    parameters: {
      msw: {
        handlers: createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      },
    },
    args: {
      ...commonArgs,
      clientId: DEFAULT_CLIENT_ID,
      showLinkAccountStep: true,
      linkAccountStepOptions: {
        completionMode: 'readonly',
        initialValues: mockLinkAccountPrefillReadonly,
        reviewAcknowledgements: mockLinkAccountReviewAcknowledgementsMultiple,
      },
    },
  };

/**
 * **Approved with Existing Linked Account**
 *
 * Client application has been approved and already has a linked bank account.
 * The link account step is marked as completed in the sidebar, and clicking
 * into it shows the existing account details instead of the creation form.
 */
export const ApprovedWithExistingLinkedAccount: Story = {
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
        existingLinkedAccounts: [mockExistingLinkedAccount],
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
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
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientDeclined,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
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
