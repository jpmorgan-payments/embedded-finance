import { ClientResponse } from '@/api/generated/smbdo.schemas';

/**
 * Mock data representing a complex 3-layer ownership structure:
 * 
 * Layer 1 (Root): TechCorp Holdings LLC (Client)
 * Layer 2: Multiple subsidiaries and holding entities  
 * Layer 3: Individual beneficial owners and smaller entities
 * 
 * Structure:
 * TechCorp Holdings LLC
 * ├── Innovation Ventures LLC (60%) - Subsidiary
 * │   ├── John Smith (40%) - Individual Owner  
 * │   └── Sarah Johnson (60%) - Individual Owner
 * ├── TechCorp Management LLC (25%) - Management Entity
 * │   ├── Michael Davis (80%) - Managing Member
 * │   └── Lisa Chen (20%) - Member
 * └── Strategic Investors Group (15%) - Investment Entity
 *     ├── Robert Wilson (70%) - Lead Investor
 *     └── Investment Fund Alpha LP (30%) - Institutional
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
    
    // Layer 2: Innovation Ventures LLC (60% ownership)
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
    
    // Layer 2: TechCorp Management LLC (25% ownership)  
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
    
    // Layer 2: Strategic Investors Group (15% ownership)
    {
      id: 'party-sub-003',
      partyType: 'ORGANIZATION',
      externalId: 'STRAT001',
      email: 'investors@strategicgroup.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED', 
      active: true,
      createdAt: '2025-11-12T09:45:00.000Z',
      parentPartyId: 'party-root-001',
      organizationDetails: {
        organizationType: 'PARTNERSHIP',
        organizationName: 'Strategic Investors Group',
        countryOfFormation: 'US',
      },
    },
    
    // Layer 3: Individual owners under Innovation Ventures LLC
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
    
    {
      id: 'party-ind-002',
      partyType: 'INDIVIDUAL',
      externalId: 'SARAH001',
      email: 'sarah.johnson@innovationventures.com',
      roles: ['BENEFICIAL_OWNER'], 
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:05:00.000Z',
      parentPartyId: 'party-sub-001',
      individualDetails: {
        firstName: 'Sarah',
        lastName: 'Johnson',
      },
    },
    
    // Layer 3: Individual owners under TechCorp Management LLC
    {
      id: 'party-ind-003',
      partyType: 'INDIVIDUAL', 
      externalId: 'MICHAEL001',
      email: 'michael.davis@techcorpmgmt.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:10:00.000Z',
      parentPartyId: 'party-sub-002',
      individualDetails: {
        firstName: 'Michael',
        lastName: 'Davis', 
      },
    },
    
    {
      id: 'party-ind-004',
      partyType: 'INDIVIDUAL',
      externalId: 'LISA001',
      email: 'lisa.chen@techcorpmgmt.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:15:00.000Z',
      parentPartyId: 'party-sub-002',
      individualDetails: {
        firstName: 'Lisa',
        lastName: 'Chen',
      },
    },
    
    // Layer 3: Individual and entity owners under Strategic Investors Group
    {
      id: 'party-ind-005',
      partyType: 'INDIVIDUAL',
      externalId: 'ROBERT001',
      email: 'robert.wilson@strategicgroup.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true, 
      createdAt: '2025-11-12T10:20:00.000Z',
      parentPartyId: 'party-sub-003',
      individualDetails: {
        firstName: 'Robert',
        middleName: 'Alexander',
        lastName: 'Wilson',
      },
    },
    
    {
      id: 'party-org-004',
      partyType: 'ORGANIZATION',
      externalId: 'FUND001',
      email: 'contact@investmentfundalpha.com',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      createdAt: '2025-11-12T10:25:00.000Z',
      parentPartyId: 'party-sub-003',
      organizationDetails: {
        organizationType: 'LIMITED_PARTNERSHIP',
        organizationName: 'Investment Fund Alpha LP', 
        countryOfFormation: 'US',
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
