# Testing Guidelines

The agent-facing version, with more detail, is the [`component-testing` skill](../.github/skills/component-testing/SKILL.md).

## Test Organization

- **Colocated tests**: next to the implementation, not in `__tests__/` folders.
- **Naming**: `ComponentName.test.tsx` next to `ComponentName.tsx`, `useHookName.test.tsx` next to `useHookName.ts`, `utilName.test.ts` next to `utilName.ts`.

## Coverage

- Target about **80% line coverage** for new and changed code. `vite.config.mjs` does not enforce a threshold yet (see `plans/006-enforce-coverage-thresholds.md`).
- Run coverage: `npm run test:coverage` (report in `coverage/`).

## Setup Already Provided

- Vitest globals (`describe`, `test`, `expect`, `vi`) and the `jsdom` environment are configured in `vite.config.mjs`.
- `vitest.setup.mjs` starts the MSW server before all tests, resets handlers after each test, and closes it at the end.
- Default handlers: `src/msw/handlers.ts`, backed by the in-memory `src/msw/db.ts`.

## Rendering Pattern

Render inside `EBComponentsProvider`; it creates the React Query client, so don't add a separate `QueryClientProvider`. For a quick wrapper, `render` from `@test-utils` does this for you.

```tsx
import { server } from '@/msw/server';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

const renderComponent = () =>
  render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{ queries: { retry: false } }}
    >
      <ComponentName />
    </EBComponentsProvider>
  );

test('shows an error', async () => {
  server.use(
    http.get('*/accounts', () => HttpResponse.json({}, { status: 500 }))
  );
  renderComponent();
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});
```

Override handlers per test with `server.use(...)`, and match paths with a `*/` prefix so the base URL doesn't matter.

## Running Tests

From `embedded-components/`:

- **Some tests**: `npx vitest run <path-or-pattern>`
- **Watch mode**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`
- **Full pipeline** (what CI runs): `npm test` - typecheck, lint, then Vitest with coverage

## OnboardingFlow

Onboarding uses **Vitest + MSW + RTL** inside `embedded-components` for flow integration (including Bad API parity tests), plus optional **Playwright** smoke tests against the SellSense demo (`app/client-next-ts/tests/e2e/onboarding-flow.spec.ts`). See **`embedded-components/src/core/OnboardingFlow/TESTING.md`** for the full pyramid and commands.

## Before Committing

Follow [Code Quality Workflow](code-quality-workflow.md).
