---
name: react-patterns
description: React 18 patterns, hooks best practices, component composition, and optimization techniques. Use when creating hooks, optimizing performance, or following React patterns. Keywords - React, hooks, useState, useEffect, useMemo, useCallback, patterns, composition.
compatibility: Designed for React 18.x with TypeScript, React Query v5
metadata:
  version: "2.0.0"
  author: jpmorgan-payments
  lastUpdated: "2025-12-24"
  priority: high
---

# React Patterns

## Component Patterns

### Functional Components

```typescript
import { FC } from "react";

export interface ComponentNameProps {
  /** Clear prop description */
  title: string;
  /** Optional prop with default */
  variant?: "default" | "compact";
  /** Callback handlers */
  onAction?: () => void;
}

export const ComponentName: FC<ComponentNameProps> = ({
  title,
  variant = "default",
  onAction,
}) => {
  // Implementation
  return <div>{title}</div>;
};
```

### Component Composition

Use props to control visibility and enable composition:

```typescript
type ComponentProps = {
  hideActions?: boolean;
  customComponent?: React.ReactNode;
  variant?: "default" | "compact";
  children?: React.ReactNode;
};

export const Component: FC<ComponentProps> = ({
  hideActions = false,
  customComponent,
  variant = "default",
  children,
}) => {
  return (
    <div>
      {children}
      {!hideActions && <ActionButtons />}
      {customComponent}
    </div>
  );
};
```

## Hook Patterns (Modern 2025)

### Individual Hook Files

```typescript
// ✅ CORRECT - Individual hook files
// File: hooks/useComponentData.ts
import { useQuery } from "@tanstack/react-query";

export function useComponentData(id: string) {
  return useQuery({
    queryKey: ["component-data", id],
    queryFn: () => fetch(`/api/data/${id}`),
  });
}

// File: hooks/useComponentData.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { useComponentData } from "./useComponentData";

describe("useComponentData", () => {
  test("fetches data", async () => {
    const { result } = renderHook(() => useComponentData("123"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// File: hooks/index.ts
export { useComponentData } from "./useComponentData";
export { useComponentForm } from "./useComponentForm";
```

### Custom Hooks

```typescript
import { useState, useCallback, useEffect } from "react";

interface UseToggleReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useToggle(initialValue = false): UseToggleReturn {
  const [isOpen, setIsOpen] = useState(initialValue);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
```

### Data Fetching with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSmbdoGetClientQueryKey } from "@/api/generated/smbdo";

// Query
export function useAccountData(accountId: string) {
  return useQuery({
    queryKey: ["account", accountId],
    queryFn: () => fetch(`/api/accounts/${accountId}`).then((r) => r.json()),
    enabled: !!accountId, // Only run if accountId exists
  });
}

// Mutation with cache invalidation
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountData) => 
      fetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (response, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["account", variables.id],
      });
    },
  });
}
```

## Form Handling

### Basic Form Setup

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required"),
});

type FormData = z.infer<typeof formSchema>;

export const FormComponent: FC = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // Validates on blur for better UX
    reValidateMode: "onBlur",
  });

  const onSubmit = (data: FormData) => {
    // Handle submission
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

### Discriminated Union Schemas

For conditional validation:

```typescript
import { z } from "zod";

const baseSchema = z.object({
  commonField: z.string(),
});

export const formSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("INDIVIDUAL"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
  }).merge(baseSchema),
  z.object({
    type: z.literal("ORGANIZATION"),
    businessName: z.string().min(1, "Business name is required"),
  }).merge(baseSchema),
]);
```

## State Management

### Local State

```typescript
import { useState } from "react";

export const Component: FC = () => {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  // Update state
  setCount((prev) => prev + 1);
  setUser({ id: 1, name: "John" });
};
```

### Complex State

```typescript
import { useReducer } from "react";

type State = {
  data: Data[];
  isLoading: boolean;
  error: Error | null;
};

type Action =
  | { type: "LOADING" }
  | { type: "SUCCESS"; payload: Data[] }
  | { type: "ERROR"; error: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADING":
      return { ...state, isLoading: true, error: null };
    case "SUCCESS":
      return { ...state, isLoading: false, data: action.payload };
    case "ERROR":
      return { ...state, isLoading: false, error: action.error };
    default:
      return state;
  }
}

export const Component: FC = () => {
  const [state, dispatch] = useReducer(reducer, {
    data: [],
    isLoading: false,
    error: null,
  });
};
```

## Performance Optimization

### Memoization

```typescript
import { useMemo, useCallback } from "react";

export const Component: FC<Props> = ({ data, onAction }) => {
  // Memoize expensive computations
  const processedData = useMemo(() => {
    return data.map((item) => expensiveOperation(item));
  }, [data]);

  // Memoize callbacks
  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);

  return <div onClick={handleClick}>{processedData}</div>;
};
```

### React.memo

```typescript
import { memo } from "react";

export const ExpensiveComponent = memo<Props>(({ data }) => {
  // Component only re-renders if props change
  return <div>{data}</div>;
});
```

## Side Effects

### useEffect Best Practices

```typescript
import { useEffect } from "react";

export const Component: FC = () => {
  // Run once on mount
  useEffect(() => {
    console.log("Component mounted");
    
    // Cleanup on unmount
    return () => {
      console.log("Component unmounted");
    };
  }, []);

  // Run when dependencies change
  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
    }
  }, [userId]);

  // Avoid: Missing dependencies
  useEffect(() => {
    // ❌ Missing dependency warning
    doSomething(prop);
  }, []); // Should include [prop]
};
```

## Error Handling

### Error Boundaries

```typescript
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

### API Error Handling

Always use ServerErrorAlert for API errors:

```typescript
import { ServerErrorAlert } from "@/core/OnboardingFlow/components/ServerErrorAlert";

<ServerErrorAlert
  error={apiError}
  customErrorMessage={{
    "400": "Please check the information you entered.",
    "401": "Please log in and try again.",
    "500": "An unexpected error occurred.",
    default: "An unexpected error occurred.",
  }}
  tryAgainAction={() => refetch()}
/>
```

## Context Patterns

```typescript
import { createContext, useContext, FC, ReactNode } from "react";

interface ThemeContext {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContext | undefined>(undefined);

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

## Best Practices

1. **Use TypeScript** - Strict mode, explicit types
2. **Functional components** - Always use FC with explicit props
3. **Individual hook files** - One hook per file with colocated tests
4. **Memoize appropriately** - useMemo for expensive computations, useCallback for callbacks passed to children
5. **Handle cleanup** - Always return cleanup function in useEffect
6. **Provide types** - Export interfaces for all props
7. **Component composition** - Build complex UI from simple components
8. **Error boundaries** - Wrap components that might throw

## Anti-Patterns to Avoid

❌ Using class components (use functional components)  
❌ Missing dependencies in useEffect  
❌ Not memoizing expensive computations  
❌ Prop drilling (use context or composition)  
❌ Mutating state directly  
❌ Using any type  
❌ Not handling loading/error states  

## References

- See `embedded-components/ARCHITECTURE.md` for file structure
- See `.github/copilot-instructions.md` for complete React patterns
