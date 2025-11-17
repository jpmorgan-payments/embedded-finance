import type React from 'react';

import {
  ClientResponse,
  PartyResponse,
  PartyType,
  Role,
} from '@/api/generated/smbdo.schemas';

/**
 * Props for the IndirectOwnership component
 */
export interface IndirectOwnershipComponentProps {
  /** The client ID for which to manage ownership structure */
  clientId?: string;

  /** Callback when ownership structure is updated */
  onOwnershipStructureUpdate?: (
    ownershipData?: OwnershipStructure,
    error?: any
  ) => void;

  /** Whether to show the ownership visualization tree */
  showVisualization?: boolean;

  /** Maximum depth of ownership hierarchy to display */
  maxDepth?: number;

  /** Optional trigger button to open the component */
  triggerButton?: React.ReactNode;

  /** Initial ownership data to populate the component */
  initialOwnershipData?: OwnershipStructure;

  /** Whether the component is in read-only mode */
  readOnly?: boolean;
}

/**
 * Represents the complete ownership structure for a client
 */
export interface OwnershipStructure {
  clientId: string;
  rootParty: OwnershipParty;
  ownershipChain: OwnershipLevel[];
  ultimateBeneficialOwners: IndividualOwner[];
  validationStatus: OwnershipValidationStatus;
}

/**
 * Represents a single level in the ownership hierarchy
 */
export interface OwnershipLevel {
  depth: number;
  parties: OwnershipParty[];
}

/**
 * Extended party information for ownership context
 */
export interface OwnershipParty extends Omit<PartyResponse, 'roles'> {
  roles: Role[];
  ownershipType: 'DIRECT' | 'INDIRECT';
  children: OwnershipParty[];
  ultimateBeneficialOwner?: IndividualOwner;
}

/**
 * Individual person who is an ultimate beneficial owner
 */
export interface IndividualOwner {
  partyId: string;
  firstName: string;
  lastName: string;
  ownershipPath: OwnershipPathStep[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
}

/**
 * Step in the ownership path from root to individual
 */
export interface OwnershipPathStep {
  entityName: string;
  entityId: string;
  relationship: string;
}

/**
 * Validation status for the ownership structure
 */
export interface OwnershipValidationStatus {
  isValid: boolean;
  errors: OwnershipValidationError[];
  warnings: OwnershipValidationWarning[];
  completionLevel: 'INCOMPLETE' | 'PARTIAL' | 'COMPLETE';
}

/**
 * Validation error in ownership structure
 */
export interface OwnershipValidationError {
  code: string;
  message: string;
  partyId?: string;
  severity: 'ERROR' | 'WARNING';
}

/**
 * Validation warning in ownership structure
 */
export interface OwnershipValidationWarning {
  code: string;
  message: string;
  partyId?: string;
  recommendation?: string;
}

/**
 * Form data for creating/editing entities in ownership structure
 */
export interface OwnershipEntityFormData {
  partyType: PartyType;
  parentPartyId?: string;

  // Organization details
  organizationName?: string;
  organizationType?: string;
  countryOfFormation?: string;

  // Individual details
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;

  // Common
  roles: Role[];
  address?: {
    addressLine1: string;
    city: string;
    state?: string;
    postalCode: string;
    countryCode: string;
  };
}

/**
 * Configuration for ownership visualization
 */
export interface OwnershipVisualizationConfig {
  showRoles: boolean;
  highlightUltimateOwners: boolean;
  expandDepth: number;
  theme: 'light' | 'dark';
}

// Re-export relevant types from API
export type { ClientResponse, PartyResponse, Role, PartyType };
