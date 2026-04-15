/**
 * OnboardingFlow — `contentTokens` overrides for Review & attest copy.
 *
 * Uses the same `flowEntry` landing as the terms step; strings under
 * `contentTokens.tokens['onboarding-overview'].reviewAndAttest` replace the
 * defaults via provider deep merge. Turn on **showTokenIds** in Storybook
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

const mockClientReviewAttestTermsOnly = {
  ...mockClientNew,
  outstanding: {
    ...mockClientNew.outstanding!,
    attestationDocumentIds: [] as string[],
  },
};

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Entry points/Content tokens',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@i18n'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Demonstrates host overrides via `EBComponentsProvider` `contentTokens.tokens` (deep merge into `onboarding-overview`). Compare with **Flow stages → Review & attest — terms & attestations** for baseline copy. Use Storybook **Provider → showTokenIds** to surface token IDs on hover.',
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

/**
 * **Terms step with overridden attestation strings**
 *
 * `authorizeSharing` and related keys live under `reviewAndAttest.attestation` in
 * `onboarding-overview.json`. `{{platformName}}` still interpolates from
 * `disclosureConfig.platformName`.
 */
export const ReviewAttestTermsWithTokenOverrides: Story = {
  name: 'Review & attest — terms (host content tokens)',
  loaders: [
    () =>
      resetAndSeedClient(mockClientReviewAttestTermsOnly, DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: {
      screenId: 'review-attest-section',
      stepperStepId: 'documents',
    },
    disclosureConfig: {
      platformName: 'Northwind Marketplace',
      platformAgreementUrl: 'https://example.com/northwind-partner-program',
      platformAgreementLabel: 'Northwind Partner Program Agreement',
    },
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          reviewAndAttest: {
            attestation: {
              heading:
                '[Host token] By submitting this application, you confirm that:',
              authorizeSharing:
                '[Host token] {{platformName}} and JPMorgan Chase Bank, N.A. ("JPMC") may share information to open your deposit account(s), and you designate {{platformName}} as your agent for matters relating to that account.',
            },
            termsAndConditions: {
              mustReviewDocuments:
                '[Host token] Open each document above before you can accept the attestations.',
            },
          },
        },
      },
    },
  },
};
