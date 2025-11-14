# Embedded Components - Definitive Architecture Pattern (2025)

## Overview

This document defines the **definitive** architectural pattern for all components in the embedded-components library, following **modern 2025 best practices** from the React ecosystem (Next.js, shadcn/ui, React Hook Form).

## Core Principles

### 1. **Individual Hook Files (Modern Standard)**

- ❌ **OLD**: `ComponentName.hooks.tsx` (multiple hooks in one file)
- ✅ **NEW**: Individual files with `use` prefix (e.g., `useHookName.ts`)
- Each hook in its own file in a `hooks/` directory

### 2. **Colocated Tests**

- Tests live next to the code they test
- No separate `__tests__/` directories
- Industry standard for better maintainability

### 3. **No Aggregation Barrel Exports**

- ❌ **AVOID**: `components/index.ts` that exports all components
- ✅ **USE**: Direct imports for better tree-shaking
- Only use index files at leaf level (component folders) and for convenience (hooks/, utils/)

### 4. **Flat Structure for Simple Files**

- Hooks and utils are files, not folders (unless many)
- Reduces nesting and improves navigation

### 5. **Type Colocation Strategy (Modern 2025)**

- ❌ **OLD**: All types in central `ComponentName.types.ts` file
- ✅ **NEW**: Types colocated with their implementation, central file only for public API
- Component-specific types live in component files
- Hook-specific types live in hook files
- Util-specific types inline with functions

**Type Organization Rules:**

1. **Central `.types.ts` file**: ONLY public API types (component props exported to consumers)
2. **Component files**: Component-specific props and interfaces (e.g., `LinkedAccountCardProps`)
3. **Hook files**: Hook options, return types, and internal interfaces
4. **Util files**: Function parameter types inline (no separate type definitions needed)

**Benefits:**
- ✅ Better discoverability (types next to usage)
- ✅ Easier refactoring (types move with code)
- ✅ Better tree-shaking (unused types eliminated)
- ✅ Clear separation of public vs internal types
- ✅ Follows Next.js 13+, shadcn/ui patterns

**Example:**

```typescript
// ✅ CORRECT - Central types file (PUBLIC API ONLY)
// LinkedAccountWidget.types.ts
export interface LinkedAccountWidgetProps {  // Public API
  onLinkedAccountSettled?: (recipient?: Recipient) => void;
  makePaymentComponent?: React.ReactNode;
}

// ✅ CORRECT - Component types colocated
// components/LinkedAccountCard/LinkedAccountCard.tsx
interface LinkedAccountCardProps {  // Internal, not exported from package
  recipient: Recipient;
  onLinkedAccountSettled?: (recipient?: Recipient) => void;
  hideActions?: boolean;
}

export const LinkedAccountCard: React.FC<LinkedAccountCardProps> = ({ ... }) => {
  // Implementation
};

// ✅ CORRECT - Hook types colocated
// hooks/useLinkedAccountForm.ts
export type LinkedAccountFormMode = "create" | "update" | "microdeposit";

interface UseLinkedAccountFormOptions {
  mode: LinkedAccountFormMode;
  recipient?: Recipient;
}

export function useLinkedAccountForm(options: UseLinkedAccountFormOptions) {
  // Implementation
}

// ✅ CORRECT - Util types inline
// utils/shouldShowCreateButton.ts
export function shouldShowCreateButton(
  recipients: Recipient[],
  isLoading: boolean
): boolean {
  // Implementation - no separate type file needed
}

// ❌ WRONG - All types in central file (Old Pattern)
// LinkedAccountWidget.types.ts
export interface LinkedAccountWidgetProps { ... }
export interface LinkedAccountCardProps { ... }  // ❌ Should be in component
export type LinkedAccountFormMode = ...;         // ❌ Should be in hook
```

## Directory Structure Pattern (Modern 2025)

```
ComponentName/
├── index.ts                          # Public API exports only
├── ComponentName.tsx                 # Main orchestrator component
├── ComponentName.test.tsx            # Main component tests (colocated)
├── ComponentName.types.ts            # Public types and interfaces
├── ComponentName.constants.ts        # Component-specific constants
│
├── hooks/                            # ✅ Individual hook files (flat)
│   ├── useComponentData.ts          # Hook implementation
│   ├── useComponentData.test.tsx    # Colocated test
│   ├── useComponentForm.ts          # Hook implementation
│   ├── useComponentForm.test.tsx    # Colocated test
│   └── index.ts                     # Barrel export (convenience)
│
├── utils/                            # ✅ Individual util files (flat)
│   ├── helperFunction.ts            # Util implementation
│   ├── helperFunction.test.ts       # Colocated test
│   └── index.ts                     # Barrel export (convenience)
│
├── components/                       # ✅ Sub-components (NO index files)
│   ├── ComponentCard/               # Each component in own folder
│   │   ├── ComponentCard.tsx
│   │   └── ComponentCard.test.tsx   # Colocated test
│   ├── ComponentSkeleton/
│   │   ├── ComponentSkeleton.tsx
│   │   └── ComponentSkeleton.test.tsx
│   └── ❌ NO index.ts files         # No component-level OR aggregation indexes
│
├── forms/                            # Form dialogs (only if they have .schema.ts)
│   ├── CreateForm/
│   │   ├── CreateForm.tsx
│   │   ├── CreateForm.test.tsx
│   │   └── CreateForm.schema.ts
│   └── ❌ NO index.ts here          # No aggregation barrel
│
└── stories/                          # Storybook stories
    └── ComponentName.story.tsx
```

