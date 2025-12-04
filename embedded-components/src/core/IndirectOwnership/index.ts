/**
 * IndirectOwnership - Public API
 */

// Main component
export { IndirectOwnership } from './IndirectOwnership';

// Public types only
export type { 
  IndirectOwnershipProps, 
  BeneficialOwner, 
  ValidationSummary,
  OwnershipHierarchy,
  HierarchyStep 
} from './IndirectOwnership.types';

// ❌ DON'T export internals:
// - Hooks, sub-components, utils, constants
