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

// Form data and validation types are now handled by Zod schema in AddOwnerDialog.schema.ts
