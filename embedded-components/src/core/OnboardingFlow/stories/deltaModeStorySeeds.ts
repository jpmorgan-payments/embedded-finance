/**
 * Shared MSW client seeds for panel + inline delta mode Storybook stories.
 * Keep helpers non-exported from story files — Storybook CSF treats named
 * exports as stories.
 */

import { cloneDeep } from 'lodash';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import type {
  OnboardingDisclosureConfig,
  ReviewAttestTermsAcknowledgement,
} from '@/core/OnboardingFlow/types/onboarding.types';

import { DEFAULT_CLIENT_ID, mockClientNew } from './story-utils';

/** Outstanding operational revenue + sanctions yes/no (mock ids 30005, 30026). */
const DELTA_OUTSTANDING_QUESTION_IDS = ['30005', '30026'] as const;

/** Demo platform for delta attestation copy ({{platformName}}). */
export const DELTA_MODE_DISCLOSURE_CONFIG: OnboardingDisclosureConfig = {
  platformName: 'SellSense',
  platformAgreementUrl: 'https://example.com/sellsense-commerce-terms',
  platformAgreementLabel: 'SellSense commerce terms',
};

/**
 * Host acknowledgement list for partially hosted / delta review:
 * unordered attestation rows; first item hyperlinks Embedded Payments T&Cs.
 */
export const DELTA_MODE_TERMS_ACKNOWLEDGEMENTS: readonly ReviewAttestTermsAcknowledgement[] =
  [
    {
      id: 'jpEmbeddedPaymentsTerms',
      labelKey:
        'reviewAndAttest.deltaAcknowledgements.jpEmbeddedPaymentsTerms',
      linkHrefs: {
        jpTermsLink:
          'https://www.jpmorgan.com/content/dam/jpm/cib/documents/jpmorgan-embedded-payments-terms.pdf',
      },
    },
    {
      id: 'receiveFundsOnly',
      labelKey: 'reviewAndAttest.deltaAcknowledgements.receiveFundsOnly',
    },
    {
      id: 'nonDiscretionaryAgent',
      labelKey: 'reviewAndAttest.deltaAcknowledgements.nonDiscretionaryAgent',
    },
    {
      id: 'dataAccuracy',
      labelKey: 'reviewAndAttest.deltaAcknowledgements.dataAccuracy',
    },
  ];

export const deltaModeTermsStoryArgs = {
  disclosureConfig: DELTA_MODE_DISCLOSURE_CONFIG,
  showReviewAttestTermsAcknowledgementsIntro: true,
  reviewAttestTermsAcknowledgements: DELTA_MODE_TERMS_ACKNOWLEDGEMENTS,
} as const;

/**
 * Rich LLC client with Total Annual Revenue (30005) and sanctions (30026)
 * outstanding.
 */
export function createDeltaModeOperationalOnlyClient(
  clientId = DEFAULT_CLIENT_ID
): ClientResponse {
  const client = cloneDeep(mockClientNew);
  client.id = clientId;
  client.outstanding = {
    ...client.outstanding,
    questionIds: [...DELTA_OUTSTANDING_QUESTION_IDS],
    partyIds: [],
    partyRoles: [],
  };
  client.questionResponses = [];
  return client;
}

/**
 * Rich LLC client missing operational + sanctions questions plus business EIN
 * and controller SSN (tax IDs stripped from org + controller parties).
 */
export function createDeltaModeOperationalAndTaxIdsClient(
  clientId = DEFAULT_CLIENT_ID
): ClientResponse {
  const client = cloneDeep(mockClientNew);
  client.id = clientId;
  client.outstanding = {
    ...client.outstanding,
    questionIds: [...DELTA_OUTSTANDING_QUESTION_IDS],
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
 * each missing SSN, plus outstanding operational + sanctions questions.
 * Pending count: 2 questions + birthdate + 2 SSNs = 5 (default delta cap).
 */
export function createDeltaModeBirthdateAndOwnerSsnsClient(
  clientId = DEFAULT_CLIENT_ID
): ClientResponse {
  const client = cloneDeep(mockClientNew);
  client.id = clientId;
  client.outstanding = {
    ...client.outstanding,
    questionIds: [...DELTA_OUTSTANDING_QUESTION_IDS],
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
