import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock client with realistic ownership structure for performance testing
 * Maximum 4 owners since each must have at least 25% ownership (4 × 25% = 100%)
 * Includes complex hierarchies for indirect ownership chains
 */
export const efClientWithComplexOwnership: ClientResponse = {
  id: 'complex-ownership-client-001',
  attestations: [],
  partyId: 'party-main-corp',
  status: 'APPROVED',
  outstanding: {},
  parties: [
    // CLIENT: Corporation being onboarded
    {
      id: 'party-main-corp',
      partyType: 'ORGANIZATION',
      externalId: 'MAIN_CORP_001',
      email: 'info@maincorp.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Main Corporation Inc.',
        countryOfFormation: 'US',
      },
    },

    // Owner 1: Direct owner with 30% ownership
    {
      id: 'party-direct-owner-1',
      partyType: 'INDIVIDUAL' as const,
      externalId: 'DIRECT_OWNER_001',
      email: 'john.smith@maincorp.com',
      roles: ['BENEFICIAL_OWNER'] as const,
      profileStatus: 'APPROVED' as const,
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      individualDetails: {
        firstName: 'John',
        lastName: 'Smith',
        birthDate: '1980-01-15',
      },
    },

    // Owner 2: Direct owner with 25% ownership
    {
      id: 'party-direct-owner-2',
      partyType: 'INDIVIDUAL' as const,
      externalId: 'DIRECT_OWNER_002',
      email: 'jane.doe@maincorp.com',
      roles: ['BENEFICIAL_OWNER'] as const,
      profileStatus: 'APPROVED' as const,
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Doe',
        birthDate: '1975-01-15',
      },
    },

    // Owner 3: Indirect owner with 27% ownership through complex chain
    {
      id: 'party-indirect-owner-1',
      partyType: 'INDIVIDUAL' as const,
      externalId: 'INDIRECT_OWNER_001',
      email: 'robert.wilson@holdings.com',
      roles: ['BENEFICIAL_OWNER'] as const,
      profileStatus: 'INFORMATION_REQUESTED' as const,
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      individualDetails: {
        firstName: 'Robert',
        lastName: 'Wilson',
        birthDate: '1970-01-15',
      },
    },

    // Owner 4: Indirect owner with 18% ownership (FAILS 25% threshold - for error testing)
    {
      id: 'party-indirect-owner-2',
      partyType: 'INDIVIDUAL' as const,
      externalId: 'INDIRECT_OWNER_002',
      email: 'sarah.johnson@holdings.com',
      roles: ['BENEFICIAL_OWNER'] as const,
      profileStatus: 'DECLINED' as const,
      active: false,
      createdAt: '2024-01-15T10:00:00.000Z',
      individualDetails: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        birthDate: '1982-01-15',
      },
    },

    // Intermediate holding companies for complex ownership chains
    {
      id: 'party-holding-alpha',
      partyType: 'ORGANIZATION' as const,
      externalId: 'HOLDING_ALPHA',
      email: 'contact@alphaholdingsllc.com',
      roles: ['CONTROLLER'] as const,
      profileStatus: 'APPROVED' as const,
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY' as const,
        organizationName: 'Alpha Holdings LLC',
        countryOfFormation: 'US' as const,
      },
    },

    {
      id: 'party-holding-beta',
      partyType: 'ORGANIZATION' as const,
      externalId: 'HOLDING_BETA',
      email: 'info@betainvestments.com',
      roles: ['CONTROLLER'] as const,
      profileStatus: 'APPROVED' as const,
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION' as const,
        organizationName: 'Beta Investments Corp',
        countryOfFormation: 'US' as const,
      },
    },

    {
      id: 'party-holding-gamma',
      partyType: 'ORGANIZATION' as const,
      externalId: 'HOLDING_GAMMA',
      email: 'admin@gammaventures.com',
      roles: ['CONTROLLER'] as const,
      profileStatus: 'APPROVED' as const,
      active: true,
      createdAt: '2024-01-15T10:00:00.000Z',
      organizationDetails: {
        organizationType: 'PARTNERSHIP' as const,
        organizationName: 'Gamma Ventures LP',
        countryOfFormation: 'US' as const,
      },
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
  createdAt: '2024-01-15T10:00:00.000Z',
};

/**
 * Performance test scenarios for realistic ownership structures
 * Note: Maximum 4 beneficial owners possible (each needs ≥25% ownership)
 */
export const ownershipTestScenarios = {
  empty: {
    name: 'Empty Structure',
    owners: 0,
    description: 'No owners added yet - baseline performance',
  },
  single: {
    name: 'Single Owner (100%)',
    owners: 1,
    description: 'One owner with 100% ownership',
  },
  dual: {
    name: 'Two Owners (50% each)', 
    owners: 2,
    description: 'Equal partnership structure',
  },
  complex: {
    name: 'Complex Structure (4 owners)',
    owners: 4, 
    description: 'Maximum complexity with indirect ownership chains',
  },
} as const;
