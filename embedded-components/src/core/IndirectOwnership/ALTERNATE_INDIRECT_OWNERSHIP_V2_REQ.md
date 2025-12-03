# Alternate Indirect Ownership V2 Requirements

## Overview

This document outlines the requirements for Version 2 of the Alternate Indirect Ownership component. This version consolidates the ownership chain building and preview into a single, streamlined interface with real-time validation and dynamic list updates.

## Key Changes from V1

### V1 Approach (Multi-Step)
- Step 1: Collect all beneficial owners
- Step 2: Classify each owner (direct/indirect) 
- Step 3: Build ownership chains separately
- Step 4: Final review of complete structure

### V2 Approach (Consolidated)
- **Single Interface**: Add owners one-by-one with on-demand hierarchy building
- **Dialog-Based**: "Add Individual Owner" opens a dialog for name + ownership type
- **On-Demand Hierarchy Building**: If indirect, user clicks "Build Ownership Hierarchy" button to open separate dialog
- **Real-Time Preview**: Ownership structure updates live as hierarchies are completed
- **Validation Per Hierarchy**: Validate each hierarchy as it's completed

## User Journey Flow

### Main Interface
```
┌─────────────────────────────────────────────────────────┐
│ Who are your beneficial owners?                         │
│                                                         │
│ [+ Add Individual Owner]                [Complete]      │
│                                                         │
│ Current Ownership Structure:                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✓ John Smith (Direct Owner - 25%+ ownership)        │ │
│ │   [Edit] [Remove Owner]                             │ │
│ │                                                     │ │
│ │ ✓ Jane Doe (Indirect Owner)                        │ │
│ │   └─ Jane Doe → ABC Holdings → Central Perk Coffee & Cookies │ │
│ │   [Edit Chain] [Remove Owner]                       │ │
│ │                                                     │ │
│ │ ⚠ Mike Johnson (Indirect - Pending Ownership Hierarchy) │ │
│ │   [Build Ownership Hierarchy] [Remove Owner]           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Validation Status:                                      │
│ • 2 of 3 owners have complete information ⚠            │
│ • 1 indirect owner needs ownership hierarchy            │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Add Owner Dialog
```
┌─────────────────────────────────────────┐
│ Add Beneficial Owner                    │
│                                         │
│ First Name: [John        ]              │
│ Last Name:  [Smith       ]              │
│                                         │
│ Ownership Type:                         │
│ ○ Direct Owner                          │
│   (Has 25% or more ownership directly)  │
│                                         │
│ ○ Indirect Owner                        │
│   (Has 25% or more ownership through    │
│    other companies)                     │
│                                         │
│ [Cancel] [Add Owner]                    │
└─────────────────────────────────────────┘
```

### Step 2: Hierarchy Building Interface (If Indirect)
*Note: Implementation approach is flexible - can be dialog, inline, or integrated flow*

```
┌─────────────────────────────────────────────────────────┐
│ Build Ownership Hierarchy for John Smith                │
│                                                         │
│ John Smith directly owns:                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Company Name: [Smith Holdings LLC ]                 │ │
│ │ Ownership: Has ownership in this company            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Smith Holdings LLC owns:                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Company Name: [Central Perk Coffee & Cookies]       │ │
│ │ Ownership: Has 25% or more ownership                │ │
│ │ ✓ This is the Business Being Onboarded             │ │
│ │                                                     │ │
│ │ [Leverages existing hierarchy building logic]       │ │
│ │ - Dynamic company chain building                    │ │
│ │ - Business Being Onboarded identification           │ │
│ │ - Add/remove hierarchy levels                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Uses AlternateOwnershipReview.renderOwnershipChain()]:  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [User] John Smith → [Building] Smith Holdings LLC   │ │
│ │        → [Building] Central Perk Coffee & Cookies   │ │
│ │ (with icons, badges, and responsive styling)        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Back] [Cancel] [Save Hierarchy]                        │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Hierarchy Confirmation Interface
```
┌─────────────────────────────────────────────────────────┐
│ Confirm Ownership Hierarchy                             │
│                                                         │
│ Owner: John Smith                                       │
│                                                         │
│ [Uses AlternateOwnershipReview.renderOwnershipChain()]:  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [User] John Smith → [Building] Smith Holdings LLC   │ │
│ │        → [Building] Central Perk Coffee & Cookies   │ │
│ │ (with icons, badges, and responsive styling)        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ✓ Meets 25% beneficial ownership threshold              │
│ ✓ Hierarchy leads to Business Being Onboarded         │
│                                                         │
│ [Edit Hierarchy] [Confirm & Add]                        │
└─────────────────────────────────────────────────────────┘
```

## Technical Requirements

### Core Components

#### 1. `V2AlternateIndirectOwnership` (Main Container)
- Manages overall state and orchestrates dialogs
- Real-time ownership structure display
- Validation status indicator
- Complete button with validation

