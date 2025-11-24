# Indirect Ownership Validation Error Scenarios

This document describes the validation error scenarios and their corresponding Storybook stories for the `IndirectOwnership` component.

## Overview

The `IndirectOwnership` component includes comprehensive validation to ensure beneficial ownership structures comply with regulatory requirements. There are two main validation rules:

1. **Entity Completeness Validation**: All entities must have identified beneficial owners
2. **Mathematical Limit Validation**: Maximum of 4 beneficial owners (due to 25% minimum ownership requirement)

## Validation Rules

### 1. Incomplete Beneficial Ownership (`INCOMPLETE_BENEFICIAL_OWNERSHIP`)

**Rule**: Every entity node (`partyType: 'ORGANIZATION'` with `roles: ['BENEFICIAL_OWNER']`) must have at least one individual child (`partyType: 'INDIVIDUAL'`).

**Rationale**: Regulatory compliance requires identifying the natural persons who ultimately own or control entities. Entities cannot be "dead ends" in the ownership chain.

**Visual Indicators**:

- 🟠 Orange border around problematic entities
- 🟠 Orange "Needs Individual Owner" badge
- ❌ Red error alert explaining the issue
- 🚫 Form submission blocked until resolved

### 2. Too Many Beneficial Owners (`TOO_MANY_BENEFICIAL_OWNERS`)

**Rule**: Cannot have more than 4 individuals with `partyType: 'INDIVIDUAL'` and `roles: ['BENEFICIAL_OWNER']`.

**Rationale**: Mathematical impossibility - if each beneficial owner must own ≥25% of the entity, then 5 owners would require 5 × 25% = 125% ownership (impossible).

**Visual Indicators**:

- 🚫 Disabled "Add Individual Owner" buttons
- ⚠️ Warning text: "Maximum of 4 beneficial owners reached"
- ❌ Red error alert explaining the mathematical constraint
- 🚫 Form submission blocked until resolved

## Mock Data Files

### Individual Error Scenarios

| Mock File                             | Purpose                         | Validation Error | Description                                    |
| ------------------------------------- | ------------------------------- | ---------------- | ---------------------------------------------- |
| `efClientIncompleteOwnership.mock.ts` | INCOMPLETE_BENEFICIAL_OWNERSHIP | ✅               | 2 entities without individual children         |
| `efClientTooManyOwners.mock.ts`       | TOO_MANY_BENEFICIAL_OWNERS      | ✅               | 5 individual beneficial owners (exceeds limit) |
| `efClientRemovalTest.mock.ts`         | Removal Testing                 | ❌               | Clean structure for testing removal scenarios  |

### Combined Scenario

| Mock File                                  | Purpose     | Validation Errors           | Description                                       |
| ------------------------------------------ | ----------- | --------------------------- | ------------------------------------------------- |
| `efClientMultipleValidationErrors.mock.ts` | Both errors | ✅ INCOMPLETE + ✅ TOO_MANY | Worst-case scenario with both validation failures |

## Storybook Stories

### Error Scenario Stories

| Story Name                           | Mock Data                          | Purpose                                                          |
| ------------------------------------ | ---------------------------------- | ---------------------------------------------------------------- |
| `ValidationErrorIncompleteOwnership` | `efClientIncompleteOwnership`      | Demo entities without beneficial owners                          |
| `ValidationErrorTooManyOwners`       | `efClientTooManyOwners`            | Demo mathematical limit violation                                |
| `ValidationErrorMultipleIssues`      | `efClientMultipleValidationErrors` | Demo both errors simultaneously                                  |
| `NodeRemovalTesting`                 | `efClientRemovalTest`              | Demo enhanced removal functionality for individuals and entities |

### Usage in Storybook

1. **Navigate to**: `Core/IndirectOwnership` in Storybook
2. **Select Story**: Choose any of the validation error stories
3. **Observe**: Error indicators, disabled states, and warning messages
4. **Test**: Try to submit the form (should be blocked)
5. **Verify**: All visual feedback is clear and helpful

## Testing Guidelines

### Manual Testing Checklist

**For Incomplete Beneficial Ownership**:

- [ ] Red error alert appears with clear message
- [ ] Problematic entities have orange borders
- [ ] "Needs Individual Owner" badges are visible
- [ ] Form submission shows alert and is blocked
- [ ] Visual feedback is consistent across mobile/desktop

**For Too Many Beneficial Owners**:

- [ ] Red error alert explains mathematical constraint
- [ ] "Add Individual Owner" buttons are disabled
- [ ] Warning text shows "Maximum of 4 beneficial owners reached"
- [ ] Form submission shows alert and is blocked
- [ ] Owner type selection shows limit messaging

**For Multiple Issues**:

- [ ] Multiple error messages appear in alert
- [ ] All validation indicators work simultaneously
- [ ] No visual conflicts between different error types
- [ ] Component remains usable despite multiple errors

**For Node Removal**:

