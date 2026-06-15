/**
 * OnboardingFlow — Step title & description `contentTokens` overrides.
 *
 * Demonstrates host overrides for all step-level titles and descriptions
 * in the personal, business, and owner sections via
 * `EBComponentsProvider` `contentTokens.tokens['onboarding-overview']`.
 *
 * The overrides use a "[Platform]" prefix to make it obvious which strings
 * come from token overrides vs. defaults. Enable **showTokenIds** in Storybook
 * controls to inspect token paths on hover.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Content tokens/Step titles & descriptions',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@i18n'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Demonstrates host overrides for step-level titles and descriptions. These are the headings shown at the top of each form step and in the sidebar timeline. Use Storybook **Provider → showTokenIds** to surface token IDs on hover.',
      },
    },
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

// ============================================================================
// Content Token Overrides
// ============================================================================

const stepContentTokenOverrides = {
  screens: {
    personalSection: {
      steps: {
        personalDetails: {
          title: 'About you',
          description:
            'Tell us who you are — we use this to verify the account holder.',
        },
        identityDocument: {
          title: 'Verify your identity',
          description:
            'Provide a government-issued ID so we can confirm you are who you say you are.',
        },
        contactDetails: {
          title: 'How to reach you',
          description:
            'Enter your mailing address and preferred contact method.',
        },
        checkAnswers: {
          title: 'Review your info',
          description: 'Double-check everything looks right before moving on.',
        },
      },
    },
    businessSection: {
      steps: {
        businessIdentity: {
          title: 'About your business',
          description: 'Basic information about your company or organization.',
        },
        industry: {
          title: 'What does your business do?',
          description:
            'Pick the industry classification that best matches your primary revenue source.',
        },
        contactInfo: {
          title: 'Business contact info',
          description: 'Where should we direct business correspondence?',
        },
        checkAnswers: {
          title: 'Review business info',
          description:
            'Make sure all business details are accurate before continuing.',
        },
      },
    },
    ownerSteps: {
      personalDetails: {
        title: 'Owner information',
        description:
          "We need each owner's personal details for compliance verification.",
      },
      identityDocument: {
        title: 'Owner ID verification',
        description:
          'A government-issued ID is required for each beneficial owner.',
      },
      contactDetails: {
        title: 'Owner contact info',
        description: 'Provide a mailing address for this owner.',
      },
      checkAnswers: {
        title: 'Review owner details',
        description: 'Confirm all information for this owner is correct.',
      },
    },
  },
};

// ============================================================================
// Stories
// ============================================================================

/**
 * **Personal section with overridden step titles**
 *
 * Opens at the first step of the personal section. Navigate through
 * the stepper to see each step's overridden title & description.
 */
export const PersonalSectionOverrides: Story = {
  name: 'Personal section — custom step titles',
  loaders: [() => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: {
      screenId: 'personal-section',
    },
    contentTokensPreset: 'custom',
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': stepContentTokenOverrides,
      },
    },
  },
};

/**
 * **Business section with overridden step titles**
 *
 * Opens at the first step of the business section.
 */
export const BusinessSectionOverrides: Story = {
  name: 'Business section — custom step titles',
  loaders: [() => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: {
      screenId: 'business-section',
    },
    contentTokensPreset: 'custom',
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': stepContentTokenOverrides,
      },
    },
  },
};

/**
 * **Overview with all overrides active**
 *
 * Shows the full overview screen so the sidebar timeline also
 * picks up the overridden step titles.
 */
export const OverviewWithAllOverrides: Story = {
  name: 'Overview — all step titles overridden',
  loaders: [() => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID)],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    contentTokensPreset: 'custom',
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': stepContentTokenOverrides,
      },
    },
  },
};