#### 2. `AddOwnerDialog`
- Simple form: firstName, lastName, ownershipType
- Immediate validation (required fields, duplicates)
- Direct owners: Add immediately to list with COMPLETE status
- Indirect owners: Add to list with PENDING_HIERARCHY status, show "Build Ownership Hierarchy" button

#### 3. Hierarchy Building Interface
- **Flexible implementation approach** - can be dialog-based, inline, or integrated within existing flow
- **Must reuse existing hierarchy validation logic and business rules**
- **Must integrate existing `AlternateOwnershipReview.renderOwnershipChain()` method for visual hierarchy representation**
- Leverages existing Business Being Onboarded identification and validation
- Maintains all existing validation rules and business logic
- Provides real-time hierarchy preview during building process

#### 4. Hierarchy Confirmation Interface
- **Must reuse existing `AlternateOwnershipReview.renderOwnershipChain()` method for visual hierarchy representation**
- Beneficial ownership threshold confirmation
- Validation status display
- Edit/Confirm actions
- Can be integrated into main interface or separate confirmation step

#### 5. `OwnershipStructureList`
- Real-time display of all added owners
- Status indicators (complete, pending, error)
- Quick actions (edit hierarchy, remove owner)
- **Reuses existing `AlternateOwnershipReview.renderOwnershipChain()` method for hierarchy visualization**:
  - Visual chain display: Owner → Company → Company → Business Being Onboarded
  - User icons, Building icons, and colored badges (Intermediary/Business)
  - Responsive flex layout with proper wrapping

### Data Structure

```typescript
interface V2BeneficialOwner {
  id: string;
  firstName: string;
  lastName: string;
  ownershipType: 'DIRECT' | 'INDIRECT';
  status: 'COMPLETE' | 'PENDING_HIERARCHY' | 'ERROR';
  ownershipHierarchy?: OwnershipHierarchy;
  meets25PercentThreshold?: boolean;
  validationErrors?: string[];
}

interface OwnershipHierarchy {
  id: string;
  steps: HierarchyStep[];
  isValid: boolean;
  meets25PercentThreshold: boolean;
  validationErrors?: string[];
}

interface HierarchyStep {
  id: string;
  entityName: string;
  entityType: 'INDIVIDUAL' | 'COMPANY';
  hasOwnership: boolean; // Whether this entity has ownership in the next level
  isBusinessBeingOnboarded: boolean;
  level: number; // 0 = beneficial owner, 1+ = intermediate entities
}

interface V2OwnershipState {
  rootCompanyName: string;
  beneficialOwners: V2BeneficialOwner[];
  currentDialog: 'NONE' | 'ADD_OWNER' | 'BUILD_CHAIN' | 'CONFIRM_CHAIN';
  currentOwnerBeingEdited?: string;
  validationSummary: ValidationSummary;
  isComplete: boolean;
}

interface ValidationSummary {
  totalOwners: number;
  completeOwners: number;
  pendingHierarchies: number;
  hasErrors: boolean;
  errors: string[];
  canComplete: boolean;
}
```

### Interface State Management

```typescript
interface InterfaceState {
  addOwner: {
    isActive: boolean;
    editingOwnerId?: string;
    initialData?: Partial<V2BeneficialOwner>;
  };
  buildHierarchy: {
    isActive: boolean;
    ownerId: string;
    ownerName: string;
    currentHierarchy?: OwnershipHierarchy;
    mode: 'dialog' | 'inline' | 'integrated'; // Implementation flexible
  };
  confirmHierarchy: {
    isActive: boolean;
    ownerId: string;
    completedHierarchy: OwnershipHierarchy;
    mode: 'dialog' | 'inline' | 'integrated'; // Implementation flexible
  };
}
```

## Component Behavior

### Add Owner Flow
1. **Click "Add Individual Owner"** → Opens `AddOwnerDialog`
2. **Fill form** → Real-time validation
3. **Select "Direct Owner"** → Click "Add Owner" → Owner added to list with COMPLETE status
4. **Select "Indirect Owner"** → Click "Add Owner" → Owner added with PENDING_HIERARCHY status → Dialog closes → Shows "Build Ownership Hierarchy" button

### Hierarchy Building Flow (For Indirect Owners)
1. **Click "Build Ownership Hierarchy" button** → Opens hierarchy building interface (implementation flexible)
2. **Hierarchy building leverages existing IndirectOwnership infrastructure**:
   - Reuses existing company chain building logic and components
   - Maintains existing validation logic and business rules
   - Uses existing "Add another company level" and "This is the Business Being Onboarded" functionality
   - **Must integrate existing `AlternateOwnershipReview.renderOwnershipChain()` method for real-time visual hierarchy preview**
