/**
 * V2 Alternate Indirect Ownership Types
 * Streamlined ownership structure building with real-time validation
 */

/**
 * V2 Beneficial Owner - Enhanced with real-time status tracking
 */
export interface V2BeneficialOwner {
  /** Unique identifier for the owner */
  id: string;
  
  /** Owner's first name */
  firstName: string;
  
  /** Owner's last name */
  lastName: string;
  
  /** Type of ownership relationship */
  ownershipType: 'DIRECT' | 'INDIRECT';
  
  /** Current completion status */
  status: 'COMPLETE' | 'PENDING_HIERARCHY' | 'ERROR';
  
  /** Ownership hierarchy chain (for indirect owners) */
  ownershipHierarchy?: OwnershipHierarchy;
  
  /** Whether this owner meets the 25% threshold */
  meets25PercentThreshold?: boolean;
  
  /** Real-time validation errors */
  validationErrors?: string[];
  
  /** Timestamp when owner was added */
  createdAt: Date;
  
  /** Timestamp when owner was last updated */
  updatedAt: Date;
}

/**
 * Ownership Hierarchy - Complete chain from owner to business
 */
export interface OwnershipHierarchy {
  /** Unique identifier for this hierarchy */
  id: string;
  
  /** Ordered steps in the ownership chain */
  steps: HierarchyStep[];
  
  /** Whether the hierarchy is valid and complete */
  isValid: boolean;
  
  /** Whether the final ownership meets 25% threshold */
  meets25PercentThreshold: boolean;
  
  /** Validation errors for this hierarchy */
  validationErrors?: string[];
  
  /** Timestamp when hierarchy was created */
  createdAt: Date;
  
  /** Timestamp when hierarchy was last updated */
  updatedAt: Date;
}

/**
 * Individual step in the ownership hierarchy
 */
export interface HierarchyStep {
  /** Unique identifier for this step */
  id: string;
  
  /** Name of the entity at this level */
  entityName: string;
  
  /** Type of entity */
  entityType: 'INDIVIDUAL' | 'COMPANY';
  
  /** Whether this entity has ownership in the next level */
  hasOwnership: boolean;
  
  /** Whether this is the business being onboarded */
  isBusinessBeingOnboarded: boolean;
  
  /** Level in the hierarchy (0 = beneficial owner, 1+ = intermediate entities) */
  level: number;
  
  /** Additional metadata for this step */
  metadata?: {
    ownershipPercentage?: number;
    verificationStatus?: 'PENDING' | 'VERIFIED' | 'FAILED';
    notes?: string;
  };
}

/**
 * Overall state for V2 ownership management
 */
export interface V2OwnershipState {
  /** Name of the root company being onboarded */
  rootCompanyName: string;
  
  /** All beneficial owners */
  beneficialOwners: V2BeneficialOwner[];
  
  /** Current active interface */
  currentInterface: 'NONE' | 'ADD_OWNER' | 'BUILD_HIERARCHY' | 'CONFIRM_HIERARCHY';
  
  /** ID of owner currently being edited */
  currentOwnerBeingEdited?: string;
  
  /** Real-time validation summary */
  validationSummary: ValidationSummary;
  
  /** Whether the ownership structure is complete */
  isComplete: boolean;
  
  /** Configuration options */
  config: V2OwnershipConfig;
}

/**
 * Real-time validation summary
 */
export interface ValidationSummary {
  /** Total number of owners */
  totalOwners: number;
  
  /** Number of owners with complete information */
  completeOwners: number;
  
  /** Number of owners with pending hierarchies */
  pendingHierarchies: number;
  
  /** Number of owners with errors */
  ownersWithErrors: number;
  
  /** Whether there are any validation errors */
  hasErrors: boolean;
  
  /** List of all validation errors */
  errors: string[];
  
  /** List of all validation warnings */
  warnings: string[];
  
  /** Whether the structure can be completed */
  canComplete: boolean;
  
  /** Completion percentage (0-100) */
  completionPercentage: number;
}

/**
 * Configuration for V2 ownership management
 */
