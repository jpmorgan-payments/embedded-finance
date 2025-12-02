# Alternate Indirect Ownership Requirements

## Overview

This document outlines the requirements for an alternate approach to the IndirectOinterface AlternateBeneficialOwner {
  id: string;
  firstName: string;
  lastName: string;
  ownershipType: 'DIRECT' | 'INDIRECT' | 'PENDING_CLASSIFICATION';
  hierarchyChain?: AlternateOwnershipHierarchyStep[];
  owns25PercentOfKycCompany: true; // Always true - qualifies as beneficial owner of the KYC company
}component that prioritizes beneficial owner identification first, then hierarchy construction. This approach is designed for scenarios where users know their beneficial owners but need guidance building the corporate hierarchy.

## Current vs Alternate Approach

### Current Approach (Existing Component)
- Start with root company
- Build hierarchy top-down (company → subsidiaries → owners)
- Classification happens automatically during tree construction
- Two-tab view: Full Structure + Beneficial Owners

### Alternate Approach (New Story)
- **Start with beneficial owners first** 
- Ask for each owner: "Is this a direct or indirect owner?"
- If indirect: Build the ownership chain from owner back to root company
- Bottom-up hierarchy construction (owner → intermediate entities → root)

## Key Ownership Principle

**The 25% threshold applies ONLY to the final ownership in the KYC company, not at each intermediate level.**

Examples:
- **Direct**: John Smith owns 30% of ABC Corp (KYC company) ✅
- **Indirect**: Jane Doe owns 100% of XYZ Holdings, which owns 25% of ABC Corp (KYC company) ✅
- **Multi-level Indirect**: Mike Johnson owns 51% of Johnson Investments, which owns 100% of Investment Holdings, which owns 26% of ABC Corp (KYC company) ✅

The intermediate ownership percentages (51%, 100% in the example above) can be any amount - only the final ownership in the company undergoing KYC must meet the 25% beneficial ownership threshold.

## User Journey Flow

### Step 1: Beneficial Owner Collection
```
┌─────────────────────────────────────────┐
│ "Who are your beneficial owners?"       │
│                                         │
│ Add Individual Owner:                   │
│ ┌─────────────────────────────────────┐ │
│ │ First Name: [John        ]          │ │
│ │ Last Name:  [Smith       ]          │ │
│ │                                     │ │
│ │ [Add Owner] [Remove] [Next Step]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Current Owners:                         │
│ • John Smith                            │
│ • Jane Doe                              │
│ • Michael Johnson                       │
└─────────────────────────────────────────┘
```

### Step 2: Ownership Classification
For each beneficial owner, ask:
```
┌─────────────────────────────────────────┐
│ How does John Smith own 25%+ of         │
│ [Your Company Name]?                    │
│                                         │
│ ○ Direct Owner                          │
│   (Owns 25%+ shares directly)           │
│                                         │
│ ○ Indirect Owner                        │
│   (Owns 25%+ through other companies)   │
│                                         │
│ [Back] [Continue]                       │
└─────────────────────────────────────────┘
```

### Step 3: Hierarchy Construction (For Indirect Owners)
```
┌─────────────────────────────────────────┐
│ Build ownership chain for John Smith    │
│ (Who owns 25%+ of [Your Company])       │
│                                         │
│ John Smith directly owns:               │
│ ┌─────────────────────────────────────┐ │
│ │ Company Name: [Smith Holdings LLC ] │ │
│ │ (Any ownership %)                    │ │
│ │ Add Company                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Smith Holdings LLC owns:                │
│ ┌─────────────────────────────────────┐ │
│ │ Company Name: [Your Company Name  ] │ │
│ │ Ownership: 25% or more ✓             │ │
│ │ ○ This is the KYC company           │ │
│ │ ○ Add another level up              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Back] [Continue]                       │
└─────────────────────────────────────────┘
```

### Step 4: Validation & Review
```
┌─────────────────────────────────────────┐
│ Review Ownership Structure              │
│ KYC Company: Your Company Name          │
│                                         │
│ Beneficial Owners (25%+ of Your Co):    │
│ ├─ John Smith (Direct - 30% of Your Co) │
│ ├─ Jane Doe → ABC Corp (35% of Your Co) │
│ └─ Mike Johnson → Smith Holdings LLC     │
│    └─ (25% of Your Company)             │
│                                         │
│ ✓ 3 Beneficial owners identified        │
│ ✓ All meet 25%+ threshold in KYC co.   │
│                                         │
│ [Add More Owners] [Edit] [Complete]     │
└─────────────────────────────────────────┘
```

