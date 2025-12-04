import type { BeneficialOwner } from '../../IndirectOwnership.types';

/**
 * Props for AddOwnerDialog component
 */
export interface AddOwnerDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  
  /** Callback to close the dialog */
  onClose: () => void;
  
  /** Callback when form is submitted */
  onSubmit: (ownerData: Omit<BeneficialOwner, 'id' | 'createdAt' | 'updatedAt'>) => void;
  
  /** Existing owners for duplicate validation */
  existingOwners: BeneficialOwner[];
  
  /** Initial data for editing */
  initialData?: Partial<BeneficialOwner>;
  
  /** ID of owner being edited */
  editingOwnerId?: string;
  
  /** Test ID for testing */
  testId?: string;
}

/**
 * Form data for adding/editing an owner
 */
export interface OwnerFormData {
  firstName: string;
  lastName: string;
  ownershipType: 'DIRECT' | 'INDIRECT';
}

/**
 * Validation errors for owner form
 */
export interface OwnerFormErrors {
  firstName?: string;
  lastName?: string;
  ownershipType?: string;
  general?: string;
}