## Key Architectural Changes (2025 Update)

### ❌ **DEPRECATED Patterns:**

1. `ComponentName.hooks.tsx` → Use individual `hooks/useHookName.ts` files
2. `ComponentName.utils.ts` → Use individual `utils/utilName.ts` files
3. `components/index.ts` → Remove aggregation barrel exports
4. `forms/index.ts` → Remove aggregation barrel exports

### ✅ **MODERN Patterns:**

1. Individual hook files with `use` prefix
2. Flat structure in `hooks/` directory (files, not folders)
3. Colocated tests (test next to implementation)
4. Direct imports (no barrel exports at aggregation level)
5. Leaf-level index files only (component folders, convenience exports)

## The Five Layers (Definitive Rules)

### 1. `lib/` (Workspace-Level Shared Code)

**Location:** `src/lib/`  
**Purpose:** Pure utilities shared across MULTIPLE components/features  
**Rules:**

- ✅ Pure functions only (no React, no hooks)
- ✅ Framework-agnostic
- ✅ Used by 2+ components
- ✅ Can include shared hooks (src/lib/hooks/)
- ✅ Can include shared utils (src/lib/utils/)
- ❌ No component-specific logic
- ❌ No API calls directly (use hooks for that)

**Structure:**

```typescript
lib/
├── recipientHelpers.ts        # Generic recipient utilities
├── dateUtils.ts               # Date formatting
├── validationUtils.ts         # Validation helpers
├── formatters.ts              # Generic formatters
├── hooks/                     # Shared React hooks
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── index.ts
└── utils/                     # Categorized utilities
    ├── string.ts
    ├── number.ts
    └── index.ts
```

**When to use:**

- Formatting functions used by multiple components
- Validation logic needed across features
- Generic business logic helpers
- Shared custom hooks

**Migration note:** Root-level `src/hooks/` and `src/utils/` should move here:

```
src/hooks/ → src/lib/hooks/
src/utils/ → src/lib/utils/
```

### 2. Component-Specific Code (Modern 2025 Pattern)

**Location:** `src/core/ComponentName/hooks/` and `src/core/ComponentName/utils/`  
**Purpose:** Hooks and utilities SPECIFIC to this component  
**Rules:**

- ✅ Individual files with descriptive names (`useHookName.ts`, `utilName.ts`)
- ✅ Flat structure (files, not nested folders)
- ✅ Tests colocated with implementation
- ✅ Component-specific business logic
- ✅ Can use React hooks (for hooks/)
- ✅ Pure functions (for utils/)
- ❌ Should NOT be reused by other components
- ❌ If needed elsewhere, move to `src/lib/`

**Modern Pattern (2025):**

```typescript
// ✅ CORRECT - Individual hook files (Modern Standard)
LinkedAccountWidget/
├── LinkedAccountWidget.tsx
├── LinkedAccountWidget.test.tsx
├── hooks/
│   ├── useLinkedAccounts.ts           # Individual hook file
│   ├── useLinkedAccounts.test.tsx     # Colocated test
│   ├── useLinkedAccountForm.ts        # Individual hook file
│   ├── useLinkedAccountForm.test.tsx  # Colocated test
│   └── index.ts                       # Barrel export (convenience)
├── utils/
│   ├── shouldShowCreateButton.ts      # Individual util file
│   ├── shouldShowCreateButton.test.ts # Colocated test
│   └── index.ts                       # Barrel export (convenience)
├── LinkedAccountWidget.types.ts
└── LinkedAccountWidget.constants.ts

// ❌ DEPRECATED - Monolithic files (Old Pattern)
LinkedAccountWidget/
├── LinkedAccountWidget.tsx
├── LinkedAccountWidget.hooks.tsx      # ❌ Multiple hooks in one file
├── LinkedAccountWidget.hooks.test.tsx # ❌ All tests in one file
├── LinkedAccountWidget.utils.ts       # ❌ Multiple utils in one file
└── LinkedAccountWidget.utils.test.ts  # ❌ All tests in one file
```

