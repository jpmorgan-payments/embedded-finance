import type { V2BeneficialOwner } from '../V2AlternateIndirectOwnership/types';

/**
 * Props for OwnershipStructureList component
 */
export interface OwnershipStructureListProps {
  /** List of beneficial owners to display */
  owners: V2BeneficialOwner[];
  
  /** Root company name (Business Being Onboarded) */
  rootCompanyName: string;
  
  /** Callback when user wants to build hierarchy for an owner */
  onBuildHierarchy: (ownerId: string) => void;
  
  /** Callback when user wants to edit an existing hierarchy */
  onEditHierarchy: (ownerId: string) => void;
  
  /** Callback when user wants to remove an owner */
  onRemoveOwner: (ownerId: string) => void;
  
  /** Whether the component is in read-only mode */
  readOnly?: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Test ID for testing */
  testId?: string;
}

/**
 * Props for individual owner item component
 */
export interface OwnerItemProps {
  /** The owner to display */
  owner: V2BeneficialOwner;
  
  /** Root company name for hierarchy display */
  rootCompanyName: string;
  
  /** Callback when user wants to build hierarchy */
  onBuildHierarchy: (ownerId: string) => void;
  
  /** Callback when user wants to edit hierarchy */
  onEditHierarchy: (ownerId: string) => void;
  
  /** Callback when user wants to remove owner */
  onRemoveOwner: (ownerId: string) => void;
  
  /** Whether in read-only mode */
  readOnly?: boolean;
}

/**
 * Props for ownership chain renderer
 */
export interface OwnershipChainRendererProps {
  /** The owner whose chain to render */
  owner: V2BeneficialOwner;
  
  /** Root company name (Business Being Onboarded) */
  rootCompanyName: string;
  
  /** Custom CSS classes */
  className?: string;
}