3. **Real-time validation** using existing validation components
4. **Complete hierarchy** → Shows hierarchy confirmation (can be inline or separate interface)
5. **Confirm hierarchy** → Owner status updated to COMPLETE → Hierarchy displayed in main list using `renderOwnershipChain()`
6. **Edit hierarchy** → Return to hierarchy building interface

### Main Interface Updates
- **Real-time list updates** as owners are added/modified
- **Visual status indicators** for each owner
- **Validation summary** showing completion progress
- **Complete button** enabled only when all owners have complete information

### Validation Rules

#### Per-Owner Validation (Real-time)
- **Required fields**: firstName, lastName, ownershipType
- **Duplicate detection**: Same name combinations
- **Hierarchy completeness**: Indirect owners must have valid hierarchy
- **Ownership threshold validation**: Owner must have 25% or more beneficial ownership in Business Being Onboarded

#### Hierarchy Validation (As Built)
- **Company names**: Required for each intermediate entity
- **Ownership confirmation**: Must confirm ownership exists at each level
- **25% threshold**: Final beneficial owner must have 25% or more ownership in Business Being Onboarded
- **Hierarchy logic**: Must end at Business Being Onboarded
- **Circular references**: Prevent self-ownership loops

#### Completion Validation
- **Minimum owners**: At least 1 beneficial owner required
- **Complete hierarchies**: All indirect owners must have valid hierarchies
- **Ownership thresholds**: All owners meet 25% or more beneficial ownership requirement
- **No validation errors**: All real-time validations must pass

## User Experience Enhancements

### Real-Time Feedback
```typescript
// Example validation feedback
const validationMessages = {
  pendingHierarchy: "Ownership hierarchy required - click 'Build Ownership Hierarchy' to continue",
  invalidHierarchy: "Ownership hierarchy has errors - click 'Edit Hierarchy' to fix",
  belowThreshold: "Owner must have 25% or more beneficial ownership",
  duplicateName: "Owner with this name already exists",
  missingRequired: "First name and last name are required"
};
```

### Visual Indicators
- **✓ Green checkmark**: Owner complete and valid
- **⚠ Yellow warning**: Owner pending chain or has fixable issues
- **❌ Red error**: Owner has validation errors
- **📊 Hierarchy visualization**: Reuses existing `AlternateOwnershipReview.renderOwnershipChain()` component styling for ownership chains

### Progress Tracking
```
Validation Status:
• 2 of 3 owners have complete information ⚠
• 1 indirect owner needs ownership hierarchy
• Ready to complete: No (1 pending action)
```

## Component Props

```typescript
interface V2AlternateIndirectOwnershipProps {
  /** Root company name for Business Being Onboarded */
  rootCompanyName: string;
  
  /** Callback when ownership structure is completed */
  onOwnershipComplete?: (owners: V2BeneficialOwner[]) => void;
  
  /** Callback for real-time validation updates */
  onValidationChange?: (summary: ValidationSummary) => void;
  
  /** Initial beneficial owners (for editing scenarios) */
  initialOwners?: V2BeneficialOwner[];
  
  /** Maximum ownership levels allowed in chains */
  maxHierarchyLevels?: number;
  
  /** Read-only mode */
  readOnly?: boolean;
  
  /** Custom validation rules */
  customValidation?: {
    requiresOwnershipThreshold?: boolean;
    maxOwners?: number;
    requiredFields?: string[];
  };
}
```

## Error Handling & Edge Cases

### Dialog Error Handling
- **Network errors** during hierarchy building → Show retry option
- **Validation errors** → Inline error messages with guidance
- **Unsaved changes** → Confirmation dialog before closing

### Data Consistency
- **Concurrent editing** → Optimistic updates with conflict resolution
- **Partial saves** → Auto-save dialog state, restore on reopen
- **Invalid states** → Graceful degradation and recovery options

### Accessibility Considerations
- **Dialog focus management** → Proper focus trapping and restoration
- **Keyboard navigation** → Full keyboard accessibility through dialogs
- **Screen reader support** → Proper ARIA labels and live regions
- **High contrast** → Clear visual indicators for all states

## Implementation Strategy

### Phase 1: Core Infrastructure (Week 1)
1. Create `V2AlternateIndirectOwnership` main component
2. Implement basic state management with dialog orchestration
3. Create `AddOwnerDialog` with form validation
4. Set up real-time list updates

### Phase 2: Hierarchy Building Integration (Week 1-2)
1. **Integrate existing IndirectOwnership hierarchy builder components**
2. Create flexible hierarchy building interface (approach to be determined during implementation)
3. **Reuse existing hierarchy validation logic** (no reimplementation needed)
4. Add hierarchy confirmation interface (can be separate or integrated)
5. **Integrate existing `AlternateOwnershipReview.renderOwnershipChain()` method** for visual hierarchy display throughout the flow
6. Ensure seamless integration with existing component architecture