**Why Individual Files?**

1. ✅ **Industry Standard**: Matches Next.js, shadcn/ui, React Hook Form patterns
2. ✅ **Better Discoverability**: Easy to find `useLinkedAccounts.ts`
3. ✅ **Better Tree-Shaking**: Bundlers can optimize individual imports
4. ✅ **Clearer Boundaries**: Each file has single responsibility
5. ✅ **Easier Testing**: Test file matches hook file 1:1
6. ✅ **Faster IDE**: Better autocomplete and navigation

**When to use:**

- Data fetching specific to this component
- State management for this component only
- Helper functions used only by this component
- Actions that only this component needs

**Note:** Always use `hooks/` or `utils/` folders even with just 1-2 files. This is the modern standard.

### 3. `components/` (Component-Specific Presentational)

**Location:** `src/core/ComponentName/components/`  
**Purpose:** Presentational sub-components for THIS component only  
**Rules:**

- ✅ UI/presentation logic only
- ✅ Specific to parent component
- ✅ Receive data via props
- ✅ **Each component in its own folder** with test co-located
- ❌ No API calls
- ❌ Minimal business logic
- ❌ If reused elsewhere, move to `src/components/ui/`

**Modern Best Practice: Component Folders (No Index Files)**

Each sub-component should have its own folder with all related files:

```typescript
components/
├── SubComponent1/
│   ├── SubComponent1.tsx        # Component implementation
│   └── SubComponent1.test.tsx   # Co-located tests
├── SubComponent2/
│   ├── SubComponent2.tsx
│   └── SubComponent2.test.tsx
└── ❌ NO index.ts files         # No component OR aggregation indexes
```

**Why No Index Files At All?**

Modern 2025 best practice eliminates ALL index files in component folders:

**Component-Level (Leaf) Index Files:**

- ❌ Unnecessary boilerplate (modern IDEs auto-import)
- ❌ Adds extra file to maintain per component
- ❌ Obscures actual file being imported
- ❌ Not used by Next.js 13+, shadcn/ui, Vercel patterns

**Aggregation Index Files:**

- ❌ Harms tree-shaking (larger bundles)
- ❌ Slows down IDE performance
- ❌ Risks circular dependencies
- ❌ Makes builds slower
- ❌ Obscures actual dependencies

**Import Pattern:**

```typescript
// ✅ Modern - Direct file imports (explicit and tree-shakeable)

// ❌ Old Pattern 2 - Aggregation barrel (prevents tree-shaking)
import { SubComponent1, SubComponent2 } from './components'; // Needs components/index.ts

// ❌ Old Pattern 1 - Component index (unnecessary boilerplate)
import { SubComponent1 } from './components/SubComponent1'; // Needs index.ts
import { SubComponent1 } from './components/SubComponent1/SubComponent1';
import { SubComponent2 } from './components/SubComponent2/SubComponent2';
```

**Benefits:**

- Better isolation - each component is self-contained
- Easier navigation - all related files in one place
- Scalability - easy to add styles, utils, or sub-components later
- Clear boundaries - folder structure shows component boundaries
- Industry standard - used by Next.js, React, Remix, etc.

**Examples:**

```typescript
// ✅ Good - LinkedAccount-specific displays (each in own folder)
components/
├── LinkedAccountCard/
│   ├── LinkedAccountCard.tsx           # Shows linked account
│   └── LinkedAccountCard.test.tsx
├── LinkedAccountSkeleton/
│   ├── LinkedAccountSkeleton.tsx       # Loading state
│   └── LinkedAccountSkeleton.test.tsx
└── EmptyState/
    ├── EmptyState.tsx                  # No accounts state
    └── EmptyState.test.tsx

// ❌ Bad - Generic, move to src/components/ui/
components/
├── GenericCard/                        # Move to src/components/ui/
    └── GenericCard.tsx
```

**When to use:**

- Display logic specific to this feature
- Custom layouts for this component
- Composed pieces of the main component
- Dialog wrappers (dialogs are presentation)

### 4. `forms/` (Component-Specific Forms with Validation)

**Location:** `src/core/ComponentName/forms/`  
**Purpose:** Forms with complex validation schemas  
**Rules:**

- ✅ ONLY if form has a `.schema.ts` file
- ✅ Complex validation logic
- ✅ Multi-step form workflows
- ❌ Simple forms should be in `components/`
- ❌ Confirmation dialogs should be in `components/`

**Golden Rule:** If it has a `.schema.ts` file → `forms/`, otherwise → `components/`

**Examples:**

