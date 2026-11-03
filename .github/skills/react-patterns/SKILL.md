---
name: react-patterns
description: React conventions specific to embedded-components - Orval-generated React Query hooks and query keys, react-hook-form with translated Zod schema hooks, ServerErrorAlert and useServerError, Skeleton loading, shared hooks, user-event tracking, and React 18/19 compatibility. Use when writing or refactoring components, hooks, data fetching, mutations, or forms in embedded-components.
license: Apache-2.0
metadata:
  author: jpmorgan-payments
---

# React patterns

Where files go is covered by `embedded-banking-architecture`; this skill covers how the code inside them is written.

## Data fetching

Use the Orval-generated React Query hooks; don't hand-write `fetch` or axios calls. Generated requests go through `src/api/use-axios-instance.ts`, which applies the provider's `apiBaseUrl`, `headers`, `queryParams`, and `apiBaseUrlTransforms`.

```tsx
import { useQueryClient } from '@tanstack/react-query';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoGetClient,
  useSmbdoUpdateClient,
} from '@/api/generated/smbdo';

const { data: client, status, error, refetch } = useSmbdoGetClient(clientId, {
  query: { enabled: Boolean(clientId) },
});

const queryClient = useQueryClient();
const { mutate: updateClient } = useSmbdoUpdateClient({
  mutation: {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getSmbdoGetClientQueryKey(clientId),
      }),
  },
});
```

- Invalidate with the generated `get…QueryKey` helpers, never hand-built arrays.
- Put mapping or merging of API data in a component hook (for example `TransactionsDisplay/hooks/useTransactionsData.ts`) rather than in the component.
- Generated types come from `@/api/generated/<spec>.schemas`.

## Loading and errors

- Loading: `Skeleton` from `@/components/ui/skeleton`.
- API errors: `ServerErrorAlert` from `@/components/ServerErrorAlert`, with `error`, optional `customErrorMessage` (a node or a map by status such as `{ '400': ..., default: ... }`), and `tryAgainAction={refetch}`.
- Custom error UI: `useServerError(error)` from the same module returns the parsed status, title, and reasons.

## Forms

react-hook-form with `zodResolver` and **Zod 3**. A form's schema lives next to it in `forms/<Form>/<Form>.schema.ts` and is exposed as a hook, so validation messages can be translated:

```ts
// OnboardingFlow/forms/personal-section-forms/ContactDetailsForm/ContactDetailsForm.schema.ts
export const useContactDetailsFormSchema = () => {
  const v = useGetValidationMessage(); // OnboardingFlow helper over i18n
  return z.object({
    controllerEmail: z
      .string()
      .min(1, v('controllerEmail', 'required'))
      .email(v('controllerEmail', 'invalid')),
  });
};
```

Outside OnboardingFlow, build messages with `tString` from `useTranslationWithTokens`. Cross-field rules go in a separate `refine<Form>Schema` function next to the schema hook.

## Shared building blocks

- `useDialogState()` from `@/lib/hooks` for open/close state.
- `useLocale()` from `@/lib/hooks` for formatting (see `i18n-l10n`).
- `useUserEventTracking({ containerId, userEventsHandler })` from `@/lib/utils/userTracking` wires up the public `userEventsHandler` prop so partners can send user-journey events to their RUM tools. Wire it up in new public components.
- Text always goes through `useTranslationWithTokens` (see `i18n-l10n`).

## React 18 and 19

Development uses React 18, but the peer range is `^18.2.0 || ^19`, so code must run on both: no React 19-only APIs (`use`, `useActionState`, `useOptimistic`, `ref` as a prop) and nothing removed in 19 (`defaultProps` on function components, string refs).
