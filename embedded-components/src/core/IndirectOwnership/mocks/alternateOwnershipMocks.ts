import type { AlternateBeneficialOwner } from '../types/types';

/**
 * Mock data for alternate ownership flow - empty state for new flow
 */
export const alternateOwnershipEmpty = {
  beneficialOwners: [] as AlternateBeneficialOwner[],
  kycCompanyName: 'TechStart Innovation LLC',
};

/**
 * Mock data for alternate ownership flow - with some sample owners
 */
export const alternateOwnershipWithSampleOwners = {
  beneficialOwners: [
    {
      id: 'alt-owner-001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@email.com',
      ownershipType: 'DIRECT' as const,
      hierarchyChain: [],
      owns25PercentOfKycCompany: true as const,
    },
    {
      id: 'alt-owner-002', 
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@email.com',
      ownershipType: 'INDIRECT' as const,
      hierarchyChain: [
        {
          id: 'company-001',
          companyName: 'Chen Holdings LLC',
          isKycCompany: false,
          isRootCompany: false,
          level: 1,
        },
        {
          id: 'company-002',
          companyName: 'TechStart Innovation LLC',
          isKycCompany: true,
          isRootCompany: true,
          level: 2,
        },
      ],
      owns25PercentOfKycCompany: true as const,
    },
    {
      id: 'alt-owner-003',
      firstName: 'Lisa',
      lastName: 'Rodriguez',
      email: 'lisa.rodriguez@email.com', 
      ownershipType: 'PENDING_CLASSIFICATION' as const,
      hierarchyChain: [],
      owns25PercentOfKycCompany: true as const,
    },
  ] as AlternateBeneficialOwner[],
  kycCompanyName: 'TechStart Innovation LLC',
};

/**
 * Mock data for alternate ownership flow - complex multi-level hierarchy
 */
export const alternateOwnershipComplexHierarchy = {
  beneficialOwners: [
    {
      id: 'complex-owner-001',
      firstName: 'Robert',
      lastName: 'Williams',
      email: 'robert.williams@email.com',
      ownershipType: 'INDIRECT' as const,
      hierarchyChain: [
        {
          id: 'complex-company-001',
          companyName: 'Williams Family Trust',
          isKycCompany: false,
          isRootCompany: false,
          level: 1,
        },
        {
          id: 'complex-company-002', 
          companyName: 'Investment Holdings Corp',
          isKycCompany: false,
          isRootCompany: false,
          level: 2,
        },
        {
          id: 'complex-company-003',
          companyName: 'TechStart Innovation LLC',
          isKycCompany: true,
          isRootCompany: true,
          level: 3,
        },
      ],
      owns25PercentOfKycCompany: true as const,
    },
    {
      id: 'complex-owner-002',
      firstName: 'Jennifer',
      lastName: 'Davis',
      email: 'jennifer.davis@email.com',
      ownershipType: 'DIRECT' as const,
      hierarchyChain: [],
      owns25PercentOfKycCompany: true as const,
    },
  ] as AlternateBeneficialOwner[],
  kycCompanyName: 'TechStart Innovation LLC',
};