## Technical Requirements

### New Components Needed

#### 1. `AlternateBeneficialOwnerForm`
- Individual owner entry form
- List management (add/remove owners)
- Validation for required fields

#### 2. `OwnershipTypeSelector`
- Radio buttons for Direct/Indirect classification
- Per-owner selection
- Progress tracking

#### 3. `HierarchyBuilder`
- Dynamic form for building ownership chains
- Company-to-company relationship mapping
- KYC company identification (where 25%+ threshold applies)
- "Add level" vs "This is the KYC company" decision

#### 4. `AlternateOwnershipReview`
- Visual representation of built hierarchy
- Validation summary
- Edit capabilities
- Completion confirmation

### Data Structure Changes

#### New Types for Alternate Flow
```typescript
interface AlternateBeneficialOwner {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  ownershipType: 'DIRECT' | 'INDIRECT' | 'PENDING_CLASSIFICATION';
  hierarchyChain?: OwnershipHierarchyStep[];
  owns25PercentOfKycCompany: true; // Always true - qualifies as beneficial owner of the KYC company
}

interface OwnershipHierarchyStep {
  id: string;
  companyName: string;
  isKycCompany: boolean; // True if this is the company undergoing KYC
  isRootCompany: boolean; // True if this is the ultimate parent
  level: number; // 0 = beneficial owner, 1+ = intermediate companies
  // Note: 25%+ threshold applies only to the final KYC company ownership
}

interface AlternateOwnershipState {
  rootCompanyName?: string;
  beneficialOwners: AlternateBeneficialOwner[];
  currentStep: 'OWNERS' | 'CLASSIFICATION' | 'HIERARCHY' | 'REVIEW';
  currentOwnerIndex: number;
  validationErrors: string[];
  isComplete: boolean;
}
```

### Component Props
```typescript
interface AlternateIndirectOwnershipProps {
  /** Root company name (can be pre-filled or determined during flow) */
  rootCompanyName?: string;
  
  /** Callback when ownership structure is completed */
  onOwnershipComplete?: (ownershipStructure: AlternateOwnershipStructure) => void;
  
  /** Callback for step navigation */
  onStepChange?: (step: string, ownerIndex: number) => void;
  
  /** Initial beneficial owners (if any) */
  initialBeneficialOwners?: AlternateBeneficialOwner[];
  
  /** Whether to auto-advance through steps */
  autoAdvance?: boolean;
  
  /** Maximum ownership levels allowed */
  maxHierarchyLevels?: number;
  
  /** Read-only mode */
  readOnly?: boolean;
}
```

## Implementation Plan

### Phase 1: Core Components (Week 1)
1. Create `AlternateBeneficialOwnerForm` component
2. Implement basic owner collection with add/remove
3. Add form validation
4. Create initial Storybook story

### Phase 2: Classification Flow (Week 1-2)
1. Create `OwnershipTypeSelector` component
2. Implement step navigation logic
3. Add per-owner classification tracking
4. Update state management

### Phase 3: Hierarchy Builder (Week 2)
1. Create `HierarchyBuilder` component
2. Implement dynamic company chain building
3. Add KYC company threshold validation (25%+ requirement at final level only)
4. Handle KYC company identification and validation

### Phase 4: Review & Integration (Week 2-3)
1. Create `AlternateOwnershipReview` component
2. Add visual hierarchy representation
3. Implement edit capabilities
4. Create comprehensive validation

### Phase 5: Testing & Polish (Week 3)
1. Add comprehensive unit tests
2. Create multiple Storybook scenarios
3. Add MSW mocks for API integration
4. Performance optimization and accessibility

## File Structure

