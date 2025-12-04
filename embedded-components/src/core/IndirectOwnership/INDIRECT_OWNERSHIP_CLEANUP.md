# Indirect Ownership Cleanup Plan

## Overview

We have decided to standardize on the **Streamlined Flow** as the single IndirectOwnership component implementation. This cleanup will remove all previous iterations and simplify the component architecture while retaining only the streamlined approach with three key stories: Default, Empty State, and Error State.

**Key Alignment:** This cleanup will align the component with the 2025 Architecture Pattern outlined in `ARCHITECTURE.md`, implementing individual hook/util files, proper type colocation, and eliminating aggregation barrels.

## Current State Analysis

### Existing Stories (to be cleaned up)
1. `Default` - Original complex ownership structure
2. `EmptyState` - Original empty state
3. `InformationRequested` - Original information requested state  
4. `ReadOnly` - Original read-only mode
5. `ValidationErrorIncompleteOwnership` - Original validation errors
6. `ValidationErrorTooManyOwners` - Original validation errors
7. `ValidationErrorMultipleIssues` - Original validation errors
8. `NodeRemovalTesting` - Original removal testing
9. `Alternate` - First approach (beneficial owner first)
10. `StreamlinedFlow` - **KEEP** - Final implementation (currently named AlternateV2)

### Components to Remove
- `AlternateIndirectOwnership.tsx` - First implementation
- `AlternateBeneficialOwnerForm/` - First form components
- `HierarchyBuilder/` - First hierarchy builder
- `HierarchyBuilding/` - First hierarchy building
- `HierarchyConfirmation/` - First confirmation
- `OwnershipTypeSelector/` - First type selector
- `ValidationSummary/` - First validation
- Original `IndirectOwnership.tsx` component with mode switching

### Components to Keep and Rename (Following ARCHITECTURE.md)
- `V2AlternateIndirectOwnership/` → Flat structure as main `IndirectOwnership.tsx`
- `AddOwnerDialog/` - Keep as-is (used by main component)
- `EntityForm/` - Shared component, keep as-is  
- `AlternateOwnershipReview/` → Rename to `OwnershipReview/`
- `OwnershipStructureList/` - Shared component, keep as-is
- `OwnershipTree/` - Shared component, keep as-is

## Cleanup Strategy (Following ARCHITECTURE.md Principles)

### Phase 1: Architecture Alignment & Component Simplification

1. **Remove Mode Switching Concept**
   - Remove `mode` prop from IndirectOwnership component
   - Remove conditional rendering logic for DEFAULT vs modes
   - Eliminate all mode-related types and interfaces

2. **Implement 2025 Architecture Pattern**
   - **Flat structure**: Move to flat component structure (not nested in subdirectory)
   - **Individual hooks**: Split hooks into individual files with colocated tests
   - **Type colocation**: Move types to main `IndirectOwnership.types.ts` (public API only)
   - **No aggregation barrels**: Remove `components/index.ts` aggregation files

3. **Component Consolidation & Naming Standardization**
   - Rename `V2AlternateIndirectOwnership` to `IndirectOwnership.tsx` (flat structure)
   - Remove original `IndirectOwnership.tsx` component with mode switching
   - Remove all V2/Alternate prefixes from all files, types, and interfaces
   - Update all imports and exports accordingly

4. **Remove Deprecated Components**
   - Delete `AlternateIndirectOwnership.tsx`
   - Delete `AlternateBeneficialOwnerForm/` directory
   - Delete `HierarchyBuilder/` directory  
   - Delete `HierarchyBuilding/` directory
   - Delete `HierarchyConfirmation/` directory
   - Delete `OwnershipTypeSelector/` directory
   - Delete `ValidationSummary/` directory

### Phase 2: Stories Simplification

1. **Create New Streamlined Stories**
   - `Default` - Component with sample beneficial owners added
   - `EmptyState` - Component with no owners added yet
   - `ErrorState` - Component showing validation errors

