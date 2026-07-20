/**
 * OnboardingFlow — Delta mode
 *
 * Distilled completion for pre-created LLC clients with few remaining fields.
 * Opens on review, treats owners as complete, shows missing fields inline,
 * and merges Terms & Conditions into the same screen.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { cloneDeep } from 'lodash';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

/**
 * Rich LLC client with the Total Annual Revenue (30005) and sanctions (30158,
 * whose "Yes" reveals the conditional countries question 30162) questions
 * outstanding. All party tax IDs and other section data are already populated.
 * Keep non-exported — Storybook CSF treats named exports as stories.
 */
function createDeltaModeOperationalOnlyClient(
  clientId = DEFAULT_CLIENT_ID
): ClientResponse {
  const client = cloneDeep(mockClientNew);
  client.id = clientId;
  client.outstanding = {
    ...client.outstanding,
    questionIds: ['30005', '30158'],
    partyIds: [],
    partyRoles: [],
  };
  client.questionResponses = [];
  return client;
}

/**
 * Rich LLC client missing operational revenue + sanctions questions plus
 * business EIN and controller SSN (tax IDs stripped from org + controller
 * parties).
 * Keep non-exported — Storybook CSF treats named exports as stories.
 */
function createDeltaModeOperationalAndTaxIdsClient(
  clientId = DEFAULT_CLIENT_ID
): ClientResponse {
  const client = cloneDeep(mockClientNew);
  client.id = clientId;
  client.outstanding = {
    ...client.outstanding,
    questionIds: ['30005', '30158'],
    partyIds: [],
    partyRoles: [],
  };
  client.questionResponses = [];
  client.parties = client.parties?.map((party) => {
    if (party.partyType === 'ORGANIZATION' && party.organizationDetails) {
      return {
        ...party,
        organizationDetails: {
          ...party.organizationDetails,
          organizationIds: [],
        },
      };
    }
    if (
      party.partyType === 'INDIVIDUAL' &&
      party.roles?.includes('CONTROLLER') &&
      party.individualDetails
    ) {
      return {
        ...party,
        individualDetails: {
          ...party.individualDetails,
          individualIds: [],
        },
      };
    }
    return party;
  });
  return client;
}

/**
 * Rich LLC with controller birthdate missing, two additional beneficial owners
 * each missing SSN, plus outstanding operational revenue + sanctions questions
 * (5 fields).
 * Keep non-exported — Storybook CSF treats named exports as stories.
 */
function createDeltaModeBirthdateAndOwnerSsnsClient(
  clientId = DEFAULT_CLIENT_ID
): ClientResponse {
  const client = cloneDeep(mockClientNew);
  client.id = clientId;
  client.outstanding = {
    ...client.outstanding,
    questionIds: ['30005', '30158'],
    partyIds: [],
    partyRoles: [],
  };
  client.questionResponses = [];

  client.parties = client.parties?.map((party) => {
    if (
      party.partyType === 'INDIVIDUAL' &&
      party.roles?.includes('CONTROLLER') &&
      party.individualDetails
    ) {
      return {
        ...party,
        individualDetails: {
          ...party.individualDetails,
          birthDate: undefined,
        },
      };
    }
    if (
      party.partyType === 'INDIVIDUAL' &&
      party.roles?.includes('BENEFICIAL_OWNER') &&
      !party.roles?.includes('CONTROLLER') &&
      party.individualDetails
    ) {
      return {
        ...party,
        individualDetails: {
          ...party.individualDetails,
          individualIds: [],
        },
      };
    }
    return party;
  });

  // Add a second non-controller beneficial owner also missing SSN
  client.parties = [
    ...(client.parties ?? []),
    {
      id: '2000000114',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      parentExternalId: 'TCU1234',
      externalId: 'TCU12345',
      email: 'wendy@neverlandbook.com',
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Wendy',
        lastName: 'Darling',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'COO',
        soleOwner: false,
        birthDate: '1975-03-12',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['100 Market St'],
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          },
        ],
        individualIds: [],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '4155550199',
        },
      },
    },
  ];

  return client;
}

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Delta mode',
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
    deltaMode: true,
    // Delta mode targets partner-provided clients, so the controller-owner
    // question is pre-answered "No" and not required by default here.
    defaultControllerNotAnOwner: true,
    // Delta mode: attestation checkboxes are enabled without forcing the user
    // to open every terms document first (links still render).
    skipTermsDocumentAcknowledgment: true,
    clientId: DEFAULT_CLIENT_ID,
  },
  argTypes: {
    ...commonArgTypes,
    deltaMode: {
      control: { type: 'boolean' as const },
      description:
        'Enable distilled delta completion (review-first, owners complete, terms merged). Activates only when pending fields ≤ maxPendingFields (default 5).',
      table: { category: 'Configuration' },
    },
    defaultControllerNotAnOwner: {
      control: { type: 'boolean' as const },
      description:
        'Pre-answer the controller "owns 25% or more?" question as No and do not require the user to answer it.',
      table: { category: 'Configuration' },
    },
    skipTermsDocumentAcknowledgment: {
      control: { type: 'boolean' as const },
      description:
        'Enable the terms attestation checkboxes without requiring the user to open every terms & conditions document first (links still render).',
      table: { category: 'Configuration' },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

/**
 * **Operational details only**
 *
 * Pre-created LLC with rich GET client data. Total Annual Revenue (30005) and
 * the sanctions question (30158, whose "Yes" reveals the conditional countries
 * question 30162) are outstanding. Delta mode opens on review with those fields
 * editable at the top, owners marked complete, and Terms combined on the same
 * screen.
 */
export const OperationalDetailsOnly: Story = {
  name: 'Operational details only',
  loaders: [
    () =>
      resetAndSeedClient(
        createDeltaModeOperationalOnlyClient(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5 },
  },
};

/**
 * **Operational details + tax IDs**
 *
 * Pre-created LLC missing Total Annual Revenue + sanctions questions plus
 * business EIN and controller SSN. Delta review shows those fields for inline
 * completion, then acknowledgements, with a single Agree and finish action.
 */
export const OperationalDetailsAndTaxIds: Story = {
  name: 'Operational details + tax IDs (business & controller)',
  loaders: [
    () =>
      resetAndSeedClient(
        createDeltaModeOperationalAndTaxIdsClient(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5 },
  },
};

/**
 * **Controller birthdate + owner SSNs**
 *
 * Five pending fields: Total Annual Revenue, the sanctions question, controller
 * birthdate, and SSN for each of two beneficial owners (Tinker + Wendy).
 * Grouped under their steps on the delta review screen.
 */
export const BirthdateAndOwnerSsns: Story = {
  name: 'Controller birthdate + 2 owner SSNs',
  loaders: [
    () =>
      resetAndSeedClient(
        createDeltaModeBirthdateAndOwnerSsnsClient(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5 },
  },
};
