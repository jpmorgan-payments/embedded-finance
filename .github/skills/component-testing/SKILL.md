---
name: component-testing
description: Vitest, React Testing Library, and MSW patterns for embedded-components tests - EBComponentsProvider wrapper, @test-utils, server.use handler overrides, and typed mocks of generated API schemas. Use when writing, fixing, or reviewing *.test.ts(x) files, mocking API calls, or resolving type or lint errors that only appear in tests.
license: Apache-2.0
metadata:
  author: jpmorgan-payments
---

# Component testing

## What's already set up

- Vitest globals are on (`describe`, `test`, `expect`, `vi` need no import), environment `jsdom`.
- `vitest.setup.mjs` starts the MSW `server` before all tests, resets handlers after each test, and closes it at the end. Don't call `server.listen()` yourself.
- Default handlers live in `src/msw/handlers.ts` and are backed by the in-memory `src/msw/db.ts`.
- Tests sit next to the file they test: `Thing.tsx` and `Thing.test.tsx`.

## Rendering

For a quick render inside the provider, use `render` from `@test-utils` (it also re-exports Testing Library and `userEvent`).

When you need provider props such as content tokens or no retries, wrap explicitly. `EBComponentsProvider` owns the React Query client, so don't add a separate `QueryClientProvider`:

```tsx
import { server } from '@/msw/server';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import type { ListAccountsResponse } from '@/api/generated/ep-accounts.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { Accounts } from './Accounts';
import type { AccountsProps } from './Accounts.types';

const renderComponent = (props: Partial<AccountsProps> = {}) =>
  render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{ queries: { retry: false } }}
    >
      <Accounts allowedCategories={['LIMITED_DDA']} {...props} />
    </EBComponentsProvider>
  );

test('shows the empty state', async () => {
  const empty: ListAccountsResponse = {
    metadata: { page: 0, limit: 25, total_items: 0 },
    items: [],
  };
  server.use(http.get('*/accounts', () => HttpResponse.json(empty)));

  renderComponent();

  expect(await screen.findByText(/no accounts found/i)).toBeInTheDocument();
});
```

## MSW overrides

- Override per test with `server.use(...)`; the reset after each test restores the defaults.
- Match with a `*/` prefix (`'*/accounts'`, `'*/clients/:id'`) so the base URL doesn't matter.
- Error state: `HttpResponse.json({ title: 'Server error' }, { status: 500 })`.
- Loading state: return a promise that never resolves, `() => new Promise(() => {})`.

## Mocks of generated types

`src/api/generated/*.schemas.ts` types have many required fields, and `npm run typecheck` and `npm run build` check test files too.

- For a partial mock, cast through `unknown`: `{ id: 'r1', status: 'ACTIVE' } as unknown as Recipient`.
- If you annotate a mock with a type (`const r: Recipient = ...`), include every required field.
- For arrays assigned to mutable types, use `['ACH'] as PaymentMethodType[]`, not `as const`.

## What to cover

Loading (`Skeleton`), empty, error (`ServerErrorAlert` renders `role="alert"` and a retry action), and success states, plus the interactions and validation messages a user hits.

New and changed code should reach about 80% line coverage. This is a team target; `vite.config.mjs` doesn't enforce a threshold yet.

## Running tests

From `embedded-components/`:

```bash
npx vitest run src/core/Accounts      # while iterating
npm run test:coverage                 # coverage report in coverage/
npm test                              # full pipeline CI runs
```

For the onboarding flow's integration and scenario tests, see `src/core/OnboardingFlow/TESTING.md`. The `code-quality-workflow` skill covers the full pre-commit sequence.
