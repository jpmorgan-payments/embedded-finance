---
name: code-quality-workflow
description: The format, typecheck, lint, test, and build sequence for embedded-components, matching what CI runs, plus how to triage failures. Use after editing .ts or .tsx files (including tests, mocks, and stories), before committing or opening a pull request, or when a typecheck, lint, test, or build step fails locally or in CI.
license: Apache-2.0
metadata:
  author: jpmorgan-payments
---

# Code quality workflow

Run everything from `embedded-components/` with npm (the package has a `package-lock.json`).

CI (`.github/workflows/buildAndTestEBComponents.yml`) runs `npm ci`, then `npm run build`, `npm run test`, and `npm run storybook:build`. A change is ready when those pass locally.

## After editing code

1. **Format only the files you touched:** `npx prettier --write <file> <file>`. Prettier also sorts imports. Avoid `npm run format` unless you mean to reformat every `.ts`/`.tsx` file in the package.
2. **Type check:** `npm run typecheck`. ESLint is not type-aware, so type errors only show up here or in the build.
3. **Lint:** `npm run lint` (`npm run lint:fix` applies safe fixes). If you changed `className` strings, also run `npm run lint:styles`, the slower opt-in check for the `eb-` prefix and class order.
4. **Run the tests you affected:** `npx vitest run <path-or-pattern>`.
5. **Build:** `npm run build`. It runs `tsc` over test files, mocks, and stories as well, and catches typing errors Vitest doesn't (for example a mock with the wrong return type). Run it for test-only changes too.
6. **Before pushing:** `npm test`, which runs `typecheck`, then `lint`, then the full Vitest suite with coverage. It does not check formatting, and neither does CI, so step 1 is the only formatting gate.

For Storybook-related changes, also run `npm run storybook:build`.

## Triage

| Symptom | Likely cause and fix |
| --- | --- |
| Missing properties on a generated type | A mock or payload is typed as a `src/api/generated/*.schemas.ts` type; add the required fields or cast a partial mock through `unknown` (see `component-testing`). |
| Fails only in `npm run build` | A test, mock, or story has a type error; read the `tsc` output path. |
| Timeout | Usually an unmocked request; check MSW handlers before raising timeouts (config default 20 s; `npm test` uses 45 s with one retry). |

## Showcase app

`app/client-next-ts` has its own pipeline (`.github/workflows/buildAndTestShowcase.yml`), which builds embedded-components first and then runs `npm run build` and `npm test` in the app folder. `npm run format:check` is available there but not run by CI. See `app/client-next-ts/AGENTS.md`.
