import type { OwnershipHierarchy } from '../V2AlternateIndirectOwnership/types';

/**
 * Props for HierarchyBuildingInterface component
 */
export interface HierarchyBuildingInterfaceProps {
  /** Whether the interface is open/active */
  isOpen: boolean;
  
  /** ID of the owner for whom we're building hierarchy */
  ownerId: string;
  
  /** Display name of the owner */
  ownerName: string;
  
  /** Root company name (Business Being Onboarded) */
  rootCompanyName: string;
  
  /** Current hierarchy being edited (if any) */
  currentHierarchy?: OwnershipHierarchy;
  
  /** Callback when hierarchy building is completed */
  onComplete: (ownerId: string, hierarchy: OwnershipHierarchy) => void;
  
  /** Callback when user cancels */
  onCancel: () => void;
  
  /** UI mode for the interface */
  mode: 'dialog' | 'inline' | 'integrated';
  
  /** Test ID for testing */
  testId?: string;
}

/**
 * Form data for building hierarchy step
 */
export interface HierarchyStepFormData {
  entityName: string;
  hasOwnership: boolean;
  isBusinessBeingOnboarded: boolean;
}

/**
 * Validation errors for hierarchy building
 */
export interface HierarchyBuildingErrors {
  entityName?: string;
  ownership?: string;
  business?: string;
  general?: string;
}