### Phase 3: Real-Time Features (Week 2)
1. Implement real-time validation summary
2. Add visual status indicators
3. Create progress tracking
4. Implement completion validation

### Phase 4: Polish & Testing (Week 2-3)
1. Add comprehensive error handling
2. Implement accessibility features
3. Create comprehensive test suite
4. Performance optimization

## File Structure

```
embedded-components/src/core/IndirectOwnership/
├── stories/
│   └── IndirectOwnership.story.tsx          # Add V2 story
├── components/
│   ├── V2AlternateIndirectOwnership/        # New V2 main component
│   │   ├── index.ts
│   │   ├── V2AlternateIndirectOwnership.tsx
│   │   ├── V2AlternateIndirectOwnership.test.tsx
│   │   └── types.ts
│   ├── AddOwnerDialog/                      # New dialog
│   │   ├── index.ts
│   │   ├── AddOwnerDialog.tsx
│   │   ├── AddOwnerDialog.test.tsx
│   │   └── types.ts
│   ├── HierarchyBuilding/                   # Flexible hierarchy building components
│   │   ├── index.ts                         # (implementation approach flexible)
│   │   ├── HierarchyBuildingInterface.tsx
│   │   ├── HierarchyBuildingInterface.test.tsx
│   │   └── types.ts
│   ├── HierarchyConfirmation/               # Hierarchy confirmation components
│   │   ├── index.ts                         # (can be dialog or inline)
│   │   ├── HierarchyConfirmationInterface.tsx
│   │   ├── HierarchyConfirmationInterface.test.tsx
│   │   └── types.ts
│   └── OwnershipStructureList/              # New real-time list component
│       ├── index.ts
│       ├── OwnershipStructureList.tsx
│       ├── OwnershipStructureList.test.tsx
│       └── types.ts
├── hooks/
│   ├── useV2OwnershipState.ts               # New state management hook
│   ├── useV2OwnershipState.test.tsx
│   ├── useInterfaceOrchestration.ts         # New interface orchestration hook
│   ├── useInterfaceOrchestration.test.tsx   # (flexible implementation)
│   ├── useRealTimeValidation.ts             # New validation hook
│   └── useRealTimeValidation.test.tsx
├── utils/
│   ├── v2OwnershipValidation.ts             # New validation utilities
│   ├── v2OwnershipValidation.test.ts
│   ├── hierarchyCalculations.ts             # New hierarchy calculation utilities
│   └── hierarchyCalculations.test.ts
└── mocks/
    ├── v2OwnershipMocks.ts                  # New mock data
    └── v2HierarchyMocks.ts                  # New hierarchy mock data
└── components/                              # Existing components to reuse
    └── AlternateOwnershipReview/
        └── AlternateOwnershipReview.tsx     # Contains renderOwnershipChain() method for visual hierarchy
```

## Story Configuration

```typescript
export const AlternateV2: Story = {
  name: 'Alternate V2 - Streamlined Flow',
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'alternate-v2-client-001',
    mode: 'ALTERNATE_V2',
    rootCompanyName: 'Central Perk Coffee & Cookies',
    showVisualization: true,
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
          Version 2 of the alternate indirect ownership flow featuring:
          
          **Streamlined Experience:**
          - Single interface with real-time updates
          - Dialog-based owner addition
          - On-demand hierarchy building for indirect owners
          - Live validation and progress tracking
          
          **Key Features:**
          - Add owners one-by-one with immediate feedback
          - Build ownership hierarchies on-demand with "Build Ownership Hierarchy" button
          - Real-time ownership structure preview
          - Validate each hierarchy as it's completed
          - Complete button with comprehensive validation
          
          **Ideal for scenarios where users prefer:**
          - Step-by-step guidance with immediate feedback
          - Visual confirmation of ownership structure
          - Real-time validation and error prevention
        `,
      },
    },
    msw: {
      handlers: [
        http.get('*/clients/alternate-v2-client-001', () => {
          return HttpResponse.json(efClientEmptyOwnership);
        }),
      ],
    },
  },
};
```

## Success Criteria

### User Experience Metrics
- **Task completion time**: < 5 minutes for typical 2-3 owner scenarios
- **Error rate**: < 3% validation errors due to clear real-time feedback
- **User satisfaction**: > 4.5/5 for streamlined dialog flow
- **Cognitive load**: Reduced mental effort through progressive disclosure

### Technical Performance
- **Dialog response time**: < 100ms for open/close operations
- **Real-time updates**: < 50ms for list updates after changes
- **Memory efficiency**: < 30MB for complex multi-level hierarchies
- **Error recovery**: 100% graceful handling of network/validation errors

This V2 approach provides a significantly improved user experience by consolidating steps, providing real-time feedback, and maintaining focus on completing one owner at a time while building toward the complete ownership structure.
