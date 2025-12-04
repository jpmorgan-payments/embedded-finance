/**
 * Indirect Ownership Types
 * Public API types for the IndirectOwnership component
 */

/**
 * Beneficial Owner - Enhanced with real-time status tracking
 */
export interface BeneficialOwner {
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
  
  /** Whether this entity directly owns the root business */
  ownsRootBusinessDirectly: boolean;
  
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
 * Configuration for ownership management
 */
export interface OwnershipConfig {
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
    [key: string]: (owner: BeneficialOwner) => string | null;
  };
}

/**
 * Props for the IndirectOwnership component - Public API
 */
export interface IndirectOwnershipProps {
  /** Root company name for Business Being Onboarded */
  rootCompanyName: string;
  
  /** Callback when ownership structure is completed */
  onOwnershipComplete?: (owners: BeneficialOwner[]) => void;
  
  /** Callback for real-time validation updates */
  onValidationChange?: (summary: ValidationSummary) => void;
  
  /** Initial beneficial owners (for editing scenarios) */
  initialOwners?: BeneficialOwner[];
  
  /** Configuration options */
  config?: Partial<OwnershipConfig>;
  
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
 * Complete ownership structure
 */
export interface OwnershipStructure {
  /** Root company name */
  rootCompanyName: string;
  
  /** All beneficial owners */
  owners: BeneficialOwner[];
  
  /** When the structure was completed */
  completedAt: string;
  
  /** Final validation summary */
  validationSummary: ValidationSummary;
}

/**
 * Event types for ownership management
 */
export type OwnershipEvent = 
  | { type: 'OWNER_ADDED'; payload: BeneficialOwner }
  | { type: 'OWNER_UPDATED'; payload: BeneficialOwner }
  | { type: 'OWNER_REMOVED'; payload: string }
  | { type: 'HIERARCHY_BUILT'; payload: { ownerId: string; hierarchy: OwnershipHierarchy } }
  | { type: 'HIERARCHY_CONFIRMED'; payload: { ownerId: string; hierarchy: OwnershipHierarchy } }
  | { type: 'VALIDATION_UPDATED'; payload: ValidationSummary }
  | { type: 'OWNERSHIP_COMPLETED'; payload: BeneficialOwner[] };
