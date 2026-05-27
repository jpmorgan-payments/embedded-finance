/**
 * OnboardingFlow — Linked account (Prefilled Data Validation)
 *
 * Demonstrates how the reviewOnly mode handles valid and invalid prefilled data.
 * When host-provided data fails schema validation, the summary view shows inline
 * validation errors and blocks submission until the data is corrected.
 *
 * ## Stories
 *
 * 1. **Valid prefill (reviewOnly)** — All fields pass validation; user can submit.
 * 2. **Invalid routing (reviewOnly)** — 8-digit routing blocks submission with error.
 * 3. **Custom description with contact guidance (reviewOnly)** — Content token override
 *    instructs users to contact the platform if data is incorrect.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../../types/onboarding.types';
import {
  buildApprovedClientLinkAccountStory,
  commonArgsWithCallbacks,
  commonArgTypes,
  mockLinkAccountPrefillInvalidRouting,
  mockLinkAccountPrefillReadonlyNoName,
  OnboardingFlowTemplate,
} from '../../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Linked account/Prefilled',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@linked-accounts', '@prefilled'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Demonstrates how the Onboarding Flow handles valid and invalid prefilled bank account data in `reviewOnly` mode. Invalid data triggers client-side validation errors that block submission.',
      },
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

// ============================================================================
// Prefill Summary Mode (Non-Editable)
// ============================================================================

/**
 * **Valid prefill (reviewOnly)**
 *
 * All prefilled fields pass schema validation. The read-only summary renders
 * without errors and the user can confirm and link immediately.
 */
export const ValidPrefillNonEditable: Story = {
  ...buildApprovedClientLinkAccountStory({
    linkAccountStepOptions: {
      completionMode: 'reviewOnly',
      initialValues: mockLinkAccountPrefillReadonlyNoName,
      summaryDisplayedPaymentTypes: ['ACH'],
      partyId: '2000000112',
    },
  }),
  parameters: {
    ...buildApprovedClientLinkAccountStory({
      linkAccountStepOptions: {
        completionMode: 'reviewOnly',
        initialValues: mockLinkAccountPrefillReadonlyNoName,
        summaryDisplayedPaymentTypes: ['ACH'],
        partyId: '2000000112',
      },
    }).parameters,
    docs: {
      description: {
        story:
          'All host-provided data is valid. No validation errors are shown. Submit is enabled immediately (no acknowledgements configured).',
      },
    },
  },
};

/**
 * **Invalid routing — contact platform for corrections (non-editable)**
 *
 * Host provides an 8-digit routing number (`02100002`) which fails validation.
 * The custom description (via content token override) instructs the user to
 * contact their platform provider since the fields are read-only.
 *
 * This is the recommended pattern for `reviewOnly` mode: when data is
 * invalid and the user cannot edit it, provide clear guidance on how to
 * get the issue resolved.
 */
export const InvalidRoutingContactPlatform: Story = {
  ...buildApprovedClientLinkAccountStory({
    linkAccountStepOptions: {
      completionMode: 'reviewOnly',
      initialValues: mockLinkAccountPrefillInvalidRouting,
      summaryDisplayedPaymentTypes: ['ACH'],
      partyId: '2000000112',
    },
  }),
  args: {
    ...buildApprovedClientLinkAccountStory({
      linkAccountStepOptions: {
        completionMode: 'reviewOnly',
        initialValues: mockLinkAccountPrefillInvalidRouting,
        summaryDisplayedPaymentTypes: ['ACH'],
        partyId: '2000000112',
      },
    }).args,
    contentTokensPreset: 'custom',
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          screens: {
            linkAccount: {
              prefillSummary: {
                description:
                  'Please review the bank account details below. If any information is incorrect or needs to be updated, contact your platform provider for assistance — these fields cannot be edited directly.',
              },
            },
          },
        },
      },
    },
  },
  parameters: {
    ...buildApprovedClientLinkAccountStory({
      linkAccountStepOptions: {
        completionMode: 'reviewOnly',
        initialValues: mockLinkAccountPrefillInvalidRouting,
        summaryDisplayedPaymentTypes: ['ACH'],
        partyId: '2000000112',
      },
    }).parameters,
    docs: {
      description: {
        story:
          'Combines invalid prefilled data (8-digit routing number) with a content token override that instructs users to contact the platform. Validation error blocks submit while the custom description provides a clear path to resolution.',
      },
    },
  },
};

// ============================================================================
// Editable Mode — Same Data, User Can Fix
// ============================================================================

/**
 * **Valid prefill (editable)**
 *
 * Same valid data as the reviewOnly story, but rendered in `editable` mode.
 * The user sees a pre-populated form and can modify any field before submitting.
 */
export const ValidPrefillEditable: Story = {
  ...buildApprovedClientLinkAccountStory({
    linkAccountStepOptions: {
      completionMode: 'editable',
      initialValues: mockLinkAccountPrefillReadonlyNoName,
      partyId: '2000000112',
    },
  }),
  parameters: {
    ...buildApprovedClientLinkAccountStory({
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: mockLinkAccountPrefillReadonlyNoName,
        partyId: '2000000112',
      },
    }).parameters,
    docs: {
      description: {
        story:
          'Same valid data as the non-editable variant, but the form is fully editable. User can review, modify, and submit. Validation runs on blur or submit.',
      },
    },
  },
};

/**
 * **Invalid routing — 8 digits (editable)**
 *
 * Same invalid 8-digit routing number, but in editable mode. No error is shown
 * on mount — the user sees the pre-populated value and can fix it. Validation
 * triggers on blur (when the user tabs out of the routing field) or on submit.
 */
export const InvalidRoutingEditable: Story = {
  ...buildApprovedClientLinkAccountStory({
    linkAccountStepOptions: {
      completionMode: 'editable',
      initialValues: mockLinkAccountPrefillInvalidRouting,
      partyId: '2000000112',
    },
  }),
  parameters: {
    ...buildApprovedClientLinkAccountStory({
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: mockLinkAccountPrefillInvalidRouting,
        partyId: '2000000112',
      },
    }).parameters,
    docs: {
      description: {
        story:
          'Same 8-digit routing number (`02100002`) as the non-editable variant, but in editable mode. Error only appears on blur or submit — the user can correct the value inline.',
      },
    },
  },
};
