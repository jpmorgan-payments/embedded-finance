import { describe, expect, it } from 'vitest';

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import {
  asPlainString,
  clientHasOutstandingDocRequests,
  convertClientToSoleProprietorship,
  formatQuestionResponse,
  getActiveOwners,
  getAllOwners,
  getClientContext,
  getControllerParty,
  getInactiveOwners,
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
  getPartyName,
  isPTC,
  isUSExchangePTC,
} from './dataUtils';

const mockClient = {
  id: 'client-1',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [
    {
      id: 'org-1',
      partyType: 'ORGANIZATION',
      active: true,
      roles: ['CLIENT'],
      organizationDetails: {
        organizationName: 'Acme Corp',
        organizationType: 'LLC',
        jurisdiction: 'US',
        countryOfFormation: 'US',
      },
    },
    {
      id: 'ctrl-1',
      partyType: 'INDIVIDUAL',
      active: true,
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'John',
        lastName: 'Doe',
      },
    },
    {
      id: 'owner-1',
      partyType: 'INDIVIDUAL',
      active: true,
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    },
    {
      id: 'owner-2',
      partyType: 'INDIVIDUAL',
      active: false,
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Bob',
        lastName: 'Inactive',
      },
    },
  ],
} as unknown as ClientResponse;

describe('dataUtils', () => {
  describe('getAllOwners', () => {
    it('returns all beneficial owners', () => {
      const owners = getAllOwners(mockClient);
      expect(owners).toHaveLength(2);
    });

    it('returns undefined for undefined client', () => {
      expect(getAllOwners(undefined)).toBeUndefined();
    });
  });

  describe('getActiveOwners', () => {
    it('returns only active beneficial owners', () => {
      const owners = getActiveOwners(mockClient);
      expect(owners).toHaveLength(1);
      expect((owners?.[0] as any).id).toBe('owner-1');
    });
  });

  describe('getInactiveOwners', () => {
    it('returns only inactive beneficial owners', () => {
      const owners = getInactiveOwners(mockClient);
      expect(owners).toHaveLength(1);
      expect((owners?.[0] as any).id).toBe('owner-2');
    });
  });

  describe('getClientContext', () => {
    it('returns product, jurisdiction, and entityType', () => {
      const ctx = getClientContext(mockClient);
      expect(ctx.product).toBe('EMBEDDED_PAYMENTS');
      expect(ctx.jurisdiction).toBe('US');
      expect(ctx.entityType).toBe('LLC');
    });

    it('returns empty context for undefined client', () => {
      const ctx = getClientContext(undefined);
      expect(ctx.product).toBeUndefined();
      expect(ctx.jurisdiction).toBeUndefined();
      expect(ctx.entityType).toBeUndefined();
    });
  });

  describe('getPartyByAssociatedPartyFilters', () => {
    it('finds party matching type and roles', () => {
      const party = getPartyByAssociatedPartyFilters(mockClient, {
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
      });
      expect((party as any).id).toBe('ctrl-1');
    });

    it('returns empty object when no match', () => {
      const party = getPartyByAssociatedPartyFilters(mockClient, {
        partyType: 'INDIVIDUAL',
        roles: ['NONEXISTENT' as any],
      });
      expect(party).toEqual({});
    });

    it('only returns active parties', () => {
      const party = getPartyByAssociatedPartyFilters(mockClient, {
        partyType: 'INDIVIDUAL',
        roles: ['BENEFICIAL_OWNER'],
      });
      // Should find owner-1 (active), not owner-2 (inactive)
      expect((party as any).id).toBe('owner-1');
    });
  });

  describe('getOrganizationParty', () => {
    it('returns the active organization party', () => {
      const org = getOrganizationParty(mockClient);
      expect((org as any).id).toBe('org-1');
    });

    it('returns undefined for undefined client', () => {
      expect(getOrganizationParty(undefined)).toBeUndefined();
    });
  });

  describe('getControllerParty', () => {
    it('returns the active controller', () => {
      const ctrl = getControllerParty(mockClient);
      expect((ctrl as any).id).toBe('ctrl-1');
    });

    it('returns undefined for undefined client', () => {
      expect(getControllerParty(undefined)).toBeUndefined();
    });
  });

  describe('isUSExchangePTC', () => {
    it('returns true for NYSE (XNYS)', () => {
      const party = {
        organizationDetails: {
          publiclyTraded: { stockExchange: 'XNYS', tickerSymbol: 'ACME' },
        },
      } as unknown as PartyResponse;
      expect(isUSExchangePTC(party)).toBe(true);
    });

    it('returns true for NASDAQ (XNAS)', () => {
      const party = {
        organizationDetails: {
          publiclyTraded: { stockExchange: 'XNAS', tickerSymbol: 'ACME' },
        },
      } as unknown as PartyResponse;
      expect(isUSExchangePTC(party)).toBe(true);
    });

    it('returns false for other exchanges', () => {
      const party = {
        organizationDetails: {
          publiclyTraded: { stockExchange: 'LSE', tickerSymbol: 'ACME' },
        },
      } as unknown as PartyResponse;
      expect(isUSExchangePTC(party)).toBe(false);
    });

    it('returns false when no publiclyTraded', () => {
      const party = {
        organizationDetails: {},
      } as unknown as PartyResponse;
      expect(isUSExchangePTC(party)).toBe(false);
    });

    it('returns false for undefined party', () => {
      expect(isUSExchangePTC(undefined)).toBe(false);
    });
  });

  describe('isPTC', () => {
    it('returns true when stockExchange is present', () => {
      const party = {
        organizationDetails: {
          publiclyTraded: { stockExchange: 'LSE', tickerSymbol: 'ACME' },
        },
      } as unknown as PartyResponse;
      expect(isPTC(party)).toBe(true);
    });

    it('returns false when no stockExchange', () => {
      const party = {
        organizationDetails: { publiclyTraded: {} },
      } as unknown as PartyResponse;
      expect(isPTC(party)).toBe(false);
    });

    it('returns false for undefined party', () => {
      expect(isPTC(undefined)).toBe(false);
    });
  });

  describe('getPartyName', () => {
    it('returns organization name for org party', () => {
      expect(
        getPartyName({
          organizationDetails: { organizationName: 'Acme Corp' },
        } as any)
      ).toBe('Acme Corp');
    });

    it('returns full name for individual party', () => {
      expect(
        getPartyName({
          individualDetails: {
            firstName: 'John',
            middleName: 'Q',
            lastName: 'Doe',
            nameSuffix: 'Jr',
          },
        } as any)
      ).toBe('John Q Doe Jr');
    });

    it('handles missing middle name and suffix', () => {
      expect(
        getPartyName({
          individualDetails: { firstName: 'Jane', lastName: 'Smith' },
        } as any)
      ).toBe('Jane Smith');
    });

    it('returns empty string for undefined party', () => {
      expect(getPartyName(undefined)).toBe('');
    });
  });

  describe('asPlainString', () => {
    it('returns empty string for null/undefined', () => {
      expect(asPlainString(null)).toBe('');
      expect(asPlainString(undefined)).toBe('');
    });

    it('returns string values as-is', () => {
      expect(asPlainString('hello')).toBe('hello');
    });

    it('converts numbers to string', () => {
      expect(asPlainString(42)).toBe('42');
    });

    it('converts booleans to string', () => {
      expect(asPlainString(true)).toBe('true');
      expect(asPlainString(false)).toBe('false');
    });

    it('returns empty string for objects', () => {
      expect(asPlainString({ key: 'value' })).toBe('');
      expect(asPlainString([1, 2, 3])).toBe('');
    });
  });

  describe('formatQuestionResponse', () => {
    it('formats currency for question 30005', () => {
      const result = formatQuestionResponse({
        questionId: '30005',
        values: ['50000'],
      } as any);
      expect(result).toContain('50,000');
    });

    it('returns "Yes" for true values', () => {
      const result = formatQuestionResponse({
        questionId: '30001',
        values: ['true'],
      } as any);
      expect(result.toLowerCase()).toContain('yes');
    });

    it('returns "No" for false values', () => {
      const result = formatQuestionResponse({
        questionId: '30001',
        values: ['false'],
      } as any);
      expect(result.toLowerCase()).toContain('no');
    });

    it('joins multiple values with comma', () => {
      const result = formatQuestionResponse({
        questionId: '30002',
        values: ['A', 'B', 'C'],
      } as any);
      expect(result).toBe('A, B, C');
    });

    it('returns empty string for no values', () => {
      const result = formatQuestionResponse({
        questionId: '30002',
        values: undefined,
      } as any);
      expect(result).toBe('');
    });
  });

  describe('clientHasOutstandingDocRequests', () => {
    it('returns true when top-level doc requests exist', () => {
      const client = {
        outstanding: { documentRequestIds: ['doc-1'] },
        parties: [],
      } as unknown as ClientResponse;
      expect(clientHasOutstandingDocRequests(client)).toBe(true);
    });

    it('returns true when party has validation doc requests', () => {
      const client = {
        outstanding: {},
        parties: [
          {
            validationResponse: [{ documentRequestIds: ['doc-2'] }],
          },
        ],
      } as unknown as ClientResponse;
      expect(clientHasOutstandingDocRequests(client)).toBe(true);
    });

    it('returns false when no doc requests', () => {
      const client = {
        outstanding: { documentRequestIds: [] },
        parties: [{ validationResponse: [{ documentRequestIds: [] }] }],
      } as unknown as ClientResponse;
      expect(clientHasOutstandingDocRequests(client)).toBe(false);
    });

    it('returns false for undefined client', () => {
      expect(clientHasOutstandingDocRequests(undefined)).toBe(false);
    });
  });

  describe('convertClientToSoleProprietorship', () => {
    it('returns undefined for undefined client', () => {
      expect(convertClientToSoleProprietorship(undefined)).toBeUndefined();
    });

    it('sets organization type to SOLE_PROPRIETORSHIP', () => {
      const result = convertClientToSoleProprietorship(mockClient);
      const org = result?.parties?.find((p) => p.partyType === 'ORGANIZATION');
      expect(org?.organizationDetails?.organizationType).toBe(
        'SOLE_PROPRIETORSHIP'
      );
    });

    it('sets countryOfFormation to US', () => {
      const result = convertClientToSoleProprietorship(mockClient);
      const org = result?.parties?.find((p) => p.partyType === 'ORGANIZATION');
      expect(org?.organizationDetails?.countryOfFormation).toBe('US');
    });

    it('sets org name from controller name', () => {
      const result = convertClientToSoleProprietorship(mockClient);
      const org = result?.parties?.find((p) => p.partyType === 'ORGANIZATION');
      expect(org?.organizationDetails?.organizationName).toBe('John Doe');
    });

    it('adds BENEFICIAL_OWNER role to controller', () => {
      const result = convertClientToSoleProprietorship(mockClient);
      const ctrl = result?.parties?.find(
        (p) => p.partyType === 'INDIVIDUAL' && p.roles?.includes('CONTROLLER')
      );
      expect(ctrl?.roles).toContain('BENEFICIAL_OWNER');
    });

    it('does not duplicate BENEFICIAL_OWNER if already present', () => {
      const clientWithBOController = {
        ...mockClient,
        parties: mockClient.parties?.map((p) =>
          (p as any).id === 'ctrl-1'
            ? { ...p, roles: ['CONTROLLER', 'BENEFICIAL_OWNER'] }
            : p
        ),
      } as unknown as ClientResponse;

      const result = convertClientToSoleProprietorship(clientWithBOController);
      const ctrl = result?.parties?.find(
        (p) => p.partyType === 'INDIVIDUAL' && p.roles?.includes('CONTROLLER')
      );
      const boCount = ctrl?.roles?.filter(
        (r) => r === 'BENEFICIAL_OWNER'
      ).length;
      expect(boCount).toBe(1);
    });
  });
});
