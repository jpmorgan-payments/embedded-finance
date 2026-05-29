# Component Testing Patterns

**Version 2.0.0**  
J.P. Morgan Payments  
December 2024

> **Note:**  
> This document is mainly for agents and LLMs to follow when writing tests,  
> setting up mocks, or testing API interactions in React components. Humans  
> may also find it useful, but guidance here is optimized for automation  
> and consistency by AI-assisted workflows.

---

## Abstract

Comprehensive testing patterns for React components with MSW, React Query, and Vitest. All components require comprehensive tests with minimum 80% coverage. Tests must be colocated with implementation files.

---

## Test File Requirements

**File naming:** `ComponentName.test.tsx` next to `ComponentName.tsx`

**Basic structure:**

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@test-utils";
import { http, HttpResponse } from "msw";
import { server } from "@/msw/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EBComponentsProvider } from "@/providers/EBComponentsProvider";

// Setup QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Mock data setup
const mockData = {
  // Component-specific mock data
};
```

## Test Setup Helper Function

Always create a `renderComponent` helper:

```typescript
const renderComponent = (props = {}) => {
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
      contentTokens={{ name: "enUS" }}
    >
      <QueryClientProvider client={queryClient}>
        <ComponentName {...props} />
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};
```

## Test Structure

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

## MSW API Mocking Patterns

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
      return HttpResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
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

## Context and Provider Testing

```typescript
// For components using multiple contexts
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <EBComponentsProvider apiBaseUrl="/" headers={{}}>
      <FeatureContextProvider value={mockFeatureContext}>
        <QueryClientProvider client={queryClient}>
          {ui}
        </QueryClientProvider>
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

## Testing Best Practices

1. **Test component rendering** with different prop combinations
2. **Verify user interactions** and their effects
3. **Test error states** and loading states
4. **Ensure proper API interaction** handling
5. **Test accessibility features** (ARIA, keyboard nav)
6. **Cover edge cases** and validation scenarios

## Test Coverage Requirements

- ✅ Minimum 80% line coverage
- ✅ Cover all user interaction paths
- ✅ Test all API integration points
- ✅ Verify error handling and edge cases
- ✅ Test accessibility features
- ✅ Include integration tests for complex flows

## Query Key Management

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSmbdoGetClientQueryKey } from "@/api/generated/smbdo";

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => api.post("/endpoint", data),
  onSuccess: (response) => {
    // Invalidate related queries
    queryClient.invalidateQueries({
      queryKey: getSmbdoGetClientQueryKey(clientId),
    });
  },
});
```

## Common Patterns

### Testing Forms

```typescript
test("validates form inputs", async () => {
  renderComponent();

  const input = screen.getByLabelText(/email/i);
  await userEvent.type(input, "invalid-email");

  await userEvent.click(screen.getByRole("button", { name: /submit/i }));

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

### Testing Loading States

Use skeleton components, never "Loading..." text:

```typescript
test("shows loading state", async () => {
  renderComponent();

  // Check for skeleton loader
  expect(screen.getByTestId("skeleton")).toBeInTheDocument();

  // Wait for data to load
  await waitFor(() => {
    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
  });
});
```

### Testing Error States

Always use ServerErrorAlert component:

```typescript
test("displays error alert", async () => {
  server.use(
    http.get("/api/endpoint", () => {
      return HttpResponse.json(
        { error: "Server error" },
        { status: 500 }
      );
    })
  );

  renderComponent();

  await waitFor(() => {
    expect(screen.getByText(/server error/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
```

## Running Tests

**After ANY code change, you MUST:**

```powershell
cd embedded-components
yarn test
```

This runs: typecheck → format:check → lint → test:unit

**Quick fix commands:**

```powershell
cd embedded-components
yarn format          # Auto-fix formatting
yarn lint:fix        # Auto-fix linting
yarn typecheck       # Check types only
yarn test:unit       # Run tests only
```

## Never Commit Code With

- ❌ TypeScript errors
- ❌ Formatting errors (Prettier)
- ❌ Linting errors
- ❌ Failing tests

## References

- See `embedded-components/ARCHITECTURE.md` for architecture patterns
- See `.github/skills/code-quality-workflow/` for testing workflows
- See individual rule files in `rules/` directory for specific patterns