```typescript
// ✅ Good - Has validation schema
forms/
├── MicrodepositsForm/
│   ├── MicrodepositsForm.tsx          # Form with validation
│   └── MicrodepositsForm.schema.ts    # ✅ Zod schema
└── CreatePaymentForm/
    ├── CreatePaymentForm.tsx
    └── CreatePaymentForm.schema.ts    # ✅ Zod schema

// ❌ Bad - No schema, move to components/
forms/
└── RemoveAccountDialog/               # ❌ Just confirmation, no schema
    └── RemoveAccountDialog.tsx        # Move to components/
```

**When to use:**

- Forms with complex validation (amounts, dates, etc.)
- Multi-field forms with dependencies
- Forms with Zod schemas
- Forms with react-hook-form

**When NOT to use:**

- Simple confirmation dialogs → `components/`
- Dialogs that just wrap shared forms → `components/`
- Display-only dialogs → `components/`

## Shared Resources (Workspace Level)

### `src/lib/` (All Shared Code)

**Purpose:** All shared utilities, hooks, and helpers  
**Structure:**

```typescript
src/lib/
├── recipientHelpers.ts              # Generic recipient utilities
├── dateUtils.ts                     # Date formatting
├── formatters.ts                    # Generic formatters
├── hooks/                           # Shared React hooks
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useRecipientMutations.ts     # Generic recipient mutations
│   └── index.ts
└── utils/                           # Categorized utilities
    ├── string.ts
    ├── number.ts
    ├── array.ts
    └── index.ts
```

**Migration from old structure:**

```bash
src/hooks/ → src/lib/hooks/
src/utils/ → src/lib/utils/
```

**When to use:**

- Pure functions used by 2+ components
- Shared React hooks
- Generic business logic
- Framework utilities

### `src/components/` (Workspace-Level Components)

**Purpose:** UI components used across the application  
**Examples:**

```typescript
src/components/
├── ui/                              # Radix wrappers
│   ├── button.tsx
│   ├── card.tsx
│   └── dialog.tsx
├── BankAccountForm/                 # Shared form used by multiple features
│   ├── BankAccountForm.tsx
│   ├── BankAccountForm.schema.ts
│   └── BankAccountForm.utils.ts
└── ServerErrorAlert/                # Generic error display
```

## Decision Tree

### "Where should I put this code?"

#### Is it a React Hook?

```
YES → Is it used by 2+ components?
      YES → src/lib/hooks/useHookName.ts
      NO  → ComponentName.hooks.tsx (colocated)

      Exception: If many hooks (5+) → ComponentName/hooks/ folder
```

#### Is it a Utility Function?

```
YES → Is it used by 2+ components?
      YES → src/lib/utils/utilName.ts or src/lib/utilName.ts
      NO  → ComponentName.utils.tsx (colocated)

      Exception: If many utils (5+) → ComponentName/utils/ folder
```

#### Is it a UI Component?

```
YES → Is it used by 2+ features?
      YES → src/components/ComponentName/
      NO  → ComponentName/components/SubComponent/
            ├── SubComponent.tsx
            ├── SubComponent.test.tsx
            └── index.ts
```

#### Is it a Form?

```
YES → Does it have a .schema.ts file?
      YES → Does it belong to one feature?
            YES → ComponentName/forms/FormName/
            NO  → src/components/forms/FormName/
      NO  → It's a dialog, not a form
            → ComponentName/components/DialogName.tsx
```

## Real-World Examples

### ✅ Example 1: LinkedAccountWidget (Modern 2025 Pattern)

```
LinkedAccountWidget/
├── index.ts                                 # Public API
├── LinkedAccountWidget.tsx                  # Main component
├── LinkedAccountWidget.test.tsx             # Main component test
├── LinkedAccountWidget.types.ts             # Types
├── LinkedAccountWidget.constants.ts         # Constants
├── hooks/                                   # ✅ Individual hook files
│   ├── useLinkedAccounts.ts                # Hook implementation
│   ├── useLinkedAccounts.test.tsx          # Colocated test
│   ├── useLinkedAccountForm.ts             # Hook implementation
│   ├── useLinkedAccountForm.test.tsx       # Colocated test
│   └── index.ts                            # Barrel export
├── utils/                                   # ✅ Individual util files
│   ├── shouldShowCreateButton.ts           # Util implementation
│   ├── shouldShowCreateButton.test.ts      # Colocated test
│   └── index.ts                            # Barrel export
├── components/                              # ✅ No index files
│   ├── LinkedAccountCard/
│   │   ├── LinkedAccountCard.tsx
│   │   └── LinkedAccountCard.test.tsx
│   ├── LinkedAccountFormDialog/
│   │   ├── LinkedAccountFormDialog.tsx
│   │   └── LinkedAccountFormDialog.test.tsx
│   ├── StatusAlert/
│   │   ├── StatusAlert.tsx
│   │   └── StatusAlert.test.tsx
│   └── ❌ NO index.ts files             # No component OR aggregation indexes
├── forms/                                   # ✅ No index files
│   └── MicrodepositsForm/
│       ├── MicrodepositsForm.tsx
│       ├── MicrodepositsForm.test.tsx
│       └── MicrodepositsForm.schema.ts      # ✅ Has schema
│   └── ❌ NO index.ts files             # No component OR aggregation indexes
└── stories/
    └── LinkedAccountWidget.story.tsx
```

