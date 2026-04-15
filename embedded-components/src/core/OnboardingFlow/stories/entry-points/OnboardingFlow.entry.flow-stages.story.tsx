/**
 * OnboardingFlow — entry points by flow stage (`flowEntry`).
 *
 * Each story opens the flow at a specific screen after the client loads, for Storybook and QA.
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

/** Re-enable hidden `commonArgTypes` rows so host ack props appear in Controls. */
const reviewAttestTermsHostAckControlArgTypes = {
  reviewAttestTermsAcknowledgements: {
    control: { type: 'object' as const },
    description:
      'Rows `{ id: string; labelKey: string }[]`. Each `labelKey` resolves under `onboarding-overview` JSON.',
    table: { category: 'Review & attest', disable: false },
  },
  showReviewAttestTermsAcknowledgementsIntro: {
    control: { type: 'boolean' as const },
    description: 'Show introductory text above the checkbox list.',
    table: { category: 'Review & attest', disable: false },
  },
} as const;

const seededNewClientLoader = () =>
  resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID);

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Entry points/Flow stages',
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

/** Main timeline hub for a client with organization type set. */
export const Overview: Story = {
  name: 'Overview',
  loaders: [seededNewClientLoader],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: { screenId: 'overview' },
  },
};

/** Personal section — controller personal details (first step). */
export const PersonalSectionPersonalDetails: Story = {
  name: 'Personal — personal details',
  loaders: [seededNewClientLoader],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: {
      screenId: 'personal-section',
      stepperStepId: 'personal-details',
    },
  },
};

/** Business section — business identity (first step). */
export const BusinessSectionBusinessIdentity: Story = {
  name: 'Business — business identity',
  loaders: [seededNewClientLoader],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: {
      screenId: 'business-section',
      stepperStepId: 'business-identity',
    },
  },
};

/** Operational / additional questions (single-screen section). */
export const AdditionalQuestions: Story = {
  name: 'Operational details',
  loaders: [seededNewClientLoader],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: { screenId: 'additional-questions-section' },
  },
};

/** Link bank account step (requires `showLinkAccountStep`). */
export const LinkBankAccount: Story = {
  name: 'Link bank account',
  loaders: [seededNewClientLoader],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
  },
};

/**
 * Review & attest — data review (`ReviewForm`).
 * Optional `disclosureConfig` adds the regulatory attestation block on this step.
 */
export const ReviewAttestReview: Story = {
  name: 'Review & attest — review',
  loaders: [seededNewClientLoader],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: {
      screenId: 'review-attest-section',
      stepperStepId: 'review',
    },
    disclosureConfig: {
      platformName: 'Northwind Marketplace',
      platformAgreementUrl: 'https://example.com/northwind-partner-program',
      platformAgreementLabel: 'Northwind Partner Program Agreement',
    },
  },
};

/**
 * Review & attest — terms & submit (`TermsAndConditionsForm`).
 * Uses {@link mockClientNew} so `outstanding.attestationDocumentIds` matches MSW
 * (see `GET /documents/:documentId` and `efClientCorpEBMock` — e.g. TERMS_CONDITIONS PDF).
 */
export const ReviewAttestDocuments: Story = {
  name: 'Review & attest — terms & attestations',
  loaders: [
    () => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID),
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
  },
};

/**
 * Same step as **Review & attest — terms & attestations**, but **`disclosureConfig` is omitted**
 * (no platform agreement link card; `{{platformName}}` in copy falls back to i18n / tokens only).
 */
export const ReviewAttestDocumentsNoDisclosureConfig: Story = {
  name: 'Review & attest — terms & attestations (no disclosureConfig)',
  loaders: [
    () => resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Omits `disclosureConfig` so the terms step does not show the optional platform program agreement row. API attestation documents still come from `outstanding.attestationDocumentIds`. Compare with **Review & attest — terms & attestations**.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: {
      screenId: 'review-attest-section',
      stepperStepId: 'documents',
    },
    disclosureConfig: undefined,
  },
};

/**
 * Same terms step with **host-defined acknowledgement list** (`reviewAttestTermsAcknowledgements`).
 * Replaces the default agree-to-terms / authorize-sharing checkboxes; uses onboarding-only
 * `TermsAttestationAcknowledgementsGroup` (same pattern as linked account, not shared code).
 */