2. **Remove All Legacy Stories**
   - Remove all current stories except the streamlined approach
   - Remove all complex mock data scenarios
   - Remove API mocking setup (component doesn't use direct API calls)

### Phase 3: 2025 Architecture Implementation

1. **Hooks Restructure (Individual Files + Colocated Tests)**
   ```
   hooks/
   ├── useOwnershipState.ts          # Renamed from useV2OwnershipState.ts
   ├── useOwnershipState.test.tsx    # Colocated test
   ├── useRealTimeValidation.ts      # Keep as-is
   ├── useRealTimeValidation.test.tsx # Colocated test
   └── index.ts                      # Barrel export for convenience
   ```

2. **Types Cleanup & Colocation**
   - Move public types to `IndirectOwnership.types.ts` (API only)
   - Remove all V2/Alternate prefixes: `V2BeneficialOwner` → `BeneficialOwner`
   - Keep internal types colocated in component/hook files
   - Update all type imports across the codebase

3. **Component Renaming**
   - `AlternateOwnershipReview/` → `OwnershipReview/`
   - Update all references to `AlternateOwnershipReview` → `OwnershipReview`
   - Remove "Alternate" from all component names and references

4. **Utils Cleanup (If Any)**
   - Review and keep only utils used by main component and shared components
   - Remove utils specific to removed implementations
   - Follow individual file pattern if multiple utils exist

5. **Mocks Cleanup**
   - Remove complex API mock data (efClientComplexOwnership, etc.)
   - Keep only simple data structures needed for stories
   - Component manages state internally, minimal mocking needed

### Phase 4: Documentation & Export Updates

1. **Requirements Documents**
   - Archive legacy requirement documents
   - Update `INDIRECT_OWNERSHIP_REQUIREMENTS.md` to reflect standardized approach
   - Update `VALIDATION_SCENARIOS.md` for current scenarios

2. **Architecture Documentation**
   - Update component diagrams and flows
   - Remove references to mode switching and V2/Alternate naming
   - Document the streamlined approach as the standard

3. **Public API (Following ARCHITECTURE.md)**
   ```typescript
   // IndirectOwnership/index.ts - Minimal, explicit exports
   export { IndirectOwnership } from './IndirectOwnership';
   export type { IndirectOwnershipProps } from './IndirectOwnership.types';
   // ❌ DON'T export internals: hooks, sub-components, utils
   ```

## Target Architecture (2025 Pattern Compliant)

### Directory Structure (Post-Cleanup)
```
IndirectOwnership/
├── index.ts                           # Public API exports only
├── IndirectOwnership.tsx              # Main component (flat structure)
├── IndirectOwnership.test.tsx         # Colocated test
├── IndirectOwnership.types.ts         # Public types ONLY
├── IndirectOwnership.constants.ts     # Constants (if needed)
│
├── hooks/                             # Individual files (flat)
│   ├── useOwnershipState.ts          # Renamed from useV2OwnershipState
│   ├── useOwnershipState.test.tsx    # Colocated test
│   ├── useRealTimeValidation.ts      # Keep as-is
│   ├── useRealTimeValidation.test.tsx # Colocated test
│   └── index.ts                      # Barrel export for convenience
│
├── components/                        # NO index files
│   ├── AddOwnerDialog/
│   │   ├── AddOwnerDialog.tsx
│   │   └── AddOwnerDialog.test.tsx
│   ├── OwnershipReview/              # Renamed from AlternateOwnershipReview
│   │   ├── OwnershipReview.tsx
│   │   └── OwnershipReview.test.tsx
│   └── ... (other shared components)
│
└── stories/
    └── IndirectOwnership.story.tsx
```

### Target Story Structure

After cleanup, we will have exactly 3 stories:

### 1. Default Story
```typescript
export const Default: Story = {
  name: 'Default',
  args: {
    rootCompanyName: 'Central Perk Coffee & Cookies',
    readOnly: false,
    themePreset: 'Salt', // Match LinkedAccountWidget theme
  },
  // Shows component with 2-3 sample beneficial owners already added
  // Demonstrates complete ownership chains with visualization
}
```

### 2. Empty State Story  
```typescript
export const EmptyState: Story = {
  name: 'Empty State',
  args: {
    rootCompanyName: 'Central Perk Coffee & Cookies', 
    readOnly: false,
    themePreset: 'Salt', // Match LinkedAccountWidget theme
  },
  // Shows component with no owners added yet
  // Demonstrates initial state and "Add Owner" workflow
}
```

### 3. Error State Story
```typescript
export const ErrorState: Story = {
  name: 'Error State',
  args: {
    rootCompanyName: 'Central Perk Coffee & Cookies',
    readOnly: false,
    themePreset: 'Salt', // Match LinkedAccountWidget theme
  },
  // Shows component with validation errors
  // Demonstrates error handling and validation messaging
}
```

## Implementation Steps

1. **Create backup branch** - Ensure we can revert if needed
2. **Phase 1: Architecture alignment** - Implement 2025 pattern, remove deprecated components
3. **Phase 2: Naming standardization** - Remove all V2/Alternate references
4. **Phase 3: Stories simplification** - Create new streamlined stories  
5. **Phase 4: Documentation updates** - Reflect new simplified architecture
6. **Phase 5: Export verification** - Ensure all imports work correctly
7. **Phase 6: Testing validation** - Verify all functionality preserved

## Benefits of This Cleanup

1. **Simplified Architecture** - Single component approach eliminates confusion
2. **Better Developer Experience** - Clear, focused API without mode switching  
3. **Reduced Bundle Size** - Elimination of unused code paths
4. **Easier Maintenance** - Single implementation to maintain and test
5. **Clear User Stories** - Three focused stories covering all use cases
6. **Better Performance** - No unnecessary conditional rendering or mode checks

## Risk Mitigation

1. **Backup Strategy** - Create backup branch before starting cleanup
2. **Incremental Approach** - Execute cleanup in phases with testing between each
3. **Export Verification** - Ensure all public exports remain functional
4. **Story Validation** - Test all three new stories thoroughly
5. **Documentation Review** - Update all references and examples

## Post-Cleanup Validation

1. **Storybook Verification** - All three stories render and function correctly
2. **Component API** - Public interface remains clean and focused
3. **Performance Testing** - Verify no performance regressions  
4. **Accessibility Testing** - Ensure a11y standards maintained
5. **Integration Testing** - Verify component works in consuming applications

---

## Key Naming Changes Summary

### Files & Components
- `V2AlternateIndirectOwnership/` → `IndirectOwnership.tsx` (flat structure)
- `AlternateOwnershipReview/` → `OwnershipReview/`
- `useV2OwnershipState.ts` → `useOwnershipState.ts`

### Types & Interfaces (Remove V2/Alternate prefixes)
- `V2BeneficialOwner` → `BeneficialOwner`
- `V2OwnershipState` → `OwnershipState`
- `V2OwnershipConfig` → `OwnershipConfig`
- `V2OwnershipEvent` → `OwnershipEvent`
- `V2AlternateIndirectOwnershipProps` → `IndirectOwnershipProps`
- `UseV2OwnershipStateConfig` → `UseOwnershipStateConfig`

### Other References
- All story names and descriptions mentioning "V2", "Alternate", or "ALTERNATE"
- All comments and documentation references
- Import paths in hook files: `'../components/V2AlternateIndirectOwnership/types'`
- Component export names in `components/index.ts`

---

This cleanup will result in a much cleaner, more maintainable IndirectOwnership component that:
- **Follows 2025 Architecture Pattern** with individual hook files and proper type colocation
- **Uses standardized naming** without V2/Alternate prefixes
- **Focuses exclusively on the proven streamlined approach** with clear, purpose-built stories
- **Implements proper encapsulation** with minimal public API exports