### ✅ Example 2: Simple Component (Modern 2025 Pattern)

```
PaymentButton/
├── index.ts
├── PaymentButton.tsx
├── PaymentButton.test.tsx
├── PaymentButton.types.ts
├── hooks/                                   # ✅ Individual hook files
│   ├── usePaymentAction.ts
│   ├── usePaymentAction.test.tsx
│   └── index.ts
└── stories/
    └── PaymentButton.story.tsx
```

### ✅ Example 3: Complex Component (Many Hooks - Modern 2025 Pattern)

```
TransactionHistory/
├── index.ts
├── TransactionHistory.tsx
├── TransactionHistory.test.tsx
├── TransactionHistory.types.ts
├── TransactionHistory.constants.ts
├── hooks/                                   # ✅ Many hooks, each in own file
│   ├── useTransactions.ts
│   ├── useTransactions.test.tsx            # Colocated test
│   ├── useTransactionFilters.ts
│   ├── useTransactionFilters.test.tsx
│   ├── useTransactionExport.ts
│   ├── useTransactionExport.test.tsx
│   ├── useTransactionSearch.ts
│   ├── useTransactionSearch.test.tsx
│   ├── useTransactionSort.ts
│   ├── useTransactionSort.test.tsx
│   └── index.ts                            # Barrel export
├── utils/                                   # ✅ Many utils, each in own file
│   ├── transactionFormatters.ts
│   ├── transactionFormatters.test.ts
│   ├── transactionCalculations.ts
│   ├── transactionCalculations.test.ts
│   ├── transactionGrouping.ts
│   ├── transactionGrouping.test.ts
│   └── index.ts                            # Barrel export
├── components/                              # ✅ No index files
│   ├── TransactionCard/
│   │   ├── TransactionCard.tsx
│   │   └── TransactionCard.test.tsx
│   ├── TransactionFilters/
│   │   ├── TransactionFilters.tsx
│   │   └── TransactionFilters.test.tsx
│   └── ❌ NO index.ts files             # No component OR aggregation indexes
└── stories/
```

### ✅ Example 4: Workspace-Level Shared

```
src/
├── lib/
│   ├── recipientHelpers.ts                  # ✅ Used by LinkedAccount + Recipients
│   ├── dateUtils.ts                         # ✅ Used everywhere
│   ├── hooks/                               # ✅ Shared hooks
│   │   ├── useDebounce.ts
│   │   ├── useRecipientMutations.ts         # ✅ Generic mutations
│   │   └── index.ts
│   └── utils/                               # ✅ Categorized utils
│       ├── string.ts
│       ├── number.ts
│       └── index.ts
├── components/
│   ├── BankAccountForm/                     # ✅ Used by multiple features
│   └── ui/
│       ├── button.tsx
│       └── card.tsx
```

## Migration Guide (2025 Update)

### From Old Monolithic Files to New Individual Files

#### Old Pattern (Deprecated)

```
❌ LinkedAccountWidget/
   ├── LinkedAccountWidget.hooks.tsx         # Multiple hooks in one file
   │   └── export { useLinkedAccounts, useLinkedAccountForm }
   ├── LinkedAccountWidget.hooks.test.tsx    # All tests in one file
   ├── LinkedAccountWidget.utils.ts          # Multiple utils in one file
   └── LinkedAccountWidget.utils.test.ts     # All tests in one file
```

#### New Pattern (Modern 2025)

```
✅ LinkedAccountWidget/
   ├── hooks/                                # Individual hook files
   │   ├── useLinkedAccounts.ts             # Hook implementation
   │   ├── useLinkedAccounts.test.tsx       # Colocated test
   │   ├── useLinkedAccountForm.ts          # Hook implementation
   │   ├── useLinkedAccountForm.test.tsx    # Colocated test
   │   └── index.ts                         # Barrel export
   └── utils/                                # Individual util files
       ├── shouldShowCreateButton.ts        # Util implementation
       ├── shouldShowCreateButton.test.ts   # Colocated test
       └── index.ts                         # Barrel export
```

#### Migration Steps:

