/**
 * OnboardingFlow — stylized content-token overrides in rich prose surfaces.
 *
 * Demonstrates automatic structured rendering through ordinary `t()` calls in
 * Operational Details and through the existing Owners informational Alert.
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
  title: 'Core/OnboardingFlow/Content tokens/Stylized content',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@i18n'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Demonstrates package-wide automatic formatting in content-token overrides. Supported tags include paragraphs, line breaks, emphasis, and ordered or unordered lists.',
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

const seededOwnersSectionArgs: Partial<OnboardingFlowStoryArgs> = {
  ...commonArgs,
  clientId: DEFAULT_CLIENT_ID,
  flowEntry: { screenId: 'owners-section' },
  contentTokensPreset: 'custom',
};

const seededOperationalDetailsArgs: Partial<OnboardingFlowStoryArgs> = {
  ...commonArgs,
  clientId: DEFAULT_CLIENT_ID,
  flowEntry: { screenId: 'additional-questions-section' },
  contentTokensPreset: 'custom',
};

const seededNewClientLoader = () =>
  resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID);

export const OperationalDetailsBulletedDescription: Story = {
  name: 'Operational details — bulleted description',
  loaders: [seededNewClientLoader],
  args: {
    ...seededOperationalDetailsArgs,
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          screens: {
            operationalDetails: {
              description:
                'Please provide details about:<ul><li>How your business receives funds</li><li>Where your customers are located</li><li>Your expected account activity</li></ul>',
            },
          },
        },
      },
    },
  },
};

export const OperationalDetailsNumberedDescription: Story = {
  name: 'Operational details — numbered description',
  loaders: [seededNewClientLoader],
  args: {
    ...seededOperationalDetailsArgs,
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          screens: {
            operationalDetails: {
              description:
                'Complete these steps:<ol><li>Review each question</li><li>Provide the requested business details</li><li>Save and continue to review</li></ol>',
            },
          },
        },
      },
    },
  },
};

export const AlertBulletedList: Story = {
  name: 'Alert — bulleted list',
  loaders: [seededNewClientLoader],
  args: {
    ...seededOwnersSectionArgs,
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          screens: {
            owners: {
              infoAlert: {
                pleaseAddAllOwners:
                  'Before continuing:<ul><li>Add <strong>all owners</strong> holding 25% or more of the business</li><li>Review the ownership percentage for each person</li></ul>',
              },
            },
          },
        },
      },
    },
  },
};

export const AlertNumberedList: Story = {
  name: 'Alert — numbered list',
  loaders: [seededNewClientLoader],
  args: {
    ...seededOwnersSectionArgs,
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          screens: {
            owners: {
              infoAlert: {
                pleaseAddAllOwners:
                  "Complete the owner review in order:<ol><li>Add each owner holding 25% or more</li><li>Review each owner's details</li><li>Continue when the list is complete</li></ol>",
              },
            },
          },
        },
      },
    },
  },
};

export const MixedFormatting: Story = {
  name: 'Alert — emphasis and line break',
  loaders: [seededNewClientLoader],
  args: {
    ...seededOwnersSectionArgs,
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          screens: {
            owners: {
              infoAlert: {
                pleaseAddAllOwners:
                  '<strong>Include every qualifying owner.</strong><br/><em>You can review each person before continuing.</em>',
              },
            },
          },
        },
      },
    },
  },
};
