# Plan: Add Business Entity Owner Option

Add initial entity type selection in the Add Owner flow, enabling users to add either individual beneficial owners OR business entity owners. Display them in separate sections with counts, supporting direct/indirect ownership, editable chains, and allowing completion with zero individuals.

## Steps

1. **Add entity type selection as first question** in AddOwnerDialog component in [`IndirectOwnership.tsx`](c:\Users\U875697\ds\projects\oss\embedded-finance\embedded-components\src\core\IndirectOwnership\IndirectOwnership.tsx) (lines 828-1000)—show radio buttons: "Individual person" or "Business entity" before capturing any names.

2. **Create conditional form variants** based on entity type—if "Individual", show First Name, Last Name, Direct/Indirect; if "Business entity", show Business Name field (required), Direct/Indirect—separate validation: prevent duplicate individuals (by name), prevent duplicate business names independently.

3. **Create party objects with correct type** based on selection—individuals: `partyType: "INDIVIDUAL"`, `roles: ["BENEFICIAL_OWNER"]`; businesses: `partyType: "ORGANIZATION"`, `roles: []`, both with `parentPartyId` set per Direct/Indirect selection.

4. **Split owner list into two sections** when owners exist—show single empty state when no owners of either type, otherwise display "Individual Beneficial Owners (n)" section (user icons) and "Business Entity Owners (n)" section (building icons) with counts in headings.

5. **Update HierarchyBuilder** to display business name or individual name at chain start based on `partyType`, maintaining identical hierarchy building flow and chain visualization styling for both entity types.

6. **Update completion validation** and add light transformation logic for business entities—count both entity types toward total, allow completion with zero individuals, ensure business entities transform to API format with `partyType: "ORGANIZATION"` and `roles: []`.

## Requirements Summary

### Entity Type Selection

- First question in Add Owner dialog
- Radio options: "Individual person" | "Business entity"
- Controls which form fields appear

### Form Variants

- **Individual**: First Name, Last Name, Direct/Indirect ownership type
- **Business Entity**: Business Name, Direct/Indirect ownership type
- Both variants share same dialog, same submit handler

### Validation Rules

- **Individuals**: Prevent duplicate names (first + last)
- **Business Entities**: Prevent duplicate business names
- Separate validation scopes (business name can match individual name)
- No additional validation beyond required fields

### Data Structure

- **Individual Party**: `partyType: "INDIVIDUAL"`, `roles: ["BENEFICIAL_OWNER"]`
- **Business Party**: `partyType: "ORGANIZATION"`, `roles: []` (empty array)
- Both use `parentPartyId` for Direct/Indirect (null = direct, value = indirect)

### UI Display

- **Empty State**: Single empty state when no owners of either type
- **With Owners**: Split into two sections
  - "Individual Beneficial Owners (n)" - user icons
  - "Business Entity Owners (n)" - building icons
- No additional badges, rely on section headings and icons for differentiation
- Same card styling for both types

### Hierarchy Builder

- Supports both entity types as root of chain
- Display business name OR individual name at start
- Identical flow and visualization for both types
- Full edit/delete functionality for both types

### Completion

- Can complete with zero individuals (only business entities)
- Both entity types count toward total owner count
- Both entity types count toward completion percentage
- All owners must have status: COMPLETE

### API Transformation

- Light transformation logic
- Business entities: `partyType: "ORGANIZATION"`, `roles: []`
- Individuals: existing logic unchanged
- Both include proper `parentPartyId` relationships