```
embedded-components/src/core/IndirectOwnership/
├── stories/
│   ├── IndirectOwnership.story.tsx          # Existing
│   └── AlternateIndirectOwnership.story.tsx # New - "Alternate" story
├── components/
│   ├── AlternateBeneficialOwnerForm/
│   │   ├── index.ts
│   │   ├── AlternateBeneficialOwnerForm.tsx
│   │   ├── AlternateBeneficialOwnerForm.test.tsx
│   │   └── types.ts
│   ├── OwnershipTypeSelector/
│   │   ├── index.ts
│   │   ├── OwnershipTypeSelector.tsx
│   │   ├── OwnershipTypeSelector.test.tsx
│   │   └── types.ts
│   ├── HierarchyBuilder/
│   │   ├── index.ts
│   │   ├── HierarchyBuilder.tsx
│   │   ├── HierarchyBuilder.test.tsx
│   │   └── types.ts
│   └── AlternateOwnershipReview/
│       ├── index.ts
│       ├── AlternateOwnershipReview.tsx
│       ├── AlternateOwnershipReview.test.tsx
│       └── types.ts
├── hooks/
│   ├── useAlternateOwnership.ts
│   ├── useAlternateOwnership.test.tsx
│   ├── useHierarchyBuilder.ts
│   └── useHierarchyBuilder.test.tsx
├── utils/
│   ├── alternateOwnershipValidation.ts
│   ├── alternateOwnershipValidation.test.ts
│   ├── hierarchyValidation.ts
│   └── hierarchyValidation.test.ts
└── mocks/
    ├── alternateOwnershipMocks.ts
    └── hierarchyBuilderMocks.ts
```

## Story Configuration

The new story will be added to the existing `IndirectOwnership.story.tsx` file:

```typescript
export const Alternate: Story = {
  name: 'Alternate - Beneficial Owner First',
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'alternate-ownership-client-001',
    mode: 'ALTERNATE', // New prop to switch modes
    showVisualization: true,
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
          Alternative approach to indirect ownership where users:
          1. First identify all beneficial owners
          2. Classify each as direct or indirect
          3. Build hierarchy chains for indirect owners
          4. Review complete ownership structure
          
          This approach is ideal when users know their beneficial owners
          but need guidance constructing the corporate hierarchy.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('*/clients/alternate-ownership-client-001', () => {
          return HttpResponse.json(efClientEmptyOwnership);
        }),
      ],
    },
  },
};
```

## Validation Requirements

### Owner Validation
- Required: firstName, lastName
- Duplicate detection (same name combinations)
- Minimum 1 owner, maximum reasonable limit

### Hierarchy Validation
- Each intermediate company must have a name
- Final ownership in KYC company must meet 25%+ threshold
- Ownership chain must lead to the KYC company being onboarded
- No circular ownership references
- Intermediate ownership percentages can be any amount (not restricted to 25%+)

### Business Logic Validation
- Beneficial ownership threshold confirmation (≥25% of final KYC company only)
- Maximum hierarchy depth limits
- Required documentation alerts
- Compliance requirement notifications

## User Experience Considerations

### Progressive Disclosure
- Show only relevant fields at each step
- Clear progress indicators
- Ability to go back and edit previous steps

### Error Handling
- Inline validation with helpful messages
- Clear error states with recovery suggestions
- Bulk validation at step completion

### Accessibility
- Keyboard navigation through forms
- Screen reader compatible labels
- High contrast error states
- Focus management during step transitions

### Mobile Optimization
- Touch-friendly form controls
- Responsive layout for small screens
- Appropriate input types for mobile keyboards

## Testing Strategy

### Unit Tests
- Component rendering with various props
- Form validation logic
- State management transitions
- Hierarchy calculation utilities

### Integration Tests
- Complete user flow scenarios
- API integration points
- Error handling paths
- Cross-component data flow

### Storybook Scenarios
- Empty state (no owners)
- Single direct owner
- Multiple direct owners
- Single indirect owner (2-level hierarchy)
- Complex multi-level hierarchies
- Validation error states
- Read-only mode

## Success Metrics

### Usability Metrics
- Time to complete ownership structure: < 8 minutes
- User error rate: < 5% validation errors
- Task completion rate: > 95%
- User satisfaction: > 4.2/5

### Technical Metrics
- Component load time: < 200ms
- Form submission time: < 1 second
- Memory usage: < 50MB for complex hierarchies
- Test coverage: > 90%

## Future Enhancements

### Phase 2 Enhancements
- Import from CSV/Excel
- Ownership structure templates
- Automated compliance checking
- Integration with external corporate databases

### Advanced Features
- Visual hierarchy diagram
- Ownership threshold verification tools
- Multi-company root scenarios
- Historical ownership tracking

## API Integration

The alternate flow will use the same SMBDO APIs but construct the party relationships in reverse:

1. Create individual beneficial owners first
2. Create intermediate companies as needed
3. Link ownership relationships bottom-up
4. Validate complete structure before submission

This approach maintains API compatibility while providing a fundamentally different user experience optimized for scenarios where beneficial owners are known upfront.
