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

| Mock File | Purpose | Validation Error | Description |
|-----------|---------|------------------|-------------|
| `efClientIncompleteOwnership.mock.ts` | INCOMPLETE_BENEFICIAL_OWNERSHIP | ✅ | 2 entities without individual children |
| `efClientTooManyOwners.mock.ts` | TOO_MANY_BENEFICIAL_OWNERS | ✅ | 5 individual beneficial owners (exceeds limit) |

### Combined Scenario

| Mock File | Purpose | Validation Errors | Description |
|-----------|---------|-------------------|-------------|
| `efClientMultipleValidationErrors.mock.ts` | Both errors | ✅ INCOMPLETE + ✅ TOO_MANY | Worst-case scenario with both validation failures |

## Storybook Stories

### Error Scenario Stories

| Story Name | Mock Data | Purpose |
|------------|-----------|---------|
| `ValidationErrorIncompleteOwnership` | `efClientIncompleteOwnership` | Demo entities without beneficial owners |
| `ValidationErrorTooManyOwners` | `efClientTooManyOwners` | Demo mathematical limit violation |
| `ValidationErrorMultipleIssues` | `efClientMultipleValidationErrors` | Demo both errors simultaneously |

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

### Automated Testing

The validation logic is implemented in:
- `validateOwnershipStructure()` function
- `canAddMoreOwners()` helper function

Test scenarios should cover:
- Empty ownership structure (no errors)
- Single validation errors
- Multiple validation errors
- Edge cases (exactly 4 owners, single entity without children)

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
