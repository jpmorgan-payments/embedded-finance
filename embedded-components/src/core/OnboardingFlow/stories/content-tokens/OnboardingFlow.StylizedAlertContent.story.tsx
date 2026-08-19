/**
 * OnboardingFlow — stylized content-token overrides inside an Alert.
 *
 * Each story opens the Owners section and overrides the existing informational
 * Alert through `contentTokens.tokens['onboarding-overview']`.
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
  title: 'Core/OnboardingFlow/Content tokens/Stylized alert content',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@i18n'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Demonstrates safe inline formatting in Alert content-token overrides. Supported tags include paragraphs, line breaks, emphasis, and ordered or unordered lists.',
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

const seededNewClientLoader = () =>
  resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID);

export const BulletedList: Story = {
  name: 'Bulleted list',
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

export const NumberedList: Story = {
  name: 'Numbered list',
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
  name: 'Emphasis and line break',
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
