/**
 * Indirect Ownership Types
 * Public API types for the IndirectOwnership component
 */

import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';

import type { OwnershipConfig } from './IndirectOwnership.internal.types';

/**
 * Beneficial Owner status based on OpenAPI Party data
 */
export type BeneficialOwnerStatus = 'COMPLETE' | 'PENDING_HIERARCHY' | 'ERROR';

/**
 * Extended Party interface for beneficial ownership display
 */
export interface BeneficialOwner
  extends Pick<
    PartyResponse,
    | 'id'
    | 'parentPartyId'
    | 'partyType'
    | 'profileStatus'
    | 'active'
    | 'individualDetails'
    | 'organizationDetails'
  > {
  /** Type of ownership relationship */
  ownershipType: 'DIRECT' | 'INDIRECT';

  /** Current completion status derived from profileStatus */
  status: BeneficialOwnerStatus;

  /** Convenience properties for display - derived from individualDetails */
  firstName?: string;
  lastName?: string;

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

// Internal types moved to IndirectOwnership.internal.types.ts

/**
 * Props for the IndirectOwnership component - Public API
 */
export interface IndirectOwnershipProps extends UserTrackingProps {
  /** Client data from OpenAPI response */
  client?: ClientResponse;

  /** Callback when ownership structure is completed */
  onOwnershipComplete?: (owners: BeneficialOwner[]) => void;

  /** Callback for real-time validation updates */
  onValidationChange?: (summary: ValidationSummary) => void;

  /** Configuration options */
  config?: Partial<OwnershipConfig>;

  /** Read-only mode */
  readOnly?: boolean;

  /** Custom styling classes */
  className?: string;

  /** Test ID for testing */
  testId?: string;
}

// Internal constants, structures, and event types moved to IndirectOwnership.internal.types.ts
