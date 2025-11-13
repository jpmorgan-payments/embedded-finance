import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock data representing a realistic beneficial ownership structure:
 * 
 * Layer 1 (Root): TechCorp Holdings LLC (Client)
 * Layer 2: Intermediary entities that qualify for beneficial ownership (≥25%)
 * Layer 3: Individual beneficial owners (3 total = mathematically valid)
 * 
 * Structure (Realistic Beneficial Ownership):
 * TechCorp Holdings LLC
 * ├── David Thompson - Direct Individual Owner (40% beneficial ownership)
 * ├── Innovation Ventures LLC - Subsidiary (35% beneficial ownership)
 * │   └── John Smith - Individual Owner (owns 100% of Innovation Ventures)
 * └── TechCorp Management LLC - Management Entity (25% beneficial ownership)
 *     └── Sarah Johnson - Individual Owner (owns 100% of TechCorp Management)
 */
export const efClientComplexOwnership: ClientResponse = {
  id: 'complex-ownership-client-001',
  attestations: [],
  parties: [
    // Layer 1: Root Client Organization
    {
      id: 'party-root-001', 
      partyType: 'ORGANIZATION',
      externalId: 'TECHCORP001',
      email: 'legal@techcorpholdings.com',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T09:00:00.000Z',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'TechCorp Holdings LLC',
        countryOfFormation: 'US',
      },
    },
    
    // Layer 2: Innovation Ventures LLC (35% beneficial ownership) - Intermediary Owner
    {
      id: 'party-sub-001',
      partyType: 'ORGANIZATION', 
      externalId: 'INNOV001',
      email: 'info@innovationventures.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T09:15:00.000Z',
      parentPartyId: 'party-root-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Innovation Ventures LLC',
        countryOfFormation: 'US',
      },
    },
    
    // Layer 2: TechCorp Management LLC (25% beneficial ownership)
    {
      id: 'party-sub-002',
      partyType: 'ORGANIZATION',
      externalId: 'MGMT001', 
      email: 'contact@techcorpmgmt.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T09:30:00.000Z',
      parentPartyId: 'party-root-001',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'TechCorp Management LLC', 
        countryOfFormation: 'US',
      },
    },
    
    // Layer 3: Individual owner under Innovation Ventures LLC (35% beneficial ownership through entity)
    {
      id: 'party-ind-001',
      partyType: 'INDIVIDUAL',
      externalId: 'JOHN001',
      email: 'john.smith@innovationventures.com', 
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:00:00.000Z',
      parentPartyId: 'party-sub-001',
      individualDetails: {
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Smith',
      },
    },
    
    // Layer 3: Individual owner under TechCorp Management LLC (25% beneficial ownership through entity)
    {
      id: 'party-ind-002',
      partyType: 'INDIVIDUAL', 
      externalId: 'SARAH001',
      email: 'sarah.johnson@techcorpmgmt.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:10:00.000Z',
      parentPartyId: 'party-sub-002',
      individualDetails: {
        firstName: 'Sarah',
        lastName: 'Johnson', 
      },
    },

    // Direct Owner: Individual who directly owns 40% of TechCorp Holdings LLC
    {
      id: 'party-ind-003',
      partyType: 'INDIVIDUAL',
      externalId: 'DAVID001',
      email: 'david.thompson@techcorpholdings.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:30:00.000Z',
      parentPartyId: 'party-root-001', // Direct ownership of the client entity
      individualDetails: {
        firstName: 'David',
        middleName: 'James',
        lastName: 'Thompson',
      },
    },
  ],
  partyId: 'party-root-001',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: [],
  },
  createdAt: '2025-11-12T09:00:00.000Z', 
  status: 'APPROVED',
};
