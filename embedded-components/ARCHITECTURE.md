# Embedded Components - Architecture Pattern (2025)

## Core Principles

### 1. Individual Hook/Util Files

- Each hook/util in its own file: `useHookName.ts`, `utilName.ts`
- Always use `hooks/` and `utils/` directories, even for single files
- Tests colocated: `useHookName.test.tsx` next to `useHookName.ts`

### 2. Type Colocation

- **Central `.types.ts`**: ONLY public API (exported component props)
- **Component files**: Internal component props/interfaces
- **Hook files**: Hook options, return types
- **Util files**: Inline parameter types

```typescript
// ✅ Public API only
// ComponentName.types.ts
export interface ComponentNameProps { ... }

// ✅ Internal types colocated
// components/SubComponent.tsx
interface SubComponentProps { ... }

// hooks/useHook.ts
interface UseHookOptions { ... }
export function useHook(options: UseHookOptions) { ... }
```

### 3. No Aggregation Barrels

- ❌ No `components/index.ts` exporting all components
- ✅ Direct imports for tree-shaking
- ✅ Barrel exports only for: `hooks/index.ts`, `utils/index.ts`, component root `index.ts`

## Directory Structure

```
ComponentName/
├── index.ts                          # Public API exports only
├── ComponentName.tsx                 # Main component
├── ComponentName.test.tsx            # Colocated test
├── ComponentName.types.ts            # Public types ONLY
├── ComponentName.constants.ts        # Constants
│
├── hooks/                            # Individual files (flat)
│   ├── useData.ts
│   ├── useData.test.tsx
│   ├── useForm.ts
│   ├── useForm.test.tsx
│   └── index.ts                      # Barrel export
│
├── utils/                            # Individual files (flat)
│   ├── helper.ts
│   ├── helper.test.ts
│   └── index.ts                      # Barrel export
│
├── components/                       # NO index files
│   ├── SubCard/
│   │   ├── SubCard.tsx
│   │   └── SubCard.test.tsx
│   └── SubSkeleton/
│       ├── SubSkeleton.tsx
│       └── SubSkeleton.test.tsx
│
├── forms/                            # Only if .schema.ts exists
│   └── CreateForm/
│       ├── CreateForm.tsx
│       ├── CreateForm.test.tsx
│       └── CreateForm.schema.ts      # Zod schema
│
└── stories/
    └── ComponentName.story.tsx
```

## Public API Pattern

**Component root `index.ts` - Minimal, explicit exports:**

```typescript
/**
 * ComponentName - Public API
 */

// Main component
export { ComponentName } from './ComponentName';

// Public types only
export type { ComponentNameProps } from './ComponentName.types';

// ❌ DON'T export internals:
// - Hooks, sub-components, utils, constants
```

**Why minimal exports?**

- 🌲 Better tree-shaking
- 🔒 Encapsulation
- 📊 Clear versioning obligations
- 🎯 Intentional API design

## Code Organization Layers

### Component-Specific Code

**Location:** `ComponentName/hooks/`, `ComponentName/utils/`, `ComponentName/components/`

- Individual files: `useHookName.ts`, `utilName.ts`
- Tests colocated: `useHookName.test.tsx`
- Used by THIS component only
- Move to workspace level if used by 2+ components

### Workspace-Shared Code

**Location:** `src/lib/`

```
src/lib/
├── hooks/              # Shared hooks (useDebounce, etc.)
├── utils/              # Shared utilities
└── recipientHelpers.ts # Domain helpers
```

- Pure functions, no component-specific logic
- Used by 2+ components
- Framework-agnostic (utils), or shared React hooks

### Forms vs Components

- **Has `.schema.ts`?** → `forms/FormName/`
- **No schema (dialog/confirmation)?** → `components/DialogName/`

## Decision Tree