export interface V2OwnershipConfig {
  /** Maximum number of ownership levels allowed */
  maxHierarchyLevels: number;
  
  /** Whether to require 25% ownership threshold */
  requiresOwnershipThreshold: boolean;
  
  /** Maximum number of owners allowed */
  maxOwners?: number;
  
  /** Required fields for owner validation */
  requiredFields: string[];
  
  /** Whether duplicate names are allowed */
  allowDuplicateNames: boolean;
  
  /** Custom validation rules */
  customValidation?: {
    [key: string]: (owner: V2BeneficialOwner) => string | null;
  };
}

/**
 * Interface state management for different UI modes
 */
export interface InterfaceState {
  /** Add owner interface state */
  addOwner: {
    isActive: boolean;
    editingOwnerId?: string;
    initialData?: Partial<V2BeneficialOwner>;
  };
  
  /** Build hierarchy interface state */
  buildHierarchy: {
    isActive: boolean;
    ownerId: string;
    ownerName: string;
    currentHierarchy?: OwnershipHierarchy;
    mode: 'dialog' | 'inline' | 'integrated';
  };
  
  /** Confirm hierarchy interface state */
  confirmHierarchy: {
    isActive: boolean;
    ownerId: string;
    completedHierarchy: OwnershipHierarchy;
    mode: 'dialog' | 'inline' | 'integrated';
  };
}

/**
 * Props for the main V2 component
 */
export interface V2AlternateIndirectOwnershipProps {
  /** Root company name for Business Being Onboarded */
  rootCompanyName: string;
  
  /** Callback when ownership structure is completed */
  onOwnershipComplete?: (owners: V2BeneficialOwner[]) => void;
  
  /** Callback for real-time validation updates */
  onValidationChange?: (summary: ValidationSummary) => void;
  
  /** Initial beneficial owners (for editing scenarios) */
  initialOwners?: V2BeneficialOwner[];
  
  /** Configuration options */
  config?: Partial<V2OwnershipConfig>;
  
  /** Read-only mode */
  readOnly?: boolean;
  
  /** Custom styling classes */
  className?: string;
  
  /** Test ID for testing */
  testId?: string;
}

/**
 * Validation messages for different scenarios
 */
export const VALIDATION_MESSAGES = {
  pendingHierarchy: "Ownership hierarchy required - click 'Build Ownership Hierarchy' to continue",
  invalidHierarchy: "Ownership hierarchy has errors - click 'Edit Hierarchy' to fix",
  belowThreshold: "Owner must have 25% or more beneficial ownership",
  duplicateName: "Owner with this name already exists",
  missingRequired: "First name and last name are required",
  noOwners: "At least one beneficial owner is required",
  maxOwnersReached: "Maximum number of owners reached",
  hierarchyTooDeep: "Ownership hierarchy exceeds maximum allowed levels",
  circularOwnership: "Circular ownership detected - owner cannot own themselves",
  invalidCompanyName: "Company name is required and must be valid",
  missingBusinessBeingOnboarded: "Hierarchy must end at the Business Being Onboarded",
} as const;

/**
 * Status indicators for visual feedback
 */
export interface StatusIndicator {
  type: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  icon?: string;
  actionable?: boolean;
  actionText?: string;
  onAction?: () => void;
}

/**
 * Event types for ownership management
 */
export type V2OwnershipEvent = 
  | { type: 'OWNER_ADDED'; payload: V2BeneficialOwner }
  | { type: 'OWNER_UPDATED'; payload: V2BeneficialOwner }
  | { type: 'OWNER_REMOVED'; payload: string }
  | { type: 'HIERARCHY_BUILT'; payload: { ownerId: string; hierarchy: OwnershipHierarchy } }
  | { type: 'HIERARCHY_CONFIRMED'; payload: { ownerId: string; hierarchy: OwnershipHierarchy } }
  | { type: 'VALIDATION_UPDATED'; payload: ValidationSummary }
  | { type: 'OWNERSHIP_COMPLETED'; payload: V2BeneficialOwner[] };
