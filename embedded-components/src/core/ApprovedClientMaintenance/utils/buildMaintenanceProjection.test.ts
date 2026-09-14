import { describe, expect, test } from 'vitest';

import type {
  MaintenanceClient,
  MaintenanceParty,
} from '../models/maintenanceApi.types';
import { buildMaintenanceProjection } from './buildMaintenanceProjection';

const approvedClient: MaintenanceClient = {
  id: 'client-1',
  partyId: 'org-1',
  status: 'APPROVED',
  parties: [
    {
      id: 'person-1',
      partyType: 'INDIVIDUAL',
      individualDetails: {
        firstName: 'Jane',
        middleName: 'R',
        lastName: 'Doe',
      },
    },
  ],
};

const proposal = (
  overrides: Partial<MaintenanceParty> = {}
): MaintenanceParty => ({
  id: 'person-1',
  partyType: 'INDIVIDUAL',
  individualDetails: {
    firstName: 'Jane',
    middleName: 'R',
    lastName: 'Diaz',
  },
  updateRequest: {
    status: 'NEW',
    action: 'MODIFY',
    requestId: 'request-1',
    submittedAt: '2026-08-26T12:00:00.000Z',
  },
  ...overrides,
});

describe('buildMaintenanceProjection', () => {
  test('builds a name change without mutating the approved client', () => {
    const before = structuredClone(approvedClient);
    const projection = buildMaintenanceProjection(approvedClient, [proposal()]);

    expect(projection.partyChanges[0]?.fieldChanges).toEqual([
      expect.objectContaining({
        field: 'lastName',
        approvedValue: 'Doe',
        proposedValue: 'Diaz',
      }),
    ]);
    expect(projection.activeRequestId).toBe('request-1');
    expect(projection.canReview).toBe(true);
    expect(approvedClient).toEqual(before);
  });

  test('blocks proposals without required correlation', () => {
    const projection = buildMaintenanceProjection(approvedClient, [
      proposal({ id: undefined }),
    ]);

    expect(projection.unresolvedProposals).toHaveLength(1);
    expect(projection.canReview).toBe(false);
  });

  test('blocks more than one active request ID', () => {
    const projection = buildMaintenanceProjection(approvedClient, [
      proposal(),
      proposal({
        updateRequest: {
          ...proposal().updateRequest,
          requestId: 'request-2',
        },
      }),
    ]);

    expect(projection.hasConflicts).toBe(true);
    expect(projection.canReview).toBe(false);
  });

  test('excludes terminal proposals from the active overlay', () => {
    const projection = buildMaintenanceProjection(approvedClient, [
      proposal({
        updateRequest: {
          ...proposal().updateRequest,
          status: 'APPROVED',
        },
      }),
    ]);

    expect(projection.partyChanges).toEqual([]);
  });

  test('composes multiple party proposals and validation tasks under one request', () => {
    const client: MaintenanceClient = {
      id: '3002022212',
      status: 'APPROVED',
      updateRequest: { status: 'NEW', requestId: '400000320' },
      outstanding: { partyIds: ['person-1', 'person-2'] },
      parties: [
        {
          id: 'person-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          individualDetails: { firstName: 'Controller', lastName: 'One' },
          validationResponse: [
            {
              validationStatus: 'NEEDS_INFO',
              validationType: 'ENTITY_VALIDATION',
              documentRequestIds: ['document-1'],
            },
          ],
        },
        {
          id: 'person-2',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { firstName: 'Owner', lastName: 'Two' },
          validationResponse: [
            {
              validationStatus: 'NEEDS_INFO',
              validationType: 'ENTITY_VALIDATION',
              documentRequestIds: ['document-2'],
            },
          ],
        },
      ],
    };
    const proposals: MaintenanceParty[] = [
      {
        id: 'person-1',
        individualDetails: {
          firstName: 'Controller Updated',
          lastName: 'One Updated',
        },
        updateRequest: {
          status: 'NEW',
          action: 'MODIFY',
          requestId: '400000320',
          submittedAt: '2026-08-26T18:16:06.21Z',
        },
      },
      {
        id: 'person-2',
        individualDetails: {
          firstName: 'Owner',
          lastName: 'Two Updated',
        },
        updateRequest: {
          status: 'NEW',
          action: 'MODIFY',
          requestId: '400000320',
          submittedAt: '2026-08-26T18:15:00.535Z',
        },
      },
    ];

    const projection = buildMaintenanceProjection(client, proposals);

    expect(projection.activeRequestId).toBe('400000320');
    expect(projection.partyChanges).toHaveLength(2);
    expect(projection.hasConflicts).toBe(false);
    expect(projection.validationTasks).toHaveLength(2);
    expect(projection.documentRequestIds).toEqual(['document-1', 'document-2']);
    expect(projection.outstandingPartyIds).toEqual(['person-1', 'person-2']);
  });

  test('projects organization fields and replaces the complete address array', () => {
    const client: MaintenanceClient = {
      ...approvedClient,
      parties: [
        {
          id: 'org-1',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          organizationDetails: {
            organizationName: 'Neverland Books',
            dbaName: 'FT Books',
            addresses: [
              {
                addressType: 'BUSINESS_ADDRESS',
                addressLines: ['2029 Century Park E'],
                city: 'Los Angeles',
                state: 'CA',
                postalCode: '90067',
                country: 'US',
              },
            ],
          },
        },
        ...(approvedClient.parties ?? []),
      ],
    };
    const projection = buildMaintenanceProjection(client, [
      proposal({
        id: 'org-1',
        partyType: 'ORGANIZATION',
        individualDetails: undefined,
        organizationDetails: {
          dbaName: 'Neverland Bookshop',
          addresses: [
            {
              addressType: 'BUSINESS_ADDRESS',
              addressLines: ['100 Market Street'],
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94105',
              country: 'US',
            },
          ],
        },
      }),
    ]);

    expect(projection.partyChanges[0]?.fieldChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'dbaName',
          approvedValue: 'FT Books',
          proposedValue: 'Neverland Bookshop',
        }),
        expect.objectContaining({
          field: 'addresses',
          proposedValue: '100 Market Street, San Francisco, CA, 94105, US',
        }),
      ])
    );
    expect(
      projection.proposedClient.parties?.find((party) => party.id === 'org-1')
        ?.organizationDetails?.addresses
    ).toEqual([
      expect.objectContaining({ addressLines: ['100 Market Street'] }),
    ]);
  });

  test('masks birth dates for display while retaining the raw fingerprint value', () => {
    const client: MaintenanceClient = {
      ...approvedClient,
      parties: [
        {
          ...(approvedClient.parties?.[0] ?? {}),
          individualDetails: {
            ...approvedClient.parties?.[0]?.individualDetails,
            birthDate: '1975-03-12',
          },
        },
      ],
    };
    const projection = buildMaintenanceProjection(client, [
      proposal({
        individualDetails: {
          firstName: 'Jane',
          middleName: 'R',
          lastName: 'Doe',
          birthDate: '1976-04-13',
        },
      }),
    ]);
    const birthDateChange = projection.partyChanges[0]?.fieldChanges.find(
      (change) => change.field === 'birthDate'
    );

    expect(birthDateChange).toEqual(
      expect.objectContaining({
        approvedValue: '••••••••',
        proposedValue: '••••••••',
        approvedRawValue: '1975-03-12',
        proposedRawValue: '1976-04-13',
        sensitivity: 'masked',
      })
    );
  });

  test('projects role replacement while omitted nested fields remain unchanged', () => {
    const clientWithRoles = {
      ...approvedClient,
      parties: approvedClient.parties?.map((party) => ({
        ...party,
        roles: ['CONTROLLER'],
      })),
    };
    const projection = buildMaintenanceProjection(clientWithRoles, [
      proposal({
        roles: ['BENEFICIAL_OWNER'],
        individualDetails: {
          firstName: 'Jane',
          lastName: 'Doe',
        },
      }),
    ]);

    expect(projection.partyChanges[0]?.fieldChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'roles',
          proposedRawValue: ['BENEFICIAL_OWNER'],
        }),
      ])
    );
    expect(
      projection.partyChanges[0]?.fieldChanges.some(
        (change) => change.field === 'middleName'
      )
    ).toBe(false);
    expect(projection.proposedClient.parties?.[0]).toEqual(
      expect.objectContaining({
        roles: ['BENEFICIAL_OWNER'],
        individualDetails: {
          firstName: 'Jane',
          middleName: 'R',
          lastName: 'Doe',
        },
      })
    );
  });

  test('projects ownership nature when a controller becomes an owner', () => {
    const clientWithInactiveOwnershipNature = {
      ...approvedClient,
      parties: approvedClient.parties?.map((party) => ({
        ...party,
        roles: ['CONTROLLER'],
        individualDetails: {
          ...party.individualDetails,
          natureOfOwnership: 'Direct',
        },
      })),
    };
    const projection = buildMaintenanceProjection(
      clientWithInactiveOwnershipNature,
      [
        proposal({
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          individualDetails: { natureOfOwnership: 'Direct' },
        }),
      ]
    );

    expect(projection.partyChanges[0]?.fieldChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'natureOfOwnership',
          approvedRawValue: undefined,
          proposedValue: 'Direct',
        }),
      ])
    );
  });

  test('composes latest sparse value per field in one maintenance request', () => {
    const projection = buildMaintenanceProjection(approvedClient, [
      proposal({
        individualDetails: {
          firstName: 'Janet',
        },
        updateRequest: {
          ...proposal().updateRequest,
          submittedAt: '2026-08-26T11:00:00.000Z',
        },
      }),
      proposal({
        individualDetails: {
          lastName: 'Diaz',
        },
        updateRequest: {
          ...proposal().updateRequest,
          submittedAt: '2026-08-26T12:00:00.000Z',
        },
      }),
    ]);

    expect(projection.hasConflicts).toBe(false);
    expect(projection.partyChanges[0]?.fieldChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'firstName', proposedValue: 'Janet' }),
        expect.objectContaining({ field: 'lastName', proposedValue: 'Diaz' }),
      ])
    );
    expect(projection.proposedClient.parties?.[0]?.individualDetails).toEqual({
      firstName: 'Janet',
      middleName: 'R',
      lastName: 'Diaz',
    });
  });

  test('composes independent root roles with sparse nested details', () => {
    const projection = buildMaintenanceProjection(approvedClient, [
      proposal({
        individualDetails: {
          lastName: 'Diaz',
        },
        updateRequest: {
          ...proposal().updateRequest,
          submittedAt: '2026-08-26T11:00:00.000Z',
        },
      }),
      proposal({
        individualDetails: undefined,
        roles: ['BENEFICIAL_OWNER'],
        updateRequest: {
          ...proposal().updateRequest,
          submittedAt: '2026-08-26T12:00:00.000Z',
        },
      }),
    ]);

    expect(projection.proposedClient.parties?.[0]).toEqual(
      expect.objectContaining({
        roles: ['BENEFICIAL_OWNER'],
        individualDetails: {
          firstName: 'Jane',
          middleName: 'R',
          lastName: 'Diaz',
        },
      })
    );
  });

  test('treats empty role and address arrays as unchanged deltas', () => {
    const clientWithArrays: MaintenanceClient = {
      ...approvedClient,
      parties: [
        {
          id: 'person-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          individualDetails: approvedClient.parties?.[0]?.individualDetails,
        },
        {
          id: 'org-1',
          partyType: 'ORGANIZATION',
          roles: ['CLIENT'],
          organizationDetails: {
            organizationName: 'Neverland Books',
            addresses: [
              {
                addressType: 'BUSINESS_ADDRESS',
                addressLines: ['100 Market Street'],
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'US',
              },
            ],
          },
        },
      ],
    };
    const projection = buildMaintenanceProjection(clientWithArrays, [
      proposal({ roles: [], individualDetails: undefined }),
      {
        id: 'org-1',
        partyType: 'ORGANIZATION',
        organizationDetails: { addresses: [] },
        updateRequest: {
          status: 'NEW',
          action: 'MODIFY',
          requestId: 'request-1',
          submittedAt: '2026-08-26T12:00:00.000Z',
        },
      },
    ]);

    expect(projection.partyChanges).toEqual([]);
    expect(projection.proposedClient.parties).toEqual(clientWithArrays.parties);
  });

  test('projects pending party additions and removals without mutating approved parties', () => {
    const addedParty: MaintenanceParty = {
      id: 'person-2',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Wendy',
        lastName: 'Darling',
        birthDate: '1975-03-12',
      },
      updateRequest: {
        status: 'NEW',
        action: 'ADD',
        requestId: 'request-1',
        submittedAt: '2026-08-26T12:00:00.000Z',
      },
    };
    const removal = proposal({ individualDetails: undefined, active: false });
    const additionProjection = buildMaintenanceProjection(approvedClient, [
      addedParty,
    ]);
    const removalProjection = buildMaintenanceProjection(approvedClient, [
      removal,
    ]);

    expect(additionProjection.partyChanges[0]).toEqual(
      expect.objectContaining({
        partyId: 'person-2',
        action: 'ADD',
        removesParty: false,
        approvedParty: undefined,
      })
    );
    expect(
      additionProjection.proposedClient.parties?.some(
        (party) => party.id === 'person-2'
      )
    ).toBe(true);
    expect(removalProjection.partyChanges[0]).toEqual(
      expect.objectContaining({
        partyId: 'person-1',
        action: 'MODIFY',
        removesParty: true,
      })
    );
    expect(removalProjection.proposedClient.parties).toEqual([]);
    expect(approvedClient.parties).toHaveLength(1);
  });

  test('undoes a pending owner role without discarding unrelated party changes', () => {
    const roleAddition = proposal({
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: { natureOfOwnership: 'Direct' },
    });
    const nameChange = proposal({
      individualDetails: { lastName: 'Diaz' },
      updateRequest: {
        status: 'NEW',
        action: 'MODIFY',
        requestId: 'request-1',
        submittedAt: '2026-08-26T12:01:00.000Z',
      },
    });
    const roleReversal = proposal({
      roles: ['CONTROLLER'],
      individualDetails: undefined,
      updateRequest: {
        status: 'NEW',
        action: 'MODIFY',
        requestId: 'request-1',
        submittedAt: '2026-08-26T12:02:00.000Z',
      },
    });

    const projection = buildMaintenanceProjection(
      {
        ...approvedClient,
        parties: approvedClient.parties?.map((party) => ({
          ...party,
          roles: ['CONTROLLER'],
        })),
      },
      [roleAddition, nameChange, roleReversal]
    );

    expect(projection.partyChanges[0]?.fieldChanges).toEqual([
      expect.objectContaining({ field: 'lastName', proposedValue: 'Diaz' }),
    ]);
    expect(projection.proposedClient.parties?.[0]).toEqual(
      expect.objectContaining({
        roles: ['CONTROLLER'],
        individualDetails: expect.not.objectContaining({
          natureOfOwnership: 'Direct',
        }),
      })
    );
  });

  test('keeps a pending addition when a later proposal edits its details', () => {
    const addedParty: MaintenanceParty = {
      id: 'person-2',
      parentPartyId: 'org-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Wendy',
        lastName: 'Darling',
        natureOfOwnership: 'Direct',
      },
      updateRequest: {
        status: 'NEW',
        action: 'ADD',
        requestId: 'request-1',
        submittedAt: '2026-09-03T10:00:00.000Z',
      },
    };
    const pendingEdit: MaintenanceParty = {
      id: 'person-2',
      individualDetails: { lastName: 'Pan' },
      updateRequest: {
        status: 'NEW',
        action: 'MODIFY',
        requestId: 'request-1',
        submittedAt: '2026-09-03T10:01:00.000Z',
      },
    };

    const projection = buildMaintenanceProjection(approvedClient, [
      addedParty,
      pendingEdit,
    ]);

    expect(projection.unresolvedProposals).toEqual([]);
    expect(projection.partyChanges[0]).toEqual(
      expect.objectContaining({
        partyId: 'person-2',
        action: 'ADD',
        approvedParty: undefined,
      })
    );
    expect(
      projection.proposedClient.parties?.find(
        (party) => party.id === 'person-2'
      )
    ).toEqual(
      expect.objectContaining({
        roles: ['BENEFICIAL_OWNER'],
        individualDetails: expect.objectContaining({
          firstName: 'Wendy',
          lastName: 'Pan',
          natureOfOwnership: 'Direct',
        }),
      })
    );
  });

  test('treats an embedded active ADD party as a pending addition', () => {
    const embeddedAddition: MaintenanceParty = {
      id: 'person-2',
      parentPartyId: 'org-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Wendy',
        lastName: 'Darling',
        natureOfOwnership: 'Direct',
      },
      updateRequest: {
        status: 'NEW',
        action: 'ADD',
        requestId: 'request-1',
        submittedAt: '2026-09-03T10:00:00.000Z',
      },
    };
    const projection = buildMaintenanceProjection(
      {
        ...approvedClient,
        parties: [...(approvedClient.parties ?? []), embeddedAddition],
      },
      []
    );

    expect(projection.approvedClient.parties).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: embeddedAddition.id }),
      ])
    );
    expect(projection.proposedClient.parties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: embeddedAddition.id }),
      ])
    );
    expect(projection.partyChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          partyId: embeddedAddition.id,
          action: 'ADD',
          approvedParty: undefined,
        }),
      ])
    );
  });

  test('excludes an embedded addition from a terminated request', () => {
    const terminatedAddition: MaintenanceParty = {
      id: 'person-terminated',
      parentPartyId: 'org-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Wendy',
        lastName: 'Darling',
        natureOfOwnership: 'Direct',
      },
      updateRequest: {
        status: 'TERMINATED',
        action: 'ADD',
        requestId: 'request-terminated',
        submittedAt: '2026-09-03T10:00:00.000Z',
      },
    };
    const projection = buildMaintenanceProjection(
      {
        ...approvedClient,
        parties: [...(approvedClient.parties ?? []), terminatedAddition],
      },
      []
    );

    expect(projection.approvedClient.parties).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: terminatedAddition.id }),
      ])
    );
    expect(projection.proposedClient.parties).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: terminatedAddition.id }),
      ])
    );
    expect(projection.partyChanges).toEqual([]);
  });

  test('retains an embedded addition from an approved request', () => {
    const approvedAddition: MaintenanceParty = {
      id: 'person-approved',
      parentPartyId: 'org-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Wendy',
        lastName: 'Darling',
        natureOfOwnership: 'Direct',
      },
      updateRequest: {
        status: 'APPROVED',
        action: 'ADD',
        requestId: 'request-approved',
        submittedAt: '2026-09-03T10:00:00.000Z',
      },
    };
    const projection = buildMaintenanceProjection(
      {
        ...approvedClient,
        parties: [...(approvedClient.parties ?? []), approvedAddition],
      },
      []
    );

    expect(projection.approvedClient.parties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: approvedAddition.id }),
      ])
    );
    expect(projection.proposedClient.parties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: approvedAddition.id }),
      ])
    );
    expect(projection.partyChanges).toEqual([]);
  });

  test('projects a pending product without a maintenance request', () => {
    const projection = buildMaintenanceProjection(
      {
        ...approvedClient,
        productDetails: [
          {
            subProduct: 'LIMITED_DDA_PAYMENTS',
            onboardingStatus: 'NEW',
          },
        ],
      },
      []
    );

    expect(projection.activeRequestId).toBeUndefined();
    expect(projection.productChanges).toEqual([
      expect.objectContaining({
        product: 'EMBEDDED_PAYMENTS',
        subProduct: 'LIMITED_DDA_PAYMENTS',
        requestedAction: 'ADD',
      }),
    ]);
    expect(projection.approvedClient.productDetails).toEqual([]);
    expect(projection.proposedClient.productDetails).toEqual([
      expect.objectContaining({ subProduct: 'LIMITED_DDA_PAYMENTS' }),
    ]);
    expect(projection.canReview).toBe(true);
  });

  test('keeps a pending product active beside terminated maintenance history', () => {
    const projection = buildMaintenanceProjection(
      {
        ...approvedClient,
        updateRequest: {
          status: 'TERMINATED',
          requestId: 'terminated-request',
        },
        productDetails: [
          {
            product: 'EMBEDDED_PAYMENTS',
            subProduct: 'LIMITED_DDA',
            onboardingStatus: 'APPROVED',
          },
          {
            product: 'EMBEDDED_PAYMENTS',
            subProduct: 'LIMITED_DDA_PAYMENTS',
            onboardingStatus: 'NEW',
          },
        ],
      },
      [
        {
          id: 'person-1',
          updateRequest: {
            status: 'TERMINATED',
            action: 'MODIFY',
            requestId: 'terminated-request',
            submittedAt: '2026-09-10T14:04:00.492Z',
          },
        },
      ]
    );

    expect(projection.activeRequestId).toBeUndefined();
    expect(projection.partyChanges).toEqual([]);
    expect(projection.productChanges).toEqual([
      expect.objectContaining({
        subProduct: 'LIMITED_DDA_PAYMENTS',
        onboardingStatus: 'NEW',
      }),
    ]);
  });
});
