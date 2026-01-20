# Testing Guidelines

## Test Organization

- **Colocated tests**: Tests must be next to implementation files (not in separate `__tests__/` directories)
- **One test file per implementation**: `ComponentName.test.tsx` next to `ComponentName.tsx`
- **Hook tests**: `useHookName.test.tsx` next to `useHookName.ts`
- **Util tests**: `utilName.test.ts` next to `utilName.ts`

## Coverage Requirements

- **Minimum 80% line coverage** required
- Run coverage: `yarn test:coverage`

## API Mocking

Use **MSW (Mock Service Worker)** for API mocking in tests and development.

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

## Provider Requirements in Tests

Always wrap components with `EBComponentsProvider` in tests:

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

## Running Tests

- **Full test suite**: `yarn test` (includes typecheck, format, lint)
- **Tests only**: `yarn test:unit`
- **Watch mode**: `yarn test:watch`
- **Coverage**: `yarn test:coverage`

## Before Committing

Always run the full quality check:

```powershell
cd embedded-components
yarn format
yarn test
```