- [ ] Delete buttons appear on all removable parties with red styling
- [ ] Delete button is hidden for root client entity only
- [ ] Individual removal works for any individual (including last in entity)
- [ ] Removing last individual from entity shows orphan warning dialog
- [ ] Entity removal includes cascade warning dialog
- [ ] Confirmation dialog shows different messaging for individuals vs entities
- [ ] Successful deletion removes party and all descendants
- [ ] Tree structure updates immediately after deletion
- [ ] Validation errors are recalculated after deletion (showing incomplete ownership warnings)
- [ ] Can remove all individuals from entities (triggers validation warning as expected)

### Automated Testing

The validation logic is implemented in:

- `validateOwnershipStructure()` function
- `canAddMoreOwners()` helper function
- `canDeleteParty()` deletion validation function
- `handleDeleteOwner()` and `confirmDeleteOwner()` removal functions

Test scenarios should cover:

- Empty ownership structure (no errors)
- Single validation errors
- Multiple validation errors
- Edge cases (exactly 4 owners, single entity without children)
- Node removal with cascade deletion
- Individual removal creating orphaned entities (shows warnings)
- Entity removal with descendants
- Root client deletion protection
- Validation system response to removal actions

## Node Removal Functionality

### Remove Owner Feature

The IndirectOwnership component includes the ability to remove ownership nodes with proper validation and cascading deletion:

**Remove Button Availability**:

- 🗑️ Delete buttons appear on all removable parties with red styling
- 🚫 Root client entity cannot be removed (no delete button)
- ✅ All individuals can be removed (including last individual in entity)
- ✅ Entire entities can be removed (with cascade deletion)
- ⚠️ Confirmation dialog shows warnings for orphaned entities and cascade deletion

**Deletion Rules**:

- **Cannot delete root client**: The CLIENT entity cannot be removed
- **Individual removal**: Can remove individuals from entities (if siblings exist)
- **Entity removal**: Can remove entire entities (cascade deletes all descendants)
- **Flexible removal**: Can remove last individual from entity (triggers validation warning)
- **Cascade deletion**: Removing a party also removes all its descendants
- **Validation feedback**: Deletions that create incomplete beneficial ownership show warnings
- **Confirmation required**: User must confirm deletion through contextual dialog with warnings

**Visual Indicators**:

- 🗑️ Red delete buttons with trash icons (hover effects)
- 🚫 Hidden delete buttons only for root client entity
- ⚠️ Contextual confirmation dialogs (different messaging for individuals vs entities)
- ⚠️ Cascade warning when removing entities with children
- 🟠 Orphan warning when removing last individual from entity
- 📄 Entity/individual preview showing what will be deleted
- 🔄 Immediate tree structure updates after deletion

### Deletion Validation Logic

```typescript
const canDeleteParty = (party: any): boolean => {
  // Cannot delete the root client entity
  if (party.roles?.includes('CLIENT')) return false;

  // For individuals: Always allow deletion (validation system will handle warnings for empty entities)
  if (party.partyType === 'INDIVIDUAL') {
    return true;
  }

  // For entities: Standard validation for cascade deletion
  if (party.partyType === 'ORGANIZATION') {
    if (party.parentPartyId) {
      const parent = currentOwnershipData?.parties?.find(
        (p) => p.id === party.parentPartyId
      );
      if (parent) {
        const siblings =
          currentOwnershipData?.parties?.filter(
            (p) => p.parentPartyId === party.parentPartyId && p.id !== party.id
          ) || [];

        // If this is the only child of a beneficial owner entity, cannot delete
        if (
          parent.roles?.includes('BENEFICIAL_OWNER') &&
          parent.partyType === 'ORGANIZATION' &&
          siblings.length === 0
        ) {
          return false;
        }
      }
    }
  }

  return true;
};
```

## Developer Notes

### Validation Function Structure

```typescript
const validateOwnershipStructure = () => {
  const errors: Array<{ type: string; message: string; partyId?: string }> = [];

  // Rule 1: Entity completeness
  entities.forEach(entity => {
    const hasIndividualChildren = /* check logic */;
    if (!hasIndividualChildren) {
      errors.push({
        type: 'INCOMPLETE_BENEFICIAL_OWNERSHIP',
        message: `${entityName} does not have identified beneficial owners`,
        partyId: entity.id
      });
    }
  });

  // Rule 2: Mathematical limit
  if (individuals.length > 4) {
    errors.push({
      type: 'TOO_MANY_BENEFICIAL_OWNERS',
      message: `Cannot have more than 4 beneficial owners (currently ${individuals.length}). Each must own at least 25%.`,
    });
  }

  return errors;
};
```

### Adding New Validation Rules

To add new validation rules:

1. **Add logic** to `validateOwnershipStructure()` function
2. **Create mock data** that triggers the new rule
3. **Add Storybook story** to demonstrate the error
4. **Update visual indicators** as needed
5. **Document the new rule** in this file

## Regulatory Context

These validation rules ensure compliance with:

- **Beneficial Ownership Rules**: Requirement to identify natural persons
- **25% Ownership Threshold**: Standard threshold for beneficial ownership reporting
- **Complete Ownership Chains**: No "gaps" in ownership identification

The validation helps prevent:

- Incomplete onboarding due to missing information
- Regulatory compliance failures
- Mathematical inconsistencies in ownership percentages
