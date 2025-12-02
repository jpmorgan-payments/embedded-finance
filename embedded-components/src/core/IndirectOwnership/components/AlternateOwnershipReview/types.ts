import type React from 'react';
import type { AlternateBeneficialOwner } from '../../types/types';

/**
 * Props for the AlternateOwnershipReview component
 */
export interface AlternateOwnershipReviewProps {
  /** All classified beneficial owners */
  beneficialOwners: AlternateBeneficialOwner[];

  /** KYC company name */
  kycCompanyName?: string;

  /** Callback to go back and edit */
  onBack: () => void;

  /** Callback to complete the ownership structure */
  onComplete: () => void;

  /** Callback to edit a specific owner */
  onEditOwner?: (ownerId: string) => void;

  /** Callback to add more owners */
  onAddMoreOwners?: () => void;

  /** Whether the component is in read-only mode */
  readOnly?: boolean;
}
