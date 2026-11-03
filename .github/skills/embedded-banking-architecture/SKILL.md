---
name: embedded-banking-architecture
description: File layout, public API, and code-placement rules for the embedded-components library (src/core/<Component>, hooks/, utils/, components/, forms/, .types.ts, index.ts, generated API code). Use when creating a component, adding hooks, utils, sub-components, or forms, moving code into shared folders, or deciding what a component exports.
license: Apache-2.0
metadata:
  author: jpmorgan-payments
---

# Embedded components architecture

[`embedded-components/ARCHITECTURE.md`](../../../embedded-components/ARCHITECTURE.md) is the source of truth. Read it before creating or reorganizing component code; this skill summarizes it and adds repo facts it doesn't cover.

## Where code goes

| New code | Used by one component | Used by two or more |
| --- | --- | --- |
| Hook | `src/core/<Component>/hooks/useThing.ts` | `src/lib/hooks/useThing.ts` |
| Util | `src/core/<Component>/utils/thing.ts` | `src/lib/utils/thing.ts` |
| UI piece | `src/core/<Component>/components/Thing/Thing.tsx` | `src/components/Thing/` (primitives live in `src/components/ui/`) |
| Form with a Zod schema | `src/core/<Component>/forms/ThingForm/` | - |

Start local; move code to a shared folder only when a second consumer appears. A UI piece without a `.schema.ts` is a component, not a form.

## Component folder

```
src/core/<Component>/
├── index.ts                  # public API only
├── <Component>.tsx
├── <Component>.test.tsx
├── <Component>.types.ts      # public props only
├── <Component>.constants.ts  # optional
├── FUNCTIONAL_REQUIREMENTS.md  # behavior spec, where present
├── hooks/        useX.ts + useX.test.tsx, index.ts barrel allowed
├── utils/        x.ts + x.test.ts, index.ts barrel allowed
├── components/   Sub/Sub.tsx + Sub.test.tsx, no index.ts
├── forms/        Form/Form.tsx + Form.schema.ts + Form.test.tsx
└── stories/      <Component>.story.tsx
```

## Rules

- One hook or util per file, with its test next to it, always inside `hooks/` or `utils/`.
- No aggregation barrels for components: import `./components/Sub/Sub`, not `./components`.
- `<Component>.types.ts` holds only exported props; internal prop and option types live next to the code that uses them.
- The root `index.ts` exports the component and its public types only. Library-level exports are added in `src/index.tsx`.
- Stories use the `.story.tsx` suffix (not `.stories.tsx`).
- When behavior changes, update the component's `FUNCTIONAL_REQUIREMENTS.md` if it has one.

## Generated API code

`src/api/generated/` is produced by Orval from `api-specs/*.yaml` (`orval.config.mjs`). Don't edit it by hand; change the spec or config and run `npm run generate-api`.

- React Query hooks and query-key getters: `@/api/generated/<spec>` (for example `useSmbdoListClients`, `getSmbdoListClientsQueryKey`).
- Request/response types: `@/api/generated/<spec>.schemas`.
- Requests go through `src/api/use-axios-instance.ts`, which applies the provider's `apiBaseUrl`, `headers`, `queryParams`, and `apiBaseUrlTransforms`.

## Pinned majors

Use the APIs of these versions, not newer ones you may know better (exact versions in `embedded-components/package.json`):

| Library | Major | Watch out for |
| --- | --- | --- |
| Tailwind CSS | 3 | Config in `tailwind.config.js` with `prefix: 'eb-'`; no v4 `@theme` or CSS-first config |
| Zod | 3 | v3 API (`z.string().email()`, `errorMap`), not v4 |
| TanStack Query | 5 | Object-form options; Orval generates the hooks |
| React | 18 (peer `^18.2.0 \|\| ^19`) | Must run on both; see `react-patterns` |
| MSW / Vitest / Storybook | 2 / 4 / 10 | |

`app/client-next-ts` is a consumer of this library with its own conventions (unprefixed Tailwind, TanStack Router); see `app/client-next-ts/AGENTS.md`.

## Related skills

- `component-testing` for test structure and MSW.
- `styling-guidelines` for `eb-` classes and tokens.
- `react-patterns` for data fetching, forms, and errors.
