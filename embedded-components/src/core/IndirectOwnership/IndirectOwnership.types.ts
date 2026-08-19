/**
 * Indirect Ownership Types
 * Public API types for the IndirectOwnership component
 */

import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import {
  ClientResponse,
  PartyResponse,
  Role,
} from '@/api/generated/smbdo.schemas';

import type { OwnershipConfig } from './IndirectOwnership.internal.types';

/**
 * INTERMEDIARY_OWNER is a new role being added to the API but is not yet in
 * the generated schema types. Centralise the cast here so we only have one
 * unsafe cast and the rest of the codebase can import this typed constant.
 *
 * TODO: Remove once the API spec includes INTERMEDIARY_OWNER and types are regenerated.
 */
export const INTERMEDIARY_OWNER_ROLE = 'INTERMEDIARY_OWNER' as unknown as Role;

/**
 * Beneficial Owner status based on OpenAPI Party data
 *
 * - PENDING_HIERARCHY: an indirect owner still needs its intermediary chain.
 * - PENDING_DETAILS: the chain (if any) is in place but the party's own
 *   required details (DOB/address/ID, or org type/EIN/address/country) are
 *   incomplete. Kept distinct from PENDING_HIERARCHY so the two conditions
 *   report the right problem.
 */
export type BeneficialOwnerStatus =
  | 'COMPLETE'
  | 'PENDING_HIERARCHY'
  | 'PENDING_DETAILS'
  | 'ERROR';

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

  /**
   * When true, shows a gating question before the full indirect ownership UI:
   * "Does anyone own 25% or more of your business through other companies?"
   *
   * - "Yes" → reveals the full indirect ownership builder
   * - "No" → calls `onGatingAnswer('direct-only')` so the host can fall back
   *
   * @default false
   */
  showGatingQuestion?: boolean;

  /**
   * Callback when the gating question is answered.
   * - `'direct-only'` — user answered "No" (no indirect owners)
   * - `'has-indirect'` — user answered "Yes" (proceed with indirect UI)
   */
  onGatingAnswer?: (answer: 'direct-only' | 'has-indirect') => void;

  /**
   * Callback when a new owner is submitted from the Add Owner dialog.
   * The host is responsible for creating the party via the API and refreshing
   * client data. If not provided, owners are managed in local component state
   * (standalone/demo mode).
   */
  onAddOwner?: (ownerData: {
    entityType: 'INDIVIDUAL' | 'BUSINESS';
    firstName?: string;
    lastName?: string;
    businessName?: string;
    ownershipType: 'DIRECT' | 'INDIRECT';
  }) => void;

  /**
   * Callback when an owner is removed. The host is responsible for
   * deactivating the party via the API. If not provided, removal is
   * managed in local component state (standalone/demo mode).
   */
  onRemoveOwner?: (ownerId: string) => void;

  /**
   * Callback when a hierarchy chain is saved for an indirect owner.
   * The host is responsible for creating intermediary owner parties via
   * the API (one per hierarchy step) with correct `parentPartyId` chaining.
   *
   * Each step in the array represents an intermediary entity in order from
   * the beneficial owner toward the root business.
   *
   * If not provided, hierarchies are stored in local component state only.
   */
  onSaveHierarchy?: (
    ownerId: string,
    steps: Array<{
      entityName: string;
      ownsRootBusinessDirectly: boolean;
      /**
       * True when this step was chosen from the existing-entities list rather
       * than added as a new company. The host should reuse the existing party
       * instead of creating a duplicate.
       */
      isExistingEntity?: boolean;
      /**
       * Stable party id of the selected existing entity, carried from the
       * chain-builder selection so the host reuses that exact party instead of
       * re-matching by (ambiguous) organization name.
       */
      partyId?: string;
    }>
  ) => void;

  /**
   * Callback when the user clicks "Edit" on an owner card.
   * The host navigates to the detail-collection form for this party.
   */
  onEditOwner?: (ownerId: string) => void;

  /**
   * Callback when the user changes an owner's nature of ownership
   * (Direct <-> Indirect) via the card toggle. The host is responsible for
   * persisting `natureOfOwnership` on the party. When switching to DIRECT,
   * any existing intermediary chain for this owner should be cleared.
   * If not provided, the change is managed in local component state
   * (standalone/demo mode).
   */
  onChangeOwnerNature?: (
    ownerId: string,
    nature: 'DIRECT' | 'INDIRECT'
  ) => void;

  /**
   * Callback when the user attests that no individual or entity owns 25%
   * or more of the business. The host can use this to skip the ownership
   * collection step entirely.
   */
  onNoBeneficialOwners?: (attested: boolean) => void;

  /** Configuration options */
  config?: Partial<OwnershipConfig>;

  /** Read-only mode */
  readOnly?: boolean;

  /**
   * Party ID of the controller/session user. When set, the delete button
   * is hidden for this owner (they cannot remove themselves).
   */
  controllerPartyId?: string;

  /** Custom styling classes */
  className?: string;

  /** Test ID for testing */
  testId?: string;
}

// Internal constants, structures, and event types moved to IndirectOwnership.internal.types.ts