1. Create `hooks/` directory
2. Split `ComponentName.hooks.tsx` into individual `useHookName.ts` files
3. Split `ComponentName.hooks.test.tsx` into colocated test files
4. Create `hooks/index.ts` barrel export
5. Create `utils/` directory
6. Split `ComponentName.utils.ts` into individual `utilName.ts` files
7. Split `ComponentName.utils.test.ts` into colocated test files
8. Create `utils/index.ts` barrel export
9. Update imports throughout codebase
10. Delete old monolithic files

### Removing Aggregation Barrel Exports

#### Remove These Files:

```
❌ components/index.ts    # Aggregation barrel
❌ forms/index.ts         # Aggregation barrel
```

#### Update Imports:

```typescript
// ❌ Old (barrel import)
import { ComponentCard, ComponentSkeleton } from './components';
// ✅ New (direct import)
import { ComponentCard } from './components/ComponentCard';
import { ComponentSkeleton } from './components/ComponentSkeleton';
```

### From Root-Level to lib/

#### Old Pattern

```
❌ src/
   ├── hooks/
   │   └── useDebounce.ts
   └── utils/
       └── stringUtils.ts
```

#### New Pattern

```
✅ src/
   └── lib/
       ├── hooks/
       │   └── useDebounce.ts
       └── utils/
           └── string.ts
```

#### Migration Steps:

1. Create `src/lib/hooks/` and `src/lib/utils/` directories
2. Move `src/hooks/*` → `src/lib/hooks/`
3. Move `src/utils/*` → `src/lib/utils/`
4. Update all imports: `@/hooks/` → `@/lib/hooks/`
5. Delete old `src/hooks/` and `src/utils/` directories

## Key Principles

### 1. **Colocation Over Organization**

- Keep code close to where it's used
- Single file (`.hooks.tsx`, `.utils.tsx`) for component-specific code
- Folders only when you have many (5+) files

### 2. **Start Specific, Generalize Later**

- Always start in component folders (colocated)
- Move to `src/lib/` ONLY when used by 2+ components
- Don't prematurely optimize for reuse

### 3. **Name Based on Specificity**

- Component-specific: `LinkedAccountCard`, `useLinkedAccountData()`
- Generic/Shared: `RecipientCard`, `useRecipientData()`
- Name reveals scope

### 4. **Forms vs Components Distinction**

- Has `.schema.ts` file? → `forms/`
- Just a dialog or display? → `components/`
- Confirmation dialogs are components, not forms

### 5. **Folder Structure Simplicity**

```
✅ Prefer: ComponentName.hooks.tsx (colocated)
⚠️ Allow:  ComponentName/hooks/ (if 5+ files)
❌ Avoid:  ComponentName/hooks/ (for 1-2 files)
```

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Premature Abstraction

```typescript
// ❌ Bad - Creating "generic" hook in component folder
LinkedAccountWidget/hooks/useRecipientForm.ts  // Too generic!

// ✅ Good - Specific to component
LinkedAccountWidget.hooks.tsx
  └── export function useLinkedAccountForm()   // Clear scope
```

### ❌ Anti-Pattern 2: Unnecessary Folders

```typescript
// ❌ Bad - Folder for one util
ComponentName/
└── utils/
    ├── helper.ts
    └── index.ts

// ✅ Good - Colocated file
ComponentName/
└── ComponentName.utils.tsx
```

### ❌ Anti-Pattern 3: Generic Names in Specific Places

```typescript
// ❌ Bad - Generic name in component folder
LinkedAccountWidget / components / RecipientCard.tsx; // Could be used anywhere!

// ✅ Good - Specific name
LinkedAccountWidget / components / LinkedAccountCard.tsx; // Clear it's for LinkedAccount
```

### ❌ Anti-Pattern 4: Forms Without Schemas

```typescript
// ❌ Bad - Dialog in forms/ without schema
ComponentName/forms/ConfirmDialog/
└── ConfirmDialog.tsx  // No schema, just yes/no buttons

// ✅ Good - Dialog in components/
ComponentName/components/
└── ConfirmDialog.tsx
```

### ❌ Anti-Pattern 5: Shared Code in Component Folders

```typescript
// ❌ Bad - Generic utility in component folder
LinkedAccountWidget/utils/recipientHelpers.ts
  └── isRecipientPending()  // Used by Recipients component too!

// ✅ Good - Shared utility in lib/
src/lib/recipientHelpers.ts
  └── isRecipientPending()  // Available to all
```

## Quick Reference (2025 Update)

### "I have a hook..."

- Used by THIS component only? → `ComponentName/hooks/useHookName.ts` (individual file)
- Used by 2+ components? → `src/lib/hooks/useHookName.ts`
- **Always use `hooks/` folder**, even for 1 hook (modern standard)

