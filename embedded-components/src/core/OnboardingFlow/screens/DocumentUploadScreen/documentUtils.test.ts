import { describe, expect, test } from 'vitest';

import type {
  ClientResponse,
  DocumentRequestResponse,
} from '@/api/generated/smbdo.schemas';

import {
  filterDocumentRequestsByPartyId,
  groupDocumentRequests,
} from './documentUtils';

function minimalClient(id: string, partyIds: string[]): ClientResponse {
  return {
    id,
    status: 'NEW',
    partyId: partyIds[0],
    products: ['EMBEDDED_PAYMENTS'],
    parties: partyIds.map((pid, i) => ({
      id: pid,
      roles: i === 0 ? ['CLIENT'] : ['BENEFICIAL_OWNER'],
      partyType: i === 0 ? 'ORGANIZATION' : 'INDIVIDUAL',
      organizationDetails:
        i === 0
          ? {
              organizationName: 'Biz',
              organizationType: 'LIMITED_LIABILITY_COMPANY',
              addresses: [],
            }
          : undefined,
      individualDetails:
        i !== 0
          ? {
              firstName: 'Pat',
              lastName: 'Lee',
              addresses: [],
            }
          : undefined,
      status: 'ACTIVE',
      validationResponse: [],
    })),
    outstanding: {
      partyIds: [],
      partyRoles: [],
      questionIds: [],
      documentRequestIds: [],
      attestationDocumentIds: [],
    },
  };
}

describe('documentUtils', () => {
  test('groupDocumentRequests returns empty groups without inputs', () => {
    expect(groupDocumentRequests(undefined, undefined)).toEqual({
      businessDocumentRequests: [],
      individualDocumentRequests: [],
    });
    expect(groupDocumentRequests([], minimalClient('c1', ['p1']))).toEqual({
      businessDocumentRequests: [],
      individualDocumentRequests: [],
    });
  });

  test('groups client-level business docs and owner docs separately', () => {
    const client = minimalClient('client-x', ['org-1', 'owner-2']);
    const docs: DocumentRequestResponse[] = [
      {
        id: 'dr-org',
        clientId: 'client-x',
        partyId: 'org-1',
        status: 'ACTIVE',
        createdAt: '2024-02-01T00:00:00Z',
        requirements: [],
      },
      {
        id: 'dr-owner',
        clientId: 'client-x',
        partyId: 'owner-2',
        status: 'ACTIVE',
        createdAt: '2024-03-01T00:00:00Z',
        requirements: [],
      },
    ];
    const grouped = groupDocumentRequests(docs, client);
    expect(grouped.businessDocumentRequests.map((d) => d.id)).toEqual([
      'dr-org',
    ]);
    expect(grouped.individualDocumentRequests.map((d) => d.id)).toEqual([
      'dr-owner',
    ]);
  });

  test('filterDocumentRequestsByPartyId keeps ACTIVE rows for party', () => {
    const docs: DocumentRequestResponse[] = [
      {
        id: 'a',
        clientId: 'c',
        partyId: 'p1',
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00Z',
        requirements: [],
      },
      {
        id: 'b',
        clientId: 'c',
        partyId: 'p1',
        status: 'CLOSED',
        createdAt: '2024-01-02T00:00:00Z',
        requirements: [],
      },
    ];
    expect(filterDocumentRequestsByPartyId(docs, 'p1')).toHaveLength(1);
    expect(filterDocumentRequestsByPartyId(docs, 'p1')[0]?.id).toBe('a');
  });

  test('filterDocumentRequestsByPartyId returns empty without party id', () => {
    expect(filterDocumentRequestsByPartyId([], undefined)).toEqual([]);
  });
});
