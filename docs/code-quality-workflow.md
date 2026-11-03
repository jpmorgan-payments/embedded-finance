# Code Quality Workflow

Run these from `embedded-components/` after changing `.ts` or `.tsx` files, including tests, mocks, and stories. The agent-facing version is the [`code-quality-workflow` skill](../.github/skills/code-quality-workflow/SKILL.md).

CI (`.github/workflows/buildAndTestEBComponents.yml`) runs `npm ci`, `npm run build`, `npm run test`, and `npm run storybook:build`. If those pass locally, CI should too.

## Sequence

```powershell
cd embedded-components
npx prettier --write <changed files>   # format only what you touched; also sorts imports
npm run typecheck                      # ESLint isn't type-aware, so types are checked here
npm run lint                           # npm run lint:fix for safe auto-fixes
npm run lint:styles                    # only if you changed class names (slow; eb- prefix rules)
npx vitest run <affected paths>        # fast feedback on the tests you touched
npm run build                          # tsc also checks tests, mocks, and stories
npm test                               # typecheck + lint + full Vitest run with coverage
```

`npm run format` rewrites every `.ts`/`.tsx` file in the package, so use it only when you intend to. Neither `npm test` nor CI checks formatting; run `npm run format:check` if you want to confirm.

## Fixing failures

Fix in this order: type errors, lint errors, test failures, then build errors. Earlier failures often cause later ones.

- **Generated API types:** mocks typed as `src/api/generated/*.schemas.ts` types need every required field, or a cast through `unknown` for partial mocks.
- **Build-only failures:** usually a type error in a test, mock, or story; the `tsc` output names the file.
- **Lint:** fix the code rather than adding `eslint-disable` comments.
- **Tests:** check MSW handlers and async queries (`findBy*`, `waitFor`) before raising timeouts.

Re-run until every step passes.

## Never commit code with

- TypeScript errors
- Build failures
- Lint errors
- Failing tests
- Unformatted files you touched