### "I have a utility..."

- Used by THIS component only? → `ComponentName/utils/utilName.ts` (individual file)
- Used by 2+ components? → `src/lib/utils/utilName.ts` or `src/lib/utilName.ts`
- **Always use `utils/` folder**, even for 1 util (modern standard)

### "I have a test..."

- Test for a hook? → Colocate: `hooks/useHookName.test.tsx`
- Test for a util? → Colocate: `utils/utilName.test.ts`
- Test for a component? → Colocate: `ComponentName/ComponentName.test.tsx`
- **Always colocate tests** with their implementation (modern standard)

### "I have a form..."

- Has `.schema.ts` file? → `ComponentName/forms/FormName/`
- No schema (just dialog)? → `ComponentName/components/DialogName/`

### "I have a component..."

- Used by THIS feature only? → `ComponentName/components/SubComponent/` (each in own folder with test)
- Used by 2+ features? → `src/components/ComponentName/`

### "Should I create an index file?"

- Component folder (leaf level)? → ❌ NO (modern IDEs handle auto-import)
- Feature folder (hooks/, utils/)? → ✅ YES (barrel export for convenience)
- Aggregation (components/, forms/)? → ❌ NO (prevents tree-shaking)
- Public API (module root)? → ✅ YES (e.g., `LinkedAccountWidget/index.ts`)

## Type Specificity Examples

### ✅ Good - Clear Scope

```typescript
// Component-specific hook (LinkedAccountWidget.hooks.tsx)
export function useLinkedAccountForm() {
  // Hardcodes type: 'LINKED_ACCOUNT'
  // Only for LinkedAccountWidget
}

// Generic hook (src/lib/hooks/useRecipientMutations.ts)
export function useRecipientMutations(type: RecipientType) {
  // Accepts any type parameter
  // Can be used by LinkedAccountWidget, Recipients, etc.
}

// Component-specific utility (LinkedAccountWidget.utils.tsx)
export function shouldShowCreateButton(
  variant: 'default' | 'singleAccount', // LinkedAccount-specific variant
  hasActiveAccount: boolean
): boolean {
  // Logic specific to LinkedAccountWidget's singleAccount mode
}

// Generic utility (src/lib/recipientHelpers.ts)
export function isRecipientPending(recipient: Recipient): boolean {
  // Works for any recipient type
  // Used by multiple components
}
```

## Summary (2025 Update)

### File Naming Patterns

| What       | Component-Specific                   | Workspace-Level            |
| ---------- | ------------------------------------ | -------------------------- |
| Hooks      | `ComponentName/hooks/useHookName.ts` | `src/lib/hooks/useHook.ts` |
| Utils      | `ComponentName/utils/utilName.ts`    | `src/lib/utils/util.ts`    |
| Tests      | Colocated (next to implementation)   | Colocated                  |
| Components | `ComponentName/components/Sub/`      | `src/components/`          |
| Forms      | `ComponentName/forms/FormName/`      | N/A (rare)                 |

**Key Changes from Old Pattern:**

- ❌ **OLD**: `ComponentName.hooks.tsx` (monolithic)
- ✅ **NEW**: `ComponentName/hooks/useHookName.ts` (individual)
- ❌ **OLD**: Aggregation barrel exports (`components/index.ts`)
- ✅ **NEW**: Direct imports, leaf-level indexes only

### Decision Flow (2025)

```
New Code
  │
  ├─→ Is it a hook?
  │   ├─→ Used by 2+ components? → src/lib/hooks/useHookName.ts
  │   └─→ Used by 1 component? → ComponentName/hooks/useHookName.ts
  │                                (individual file, with colocated test)
  │
  ├─→ Is it a utility?
  │   ├─→ Used by 2+ components? → src/lib/utils/utilName.ts
  │   └─→ Used by 1 component? → ComponentName/utils/utilName.ts
  │                                (individual file, with colocated test)
  │
  ├─→ Is it a component?
  │   ├─→ Used by 2+ features? → src/components/ComponentName/
  │   └─→ Used by 1 feature? → ComponentName/components/SubComponent/
  │                              (folder with colocated test, NO aggregation index)
  │
  ├─→ Is it a form?
  │   ├─→ Has .schema.ts? → ComponentName/forms/FormName/
  │   └─→ No schema? → ComponentName/components/DialogName/ (it's a component)
  │
  └─→ Should I create index.ts?
      ├─→ Component folder (leaf)? → YES
      ├─→ Feature folder (hooks/utils)? → YES (convenience)
      ├─→ Aggregation (components/)? → NO (prevents tree-shaking)
      └─→ Public API (module root)? → YES
```

## Benefits of This Architecture

### 1. **Colocation Benefits**

