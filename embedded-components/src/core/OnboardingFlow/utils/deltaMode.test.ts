import { describe, expect, it } from 'vitest';

import type {
  ClientResponse,
  QuestionResponse,
} from '@/api/generated/smbdo.schemas';

import {
  countPendingOnboardingFields,
  DEFAULT_DELTA_MODE_MAX_PENDING_FIELDS,
  isDeltaModeActive,
  resolveDeltaModeConfig,
} from './deltaMode';

const richClient = {
  id: 'client-1',
  status: 'NEW',
  parties: [
    {
      id: 'org-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
        organizationIds: [{ idType: 'EIN', issuer: 'US', value: '123456789' }],
      },
    },
    {
      id: 'ctrl-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        countryOfResidence: 'US',
        birthDate: '1990-01-01',
        individualIds: [{ idType: 'SSN', issuer: 'US', value: '123456789' }],
      },
    },
  ],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: ['30005'],
  },
  questionResponses: [],
  products: ['EMBEDDED_PAYMENTS'],
} as unknown as ClientResponse;

const missingTaxIdsClient = {
  ...richClient,
  parties: [
    {
      id: 'org-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
        organizationIds: [],
      },
    },
    {
      id: 'ctrl-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        countryOfResidence: 'US',
        birthDate: '1990-01-01',
        individualIds: [],
      },
    },
  ],
} as unknown as ClientResponse;

describe('resolveDeltaModeConfig', () => {
  it('returns null when disabled or omitted', () => {
    expect(resolveDeltaModeConfig(undefined)).toBeNull();
    expect(resolveDeltaModeConfig(false)).toBeNull();
    expect(resolveDeltaModeConfig({ enabled: false })).toBeNull();
  });

  it('normalizes true and enabled config with default max', () => {
    expect(resolveDeltaModeConfig(true)).toEqual({
      enabled: true,
      maxPendingFields: DEFAULT_DELTA_MODE_MAX_PENDING_FIELDS,
      defaultControllerNotAnOwner: false,
      reviewSectionsDisplay: 'collapsible',
    });
    expect(
      resolveDeltaModeConfig({ enabled: true, maxPendingFields: 3 })
    ).toEqual({
      enabled: true,
      maxPendingFields: 3,
      defaultControllerNotAnOwner: false,
      reviewSectionsDisplay: 'collapsible',
    });
  });

  it('preserves an explicit defaultControllerNotAnOwner opt-in', () => {
    expect(
      resolveDeltaModeConfig({
        enabled: true,
        defaultControllerNotAnOwner: true,
      })
    ).toEqual({
      enabled: true,
      maxPendingFields: DEFAULT_DELTA_MODE_MAX_PENDING_FIELDS,
      defaultControllerNotAnOwner: true,
      reviewSectionsDisplay: 'collapsible',
    });
  });

  it('preserves an explicit reviewSectionsDisplay', () => {
    expect(
      resolveDeltaModeConfig({
        enabled: true,
        reviewSectionsDisplay: 'expanded',
      })
    ).toEqual({
      enabled: true,
      maxPendingFields: DEFAULT_DELTA_MODE_MAX_PENDING_FIELDS,
      defaultControllerNotAnOwner: false,
      reviewSectionsDisplay: 'expanded',
    });
    expect(
      resolveDeltaModeConfig({
        enabled: true,
        reviewSectionsDisplay: 'requireReview',
      })?.reviewSectionsDisplay
    ).toBe('requireReview');
  });
});

describe('countPendingOnboardingFields', () => {
  it('counts outstanding questions', () => {
    expect(countPendingOnboardingFields(richClient)).toBe(1);
  });

  it('excludes conditional sub-questions when definitions are provided', () => {
    const client = {
      ...richClient,
      outstanding: {
        ...richClient.outstanding,
        // A parent (30158) plus its conditional child (30162).
        questionIds: ['30158', '30162'],
      },
    } as unknown as ClientResponse;

    // Child identified via its own parentQuestionId.
    const definitionsWithParentRef = [
      { id: '30158' },
      { id: '30162', parentQuestionId: '30158' },
    ] as QuestionResponse[];
    expect(countPendingOnboardingFields(client, definitionsWithParentRef)).toBe(
      1
    );

    // Child identified via the parent's subQuestions reference.
    const definitionsWithSubQuestionRef = [
      { id: '30158', subQuestions: [{ questionIds: ['30162'] }] },
      { id: '30162' },
    ] as QuestionResponse[];
    expect(
      countPendingOnboardingFields(client, definitionsWithSubQuestionRef)
    ).toBe(1);

    // Without definitions, both count (safe fallback / prior behavior).
    expect(countPendingOnboardingFields(client)).toBe(2);
  });

  it('counts missing business EIN and controller tax ID', () => {
    expect(countPendingOnboardingFields(missingTaxIdsClient)).toBe(3);
  });

  it('counts controller birthDate and owner SSNs', () => {
    const client = {
      ...richClient,
      outstanding: { ...richClient.outstanding, questionIds: [] },
      parties: [
        richClient.parties![0],
        {
          id: 'ctrl-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            countryOfResidence: 'US',
            individualIds: [
              { idType: 'SSN', issuer: 'US', value: '111111111' },
            ],
          },
        },
        {
          id: 'owner-2',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            countryOfResidence: 'US',
            birthDate: '1980-01-01',
            individualIds: [],
          },
        },
        {
          id: 'owner-3',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          individualDetails: {
            countryOfResidence: 'US',
            birthDate: '1985-01-01',
            individualIds: [],
          },
        },
      ],
    } as unknown as ClientResponse;

    // birthDate + 2 owner SSNs
    expect(countPendingOnboardingFields(client)).toBe(3);
  });
});

describe('isDeltaModeActive', () => {
  it('is false when host flag is off', () => {
    expect(isDeltaModeActive(false, richClient)).toBe(false);
  });

  it('is true when enabled and under the pending-field cap', () => {
    expect(isDeltaModeActive(true, richClient)).toBe(true);
  });

  it('is false when pending fields exceed the configured max', () => {
    expect(
      isDeltaModeActive({ enabled: true, maxPendingFields: 0 }, richClient)
    ).toBe(false);
  });
});
