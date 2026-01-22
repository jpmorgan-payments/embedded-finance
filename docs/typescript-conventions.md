# TypeScript Conventions

## Type Safety

- **Strict mode enabled**: TypeScript strict mode is required
- **No 'any' types**: Explicit types required for all code
- **Explicit prop interfaces**: Use interfaces with JSDoc comments for component props

## Type Colocation

### Public API Types

**Location**: `ComponentName.types.ts`

Only export public API types (component props that consumers need):

```typescript
// ComponentName.types.ts
export interface ComponentNameProps {
  /** Description of prop */
  propName: string;
}
```

### Internal Types

**Location**: Colocated with implementation

- **Component files**: Internal component props/interfaces
- **Hook files**: Hook options, return types
- **Util files**: Inline parameter types

```typescript
// ✅ Internal types in component file
// components/SubComponent.tsx
interface SubComponentProps {
  // Internal props
}

// ✅ Hook types in hook file
// hooks/useHook.ts
interface UseHookOptions {
  // Hook options
}
export function useHook(options: UseHookOptions) { ... }
```

## Import Patterns

### Type Imports

Use `type` keyword for type-only imports:

```typescript
import type { ComponentNameProps } from './ComponentName.types';
import { ComponentName } from './ComponentName';
```

## React Patterns

### Component Props

```typescript
import { FC } from 'react';

export interface ComponentNameProps {
  /** Clear prop definitions with JSDoc comments */
  propName: string;
}

export const ComponentName: FC<ComponentNameProps> = ({
  // Destructured props
}) => {
  // Implementation
};
```

## Code Style

- **Single quotes preferred** for strings
- **Explicit return types** for exported functions
- **JSDoc comments** for public APIs
