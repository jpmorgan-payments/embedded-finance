# Component Implementation

## Component Structure

Follow the architecture pattern from `embedded-components/ARCHITECTURE.md`:

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

Component root `index.ts` - Minimal, explicit exports:

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

## Import Patterns

### ✅ CORRECT - Direct imports (tree-shakeable)

```typescript
import { ComponentCard } from "./components/ComponentCard";
import { ComponentSkeleton } from "./components/ComponentSkeleton";
import { useComponentData } from "./hooks"; // Can use barrel for convenience
```

### ❌ WRONG - Aggregation barrel (prevents tree-shaking)

```typescript
import { ComponentCard, ComponentSkeleton } from "./components"; // No index.ts!
```

## Code Organization Decision Tree

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
```

## Hook Patterns

### Individual Hook Files

```typescript
// File: hooks/useComponentData.ts
import { useQuery } from '@tanstack/react-query';

export function useComponentData() {
  return useQuery({
    queryKey: ['component-data'],
    queryFn: () => fetch('/api/data'),
  });
}

// File: hooks/useComponentData.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useComponentData } from './useComponentData';

describe('useComponentData', () => {
  test('fetches data', async () => {
    const { result } = renderHook(() => useComponentData());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// File: hooks/index.ts
export { useComponentData } from './useComponentData';
```

## Utility Patterns

### Individual Util Files

```typescript
// File: utils/formatValue.ts
export function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

// File: utils/formatValue.test.ts
import { formatValue } from './formatValue';

describe('formatValue', () => {
  test('formats numbers correctly', () => {
    expect(formatValue(1000)).toBe('1,000');
  });
});

// File: utils/index.ts
export { formatValue } from './formatValue';
```

## Styling

- Use **Tailwind CSS** classes
- Prefix custom Tailwind classes with `eb-` for embedded components
- Follow design token system
- Maintain responsive design

## Forms vs Components

- **Has `.schema.ts`?** → `forms/FormName/` (Zod schema required)
- **No schema (dialog/confirmation)?** → `components/DialogName/`

## Storybook Stories

```typescript
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ComponentName> = {
  component: ComponentName,
  tags: ['autodocs'],
  // Configuration
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // Props
  },
};
```

## Provider Requirements

Always wrap components with `EBComponentsProvider`:

```typescript
<EBComponentsProvider
  apiBaseUrl="https://api-url"
  theme={{
    colorScheme: "light",
    variables: {
      // Theme variables
    },
  }}
>
  {/* Components */}
</EBComponentsProvider>
```

## Anti-Patterns to Avoid

### ❌ Aggregation barrel exports

```typescript
// components/index.ts - DON'T DO THIS
export { Card } from './Card';
export { Skeleton } from './Skeleton';
```

### ❌ Generic names in specific places

```typescript
// LinkedAccountWidget/components/RecipientCard.tsx - TOO GENERIC
// Should be: LinkedAccountCard.tsx
```

### ❌ All types in central file

```typescript
// ComponentName.types.ts - DON'T DO THIS
export interface ComponentNameProps {} // ✅ OK - public API
export interface SubComponentProps {} // ❌ Should be in component
export interface UseHookOptions {} // ❌ Should be in hook
```

### ❌ Forms without schemas

```typescript
// forms/ConfirmDialog/ - WRONG
// Should be: components/ConfirmDialog/
```
