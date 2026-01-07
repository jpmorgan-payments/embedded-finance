# Embedded Components - Package-Specific Instructions

## ⚠️ CRITICAL: Follow ARCHITECTURE.md

**All code generation MUST follow the patterns defined in `ARCHITECTURE.md`.**

**Before generating any component code, review `ARCHITECTURE.md` for the complete pattern.**

## Setup Commands

- Install dependencies: `yarn install`
- Start development server: `yarn dev`
- Run Storybook: `yarn storybook`
- Run tests: `yarn test`
- Run tests in watch mode: `yarn test:watch`
- Type checking: `yarn typecheck`
- Linting: `yarn lint`
- Format code: `yarn prettier`

## Component Location

New components must be placed in `src/core/` following the architecture pattern.

## Architecture Principles

### 1. Individual Hook/Util Files

- Each hook/util in its own file: `useHookName.ts`, `utilName.ts`
- Always use `hooks/` and `utils/` directories, even for single files
- Tests colocated: `useHookName.test.tsx` next to `useHookName.ts`

### 2. Type Colocation

- **Central `.types.ts`**: ONLY public API (exported component props)
- **Component files**: Internal component props/interfaces
- **Hook files**: Hook options, return types
- **Util files**: Inline parameter types

### 3. No Aggregation Barrels

- ❌ No `components/index.ts` exporting all components
- ✅ Direct imports for tree-shaking
- ✅ Barrel exports only for: `hooks/index.ts`, `utils/index.ts`, component root `index.ts`

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

## Code Organization

### Component-Specific Code

**Location:** `ComponentName/hooks/`, `ComponentName/utils/`, `ComponentName/components/`

- Individual files: `useHookName.ts`, `utilName.ts`
- Tests colocated: `useHookName.test.tsx`
- Used by THIS component only
- Move to workspace level if used by 2+ components

### Workspace-Shared Code

**Location:** `src/lib/`

- Pure functions, no component-specific logic
- Used by 2+ components
- Framework-agnostic (utils), or shared React hooks

### Forms vs Components

- **Has `.schema.ts`?** → `forms/FormName/`
- **No schema (dialog/confirmation)?** → `components/DialogName/`

## Technology Stack

- React 18.x with TypeScript (strict mode)
- Radix UI primitives for base components
- Tailwind CSS with `eb-` prefix for custom classes
- Tanstack React Query v5 for data fetching
- Zod for validation schemas
- MSW for API mocking in tests and development
- Storybook 10.x for component development

## Component Implementation

### TypeScript

- Use strict mode
- Define explicit interfaces for props
- Use proper type imports
- No 'any' types

### React Patterns

```typescript
import { FC } from 'react';

export interface ComponentNameProps {
  // Clear prop definitions with JSDoc comments
}

export const ComponentName: FC<ComponentNameProps> = (
  {
    // Destructured props
  }
) => {
  // Implementation
};
```

### Hook Patterns (Modern 2025)

```typescript
// ✅ CORRECT - Individual hook files
// File: hooks/useComponentData.ts
import { useQuery } from '@tanstack/react-query';
// File: hooks/useComponentData.test.tsx
import { renderHook, waitFor } from '@testing-library/react';

import { useComponentData } from './useComponentData';

export function useComponentData() {
  return useQuery({
    queryKey: ['component-data'],
    queryFn: () => fetch('/api/data'),
  });
}

describe('useComponentData', () => {
  test('fetches data', async () => {
    const { result } = renderHook(() => useComponentData());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// File: hooks/index.ts
export { useComponentData } from './useComponentData';
export { useComponentForm } from './useComponentForm';
```

### Utility Patterns (Modern 2025)

```typescript
// File: utils/formatValue.test.ts
import { formatValue } from './formatValue';

// ✅ CORRECT - Individual util files
// File: utils/formatValue.ts
export function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

describe('formatValue', () => {
  test('formats numbers correctly', () => {
    expect(formatValue(1000)).toBe('1,000');
  });
});

// File: utils/index.ts
export { formatValue } from './formatValue';
export { validateInput } from './validateInput';
```

## Styling

- Use Tailwind CSS classes
- Prefix custom Tailwind classes with `eb-` for embedded components
- Follow design token system
- Maintain responsive design

## Testing Instructions

- Tests colocated with implementation
- One test file per implementation file
- Minimum 80% line coverage
- Use MSW for API mocking
- Always run tests before committing: `yarn test`
- Run type checking: `yarn typecheck`
- Run linting: `yarn lint`

### Test Setup Pattern

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@test-utils";
import { http, HttpResponse } from "msw";
import { server } from "@/msw/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderComponent = () => {
  server.resetHandlers();

  server.use(
    http.get("/api/endpoint", () => {
      return HttpResponse.json(mockData);
    })
  );

  return render(
    <EBComponentsProvider apiBaseUrl="/" headers={{}} contentTokens={{ name: "enUS" }}>
      <QueryClientProvider client={queryClient}>
        <ComponentName />
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};
```

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

Always wrap components with EBComponentsProvider:

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

## Before Committing

Always run these checks:

1. `yarn typecheck` - TypeScript validation
2. `yarn lint` - Linting
3. `yarn test` - All tests passing
4. `yarn prettier` - Code formatting