```
New Code?
  ├─→ Hook?
  │   ├─→ Used by 2+ components? → src/lib/hooks/useHookName.ts
  │   └─→ Used by 1 component? → ComponentName/hooks/useHookName.ts
  │
  ├─→ Utility?
  │   ├─→ Used by 2+ components? → src/lib/utils/utilName.ts
  │   └─→ Used by 1 component? → ComponentName/utils/utilName.ts
  │
  ├─→ Component?
  │   ├─→ Used by 2+ features? → src/components/ComponentName/
  │   └─→ Used by 1 feature? → ComponentName/components/SubComponent/
  │
  ├─→ Form?
  │   ├─→ Has .schema.ts? → ComponentName/forms/FormName/
  │   └─→ No schema? → ComponentName/components/DialogName/
  │
  └─→ index.ts?
      ├─→ Component leaf folder? → NO
      ├─→ hooks/utils folder? → YES (convenience)
      ├─→ components/forms aggregation? → NO (tree-shaking)
      └─→ Module root (public API)? → YES
```

## Examples

### ✅ Modern Component Structure

```
LinkedAccountWidget/
├── index.ts                    # Public API
├── LinkedAccountWidget.tsx
├── LinkedAccountWidget.test.tsx
├── LinkedAccountWidget.types.ts # Public types only
├── hooks/
│   ├── useLinkedAccounts.ts
│   ├── useLinkedAccounts.test.tsx
│   └── index.ts
├── utils/
│   ├── shouldShowCreateButton.ts
│   ├── shouldShowCreateButton.test.ts
│   └── index.ts
├── components/              # NO index files
│   ├── LinkedAccountCard/
│   │   ├── LinkedAccountCard.tsx
│   │   └── LinkedAccountCard.test.tsx
│   └── StatusAlert/
│       ├── StatusAlert.tsx
│       └── StatusAlert.test.tsx
└── forms/                   # NO index files
    └── MicrodepositsForm/
        ├── MicrodepositsForm.tsx
        ├── MicrodepositsForm.test.tsx
        └── MicrodepositsForm.schema.ts
```

### ✅ Workspace-Level Shared

```
src/lib/
├── hooks/
│   ├── useDebounce.ts
│   └── index.ts
├── utils/
│   ├── string.ts
│   └── index.ts
└── recipientHelpers.ts

src/components/
├── ui/
│   ├── button.tsx
│   └── card.tsx
└── BankAccountForm/     # Shared by multiple features
```

## Anti-Patterns

❌ **Aggregation barrel exports**

```typescript
// components/index.ts - DON'T DO THIS
export { Card } from './Card';
export { Skeleton } from './Skeleton';
```

❌ **Generic names in specific places**

```typescript
// LinkedAccountWidget/components/RecipientCard.tsx - TOO GENERIC
// Should be: LinkedAccountCard.tsx
```

❌ **All types in central file**

```typescript
// ComponentName.types.ts - DON'T DO THIS
export interface ComponentNameProps {} // ✅ OK - public API
export interface SubComponentProps {} // ❌ Should be in component
export interface UseHookOptions {} // ❌ Should be in hook
```

❌ **Forms without schemas**

```typescript
// forms/ConfirmDialog/ - WRONG
// Should be: components/ConfirmDialog/
```

## Migration Steps

1. **Split monolithic files:**
   - `ComponentName.hooks.tsx` → `hooks/useHookName.ts` (individual files)
   - `ComponentName.utils.ts` → `utils/utilName.ts` (individual files)
2. **Move tests:** Colocate next to implementation
3. **Remove aggregation barrels:** Delete `components/index.ts`, `forms/index.ts`
4. **Update imports:** Use direct imports
5. **Move types:** Internal types to their files, keep only public API in `.types.ts`
6. **Consolidate shared code:** Root `src/hooks/` → `src/lib/hooks/`

## Key Takeaways

✅ **Individual files** for hooks/utils with colocated tests  
✅ **Direct imports** for components (no aggregation barrels)  
✅ **Type colocation** - only public API in `.types.ts`  
✅ **Minimal public API** - export only what consumers need  
✅ **Start specific** - move to shared only when used by 2+ components  
✅ **Forms = schemas** - no schema? It's a component, not a form