const reviewAttestTermsHostAckBaseArgs = {
  ...commonArgs,
  clientId: DEFAULT_CLIENT_ID,
  flowEntry: {
    screenId: 'review-attest-section' as const,
    stepperStepId: 'documents' as const,
  },
  disclosureConfig: {
    platformName: 'Northwind Marketplace',
    platformAgreementUrl: 'https://example.com/northwind-partner-program',
    platformAgreementLabel: 'Northwind Partner Program Agreement',
  },
  showReviewAttestTermsAcknowledgementsIntro: true,
  reviewAttestTermsAcknowledgements: [
    {
      id: 'agreeJpTerms',
      labelKey: 'reviewAndAttest.termsAndConditions.agreeToTermsWithPlatform',
    },
    {
      id: 'authorizeSharing',
      labelKey: 'reviewAndAttest.attestation.authorizeSharing',
    },
  ],
};

export const ReviewAttestDocumentsHostAcknowledgements: Story = {
  name: 'Review & attest — terms (host acknowledgement list)',
  argTypes: {
    ...reviewAttestTermsHostAckControlArgTypes,
  },
  loaders: [
    () =>
      resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID),
  ],
  args: {
    ...reviewAttestTermsHostAckBaseArgs,
  },
};

/**
 * **Change the authorize-sharing sentence** without changing code: deep-merge
 * `contentTokens.tokens['onboarding-overview'].reviewAndAttest.attestation.authorizeSharing`
 * on `EBComponentsProvider` (Storybook: **Provider → contentTokens** when preset is `custom`,
 * or pass `contentTokens` in args as below). `{{platformName}}` still comes from
 * `disclosureConfig.platformName`.
 *
 * **Controls:** this story sets **Provider → contentTokens preset** to `custom` so the
 * **contentTokens** object is visible and editable. **Review & attest** hosts the acknowledgement list.
 */
export const ReviewAttestDocumentsHostAckCustomAuthorizeText: Story = {
  name: 'Review & attest — terms (override authorize-sharing copy)',
  argTypes: {
    ...reviewAttestTermsHostAckControlArgTypes,
  },
  loaders: [
    () =>
      resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates replacing the long JPMC / authorize-sharing line by overriding the `reviewAndAttest.attestation.authorizeSharing` string in `contentTokens.tokens`. In your app, set the same path on `EBComponentsProvider` `contentTokens`. Open **Controls**: under **Provider**, **contentTokens preset** should be `custom` to edit **contentTokens**; under **Review & attest**, edit the acknowledgement list.',
      },
    },
  },
  args: {
    ...reviewAttestTermsHostAckBaseArgs,
    contentTokensPreset: 'custom',
    contentTokens: {
      name: 'enUS',
      tokens: {
        'onboarding-overview': {
          reviewAndAttest: {
            attestation: {
              authorizeSharing:
                '[Content token override] You authorize {{platformName}} and JPMorgan Chase Bank, N.A. ("JPMC") to share information to facilitate the opening of your deposit account(s), and appoint {{platformName}} as your agent to act on your behalf regarding your deposit account. (Short custom ending for demo.)',
            },
          },
        },
      },
    },
  },
};

/**
 * **Add another checkbox**: append a row to `reviewAttestTermsAcknowledgements`
 * with a unique `id` and any `onboarding-overview` `labelKey` (existing keys or
 * keys you add under `reviewAndAttest.*` in locale JSON). All rows must be checked to submit.
 *
 * **Controls:** under **Review & attest**, expand **reviewAttestTermsAcknowledgements** to add or edit rows.
 */
export const ReviewAttestDocumentsHostAckThreeCheckboxes: Story = {
  name: 'Review & attest — terms (host list + extra checkbox)',
  argTypes: {
    ...reviewAttestTermsHostAckControlArgTypes,
  },
  loaders: [
    () =>
      resetAndSeedClient(mockClientNew, DEFAULT_CLIENT_ID),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Third row uses existing copy `reviewAndAttest.attestation.accurateInfo`. Add more rows the same way, or point `labelKey` at new strings in `onboarding-overview` JSON. In **Controls → Review & attest**, edit **reviewAttestTermsAcknowledgements** (array of `{ id, labelKey }`).',
      },
    },
  },
  args: {
    ...reviewAttestTermsHostAckBaseArgs,
    reviewAttestTermsAcknowledgements: [
      ...reviewAttestTermsHostAckBaseArgs.reviewAttestTermsAcknowledgements,
      {
        id: 'accurateAndBusinessOnly',
        labelKey: 'reviewAndAttest.attestation.accurateInfo',
      },
    ],
  },
};
