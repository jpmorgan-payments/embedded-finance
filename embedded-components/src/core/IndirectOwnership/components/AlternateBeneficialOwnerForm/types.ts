import type React from 'react';

/**
 * Props for the AlternateBeneficialOwnerForm component
 */
export interface AlternateBeneficialOwnerFormProps {
  /** List of current beneficial owners */
  owners: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;

  /** Callback when owners list is updated */
  onOwnersChange: (owners: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>) => void;

  /** Callback to proceed to next step */
  onNext: () => void;

  /** Whether the form is in read-only mode */
  readOnly?: boolean;

  /** KYC company name for context */
  kycCompanyName?: string;
}
