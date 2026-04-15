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

const mockClientReviewAttestTermsOnly = {
  ...mockClientNew,
  outstanding: {
    ...mockClientNew.outstanding!,
    attestationDocumentIds: [] as string[],
  },
};

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
 * Attestation PDF IDs cleared so checkboxes are usable without downloads.
 */
export const ReviewAttestDocuments: Story = {
  name: 'Review & attest — terms & attestations',
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
  },
};
