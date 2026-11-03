# Embedded Components — Technical Debt & Dependency Backlog

**Last verified:** 2026-11-02 against v0.17.18, plus later `develop` changes through v0.17.21
**Updated:** 2026-11-02 for the v0.18.0 work — Zod 4 and `@hookform/resolvers` 5 landed; module-boundary, file-size, hook-ratchet and hook-test figures refreshed in TD-2, TD-4, BL-505-N5 and TD-5b.
**Method:** `npm run lint` (JSON report), `npm run typecheck`, full `vitest run`, `npm outdated`, `npm audit`, upstream peer-range checks (`npm view`), static code audit with an independent second-opinion review. Line numbers are as of v0.17.18.
**Companion:** [BACKLOG.md](./BACKLOG.md) holds product, UX, accessibility and release-gate items plus the **cross-file priority index**. This file holds tooling, dependencies, architecture, typing and test infrastructure.

---

## Conventions

- **Stable IDs.** Legacy `BL-50x` IDs are retained. New debt uses `TD-n`. New dependency majors continue the `BL-508-*` namespace. IDs never encode priority.
- **Closing an item:** move it to [Closed & merged](#closed--merged-register) with the date and commit/PR. Do not delete IDs silently and do not reuse them.
- **Per item:** Priority · Size (S/M/L) · Verified (date/method) · Acceptance.
- Priority legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low. Status: 📋 Planned · 🚧 In progress · ⏸️ Deferred/blocked.

---

## Baseline metrics (2026-11-02)

| Metric                                                                 | Value                                                                                                                                                 | Notes                                                                                                                                                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint                                                                 | **0 errors / 40 warnings**                                                                                                                            | 35 `no-explicit-any` (OnboardingFlow 17, IndirectOwnership 12, RecipientWidgets 6); 5 `exhaustive-deps` (IndirectOwnership 4, RecipientWidgets 1). Was ~540 in July. |
| `rules-of-hooks` ratchets                                              | **9**                                                                                                                                                 | Unchanged since July — see BL-505-N5                                                                                                                                 |
| Escape hatches (production `src`, excl. generated/tests/stories/mocks) | 71 `eslint-disable` (43 `exhaustive-deps`), **117 `as unknown as`**, 22 `: any`, 3 `as any`, 6 `@ts-expect-error`, 0 `@ts-ignore`, 2 blanket disables | See TD-3                                                                                                                                                             |
| Typecheck                                                              | Clean, ~61 s                                                                                                                                          | `tsc --noEmit`                                                                                                                                                       |
| Unit tests                                                             | **217 files · 2,081 passed · 1 skipped · 0 failed**                                                                                                   | **1,025 s** locally; cumulative setup 3,694 s vs test execution 571 s — see TD-11                                                                                    |
| Coverage                                                               | **Unknown**                                                                                                                                           | `coverage/` artifact is from 2026-07-07 (20.6 %, likely a partial run); `docs/COVERAGE_IMPROVEMENT_PLAN.md` cites 71.9 % (June) — see TD-5a                          |
| `npm audit`                                                            | **Not functional in CI**                                                                                                                              | The configured package registry does not serve the npm advisories endpoint — see TD-7                                                                                |
| Source size                                                            | 878 TS/TSX files (non-generated); 217 test files; 71 stories                                                                                          | 15 files > 1,000 LOC — see TD-4                                                                                                                                      |
| Toolchain                                                              | CI runs Node 22; `engines` `>=20.19.0`; local dev seen on Node 24                                                                                     | Local `node_modules` lagged `package.json` at audit time — see TD-9                                                                                                  |

---

## 1. Correctness-adjacent debt

### TD-1 — Ownership hierarchy data contract 🟠 · M

**Absorbs:** the IndirectOwnership bullet of BL-505-N7. **Related:** BL-901 in BACKLOG.md.

User-built ownership chains do not conform to `OwnershipHierarchy` / `HierarchyStep`: chain construction (`src/core/IndirectOwnership/IndirectOwnership.tsx:2534–2548`) omits the required `HierarchyStep.entityType`, and the save payload (`:2568–2575`) omits `createdAt` / `updatedAt` (contract at `IndirectOwnership.types.ts:99,102,116`). The objects flow through `any` (`IndirectOwnership.tsx:630,1106,2351–2352`; `utils/openapi-transforms.ts:26,53–57,77`) into `BeneficialOwner.ownershipHierarchy`.

**Impact assessment:** the persistence callback projects only four fields (`IndirectOwnership.tsx:1111–1129`), so corrupted API payloads are **not proven**. What is proven is that invalid in-memory chains are accepted and type-checking cannot catch it.

- [ ] **TD-1-1:** Introduce explicit draft vs persisted hierarchy types (or populate the missing fields at construction).
- [ ] **TD-1-2:** Remove the hierarchy `any`s (≈12 of the 35 remaining `no-explicit-any` warnings).
- [ ] **TD-1-3:** Round-trip tests: build chain → save → reload → render.

---

## 2. Architecture

### TD-2 — Module boundaries between core components 🟠 · L

Cross-component import declarations (production code):

| From → To                                            | Imports | Example                                                                        |
| ---------------------------------------------------- | ------: | ------------------------------------------------------------------------------ |
| ApprovedClientMaintenance → ClientProfile            |      48 | `ApprovedClientMaintenance/components/AddIntermediaryOwnerForm.tsx:10`         |
| PaymentFlowFX → PaymentFlow                          |      21 | `PaymentFlowFX/PaymentFlowFX.constants.ts:7`                                   |
| OnboardingFlow → RecipientWidgets                    |      18 | `OnboardingFlow/screens/LinkAccountScreen/LinkAccountFormPanel.tsx:14`         |
| ApprovedClientMaintenance → OnboardingFlow internals |      19 | `components/MaintenanceQuestionsView.tsx:22` (`QuestionField`)                 |
| **RecipientWidgets → PaymentFlowFX (reverse)**       |      11 | `RecipientWidgets/components/BaseRecipientsWidget/BaseRecipientsWidget.tsx:51` |

- [ ] **TD-2-1:** Extract genuinely shared code into domain layers (e.g. `src/domain/client-profile`, `src/domain/payments`) instead of importing another component's internals. Imports from maintenance into onboarding internals grew from 15 (v0.17.18) to 19 (for example `QuestionField`, `useDocumentRequestUpload`, `DocumentRequestCard`); BACKLOG BL-909-5 is the product-side driver.
- [ ] **TD-2-2:** Remove the reverse RecipientWidgets → PaymentFlowFX dependency.
- [ ] **TD-2-3:** Enforce with `no-restricted-imports` boundaries (BL-505-N6) — `warn` first, then `error`.

### TD-4 — Split oversized orchestrators 🟡 · L (opportunistic)

Files > 2,000 LOC: `PaymentFlow/PaymentFlow.tsx` 3,435 · `ApprovedClientMaintenance/ApprovedClientMaintenance.tsx` **3,386** (2,868 at v0.17.18; grew with the guided change request) · `IndirectOwnership/IndirectOwnership.tsx` 2,862 · `OnboardingFlow/.../ReviewForm/DeltaPendingFieldsPanel.tsx` 2,626 · `RecipientWidgets/components/BankAccountForm/BankAccountForm.tsx` 2,274. Ten more files are between 1,000 and 1,600 LOC (BaseRecipientsWidget, `fieldMap.ts`, `formUtils.ts`, OwnersSectionScreen, PaymentFlowFX, OverviewScreen, `useTermsAndConditions`, MaintenanceReviewView, StepperRenderer, `countrySubdivisions.ts` — the last is static data and is exempt).

- [ ] **TD-4-1:** When a hotspot is touched for feature work, extract cohesive hooks/subcomponents in the same PR; no big-bang refactors.
- [ ] **TD-4-2:** Acceptance per file: < 1,000 LOC, behaviour-preserving tests added first.

### TD-6 — Curate the public API surface 🟠 · M

`src/index.tsx` re-exports whole barrels (`export *`) for EBComponentsProvider, TransactionsDisplay, Accounts, OnboardingFlow, **ApprovedClientMaintenance**, **ClientExperience**, ClientDetails, plus `export * as types` from the generated SMBDO schemas. This leaks internals: ClientDetails `StatusBadge` / `QuickStats` / `SectionList` / `getSectionIcon` (`ClientDetails/index.ts:13–18`), the onboarding form framework types (`OnboardingFlow/types/index.ts:2`), and `useAxiosInstance` (`EBComponentsProvider/index.ts:2`). PaymentFlowFX is documented as **Beta** (`src/core/DEVELOPMENT_ROADMAP.md`) but nothing marks it in the API.

- [ ] **TD-6-1:** Generate an API report with the already-installed `@microsoft/api-extractor`; check it in and review diffs in PRs.
- [ ] **TD-6-2:** Tag `@internal` / `@beta` (PaymentFlowFX, ApprovedClientMaintenance, ClientExperience until GA); replace `export *` with explicit exports.
- [ ] **TD-6-3:** Decide intent for `useAxiosInstance` and the `types` namespace; document or remove (with a deprecation release).

---

## 3. Type safety & linting

### ESLint v10 — non-functional linting decisions (read before changing `eslint.config.mjs`)

ESLint is on **v10.7** with flat config (`eslint.config.mjs`); the migration from 8.53 is complete (see [Closed & merged](#closed--merged-register)).

1. **ESLint is NOT type-aware.** `parserOptions.projectService` is intentionally omitted. Type safety is owned by `tsc` (`npm run typecheck`), which runs in CI ahead of lint. Type-aware linting roughly doubled lint time (429 s → 208 s when removed) to power a single rule (`no-floating-promises`, only ever a warning).
2. **Tailwind / `eb-` prefix rules are opt-in** (`npm run lint:styles`, `ESLINT_STYLES=1`). `eslint-plugin-tailwindcss@3`'s `no-custom-classname` alone was ~65 % of total lint time (~119 s); the plugin targets ESLint ≤ 9 and is shimmed via `@eslint/compat`. All its rules are non-blocking (`warn`), so they were removed from the hot path. The plugin stays _registered_ so inline `eslint-disable tailwindcss/*` directives remain valid.
3. **`import/extensions` disabled.** It ran full module resolution per import (~24 % of lint time) for 0 violations — TypeScript and the bundler already reject bad/extensioned paths.
4. **"Critical errors only" policy.** Only genuine correctness rules are `error` (`react-hooks/rules-of-hooks`, `@typescript-eslint/no-unused-vars`, `no-constant-binary-expression`, `prefer-const`, `@typescript-eslint/prefer-as-const`, `@typescript-eslint/no-unused-expressions`); everything else (type-strictness, style, a11y) is `warn`. Warnings do not block CI.

**Performance:** clean `npm run lint` ≈ 429 s → ≈ 41 s (~10×).

### BL-505-N — Linting follow-ups

- [ ] **BL-505-N1** 🟢: Opt-in `lint:types` (type-aware) step restoring `no-floating-promises`, `no-misused-promises`, `await-thenable` for CI/nightly only.
- [ ] **BL-505-N2** 🟡: Fast Tailwind linting folded back into default `lint`. **Unblocked upstream:** `eslint-plugin-tailwindcss@4` supports Tailwind v4 — do together with BL-506.
- [ ] **BL-505-N3** 🟢: Import hygiene via `eslint-plugin-import-x` (faster resolver) if cycle/extension checks are wanted back.
- [ ] **BL-505-N4** 🟡 · S: **Finish the last 40 warnings** (was ~540), then promote `@typescript-eslint/no-explicit-any` and `react-hooks/exhaustive-deps` from `warn` → `error`. Most remaining `any`s are covered by TD-1 and BL-505-N7.
- [ ] **BL-505-N5** 🟠 · M: Fix the **10** ratcheted `rules-of-hooks` violations (9 at v0.17.18; v0.17.20 added `useAllowedCountriesOfFormation` in `BusinessIdentityForm.schema.ts`) and remove the `eslint-disable` comments — `OnboardingFlow/components/OnboardingFormField/OnboardingFormField.tsx:330,337`; `OnboardingFlow/components/StepperRenderer/StepperRenderer.tsx:401,403,405`; `RecipientWidgets/components/BankAccountForm/BankAccountForm.tsx:730`; `BusinessIdentityForm.schema.ts:243,245`; `IndividualIdentityForm.schema.ts:275`; `PersonalDetailsForm.schema.ts:79` (i18n hooks inside `refine*FormSchema` helpers).
- [ ] **BL-505-N6** 🟡: Custom architectural rules — import boundaries (feeds TD-2) and a hardcoded-JSX-string check (feeds BACKLOG BL-905). Wire as `warn` first.
- [ ] **BL-505-N7** 🟡 · M: `no-explicit-any` refactor points that need a design decision (re-verified 2026-11-02, all still present):
  - **Generic form framework** — 9 type-level `any`s in `OnboardingFlow/types/form.types.ts:171,193,271–272,279,313–314` (`FieldRule<T = any>`, `fromResponseFn?: (val: any) => T`, `toRequestFn`, `AnyFieldConfiguration`). Swapping to `unknown` cascades into `config/fieldMap.ts`, which relies on `any`'s bivariance. **Fix:** thread a response/request value type parameter (`FieldConfigurationGeneric<K, T, TResponse>`). Note: v0.17.20 touched this file (non-US `countryOfFormation`), so line numbers may shift.
  - **IndirectOwnership hierarchy `any`** — moved to **TD-1** (it masks a real data-contract mismatch).
  - **`OnboardingFormField` `onChange?: (...value: any[]) => void`** (`OnboardingFormField.tsx:101`) — heterogeneous values (`string` / `boolean`); narrow consumer handlers rely on bivariance. **Fix:** make the component generic over `TValue`. Shares a file with BL-505-N5.
  - **Duplicate generated `ApiError` types** — `useRecipientForm.ts:7,66` uses the ep-recipients `ApiError`; `RecipientFormDialog.tsx:15` uses the SMBDO one; the settle bridge at `RecipientFormDialog.tsx:399` takes `error?: any`. **Fix:** one canonical error adapter for the recipient surface, threaded through `useRecipientForm` → widgets → cards; tests for both schemas.
  - **`IndustryTypeSelect`** — `field: ControllerRenderProps<any, string>` (`IndustryTypeSelect.tsx:61`); make generic over the form values.
  - **`EBComponentsManager.mountComponent`** — `createElement(Component as ComponentType, props as never)` (`src/vanilla/EBComponentsManager.tsx:36`). **Fix:** a typed `renderRegistered<K>(C, p)` helper that keeps component and props paired.

### TD-3 — Escape-hatch ratchet 🟡 · S

117 `as unknown as`, 43 `exhaustive-deps` disables, 2 blanket `eslint-disable` (`src/components/ui/use-toast.tsx:2`, `OnboardingFlow/screens/LinkAccountScreen/hooks/useLinkAccountAcknowledgements.ts:32`). Highest `as unknown as` density: OverviewScreen, MaintenanceReviewView, MaintenanceProfileOverview (8 each).

- [ ] **TD-3-1:** Commit a baseline-count script; CI fails if any count increases.
- [ ] **TD-3-2:** Remove both blanket disables (scope to specific rules).
- [ ] **TD-3-3:** Ratchet the baseline down whenever a file is touched.

---

## 4. Testing infrastructure

### TD-5a — Trustworthy coverage baseline 🟠 · S

`coverage/` is stale (2026-07-07, 20.6 %) and disagrees with `docs/COVERAGE_IMPROVEMENT_PLAN.md` (71.9 %, June). CI quality gates read `coverage/lcov.info`.

- [ ] **TD-5a-1:** Regenerate full-suite coverage on `develop`; record date + version + scope in `docs/COVERAGE_IMPROVEMENT_PLAN.md` (replace the stale figures).
- [ ] **TD-5a-2:** Stop committing/keeping a stale local `coverage/` folder as a reference; rely on the CI coverage report.
- [ ] **TD-5a-3:** Agree a new-code coverage gate in CI (e.g. ≥ 80 % on changed lines).

### TD-5b — Close test gaps 🟡 · M (after TD-5a)

No tests anywhere under: `RecipientWidgets/components/BankAccountForm/hooks` (7 source files) and `utils` (2); `OnboardingFlow/screens/LinkAccountScreen/hooks` (3) and `components` (3). `OnboardingFlow/hooks` now tests `useRfiQuestionIds` and `useDocumentRequestUpload`; `useFlowUnsavedChangesSync`, `useOrganizationTypeLabel` and `useStableStepSchemas` have none. ClientDetails has 3 test files for ~4.4k LOC.

- [ ] **TD-5b-1:** Targets come from the TD-5a baseline; start with the BankAccountForm hooks (payment-method and duplicate-detection logic).

### TD-11 — Unit-test suite performance & noise 🟠 · M

Full `vitest run` takes **~17 minutes** locally; cumulative **setup (3,694 s) is 6.5× test execution (571 s)**, pointing at per-file setup cost (`vitest.setup.mjs`, MSW server and provider wiring) rather than slow tests. Output is flooded with React `act()` warnings (e.g. `src/components/ui/input-otp.test.tsx`).

- [ ] **TD-11-1:** Profile per-file setup; hoist expensive one-time work; evaluate `pool`/`isolate` settings.
- [ ] **TD-11-2:** Target: < 50 % of current wall-clock locally; record CI duration before/after (feeds BL-502-5).
- [ ] **TD-11-3:** Zero `act()` warnings (fix tests, then fail on `console.error` in setup).

### BL-502 — Build/test infrastructure follow-ups

- [ ] **BL-502-5** 🟡: Rebaseline CI timings (typecheck / lint / test / storybook build) and caching after TD-11.
- [ ] **BL-502-6** 🟢 ⏸️: dts declaration emit + api-extractor bundle (`bundleTypes: true`, ~85–90 s) dominates the library build. `bundleTypes: false` is not faster and breaks the single published `dist/index.d.ts`. Options (larger effort, deferred): `isolatedDeclarations`, a dedicated `tsc --emitDeclarationOnly` pass, or trimming the compiled surface (TD-6 helps).

> Story-driven UX testing (Storybook browser tests, axe, journeys) is tracked as **BL-908** in BACKLOG.md; it runs as a separate CI job from the unit suite.

---

## 5. Security & supply chain

### TD-7 — Replace the broken vulnerability scan 🟠 · S

`npm audit` (and the `npm run audit` / `audit:fix` scripts) fails in CI because the configured package registry does not serve the npm advisories endpoint, so **BL-500-4 as written never runs**.

- [ ] **TD-7-1:** Run a registry-independent vulnerability scanner in CI (for example OSV-Scanner, or the registry's own scanning) and publish the report; remove or repoint the `audit` scripts.
- [ ] **TD-7-2:** Annotate each of the 26 `overrides` entries in `package.json` with its CVE/reason; drop pins that are no longer needed (e.g. confirm `msw` and `esbuild` pins still serve a purpose).

### BL-500 — Dependency audit hygiene (refined)

- [ ] **BL-500-1:** Security-first allow-list for new runtime dependencies (document the review in CONTRIBUTING.md).
- [ ] **BL-500-2:** Remove obsolete/unused devDependencies (start with **`@types/dompurify`** — DOMPurify 3 ships its own types; formerly BL-508-cleanup).
- [ ] **BL-500-4:** → superseded by **TD-7**.
- [ ] **BL-500-5:** Package-integrity verification after supply-chain incidents (lockfile review, `npm ci` only in CI).

### TD-12 — CSS theme-value filter hardening 🟢 · S (optional)

`convert-theme-to-css-variables.ts:190` drops values matching `/[<>{};\\]|\/\*/`, which correctly prevents escaping the declaration or the `<style>` element (BL-410 progress). `url(...)` is still accepted; this only matters if a variable feeds a resource-loading property, and theme values are host-supplied.

- [ ] **TD-12-1:** Optional per-token-type allow-list (colour / length / font-family) with tests.

---

## 6. Toolchain

### BL-501 — TypeScript & types

**Current:** `typescript` **5.9.3**. `@types/react` / `@types/react-dom` held at **18.x** until React 19 (BL-507-React19).

- [ ] **BL-501-1:** Keep `@types/*` in step with runtime libs. Align `@types/node` with the **CI Node major (22)** rather than chasing 25/26 (see TD-9).
- [ ] **BL-501-4** 🟢: TypeScript 6.0 as an optional stepping stone (typescript-eslint peer `<6.1.0` includes `6.0.x`); surfaces the `baseUrl` / `esModuleInterop=false` deprecations early.

#### BL-501-5 — TypeScript 7 (native Go compiler) ⏸️ DEFERRED — blocked on tooling, not code

**Re-checked 2026-11-02:** `typescript@latest` is still **7.0.2** (no 7.1 stable programmatic API); `typescript-eslint@8.72.1` still declares `typescript >=4.8.4 <6.1.0`. Blockers unchanged.

**Context (July 2026):** TS 7 (Project Corsa) is a line-by-line Go port (~10× faster); `tsc.js` shims to a platform binary; the programmatic API is under `./unstable/*` until 7.1. An isolated `tsc --noEmit` run on our `tsconfig.json` produced **0 code errors**, ~9 s vs ~40 s; only `esModuleInterop=false` (TS5108) and `baseUrl` (TS5102) need trivial tsconfig edits.

- [ ] **BL-501-5a:** typescript-eslint peer `<6.1.0`; forcing TS 7 crashes `typescript-estree` and breaks `npm run lint` in CI.
- [ ] **BL-501-5b:** dts bundling — `@microsoft/api-extractor` (bundled TS 5.8) and `unplugin-dts` are programmatic-API consumers; `bundleTypes: true` would break.
- [ ] **BL-501-5c:** Keep the main `typescript` on the JS line (5.x, later 6.0).
- [ ] **BL-501-5d:** Optional advisory `typecheck:fast` using an aliased `typescript7@npm:typescript@7` — pre-filter only, never the merge gate.
- [ ] **BL-501-5e:** Cut over once 7.1 ships the stable API **and** typescript-eslint + api-extractor/unplugin-dts publish TS 7 support; re-run the isolated check plus full lint/build/dts validation.

### TD-9 — Environment reproducibility 🟡 · S

- [ ] **TD-9-1:** Add `.nvmrc` (Node 22, matching CI) and reference it from README/CONTRIBUTING; keep `engines` consistent.
- [ ] **TD-9-2:** Document `npm ci` as the install step (local trees were found lagging `package.json`, e.g. vite 8.1.5 installed vs `^8.3.4` declared).
- [ ] **TD-9-3:** Decide and document the `prettier` exact pin at **3.6.2** (the July plan proposed 3.9; `prettier-plugin-tailwindcss` 0.8 may require a newer Prettier).

---

## 7. Dependencies

_Baseline: `npm outdated`, 2026-11-02 (replaces the 2026-07-23 snapshot). Tailwind (BL-506), TypeScript (BL-501) and build/test infra (BL-502) are tracked in their own items._

### A. Safe minor/patch batch — BL-507-A (refreshed) 🟡 · S

Run `npm ci` first. Same-major bumps: all `@radix-ui/react-*` minors (dialog 1.3, popover 1.3, select 2.4, tooltip 1.4, slot 1.5, scroll-area 1.4, …), `@tanstack/react-query` (+ devtools) 5.105, `@tanstack/react-virtual` 3.14.24, `react-hook-form` 7.91, `axios` 1.21, `dompurify` 3.4.17 (also bump the `overrides` floor), `libphonenumber-js` 1.13.15, `input-otp` 1.5, `uuid` 14.0.3; dev: `eslint` 10.14, `typescript-eslint` 8.72, `@eslint/compat` 2.1.1, `globals` 17.13, `orval` 8.43 (regenerate and diff `src/api/generated`), Storybook + addons 10.6.5 (and `eslint-plugin-storybook`), `vite` 8.3.5, `vite-plugin-dts` 5.1, `@vitejs/plugin-react` 6.1, `@microsoft/api-extractor` 7.58, `vitest` / `@vitest/*` 4.1.12, `rollup-plugin-visualizer` 7.1, `postcss` 8.5.32, `autoprefixer` 10.6, `@testing-library/user-event` 14.6.8, `@types/lodash` 4.17.27.

### B. Major initiatives — own spikes, do NOT batch

- [ ] **BL-507-React19** 🟠: React 18.3 → 19 (`react`, `react-dom`, `@types/react*` 19, `@testing-library/react` 14→16, `@testing-library/dom` 9→10). **Prerequisites:** REL-4 (peer-range truth) and TD-8 below. `@testing-library/react` 16 also supports React 18, so it can move first.
- [ ] **BL-506** 🟠: Tailwind CSS 3.4 → 4 (+ `tailwind-merge` 3, `eslint-plugin-tailwindcss` 4). **Prerequisite:** REL-1 (CSS isolation) — fix scoping on v3 first so v4 output can be diffed against a known-good baseline.
  - [ ] **BL-506-1:** Upgrade `tailwindcss`, PostCSS/autoprefixer; check `tailwindcss-animate`, `@tailwindcss/container-queries` (built into v4), `tailwindcss-scoped-preflight` compatibility.
  - [ ] **BL-506-2:** Convert `tailwind.config.js` to CSS-first config; carry over theme variables, the `eb-` prefix and the `.eb-component` scoping.
  - [ ] **BL-506-3:** Visual regression across all components and themes (incl. Storybook themes); breakpoints; dark mode.
  - [ ] **BL-506-4:** Compare CSS output size (feeds REL-5).
  - [ ] **BL-506-5:** Verify `npm run dev`, `npm run storybook`, `npm run build`.
- [ ] **BL-501-5:** TypeScript 7 — see §6 (deferred).
- [ ] **BL-508-datefns** 🟡: `date-fns` 3.6 → 4 (timezone rework) — **do together with BL-508-daypicker**.
- [ ] **BL-508-i18n** 🟡: `i18next` 24 → 26 + `react-i18next` 15 → 17 together; verify namespaces, content tokens, es-US/fr-CA parity tests.
- [ ] **BL-508-misc-majors** 🟢: individually — `sonner` 1→2, `react-error-boundary` 5→6, `react-window` 1→2, `lucide-react` 0.418→1.x (icon names/tree-shaking), `public-ip` 7→8, `next-themes` 0.3→0.4, `jsdom` 24→30 (test env).

### C. New majors (first tracked 2026-11-02)

- [ ] **BL-508-stepperize** 🟠: `@stepperize/react` 5 → **8** — drives the OnboardingFlow stepper (and StepperRenderer, which also holds 3 BL-505-N5 ratchets). High blast radius; spike first.
- [ ] **BL-508-msw3** 🟡: `msw` 2.15 → 3 + `msw-storybook-addon` 2 → 3 (peers `msw >=2`, Storybook ≤ 11). Update the exact pin **and** the `overrides` entry.
- [ ] **BL-508-vitest5** 🟡: `vitest`, `@vitest/ui`, `@vitest/coverage-v8` 4 → 5 (check `@storybook/addon-vitest` compatibility).
- [ ] **BL-508-daypicker** 🟡: `react-day-picker` 8 → 10 (calendar/date selector; pair with BL-508-datefns).
- [ ] **BL-508-table9** 🟡: `@tanstack/react-table` 8 → 9 (TransactionsDisplay, RecipientsTableView).
- [ ] **BL-508-dropzone** 🟢: `react-dropzone` 14 → 20 (`ui/dropzone.tsx`; document upload size limits and errors).
- [ ] **BL-508-misc-new** 🟢: `mermaid` 11 → 12 (Storybook docs only), `react-string-replace` 1 → 2.

### TD-8 — React 19 readiness, concrete prep 🟡 · S–M

**Replaces:** BACKLOG BL-440-2/3/5.

- [ ] **TD-8-1:** Remove function-component `defaultProps` at `src/components/ui/stepper.tsx:312` (removed in React 19).
- [ ] **TD-8-2:** Inventory the 116 `forwardRef` sites (still supported in 19; plan a codemod later, not a blocker).
- [ ] **TD-8-3:** Move `@testing-library/react` to 16 on React 18.
- [ ] **TD-8-4:** Provide the React 19 CI lane used by REL-4.

---

## 8. Documentation debt

### TD-10 — Agent & architecture docs drift 🟡 · S

- [ ] **TD-10-1:** `AGENTS.md:100–153` links to `../../docs/...` and `../../.github/skills/...` (monorepo-only; broken in this repo). Repoint or mark as external.
- [ ] **TD-10-2:** `AGENTS.md` says `npm test` enforces `format:check`; the `test` script (`package.json`) runs typecheck + lint + vitest only. Fix the doc or add the step. Also reconcile "format only touched files" (`AGENTS.md:27–29`) with "run `npm run format`" (`:51`).
- [ ] **TD-10-3:** `COMPONENTS_DIAGRAM.md` omits ApprovedClientMaintenance, ClientExperience, ClientProfile, PaymentFlowFX and IndirectOwnership.
- [ ] **TD-10-4:** Replace stale coverage figures (`docs/COVERAGE_IMPROVEMENT_PLAN.md`) once TD-5a lands.

---

## Closed & merged register

| ID                                   | Disposition                                                                                                                      | Date       | Evidence                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| BL-502-1…4                           | Done — Vite 8 (Rolldown), Vitest 4.1, Storybook 10.x, native `resolve.tsconfigPaths`, `unplugin-dts` exclusion fix               | 2026-07    | `package.json`; 217 test files pass (2026-11-02) |
| BL-505-1…5                           | Done — ESLint 10.7 flat config, rule triage, `lint:styles`                                                                       | 2026-07    | `eslint.config.mjs`; 0 errors (2026-11-02)       |
| BL-503 · Orval                       | Done — Orval 8 (ESM config, mutator)                                                                                             | 2026-07    | `orval.config.mjs`                               |
| BL-503 · Package manager             | Done — npm + committed `package-lock.json` (Yarn 4 reverted: incompatible with the CI publish step); `resolutions` → `overrides` | 2026-08    | `package.json`                                   |
| BL-503 · Security policy             | Ongoing via `overrides`; scanning moved to TD-7                                                                                  | 2026-11-02 | —                                                |
| BL-507-A (July list)                 | Landed (July–August 2026 dependency batch); refreshed list above                                                                 | 2026-11-02 | `package.json`                                   |
| BL-508-A (July list)                 | Landed except `prettier` (pinned 3.6.2 → TD-9-3)                                                                                 | 2026-11-02 | `package.json`                                   |
| BL-508-cleanup                       | Merged into BL-500-2                                                                                                             | 2026-11-02 | —                                                |
| BL-500-3                             | Done — ESLint/Prettier configs consolidated in flat config                                                                       | 2026-07    | `eslint.config.mjs`                              |
| BL-500-4                             | Superseded by TD-7                                                                                                               | 2026-11-02 | Registry has no advisories endpoint              |
| BL-505-N7 (IndirectOwnership bullet) | Merged into TD-1                                                                                                                 | 2026-11-02 | —                                                |
| TD-10-5                              | Done — dropped the dead `docs/README.md` link from `src/core/DEVELOPMENT_ROADMAP.md`                                             | 2026-11-02 | —                                                |
| BL-508-zod4                          | Done — `zod` 4.6.7; `zod-i18n-map` removed, its locale files vendored as `src/i18n/<locale>/zod.json` and translated by `src/i18n/zodErrorMap.ts` through the provider-scoped i18n instance (closes BACKLOG BL-802-5); deprecated Zod 4 APIs replaced | 2026-11-02 | `234fe5f6`                                       |
| BL-508-resolvers                     | Done — `@hookform/resolvers` 5.9, together with zod4                                                                             | 2026-11-02 | `234fe5f6`                                       |
