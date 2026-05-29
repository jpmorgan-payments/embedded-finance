/**
 * Internal types for IndirectOwnership component implementation
 * These types are not part of the public API and should not be exported from index.ts
 */

import {
  BeneficialOwner,
  OwnershipHierarchy,
  ValidationSummary,
} from './IndirectOwnership.types';

/**
 * Configuration for ownership management - Internal use only
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
 * Validation messages for different scenarios - Internal constants
 */
export const VALIDATION_MESSAGES = {
  pendingHierarchy:
    "Ownership hierarchy required - click 'Build Ownership Hierarchy' to continue",
  invalidHierarchy:
    "Ownership hierarchy has errors - click 'Edit Hierarchy' to fix",
  belowThreshold: 'Owner must have 25% or more beneficial ownership',
  duplicateName: 'Owner with this name already exists',
  missingRequired: 'First name and last name are required',
  noOwners: 'At least one beneficial owner is required',
  maxOwnersReached: 'Maximum number of owners reached',
  hierarchyTooDeep: 'Ownership hierarchy exceeds maximum allowed levels',
  circularOwnership:
    'Circular ownership detected - owner cannot own themselves',
  invalidCompanyName: 'Company name is required and must be valid',
  missingBusinessBeingOnboarded:
    'Hierarchy must end at the Business Being Onboarded',
} as const;

/**
 * Complete ownership structure - Internal state management
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
 * Event types for ownership management - Internal event system
 */
export type OwnershipEvent =
  | { type: 'OWNER_ADDED'; payload: BeneficialOwner }
  | { type: 'OWNER_UPDATED'; payload: BeneficialOwner }
  | { type: 'OWNER_REMOVED'; payload: string }
  | {
      type: 'HIERARCHY_BUILT';
      payload: { ownerId: string; hierarchy: OwnershipHierarchy };
    }
  | {
      type: 'HIERARCHY_CONFIRMED';
      payload: { ownerId: string; hierarchy: OwnershipHierarchy };
    }
  | { type: 'VALIDATION_UPDATED'; payload: ValidationSummary }
  | { type: 'OWNERSHIP_COMPLETED'; payload: BeneficialOwner[] };
