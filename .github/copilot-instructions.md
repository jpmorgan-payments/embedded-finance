# GitHub Copilot Instructions for Embedded Finance Components

## Repository Overview

This is a monorepo architecture with the following structure:

```
/
├── app/                    # Showcase web application (not active)
│   ├── client/            # Frontend React application
│   └── server/            # Backend server
├── embedded-components/    # Main UI component library (active)
│   ├── src/               # Source code
│   ├── .storybook/        # Storybook configuration
│   ├── dist/              # Built files (not in repo)
│   └── public/            # Static assets and MSW worker
└── embedded-finance-sdk/   # TypeScript SDK utilities (not active)
```

> **Active Development**: Focus on `embedded-components` package. Other packages are for future development.

## Technology Stack

When suggesting code, use these technologies:

- React 18.x with TypeScript (strict mode)
- Radix UI primitives for base components
- Tailwind CSS for styling
- Tanstack React Query v5 for data fetching
- Zod for validation
- MSW for API mocking
- Storybook 8.x for component development

## Code Generation Guidelines

### Component Structure

Always generate components following this structure:

```typescript
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.test.tsx     # Tests
├── ComponentName.story.tsx    # Storybook
├── ComponentName.schema.ts    # Validation schema (if needed)
└── index.ts                  # Exports
```

### Component Implementation

1. **TypeScript**:

   - Use strict mode
   - Define explicit interfaces for props
   - Use proper type imports
   - No 'any' types

2. **React Patterns**:

   ```typescript
   import { FC } from "react";

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

3. **Styling**:

   - Use Tailwind CSS classes
   - Follow design token system
   - Maintain responsive design
   - Example:
     ```typescript
     <div className="flex items-center space-x-4 p-4 rounded-lg bg-white shadow-sm">
     ```

4. **Data Fetching**:

   ```typescript
   import { useQuery } from "@tanstack/react-query";

   const { data, isLoading } = useQuery({
     queryKey: ["key"],
     queryFn: () => fetch("/api/endpoint"),
   });
   ```

5. **Validation**:

   ```typescript
   import { z } from "zod";

   export const schema = z.object({
     // Schema definition
   });
   ```

### Testing Requirements

Generate comprehensive tests that cover component functionality, API interactions, and user flows. Follow these patterns:

1. **Test Setup and Utilities**:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@test-utils";
import { http, HttpResponse } from "msw";
import { server } from "@/msw/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Setup QueryClient for tests
const queryClient = new QueryClient();

// Mock data setup
const mockData = {
  // Component-specific mock data
};

// Mock context if needed
const mockContext = {
  // Context-specific mock data
};
```

2. **Component Rendering Helper**:

```typescript
const renderComponent = () => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  // Setup explicit API mock handlers
  server.use(
    http.get("/api/endpoint", () => {
      return HttpResponse.json(mockData);
    })
  );

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{
        name: "enUS",
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ComponentName />
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};
```

3. **Test Structure**:

```typescript
describe("ComponentName", () => {
  // Mock external dependencies
  vi.mock("@/components/ui/someComponent", () => ({
    useSomeHook: () => ({ someFunction: vi.fn() }),
  }));

  test("renders correctly with initial data", async () => {
    renderComponent();

    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByText(/expected text/i)).toBeInTheDocument();
    });
  });

  test("handles user interactions", async () => {
    renderComponent();

    // Simulate user actions
    await userEvent.click(screen.getByRole("button", { name: /action/i }));

    // Verify state changes
    expect(screen.getByText(/new state/i)).toBeInTheDocument();
  });

  test("handles API interactions", async () => {
    // Setup specific API mock for this test
    server.use(
      http.post("/api/endpoint", () => {
        return HttpResponse.json({ success: true });
      })
    );

    renderComponent();

    // Trigger API call
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    // Verify API interaction results
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

4. **Testing Best Practices**:

   - Test component rendering with different prop combinations
   - Verify user interactions and their effects
   - Test error states and loading states
   - Ensure proper API interaction handling
   - Test accessibility features
   - Cover edge cases and validation scenarios

5. **MSW API Mocking Patterns**:

```typescript
// Setup mock handlers
server.use(
  // GET requests
  http.get("/api/resource/:id", ({ params }) => {
    return HttpResponse.json(mockData[params.id]);
  }),

  // POST requests with response validation
  http.post("/api/resource", async ({ request }) => {
    const body = await request.json();
    if (!isValidData(body)) {
      return HttpResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return HttpResponse.json({ success: true });
  }),

  // Error scenarios
  http.get("/api/error-case", () => {
    return HttpResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  })
);
```

6. **Context and Provider Testing**:

```typescript
// For components using multiple contexts
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <EBComponentsProvider apiBaseUrl="/" headers={{}}>
      <FeatureContextProvider value={mockFeatureContext}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </FeatureContextProvider>
    </EBComponentsProvider>
  );
};

// Testing context updates
test("responds to context changes", async () => {
  const { rerender } = renderWithProviders(<ComponentName />);

  // Verify initial state
  expect(screen.getByText(/initial/i)).toBeInTheDocument();

  // Rerender with new context
  rerender(
    <FeatureContextProvider value={newMockContext}>
      <ComponentName />
    </FeatureContextProvider>
  );

  // Verify updated state
  expect(screen.getByText(/updated/i)).toBeInTheDocument();
});
```

7. **Test Coverage Requirements**:
   - Minimum 80% line coverage
   - Cover all user interaction paths
   - Test all API integration points
   - Verify error handling and edge cases
   - Test accessibility features
   - Include integration tests for complex flows

### Storybook Stories

Generate stories as:

```typescript
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof ComponentName> = {
  component: ComponentName,
  tags: ["autodocs"],
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

## Best Practices

1. **Error Handling**:

   ```typescript
   try {
     // Operation
   } catch (error) {
     if (error instanceof ApiError) {
       // Handle API errors
     }
     // Handle other errors
   }
   ```

2. **Accessibility**:

   - Include ARIA attributes
   - Ensure keyboard navigation
   - Maintain proper contrast ratios
   - Example:
     ```typescript
     <button
       aria-label="Action description"
       role="button"
       tabIndex={0}
     >
     ```

3. **Performance**:

   - Use React.memo for expensive components
   - Implement proper dependencies in useEffect
   - Use React.lazy for code splitting

4. **Documentation**:
   ```typescript
   /**
    * Component description
    * @param {ComponentNameProps} props - The component props
    * @returns {JSX.Element} The rendered component
    */
   ```

## Common Patterns

1. **Form Handling**:

   ```typescript
   import { useForm } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";

   const form = useForm({
     resolver: zodResolver(schema),
   });
   ```

2. **API Integration**:

   ```typescript
   import { useMutation } from "@tanstack/react-query";

   const mutation = useMutation({
     mutationFn: (data) => api.post("/endpoint", data),
   });
   ```

3. **Theme Usage**:

   ```typescript
   import { useTheme } from "@/hooks/useTheme";

   const { theme } = useTheme();
   ```

Remember to maintain consistency with existing codebase patterns and follow the established project structure.