- ✅ Related code lives together
- ✅ Easy to find hooks/utils for a component
- ✅ Less navigation between folders
- ✅ Clear what's component-specific vs shared

### 2. **Scalability**

- ✅ Small components stay simple (1-2 files)
- ✅ Large components can use folders when needed
- ✅ Shared code is centralized in `src/lib/`
- ✅ No premature abstraction

### 3. **Maintainability**

- ✅ Clear naming conventions
- ✅ Obvious where new code should go
- ✅ Easy to refactor (move file to lib/ when shared)
- ✅ Reduced cognitive load

### 4. **Discoverability**

- ✅ `ComponentName.hooks.tsx` → All hooks for that component
- ✅ `src/lib/hooks/` → All shared hooks
- ✅ No hunting through nested folders
- ✅ Predictable structure

## Conclusion

This architecture prioritizes **colocation** and **simplicity**:

1. **Start colocated**: Use `.hooks.tsx` and `.utils.tsx` files
2. **Grow naturally**: Use folders only when you have many (5+) files
3. **Share deliberately**: Move to `src/lib/` only when used by 2+ components
4. **Name clearly**: Names should reveal scope (specific vs generic)

**Remember**: It's easier to promote code from component-specific to shared than to find and extract shared code from component folders.

````

### 4. **Folder Purpose Test**
Ask: "If I have a Recipients component (not LinkedAccount), would this code be useful?"
- **YES** → Move to workspace level (src/)
- **NO** → Keep in component folder

## Examples

### Example 1: Form Hook

```typescript
// ❌ WRONG - In LinkedAccountWidget/hooks/useRecipientForm.ts
export function useRecipientForm() {
  // This could be used by Recipients component too!
}

// ✅ CORRECT - In LinkedAccountWidget/hooks/useLinkedAccountForm.ts
export function useLinkedAccountForm() {
  return useRecipientMutation('LINKED_ACCOUNT'); // Specific!
}

// ✅ CORRECT - In src/hooks/useRecipientMutation.ts
export function useRecipientMutation(type: RecipientType) {
  // Generic, reusable across components
}
````

### Example 2: Utility Function

```typescript
// ❌ WRONG - In LinkedAccountWidget/utils/recipientUtils.ts
export function isRecipientPending(recipient: Recipient) {
  // Generic logic, not specific to LinkedAccount
}

// ✅ CORRECT - In src/lib/recipientHelpers.ts
export function isRecipientPending(recipient: Recipient) {
  // Shared across all components
}

// ✅ CORRECT - In LinkedAccountWidget/utils/linkedAccountHelpers.ts
export function shouldShowCreateButton(variant, hasActive, showCreate) {
  // Specific to LinkedAccount component logic
}
```

### Example 3: Form Component

```typescript
// ❌ WRONG - In LinkedAccountWidget/forms/shared/RecipientFormDialog.tsx
export function RecipientFormDialog({ mode, recipient }) {
  // Hardcoded to submit type: 'LINKED_ACCOUNT'
  submit({ ...data, type: 'LINKED_ACCOUNT' });
}

// ✅ CORRECT - In LinkedAccountWidget/forms/shared/LinkedAccountFormDialog.tsx
export function LinkedAccountFormDialog({ mode, recipient }) {
  // Clearly specific to linked accounts
  submit({ ...data, type: 'LINKED_ACCOUNT' });
}

// ✅ CORRECT - In src/components/forms/RecipientFormDialog.tsx
export function RecipientFormDialog({ mode, recipient, type }) {
  // Generic, accepts type as prop
  submit({ ...data, type });
}
```

## Migration Checklist

When refactoring existing components:

- [ ] Identify truly generic code → Move to `src/`
- [ ] Rename component-specific items to include component name
- [ ] Keep component-specific code in component folder
- [ ] Update imports to reflect new structure
- [ ] Document why code is where it is
- [ ] Test that nothing broke

## Summary

| Location                    | Purpose          | Used By       | Has React? | Has API? |
| --------------------------- | ---------------- | ------------- | ---------- | -------- |
| `src/lib/`                  | Pure utilities   | Multiple      | ❌         | ❌       |
| `src/hooks/`                | Shared hooks     | Multiple      | ✅         | ✅       |
| `src/components/`           | Shared UI        | Multiple      | ✅         | ❌       |
| `ComponentName/hooks/`      | Specific hooks   | One component | ✅         | ✅       |
| `ComponentName/components/` | Specific UI      | One component | ✅         | ❌       |
| `ComponentName/forms/`      | Specific forms   | One component | ✅         | ✅       |
| `ComponentName/utils/`      | Specific helpers | One component | ❌         | ❌       |

**Golden Rule:** Start specific, move to shared only when needed by 2+ components.
