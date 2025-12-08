import type React from 'react';

/**
 * Props for the HierarchyBuilder component
 */
export interface HierarchyBuilderProps {
  /** Owner for whom we're building the hierarchy */
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };

  /** Current hierarchy chain being built */
  hierarchyChain: Array<{
    id: string;
    companyName: string;
    isKycCompany: boolean;
    level: number;
  }>;

  /** Callback when hierarchy chain is updated */
  onHierarchyChange: (
    chain: Array<{
      id: string;
      companyName: string;
      isKycCompany: boolean;
      level: number;
    }>
  ) => void;

  /** Callback to go back */
  onBack: () => void;

  /** Callback to continue */
  onContinue: () => void;

  /** KYC company name */
  kycCompanyName?: string;

  /** Maximum hierarchy levels allowed */
  maxLevels?: number;
}
