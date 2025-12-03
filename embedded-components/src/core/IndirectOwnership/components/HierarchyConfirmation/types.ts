import type { OwnershipHierarchy } from '../V2AlternateIndirectOwnership/types';

/**
 * Props for HierarchyConfirmationInterface component
 */
export interface HierarchyConfirmationInterfaceProps {
  /** Whether the interface is open/active */
  isOpen: boolean;
  
  /** ID of the owner */
  ownerId: string;
  
  /** The completed hierarchy to confirm */
  hierarchy: OwnershipHierarchy;
  
  /** Root company name (Business Being Onboarded) */
  rootCompanyName: string;
  
  /** Callback when hierarchy is confirmed */
  onConfirm: (ownerId: string, hierarchy: OwnershipHierarchy) => void;
  
  /** Callback when user wants to edit the hierarchy */
  onEdit: () => void;
  
  /** UI mode for the interface */
  mode: 'dialog' | 'inline' | 'integrated';
  
  /** Test ID for testing */
  testId?: string;
}
