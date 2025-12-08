import type React from 'react';

/**
 * Props for the OwnershipTypeSelector component
 */
export interface OwnershipTypeSelectorProps {
  /** Current owner being classified */
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };

  /** Currently selected ownership type */
  selectedType?: 'DIRECT' | 'INDIRECT';

  /** Callback when ownership type is selected */
  onTypeSelect: (type: 'DIRECT' | 'INDIRECT') => void;

  /** Callback to go back to previous step */
  onBack: () => void;

  /** Callback to continue to next step */
  onContinue: () => void;

  /** KYC company name for context */
  kycCompanyName?: string;

  /** Whether this is the last owner to classify */
  isLastOwner?: boolean;

  /** Current progress info */
  currentOwnerIndex: number;
  totalOwners: number;
}
