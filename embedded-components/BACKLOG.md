# Embedded Components — Product & Release Backlog

**Last verified:** 2026-11-02 against v0.17.18, plus later `develop` changes through v0.17.21 (optional non-US `countryOfFormation`, configuration-restricted edit payment methods, `docs/UX_ATLAS.md`).
**Updated:** 2026-11-02 for the v0.18.0 work — Zod 4, RFI questions section, guided change requests, searchable question options, document upload and linked-account fixes — and the new BL-909 (one client experience).
**Method (this cycle):** static code verification by four independent review passes plus a second-opinion review; high-impact claims hand-checked; `npm run lint`, `npm run typecheck` and the full unit suite executed. **No browser re-test this cycle** — last browser pass was 2026-03-06.
**Companion:** [TECH_DEBT.md](./TECH_DEBT.md) — tooling, dependencies, architecture, typing, test infrastructure (`TD-n`, `BL-50x`).
**References:** Showcase https://embedded-finance-dev.com/sellsense-demo · Storybook https://storybook.embedded-finance-dev.com/ · Salt patterns https://www.saltdesignsystem.com/salt/patterns/index

---

## How this backlog works

- **Stable IDs; priority lives in the [Priority index](#priority-index-cross-file), not in the number.** Existing `BL-###` IDs are kept. New prefixes: `REL-n` release gates · `SALT-n` Salt/design-system conformance · `BL-9xx` new product items · `TD-n` (in TECH_DEBT.md).
- **Closing or merging:** move the ID to the [Closed, merged & transferred register](#closed-merged--transferred-register) with date and evidence (commit/PR). Never delete or reuse an ID — historical UX-testing reports (retired from the tree on 2026-11-02, still in git history) reference them.
- **Test evidence:** record each verification run as one row in [Verification history](#verification-history); attach detailed evidence (screenshots, logs) to the PR or issue instead of committing per-session report folders. The SALT-1 conformance matrix is a living document in `docs/ux-quality/` (BL-908), not a set of dated reports.
- **Per item:** Priority · Status · Components · Verified (date/method) · Acceptance criteria.
- **Out of repo:** items for the showcase app (`app/client-next-ts`) or `app/server-session-transfer` are not tracked here; see the register.
- Legend — Priority: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low. Status: 📋 Planned · 🚧 In progress · ❓ Needs product decision · ⏸️ Blocked.

---

## Priority index (cross-file)

| Rank | ID                              | Item                                                                                           | Pri | Where                                                  |
| ---: | ------------------------------- | ---------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------ |
|    1 | REL-1                           | Host CSS leakage from published stylesheet                                                     | 🔴  | [§1](#1-release-gates-rel)                             |
|    2 | REL-2                           | Package entry points (`exports`, raw TS, CJS, native optional deps)                            | 🟠  | [§1](#1-release-gates-rel)                             |
|    3 | REL-3                           | Release-script provenance & failure gates                                                      | 🟠  | [§1](#1-release-gates-rel)                             |
|    4 | REL-4                           | Peer-range truth (React 19 claimed, untested)                                                  | 🟠  | [§1](#1-release-gates-rel)                             |
|    5 | BL-901 + TD-1                   | IndirectOwnership chain validation & data contract                                             | 🟠  | [§2](#2-correctness--functional) · TECH_DEBT §1        |
|    6 | BL-050-1                        | Currency formatter renders `NaN`                                                               | 🟠  | [§2](#2-correctness--functional)                       |
|    7 | BL-802-3                        | Runtime en-US fallbacks in es-US/fr-CA                                                         | 🟠  | [§6](#6-i18n--content-tokens)                          |
|    8 | BL-900                          | ApprovedClientMaintenance API limitations + UI containment                                     | 🟠  | [§2](#2-correctness--functional)                       |
|    9 | BL-902                          | PaymentFlowFX bounded GA                                                                       | 🟠  | [§2](#2-correctness--functional)                       |
|   10 | BL-908-0 · TD-5a · TD-7 · TD-11 | UX quality loop pilot · coverage baseline · vuln scanning · test-suite speed (parallel, cheap) | 🟠  | [§4](#4-accessibility) · TECH_DEBT                     |
|   11 | SALT-1                          | Continuous Salt pattern conformance — baseline in the first BL-908 review run                  | 🟠  | [§3](#3-salt-design-system-conformance--design-system) |
|   12 | BL-909                          | One client experience: hosted UI, maintenance design language, linked account, content tokens  | 🟠  | [§3](#3-salt-design-system-conformance--design-system) |
|   13 | Quick wins                      | BL-601-2 · BL-905 · BL-060 · TD-10 · BL-507-A · BL-910-3                                       | 🟡  | various                                                |
|   14 | TD-2 · BL-505-N5                | Module boundaries · hook-order ratchets                                                        | 🟠  | TECH_DEBT                                              |
|   15 | Majors                          | React 19 validation → Tailwind 4 → others                                                      | 🟡  | TECH_DEBT §7                                           |

---

## Component quick reference

| Component                              | Public?                                      | Maturity             | Open items                                             |
| -------------------------------------- | -------------------------------------------- | -------------------- | ------------------------------------------------------ |
| EBComponentsProvider                   | ✅                                           | GA                   | REL-1, SALT-1                                          |
| OnboardingFlow                         | ✅                                           | GA                   | BL-400-1, BL-800-3, BL-903, BL-905, BL-909, BL-910, SALT-1 |
| IndirectOwnership                      | internal (used by OnboardingFlow)            | GA inside Onboarding | BL-901, BL-601-2, TD-1                                 |
| ApprovedClientMaintenance              | ✅ (`export *`)                              | Draft since v0.17.10 | BL-900, BL-904, BL-909                                 |
| ClientExperience                       | ✅ (`export *`)                              | Undocumented         | BL-904, BL-909                                         |
| ClientProfile                          | internal (used by ApprovedClientMaintenance) | —                    | BL-904, TD-2                                           |
| ClientDetails                          | ✅                                           | GA                   | BL-810                                                 |
| LinkedAccountWidget / RecipientsWidget | ✅                                           | GA                   | BL-401, BL-402, BL-406, BL-070, BL-120, BL-110         |
| PaymentFlow / PaymentFlowInline        | ✅                                           | GA                   | BL-020, BL-031–033, BL-040, BL-403, BL-800-1, BL-905   |
| PaymentFlowFX / PaymentFlowFXInline    | ✅                                           | **Beta**             | BL-902                                                 |
| TransactionsDisplay                    | ✅                                           | GA                   | BL-050, BL-051, BL-060, BL-062, BL-404, BL-723, BL-812 |
| Accounts                               | ✅                                           | GA                   | BL-090–092, BL-405, BL-905                             |
| Shared UI (`src/components/ui`)        | partial                                      | —                    | BL-100, BL-601-2, BL-001                               |

> The legacy `Recipients` component no longer exists; use `RecipientsWidget`.

---

## 1. Release gates (REL)

Items that affect every consumer of the published package. Verified 2026-11-02 by inspecting `package.json`, `src/index.css`, `dist/index.css` (build of 2026-10-13), `vite.config.mjs` and the release tooling.

### REL-1 — Host CSS leakage 🔴 📋

**Components:** all (published `dist/index.css`)

The published stylesheet contains **unscoped** global rules written in `@layer components` (`src/index.css:8–24`): `*,:before,:after{border-color}`, `body{background-color;font-family;…}`, `menu,ol,ul{list-style-type:none}`, `a{color:inherit;text-decoration:none}`. `tailwindcss-scoped-preflight` only scopes Tailwind preflight to `.eb-component`; it does not touch these hand-written rules. Effect on host pages: links lose colour and underline (WCAG 1.4.1 risk for the host), list markers disappear, and `body` takes the EB background and font.

- [ ] **REL-1-1:** Scope the rules to `.eb-component` and to portal containers (dialogs, popovers, toasts).
- [ ] **REL-1-2:** Regression test against built CSS: a host sibling `<a>`, `<ul>` and `body` keep their computed styles (implemented by BL-908-1).
- [ ] **REL-1-3:** Note the change in CHANGELOG — hosts may have unknowingly relied on the leak.

### REL-2 — Package entry points 🟠 📋

- [ ] **REL-2-1:** `./i18n/config` exports raw TypeScript (`src/i18n/config.ts`) that also imports the dev-only `lodash`; ship a compiled entry or remove the export.
- [ ] **REL-2-2:** The `require` condition points at `dist/umd/ef-components.js` under `"type":"module"`; emit a real `.cjs` or drop the condition.
- [ ] **REL-2-3:** Move the linux-x64 native binaries out of published `optionalDependencies` (CI-only install step).
- [ ] **REL-2-4:** Gate releases with `publint`, `@arethetypeswrong/cli` and an `npm pack` consumer smoke test (ESM, CJS, types) without transpiling dependency source.

### REL-3 — Release provenance & failure gates 🟠 📋

The release tooling bumps the version and publishes without first proving that the tree is clean and up to date or that build and tests pass. It does not reliably stop when a command fails, and it can propagate a release before the release change is merged.

- [ ] **REL-3-1:** Require a clean tree, an up-to-date `develop`, and passing `npm test` + `npm run build` before bumping.
- [ ] **REL-3-2:** Fail fast on every failing command (check exit codes explicitly).
- [ ] **REL-3-3:** Publish and propagate only from the merged release commit.

### REL-4 — Peer-range truth 🟠 📋

`peerDependencies` declares `react` / `react-dom` `^18.2.0 || ^19`, but development, tests and types are React 18.3 only.

- [ ] **REL-4-1:** Add a React 19 CI lane (runtime + types) **or** narrow the peer range to `^18` until it exists.
- [ ] **REL-4-2:** Prerequisite work is TD-8 (TECH_DEBT.md); the full migration is BL-507-React19.

### REL-5 — Bundle size budget 🟡 📋

**Absorbs:** BL-220-3, BL-220-4. Last measured build (2026-10-13): ESM **5.78 MB / 1.12 MB gzip**, UMD 6.26 MB; single entry, only React externalized (`vite.config.mjs:111–119`).

- [ ] **REL-5-1:** Fresh size report in CI; fail on regressions above an agreed budget.
- [ ] **REL-5-2:** Measure consumer-side tree-shaken size per component; decide on sub-path entries.
- [ ] **REL-5-3:** Revisit externalizing heavy runtime deps (to be decided with the dependency owners).

---

## 2. Correctness & functional

### BL-901 — IndirectOwnership completion 🟠 📋

**Absorbs:** BL-400-2. **Related:** TD-1 (data contract). **Source:** `docs/indirect-ownership-recovery-plan.md:90–121`.

- [ ] **BL-901-1:** Reject ownership chains that have no terminal beneficial owner (explicitly deferred in the recovery plan).
- [ ] **BL-901-2:** Standalone ↔ wizard parity: shared detail collection, story parity, remove wizard-only logic (unchecked recovery-plan boxes).
- [ ] **BL-901-3:** Update the recovery plan's status header (Stage 3 says "implemented (bounded)" while boxes remain unchecked).

### BL-050 — Transaction data quality 🟠 📋

**Absorbs:** BL-052. **Components:** TransactionsDisplay.

- [ ] **BL-050-1:** `formatNumberToCurrency` has no NaN/undefined guard (`TransactionsDisplay/utils/formatNumberToCurrency.ts:9–19`); return the `naText` placeholder or hide the field. Unit tests for `NaN`, `undefined`, `null`, strings.
- [ ] **BL-050-2:** One policy for "N/A" vs hidden (`hideEmpty` / `hasValue` in `TransactionDetailsSheet.tsx:51–62`); document it.
- [ ] **BL-050-3:** Show "Show all fields" only when hidden fields exist — the toggle is currently unconditional (`TransactionDetailsSheet.tsx:444–451`).
- [ ] **BL-050-4:** Populate additional fields from the API when available (fixture-driven).

### BL-900 — ApprovedClientMaintenance: API limitations & UI containment 🟠 📋

**Components:** ApprovedClientMaintenance (public, draft). **Source:** the _Known Limitations_ section of `docs/APPROVED_CLIENT_MAINTENANCE_RECIPE.md`.

The limitations below are **API behaviour**. The component's job is to contain their impact; it cannot fix server behaviour itself.

| Sub-item | Limitation (API)                                                                                                                | UI containment                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| BL-900-1 | Additions during review: `POST /parties` returns `11902` while a request is `REVIEW_IN_PROGRESS` but still creates the party    | Block every write during review; refetch after failed writes; treat parties without a proposal as unreviewed |
| BL-900-2 | Discarding a pending `INTERMEDIARY_OWNER` party fails (`11903`); a failed whole-request discard can leave a hidden open request | Warn before adding; treat `TERMINATED` + `NEW` proposals as blocked and point to support                     |
| BL-900-3 | A never-approved party cannot be removed (`active: false` returns `11911`)                                                      | Route such parties through onboarding as unreviewed                                                          |
| BL-900-4 | Validation reads the approved record, so a missing now-required field blocks submission after any change                        | Warn before editing a party whose `validationResponse` isn't `VALIDATED`                                     |
| BL-900-5 | Stale `outstanding.partyRoles` after a discard; a withdrawn product leaves its document request                                 | Don't block on stale role requirements; hide document requests of withdrawn products                         |
| BL-900-6 | Party document requests are missing from the client document list                                                               | Reconcile both sources in the UI                                                                             |
| BL-900-7 | Existing values can't be cleared (empty string rejected, `null` ignored)                                                        | Don't offer clearing; ask for a replacement value                                                            |
| BL-900-8 | No notification type for maintenance requests                                                                                   | Poll request and client status; status-transition fixtures                                                   |
| BL-900-9 | No version, ETag or snapshot token for concurrent maintenance                                                                   | Review fingerprint plus two consecutive identical reads before attestation and verification                  |

- [ ] **BL-900-10:** Raise each limitation with the API owners; when behaviour changes, update the recipe's Known Limitations table and remove the containment.
- [ ] **BL-900-11:** Integration tests (MSW) for each containment path.

### BL-902 — PaymentFlowFX bounded GA 🟠 📋

**Replaces:** BL-403-4. **Components:** PaymentFlowFX (Beta). **Sources:** `docs/CROSS_BORDER_FX_PAYOUT_CLIENT_RECIPE.md:351–360`, `src/core/PaymentFlowFX/SPECIFICATION.md:853–878`.

- [ ] **BL-902-1 (GA gate):** Sign off the supported corridor/currency matrix; minimum-amount and whole-number validation per currency; fee/spread copy; jurisdictional disclosures.
- [ ] **BL-902-2 (GA gate):** Integration contracts: rate-sheet proxy/base URL, per-currency `countryCode`, purpose-code corridors, account-ID verification.
- [ ] **BL-902-3 (post-GA, explicit non-goals for v1):** inline unregistered payees, non-USD debit, FX KYC, webhook enrichment.
- [ ] **BL-902-4 (UX follow-ups):** extraction, mobile summary, balance retry, memo limit, completed-step summaries, auto-advance focus (a11y — prioritise), quick-fill chips.
- [ ] **BL-902-5:** Mark `@beta` in the public API until GA (TD-6).

### BL-903 — Information requests (RFI) follow-ups 🟡 �

**Source:** the _Known Limitations_ section of `docs/REQUEST_FOR_INFORMATION_RECIPE.md`. **Done so far:** outstanding questions are classified with the `GET /questions` category filter, and RFI questions get their own **Additional information** section before and after submission (`737b4ee0`); an approved client with an RFI sees it at the top of the maintenance overview (`fff110bc`); BL-903-1 closed (see register).

- [ ] **BL-903-2** ⏸️: Party attribution for party-level questions. The API doesn't say which party a question concerns; raise it with the API owners. Until then the question text has to name the party.
- [ ] **BL-903-3:** Persist completion across sessions — **Additional information** shows as completed only in the session in which it was answered.

### BL-904 — ClientExperience / ClientProfile release matrix 🟡 🚧

`ClientExperience` and `ApprovedClientMaintenance` are publicly exported; `ClientProfile` is internal. **Done so far:** ClientExperience stories are grouped by route (Onboarding, Approved profile, Maintenance, Loading and errors) with a story per client and request state, and a test checks each story's routing (`66784ae9`).

- [ ] **BL-904-1:** Per component: lifecycle/routing, error states, locales, a11y, Storybook coverage, docs.
- [ ] **BL-904-2:** Decide GA vs `@beta` and record it (TD-6).
- [ ] **BL-904-3:** Document the guided change request in `docs/APPROVED_CLIENT_MAINTENANCE_RECIPE.md`: **Request a change** on each profile page, the `changeActions: 'guided' | 'inline'` prop, and the draft change request review. Only `docs/REQUEST_FOR_INFORMATION_RECIPE.md` describes it today.

### BL-400 — OnboardingFlow entity coverage 🟡 🚧

- [ ] **BL-400-1:** Entity-specific requirement matrix (legal form × data collected × owner/controller rules) aligned with `docs/UX_ATLAS.md` modules A–F. Done so far: publicly traded companies (`enablePubliclyTradedCompanies`), entity options in `consts/organizationTypeList.ts`, optional non-US `countryOfFormation` (develop, v0.17.20). Remaining: verify government, non-profit, partnership and unincorporated-association paths end to end.

### BL-910 — Refetch bursts after mutations 🟡 🚧

**Source:** Dynatrace RUM, 2026-11: document uploads rated FRUSTRATED. After an upload the UI fired 7–8 refetches at once, cancelled 2 and then 4 of them (code 971), and fetched `clients/{id}` twice. **Rule:** a mutation refreshes only what it changed, once, and waits for that before navigating away, because unmounting a screen cancels its in-flight queries. **Done so far:** BL-910-1 and BL-910-2 (see register).

- [ ] **BL-910-3:** `LinkAccountScreen` navigates to the overview as soon as the account is created, while the recipient-list refetch started by `useRecipientForm` is still in flight, so unmounting the screen can cancel it. Wait for the refresh first, as document uploads do.
- [ ] **BL-910-4:** Guard against regressions: no unscoped `queryClient.invalidateQueries()`, no invalidation in effects keyed on fetched data (review rule or lint, see BL-505-N6). Confirm the upload fix in Dynatrace after release.

---

## 3. Salt Design System conformance & design system

### SALT-1 — Continuous monitoring & assessment against Salt Design System patterns 🟠 🔁 Recurring

**Why:** our design tokens already follow [Salt Design System](https://www.saltdesignsystem.com/) naming (`DESIGN_TOKENS.md`), and `docs/EMBEDDED_FINANCE_PATTERNS.md` is meant to complement Salt patterns. Our components are built on Radix + Tailwind, though, and nothing checks that alignment over time while Salt keeps evolving (28 patterns as of 2026-11-02). Conformance here means **behaviour, structure, content and foundations** (tokens, typography, spacing, density), not adopting Salt React components.
**Owner:** design-system owner (UX) with a component engineer per area.
**Absorbs as children:** the design-system items below (BL-001, BL-002, BL-100, BL-300, BL-310, BL-321, BL-323, BL-350).

- [ ] **SALT-1-1 — Conformance matrix:** create `docs/ux-quality/salt-conformance.md` — Salt pattern × component, rated ✅ Conforms · 🟡 Partial · ⚠️ Deviates by design (rationale required) · ❌ Gap · ➖ N/A (host-owned), with a "last assessed" date per row. Each row links the Salt pattern page, the matching `EMBEDDED_FINANCE_PATTERNS.md` entry and the Storybook story.
- [ ] **SALT-1-2 — Baseline assessment:** done as part of the first BL-908 review run (BL-908-2); results update the matrix. Every ❌, and every ⚠️ without a rationale, becomes a backlog item (`SALT-n`, or linked to an existing BL ID).
- [ ] **SALT-1-3 — Cadence:** re-assess **quarterly**; also when Salt publishes a new or changed pattern (watch the patterns index and Salt release notes), when a new component ships, or when a component's UX changes significantly.
- [ ] **SALT-1-4 — PR checklist:** add "Salt pattern(s) applied / deviations documented" to the PR template (CONTRIBUTING.md) for UI changes.
- [ ] **SALT-1-5 — Automation where feasible:** record Salt patterns per story in `parameters.ux.saltPatterns` (BL-908 L3) so matrix coverage is queryable; check that theme variables keep their Salt characteristic mapping (`DESIGN_TOKENS.md`); reuse the BL-908 axe runs as the accessibility foundation.
- [ ] **SALT-1-6 — Reporting:** log each assessment in the [Verification history](#verification-history) with a summary score per component.

**Initial candidate mapping** (to be confirmed in SALT-1-2):

| Salt pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                | Where it applies here                                                                    | Related items    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------- |
| [Wizard](https://www.saltdesignsystem.com/salt/patterns/wizard)                                                                                                                                                                                                                                                                                                                                                                                             | OnboardingFlow stepper, PaymentFlow, PaymentFlowFX, ApprovedClientMaintenance multi-step | BL-020, BL-902-4 |
| [Forms](https://www.saltdesignsystem.com/salt/patterns/forms)                                                                                                                                                                                                                                                                                                                                                                                               | Onboarding section forms, BankAccountForm, RecipientFormDialog, PaymentFlow              | BL-032, BL-321   |
| [International address form](https://www.saltdesignsystem.com/salt/patterns/international-address-form)                                                                                                                                                                                                                                                                                                                                                     | Onboarding and intermediary addresses (country-aware rules; HK/SG/AE/QA)                 | BL-400-1         |
| [International phone number](https://www.saltdesignsystem.com/salt/patterns/international-phone-number-input)                                                                                                                                                                                                                                                                                                                                               | Onboarding phone inputs                                                                  | —                |
| [Formatted input](https://www.saltdesignsystem.com/salt/patterns/formatted-input)                                                                                                                                                                                                                                                                                                                                                                           | Amounts, routing/account numbers, SSN/EIN, date selector                                 | BL-410-3         |
| [File upload](https://www.saltdesignsystem.com/salt/patterns/file-upload)                                                                                                                                                                                                                                                                                                                                                                                   | DocumentUploadScreen, `ui/dropzone` (2 MB default)                                       | BL-601-2         |
| [Content status](https://www.saltdesignsystem.com/salt/patterns/content-status)                                                                                                                                                                                                                                                                                                                                                                             | Loading skeletons, empty states, `ServerErrorAlert`                                      | BL-800           |
| [Indication](https://www.saltdesignsystem.com/salt/patterns/indication)                                                                                                                                                                                                                                                                                                                                                                                     | Status badges, validation indicators                                                     | BL-100           |
| [Button bar](https://www.saltdesignsystem.com/salt/patterns/button-bar)                                                                                                                                                                                                                                                                                                                                                                                     | Dialog and step footers (FlowContainer, StepLayout)                                      | BL-001-1         |
| [Selectable card](https://www.saltdesignsystem.com/salt/patterns/selectable-card)                                                                                                                                                                                                                                                                                                                                                                           | Gateway organization type, payee/account selection                                       | —                |
| [List filtering](https://www.saltdesignsystem.com/salt/patterns/list-filtering)                                                                                                                                                                                                                                                                                                                                                                             | Transactions toolbar filters                                                             | BL-060           |
| [Search](https://www.saltdesignsystem.com/salt/patterns/search)                                                                                                                                                                                                                                                                                                                                                                                             | Payee search, industry (NAICS) select, question fields with more than 10 options         | BL-912           |
| [Metric](https://www.saltdesignsystem.com/salt/patterns/metric)                                                                                                                                                                                                                                                                                                                                                                                             | Accounts balances, ClientDetails QuickStats                                              | BL-091           |
| [Contact details](https://www.saltdesignsystem.com/salt/patterns/contact-details)                                                                                                                                                                                                                                                                                                                                                                           | ClientDetails / ClientProfile party details                                              | BL-810           |
| [Header block](https://www.saltdesignsystem.com/salt/patterns/header-block)                                                                                                                                                                                                                                                                                                                                                                                 | Component titles and section headers                                                     | BL-310           |
| [Menu button](https://www.saltdesignsystem.com/salt/patterns/menu-button)                                                                                                                                                                                                                                                                                                                                                                                   | Recipient / linked-account "more actions"                                                | BL-120           |
| [Vertical navigation](https://www.saltdesignsystem.com/salt/patterns/vertical-navigation), [Navigation](https://www.saltdesignsystem.com/salt/patterns/navigation)                                                                                                                                                                                                                                                                                          | ApprovedClientMaintenance sidebar, Onboarding overview sections                          | BL-900           |
| [Breadcrumbs](https://www.saltdesignsystem.com/salt/patterns/breadcrumbs)                                                                                                                                                                                                                                                                                                                                                                                   | ApprovedClientMaintenance page headers; ClientDetails drill-down (if multi-level)        | BL-909, BL-810   |
| [List builder](https://www.saltdesignsystem.com/salt/patterns/list-builder)                                                                                                                                                                                                                                                                                                                                                                                 | IndirectOwnership chain builder / owners list (candidate)                                | BL-901           |
| [Comments](https://www.saltdesignsystem.com/salt/patterns/comments), [Announcement dialog](https://www.saltdesignsystem.com/salt/patterns/announcement-dialog)                                                                                                                                                                                                                                                                                              | Information-request questions and responses (candidate)                                  | BL-903           |
| [Split button](https://www.saltdesignsystem.com/salt/patterns/split-button)                                                                                                                                                                                                                                                                                                                                                                                 | None known                                                                               | —                |
| [App header](https://www.saltdesignsystem.com/salt/patterns/app-header), [Analytical dashboard](https://www.saltdesignsystem.com/salt/patterns/analytical-dashboard), [Keyboard shortcuts](https://www.saltdesignsystem.com/salt/patterns/keyboard-shortcuts), [Experience customization](https://www.saltdesignsystem.com/salt/patterns/experience-customization), [Preferences dialog](https://www.saltdesignsystem.com/salt/patterns/preferences-dialog) | Likely host-owned / N/A for embedded components — confirm                                | —                |

### Design-system children of SALT-1

- **BL-001 — Button usage** 🟡: shared `Button` variants exist (`src/components/ui/button.tsx:12–37`); primary/secondary semantics documented (`DESIGN_TOKENS.md:96–128`).
  - [ ] **BL-001-1:** Complete the outline / ghost / link / destructive decision guide (Salt Button bar pattern).
  - [ ] **BL-001-3:** Storybook story covering all button variants.
  - [ ] **BL-001-4 (new):** Default icon size in `Button` is 12×12 px (`button.tsx:36`); audit icon-only consumers for legibility and target size.
- **BL-002 — Primary action colour** 🟢: [ ] **BL-002-1:** Verify every shipped theme defines the primary action colour consistently (documentation part done).
- **BL-100 — Status semantics (StatusBadge)** 🟠 — **absorbs BL-001-2, BL-320-5, BL-330-2.** A `StatusBadge` with variant mapping and i18n exists in `RecipientWidgets/components/StatusBadge/StatusBadge.tsx:52–69`; ClientDetails exports another `StatusBadge`; Transactions uses `getStatusVariant`.
  - [ ] **BL-100-1:** Promote one `StatusBadge` to `src/components/ui`; remove duplicates.
  - [ ] **BL-100-2:** Single status → variant → colour table (Salt Indication pattern), documented in `DESIGN_TOKENS.md`.
  - [ ] **BL-100-3:** Adopt in TransactionsDisplay, LinkedAccountWidget, ClientDetails, Accounts; verify WCAG AA contrast.
- **BL-300 — Collection display pattern** 🟡 — **absorbs BL-080, BL-301, BL-322.** Already implemented: Transactions swaps to cards on mobile (`TransactionsDisplay.tsx:215–238`); widgets offer `cards | compact-cards | table`.
  - [ ] **BL-300-1:** Document when to use cards vs table and the default page sizes (see BL-062).
  - [ ] **BL-300-2:** Viewport QA on mobile/tablet for all collection components.
- **BL-310 — Heading contract & typography** 🟡 — **absorbs BL-311-2, BL-340.** Configurable heading levels exist (`Accounts.tsx:37,127–129`; `ClientDetails.tsx:202–210,399–402`).
  - [ ] **BL-310-1:** Document which components render H1–H4 and expose `title`/`headingLevel` (Salt Header block).
  - [ ] **BL-310-2:** Typography scale (H1–H4, body, label) documented against Salt text tokens.
- **BL-321 / BL-323 — Primitive usage docs** 🟢: [ ] Document form primitives (Input, Select, DatePicker, `StandardFormField`) and Card primitives (Salt Forms pattern).
- **BL-350 — Spacing adoption** 🟢: a spacing token is documented (`DESIGN_TOKENS.md:209–213`). [ ] Audit adoption in high-traffic components; define card/form/table spacing scale.

### BL-909 — One client experience across onboarding and maintenance 🟠 📋

**Why:** `ClientExperience` routes one client between `OnboardingFlow` and `ApprovedClientMaintenance`, and hosts embed these flows through the partially and fully hosted UI. The two flows were built separately and look and read differently. The maintenance UI has the newer page language: a header with breadcrumb and one header action (**Request a change**), a scrolling body with a pinned footer (`MaintenancePageBody`, `MaintenanceFormFooter`), container-query spacing, and one accent for every change step. Onboarding keeps the stepper and `StepLayout`. A client moving between them, or a host embedding both, sees two products.
**Components:** OnboardingFlow, ApprovedClientMaintenance, ClientExperience, `BankAccountForm` (shared with LinkedAccountWidget). **Related:** SALT-1, BL-805-4, BL-906, TD-2, TD-4.

- [ ] **BL-909-1 — Design language:** turn the maintenance page language (layout regions, header and breadcrumb, footer actions, spacing, accent, empty and loading states) into shared primitives in `src/components/`, rate them against the Salt Header block, Button bar, Breadcrumbs, Vertical navigation and Content status patterns in the SALT-1 matrix, then apply them to OnboardingFlow screens. Acceptance: both flows use the same primitives in Storybook, and no component imports another component's layout internals.
- [ ] **BL-909-2 — Hosted UI seamlessness:** one container, height and scroll contract for hosted embeds: no nested scrollbars or doubled padding, and focus and scroll position kept when ClientExperience routes between onboarding and maintenance. Verify in the partially hosted UI at mobile and desktop widths and update `docs/partially-hosted/` (BL-805-4).
- [ ] **BL-909-3 — Linked account redesign in OnboardingFlow:** rebuild the overview bank-account section and `LinkAccountScreen` on the BL-909-1 primitives, with one card per account, its status, and add, verify and remove actions placed as in maintenance. Today `LinkedBankAccountSection` (`OverviewScreen.tsx`) renders the inline form, a single account or a list of accounts from three separate branches. Keep `linkAccountStepOptions` and `hideLinkedAccountRemoval` behaviour; includes BL-910-3.
- [ ] **BL-909-4 — Content tokens aligned between onboarding and maintenance:** `approved-client-maintenance` has 738 strings, 63 of which repeat an `onboarding-overview` string word for word (role labels, "Business details", address labels, statuses), and maintenance also reads 184 `onboarding-overview:` keys directly. Agree one vocabulary (for example "change request", party roles, statuses), move shared terms to one namespace, keep flow-specific copy in each flow, and keep content-token overrides and the locale parity test working (with BL-906-1).
- [ ] **BL-909-5 — Refactor while moving:** extract what both flows share — document upload (`useDocumentRequestUpload`, now in `OnboardingFlow/hooks`), question fields (`QuestionField`), party and ownership display — into domain modules (TD-2-1), and split `ApprovedClientMaintenance.tsx` (3,386 LOC) along the way (TD-4).

---

## 4. Accessibility

### BL-908 — UX quality loop: story-driven UX testing 🟠 📋

**Absorbs:** BL-907 (and through it BL-470-4, BL-804-5) and BL-480-2. **Executes:** BL-470-3/5/6 and the REL-1-2 test. **Schedules:** SALT-1 review runs. **Replaces:** the retired `docs/ux-testing/` session process.

**Principle:** Storybook stories are the component-level UX scenarios — one definition reused by interaction tests, axe, visual baselines, review walkthroughs and `docs/UX_ATLAS.md` links. Live-API contracts and backend workflows stay out of component stories (BL-430).

**Current state (2026-11-02):** 72 story files / ~446 stories; 7 files have `play()` (42 plays), 4 have assertions, none configure a11y checks. `@storybook/addon-vitest` and `addon-a11y` are installed, but no browser provider is, so story tests cannot run. The preview bypasses unhandled requests (`onUnhandledRequest: 'bypass'`), mounts an MSW health monitor and reads env-based API settings; 6 story files set `dangerouslyIgnoreUnhandledErrors`; plays contain 67 fixed pauses ≥ 100 ms.

| Layer                   | What                                                                                                                                                                                                                                                                        | Gate                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| L1 Render + state + axe | Every story renders in real Chromium, reaches an asserted ready state, logs no unexpected `console.error` and makes no unmocked API calls; axe runs at render and at checkpoints (open dialogs, error states)                                                               | Every PR; axe exceptions fingerprinted by story + rule + target    |
| L2 Journeys             | `play()` tests for the `UX_ATLAS.md` journeys using role/name queries, real keyboard input and focus assertions; a keyboard-only variant for each                                                                                                                           | PR (affected components) + release (all)                           |
| L3 Coverage contract    | Typed `parameters.ux` (states, journey, Salt patterns, justified n/a) plus a generator over Storybook's `index.json` → component × required-state matrix                                                                                                                    | Every PR, public components                                        |
| L4 Review runs          | Quarterly and pre-GA: SALT-1 rubric + WCAG 2.2 AA + usability heuristics + content/i18n. Humans judge visuals; agent-assisted checks cover behaviour via DOM/accessibility tree only. Each finding carries story ID, args, precondition, repro and the violated requirement | Produces backlog items; automation failures are triaged separately |

- [ ] **BL-908-0 — Pilot (S–M):** ~20 existing stories (async loading, submit errors, dialogs/portals, one onboarding journey, localization). Add `@vitest/browser-playwright` + Chromium; separate `unit` and `storybook` Vitest projects; browser MSW via `mswLoader` with unexpected requests treated as errors; per-story reset of fixtures, query cache, storage and portals; health monitor off in tests. Record cold/warm CI time and flake rate, and choose the axe mode (`error` plus fingerprinted exceptions — `todo` produces no CI output).
- [ ] **BL-908-1 — Trusted gates (M):** L1 on all stories (fix, or quarantine with owner + date); replace fixed pauses with awaited conditions; audit the 6 `dangerouslyIgnoreUnhandledErrors`; L2 for onboarding submit, link bank account + microdeposits and make payment, each with a keyboard variant; host-integration gate on the built `dist/index.css` including portals (REL-1-2); a small visual baseline (key stories × themes; CI pixel diff, humans adjudicate).
- [ ] **BL-908-2 — Coverage & review (M):** `parameters.ux` schema + generator; required-state contract for public components; remaining `UX_ATLAS.md` journeys; `docs/ux-quality/README.md` (process, rubric, finding format); first combined review run = SALT-1 baseline + human visual pass.
- [ ] **BL-908-3 — Breadth (M/L):** risk-based matrix — three locales plus pseudo-localization, two providers with different locales (BL-802-5), content-token overrides, date/currency formats, mobile container widths, 320 px reflow (plus a human 400 % zoom check), focus-visible per theme, reduced motion, realistic error shapes, retries and duplicate submits; Firefox/WebKit journeys nightly; grow the visual baseline before Tailwind 4 (BL-506).

**Stop doing:** per-session report folders and committed screenshots; performance metrics against mocks (→ REL-5, BL-450); component UX testing through the hosted showcase.
**CI cost:** browser and unit jobs run independently; affected-component selection with a full-suite fallback when shared code changes (`components/ui`, provider, i18n, MSW). Unit-suite speed is TD-11.
**Metrics:** stories reaching their asserted ready state; required-state coverage %; journeys with play tests; axe exceptions (count, age); flake rate; browser-suite duration; open UX findings by severity and age.

### BL-601 — Dialog descriptions 🟡 📋

- [ ] **BL-601-2:** Add `DialogDescription` or `aria-describedby` to the 10 `DialogContent` instances and 1 `SheetContent` instance that lack one: `IndirectOwnership/IndirectOwnership.tsx` ×4 (lines 1432, 1839, 2184, 2673), `IndirectOwnership/components/OwnershipCalculationsTooltip/OwnershipCalculationsTooltip.tsx:27`, `src/components/LearnMorePopover/LearnMorePopover.tsx:36`, `src/components/ui/command.tsx:27`, `src/components/ui/dropzone.tsx:624`, `RecipientWidgets/components/RecipientDetailsDialog/RecipientDetailsDialog.tsx:153`, `PaymentFlow/ReviewPanel/ReviewPanelMobile.tsx:99` (Sheet).
- [ ] **BL-601-3:** Make a description (or explicit `aria-describedby={undefined}` with a reason) part of the dialog usage guideline; enforce through BL-908 axe runs.

### BL-470 — WCAG 2.1 AA programme 🟡 🚧

- [ ] **BL-470-3:** WCAG 2.1 AA audit per public component (executed in BL-908 review runs; results recorded in the SALT-1 matrix).
- [ ] **BL-470-5:** Keyboard/focus test matrix (dialogs, menus, steppers, focus return) — automated as BL-908 L2 keyboard variants.
- [ ] **BL-470-6:** ARIA correctness review.

### Targeted a11y items

- [ ] **BL-070** 🟡 — Icon-only controls: targeted audit; `aria-label` is the baseline, tooltip where UX requires it. Labels already present on RecipientCard "more actions" (`RecipientCard.tsx:471`) and the Accounts balance info (`AccountCard.tsx:284`).
- [ ] **BL-120** 🟡 — Menus: add a visible tooltip to "More actions"; verify menu collision handling on small screens. Remove confirmation (`RecipientCard.tsx:394–408`) and Radix keyboard support already exist.
- [ ] **BL-040** 🟡 — PaymentFlow modal: Radix focus trap, responsive sizing and an Escape guard during submission exist (`FlowContainer.tsx:112–134`). Remaining: keyboard walkthrough and a visible scroll cue.
- [ ] **BL-723** 🟢 — Transactions filter Selects: accessible names exist (`TransactionsTableToolbar.tsx:76–78,112–114`); add `id`/`name` for form hygiene only (not a WCAG failure).
- [ ] **BL-812** 🟢 — "View details" button uses `eb-h-8` (≈ 32 px at default spacing, passes WCAG 2.2 SC 2.5.8). Spacing is theme-configurable, so verify target size across supported themes; a 44 px AAA target is optional. Whole-row click: see the decision queue.

---

## 5. Error handling & feedback

### BL-800 — Error-surface audit 🟠 🚧

**Absorbs:** BL-811, BL-410-4. The shared pattern (`ServerErrorAlert` + `useServerError`) is already used in 44 core files across Accounts, ApprovedClientMaintenance, ClientDetails, ClientExperience, OnboardingFlow (Gateway, DocumentUpload, OperationalDetails, Overview, OwnersSection, RequestedQuestions, Review, Terms, Stepper, LinkAccount), PaymentFlow wrappers, RecipientWidgets and TransactionsDisplay. The remaining work is to **prove there are no silent failures**, not to apply the component mechanically.

**Acceptance criteria:** every query **and** mutation has visible, localized error UI with retry where meaningful; stale-data behaviour is defined; errors are associated with fields where applicable; focus moves to or announces the error for screen readers.

- [ ] **BL-800-1:** PaymentFlow — reads (recipients, accounts, fees) and submit; separate recipient/linked-account failure states exist (`PaymentFlow.tsx:3377–3425`).
- [ ] **BL-800-3:** OnboardingFlow — trace each remaining API call (formerly BL-811-1/3).
- [ ] **BL-800-4:** LinkedAccountWidget — create / verify (microdeposits) / remove.
- [ ] **BL-800-5:** Document the pattern in component docs and add a Storybook error-state story.
- [ ] **BL-406-3:** RecipientsWidget — visible success feedback after create/edit (a success callback exists, but visible feedback is inconsistent).

---

## 6. i18n & content tokens

### BL-802 — Locale correctness 🟠 🚧

es-US and fr-CA key parity is **done** (11 namespaces × 3 locales, enforced by `src/i18n/config.test.ts`). BL-802-5, -6 and -7 closed 2026-11-02 (see register).

- [ ] **BL-802-3:** Runtime fallback check: the parity test excludes `zod` messages; verify no en-US fallbacks at runtime in es-US/fr-CA.

### BL-905 — Hardcoded strings & locale leaks 🟡 📋

- [ ] **BL-905-1:** 7 hardcoded HTTP-error title/message pairs in `PaymentFlow.tsx:158–191`.
- [ ] **BL-905-2:** Hardcoded accessible-name prefixes in `AccountCard.tsx:390,537`.
- [ ] **BL-905-3:** English plural suffix appended to custom/localized titles (`Accounts.tsx:138–141`).
- [ ] **BL-905-4:** Guard against regressions with the BL-505-N6 hardcoded-JSX-string lint rule (TECH_DEBT.md).

### BL-110 — Date formatting 🟡 📋

Shared recipient formatter exists (`src/lib/recipientHelpers.ts:91–98`), but dates in `RecipientDetailsDialog.tsx:130–133`, `RecipientsTableView.columns.tsx:20–22` and `TransactionCard.tsx:20` use separate implementations that ignore the provider locale; ClientDetails has its own (`formatClientFacing.ts:39`).

- [ ] **BL-110-1:** One shared date/datetime formatter using the provider locale, with a documented format policy (date vs datetime, timezone).
- [ ] **BL-110-2:** Migrate the call sites above.

### BL-060 — Filter label casing 🟢 ❓

Only TransactionsDisplay remains ("All statuses" / "All types", `TransactionsTableToolbar.tsx:82–89,118–125`). [ ] Decide the casing convention and update `transactions.json` in all three locales.

### BL-906 — Content-token rollout checklist 🟢 📋

**Absorbs:** BL-420-1, BL-801. **Source:** `docs/CONTENT_TOKENS_ARCHITECTURE.md:599–616`. Aligning onboarding and maintenance vocabulary is BL-909-4.

- [ ] **BL-906-1:** Naming audit and deprecation policy for tokens.
- [ ] **BL-906-2:** Debug tooling (attributes/CSS/toolbar) and reference tables.
- [ ] **BL-906-3:** Regression tests for `AccountCardSkeleton` and status-label token overrides (formerly BL-801-2/3).
- [ ] **BL-906-4:** Confirm `EBContentTokens` is exported and documented (formerly BL-801-5).
- [ ] **BL-906-5:** Storybook stories demonstrating content-token overrides per public component (formerly BL-801-4).

---

## 7. Component UX

### PaymentFlow

- [ ] **BL-020** 🟡 — **Absorbs BL-030.** PaymentFlow is now a single page with sections (account → payee → method → amount, `PaymentFlow.tsx:833,971,1109,1159`) and a ReviewPanel that validates saved or unsaved recipients (`ReviewPanel.tsx:526,563–586`). Remaining: acceptance tests for section order and for preserving state when users navigate back and forth.
- [ ] **BL-032** 🟢 — Missing-field collection and section highlighting exist (`ReviewPanel.tsx:563–586`). Remaining: explain why the confirm action is disabled.
- [ ] **BL-403** 🟡 — Needs acceptance criteria: **BL-403-1** recipient/method eligibility matrix; **BL-403-2** fee/ETA display rules; **BL-403-3** define the review/confirmation UX target. (BL-403-4 → BL-902.)

### TransactionsDisplay

- [ ] **BL-051** 🟢 — The reference ID column exists but is hidden by default (`TransactionsDisplay.tsx:88`); validate availability in the real API and decide the default.
- [ ] **BL-404** 🟡 — **BL-404-1** pagination exists (page size 25); confirm server-side completeness. **BL-404-2** API-to-UI field mapping table. **BL-404-3** PAYIN/PAYOUT derivation fixtures.

### Accounts

- [ ] **BL-091** 🟢 — **BL-091-2** optional: show account category/name as the title for a single account. **BL-091-3** verify the balance-type popover in supported themes.
- [ ] **BL-092** 🟡 — Concrete parity tests with the widgets (empty, loading, error, refresh ref already exist: `Accounts.tsx:103–120,153–181`) and viewport QA.
- [ ] **BL-405-2** 🟡 — Define expected balance-type semantics and tooltips (currently "review" with no target).

### LinkedAccountWidget / RecipientsWidget

- [ ] **BL-401** 🟡 — **BL-401-2** define the supported payment-rail matrix (develop v0.17.21 restricts edit methods by configuration, `restrictPaymentMethods.ts`); **BL-401-3** list the statuses that still lack messaging; **BL-401-4** microdeposit retry/lockout tests (max-attempt handling exists, `MicrodepositsForm.tsx:95,179–217`).
- [ ] **BL-402** 🟡 — **BL-402-1** ACH/RTP/WIRE field and validation matrix (method-dependent routing validation exists, `BankAccountForm.schema.ts:287–288`); **BL-402-2** edit-flow parity and masking acceptance matrix; **BL-402-3** standalone RecipientsWidget duplicate UX and banner (schema-level duplicate detection exists, `BankAccountForm.schema.ts:478–510`).
- [ ] **BL-406-4** ❓ — Ref-based control (refresh, clear filters, export): define a justified imperative API, or drop the item.

### ClientDetails

- [ ] **BL-810** 🟡 — UX audit. Modes are accordion, cards and **summary** (`ClientDetails.tsx:372–402`); SectionDialog descriptions are done. Remaining: **BL-810-1** layout per mode; **-2** interactions; **-3** skeleton layout shift; **-4** error retry test; **-5** icon-only labels; **-7** responsive behaviour; **-8** content-token overrides end to end.

---

## 8. Roadmap themes (need acceptance criteria)

- **BL-410 — Security & validation** 🟡 🚧. Progress: DOMPurify centralized (`src/lib/utils.ts:195–214`); CSS theme-value filter (`convert-theme-to-css-variables.ts:190`); linear parsing instead of vulnerable regexes (v0.17.9); maintenance idempotency (`useMaintenanceWorkspace.ts:66,233,332–333`).
  - [ ] **BL-410-1a:** Audit every HTML sink for sanitizer use.
  - [ ] **BL-410-1b:** Sensitive-field inventory and masking policy (maskers differ: `identifierDisplay.ts:19`, `fieldMap.ts:868`, `AccountCard.tsx:748` — consolidate deliberately).
  - [ ] **BL-410-1c:** Idempotency keys for which mutations/retries beyond maintenance.
  - [ ] **BL-410-1d:** Document the host/auth/CSRF boundary (header interceptor at `EBComponentsProvider.tsx:143–178`).
  - [ ] **BL-410-1e:** Define client-side rate-limit/throttling behaviour (max-attempt handling ≠ throttling).
  - [ ] **BL-410-2 / -3:** Scope of centralized Zod schemas; routing/account regex cases per country.
  - [ ] **BL-410-5:** Diff `api-specs/*` against the latest published specs.
  - [ ] **BL-410-6:** Enforce generated hooks only (lint rule; the only raw `fetch` is a local data-URL conversion in `ui/dropzone.tsx:229`).
- **BL-420-3 — Design tokens for full private labelling** 🟢: define the concrete token gaps (feeds SALT-1).
- **BL-430 — CAT functional testing** 🟡: **-1** CAT environment config (endpoints are configurable at `EBComponentsProvider.tsx:70–73`); **-2** smoke/regression suite; **-3** contract-diff capture.
- **BL-440 — React 19 readiness** → **REL-4** and **TD-8**; **BL-440-1** runtime compatibility matrix; **BL-440-4** migrate low-risk areas first.
- **BL-450 — RUM & analytics** 🟢: `dispatchUserEvent` handler and lifecycle exist (`src/lib/utils/userTracking.ts:75–208`). **-1** per-component event catalog; **-3** performance-timing utilities.
- **BL-460 — Atomic design & performance** 🟢: **-1** replace "extract shared atoms" with concrete candidates from TD-2; **-3** optimize only against measured regressions (absorbs BL-220-2). Core Web Vitals targets moved to REL-5.
- **BL-480 — Testing** → **TD-5a/5b** (coverage) and **BL-908** (story-driven UX testing; absorbs BL-480-2).
- **BL-490 — Documentation** 🟢: **-1** documentation-readiness checklist per public component (FX recipe is still a draft, `CROSS_BORDER_FX_PAYOUT_CLIENT_RECIPE.md:1`); **-2** agent templates.
- **BL-805-4** 🟢: Keep `docs/partially-hosted/PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md` current for multi-experience session transfer.
- **BL-200-2** 🟢 — **Absorbs BL-200-3.** MSW `dbLogger` logs whenever `NODE_ENV !== 'test'` (`src/msw/db.ts:14–20`). No mock path from the root barrel was found, so this is Storybook/dev noise only: put it behind an explicit debug flag.

---

## 9. Product decision queue

| ID       | Decision needed                                               | Current behaviour                                               |
| -------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| BL-031   | Fee breakdown visible by default?                             | Exists; `showFees=false` by default (`ReviewPanel.tsx:339–345`) |
| BL-033   | Scheduled payments, or immediate only?                        | Immediate only                                                  |
| BL-062   | One default page size?                                        | RecipientsWidget 10, Transactions 25                            |
| BL-090   | Accounts actions (view transactions / transfer / statements)? | Refresh only                                                    |
| BL-060   | Filter label casing                                           | "All statuses" (Transactions)                                   |
| BL-406-4 | Imperative ref API for widgets?                               | None                                                            |
| BL-812-3 | Whole-row click in Transactions table?                        | Button only                                                     |
| BL-804-3 | Ship an accessible theme preset (Empty+) in the library?      | Showcase only                                                   |

---

## Closed, merged & transferred register

**Closed / merged — 2026-11-02** (evidence: code at v0.17.18):

| ID                           | Disposition                                                         | Evidence                                                                         |
| ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| BL-061                       | Done                                                                | Both tables use "Showing X to Y of Z"; legacy Recipients removed                 |
| BL-130                       | Obsolete                                                            | RecipientDetailsDialog shows Created / Last Updated (`:470–487`)                 |
| BL-200-1, BL-603             | Done                                                                | Idempotent party upsert, `src/msw/db.ts:275–304`                                 |
| BL-200-3                     | Merged → BL-200-2                                                   | —                                                                                |
| BL-420-1, BL-801             | Merged → BL-906                                                     | —                                                                                |
| BL-420-2                     | Merged → BL-802-5 (done with Zod 4)                                 | `src/i18n/zodErrorMap.ts`                                                        |
| BL-420-4                     | Done                                                                | Provider `contentTokens`; Storybook overrides (`.storybook/preview.tsx:282–298`) |
| BL-450-2                     | Done                                                                | `userTracking.ts:75–95`                                                          |
| BL-800-2                     | Done                                                                | Transactions list + details: localized error + retry                             |
| BL-802-1, -2, -4             | Done                                                                | Parity test `src/i18n/config.test.ts:67–95`; Storybook locale control            |
| BL-601-1                     | Done                                                                | `TransactionDetailsSheet.tsx:125–129`                                            |
| BL-810-6                     | Done                                                                | `SectionDialog.tsx:99–102`                                                       |
| BL-060-3                     | Obsolete (legacy Recipients removed); BL-060-1/2 continue as BL-060 | —                                                                                |
| BL-001-2, BL-320-5, BL-330-2 | Merged → BL-100                                                     | —                                                                                |
| BL-002-2, BL-330-1           | Done                                                                | `DESIGN_TOKENS.md:96–128,181–198`                                                |
| BL-320-1…4                   | Done                                                                | Shared `Button` variants                                                         |
| BL-080, BL-301, BL-322       | Merged → BL-300                                                     | —                                                                                |
| BL-311-2, BL-340             | Merged → BL-310                                                     | —                                                                                |
| BL-030                       | Merged → BL-020                                                     | —                                                                                |
| BL-052                       | Merged → BL-050                                                     | —                                                                                |
| BL-811 (-1, -3)              | Merged → BL-800                                                     | —                                                                                |
| BL-410-4                     | Merged → BL-800                                                     | —                                                                                |
| BL-400-2                     | Merged → BL-901                                                     | —                                                                                |
| BL-403-4                     | Replaced by BL-902                                                  | —                                                                                |
| BL-470-2                     | Removed (umbrella; concrete items listed)                           | —                                                                                |
| BL-470-4, BL-804-5           | Merged → BL-907 → BL-908                                            | —                                                                                |
| BL-907                       | Merged → BL-908 (UX quality loop)                                   | Story tests cannot run yet (no browser provider)                                 |
| BL-480-2                     | Merged → BL-908                                                     | —                                                                                |
| BL-440-2, -3, -5             | Merged → REL-4 / TD-8                                               | —                                                                                |
| BL-460-2, BL-220-3, BL-220-4 | Merged → REL-5                                                      | —                                                                                |
| BL-220-2                     | Merged → BL-460-3                                                   | —                                                                                |
| BL-480-1                     | Merged → TD-5a / TD-5b                                              | —                                                                                |
| BL-500…508                   | Moved to TECH_DEBT.md                                               | —                                                                                |

**Transferred to the showcase / session-transfer backlog** (out of repo): BL-009, BL-091-1, BL-311-1, BL-330-3, BL-220-1, BL-803 (all), BL-804-1/2/4, BL-805-1/2/3, BL-811-2, BL-812-2.

**Closed — 2026-11-02, v0.18.0** (evidence: commits):

| ID                 | Disposition                                                                                                                                                         | Evidence                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| BL-802-5           | Done — Zod messages follow the provider locale; `zod-i18n-map` replaced by `src/i18n/zodErrorMap.ts` (installed with `z.config`)                                    | `234fe5f6`                                  |
| BL-802-6           | Done — schemas and display helpers no longer use the global, always en-US `i18n.t(...)` (Zod 4 lazy errors, `src/i18n/activeI18n.ts`)                               | `234fe5f6`                                  |
| BL-802-7           | Done — intermediary flow and remaining hard-coded OnboardingFlow strings localized                                                                                  | `f8232730`                                  |
| BL-903-1           | Done — client refetched after each save, on focus and every 60 s; the webhook-only `hasOutstandingInformation` flag is documented as an API limitation               | `OnboardingFlow.tsx:122`; RFI recipe        |
| BL-910-1           | Done — both upload flows share `useDocumentRequestUpload` (upload, submit, one scoped refresh); the list-screen effect that refetched the client is gone            | `c630073d`, `30d42534`                      |
| BL-910-2           | Done — inline linked-account creation no longer refreshes the recipient list twice                                                                                 | `57fb555c`                                  |
| BL-911 (new, done) | Linked-account banner said "verified" until the list refetched (it assumed `ACTIVE`); it now uses the created account's status                                      | `57fb555c`                                  |
| BL-912 (new, done) | Questions with more than 10 options (237 countries on 18 questions, e.g. NAICS 524114 licensing) render as a searchable list; multi-select uses chips and `maxItems` | `65d10990`                                  |

---

## Verification history

| Date       | Scope                                                                                                               | Method                                                                  | Report                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| 2025-12-02 | Initial UX test                                                                                                     | Browser                                                                 | `docs/ux-testing/2025-12-02/` (git history)       |
| 2025-12-09 | UX test + code inspection                                                                                           | Browser + code                                                          | `docs/ux-testing/2025-12-09/` (git history)       |
| 2026-01-14 | UX test                                                                                                             | Browser                                                                 | `docs/ux-testing/2026-01-14/` (git history)       |
| 2026-02-19 | All 7 showcase components + item-level backlog verification                                                         | Browser load + code                                                     | `docs/ux-testing/2026-02-19/` (git history)       |
| 2026-03-06 | Git analysis (Feb 22–Mar 6) + full browser re-test                                                                  | Browser + git                                                           | `docs/ux-testing/2026-03-06/` (git history)       |
| 2026-07-23 | Tech-debt / dependency refresh                                                                                      | `npm outdated`, lint/TS spikes                                          | TECH_DEBT.md                                      |
| 2026-11-02 | Full backlog re-verification (~350 commits since July), restructure into BACKLOG + TECH_DEBT, release gates, SALT-1 | Code (4 independent passes + second opinion), lint/typecheck/unit suite | This document; per-session report folders retired |
| 2026-11-02 | v0.18.0 work: Zod 4, RFI section, guided change requests, upload and linked-account fixes; BL-909–BL-912 added      | Code, unit suites (994 passed), build, UAT API probes                   | This document                                     |

**Retired reports:** the `docs/ux-testing/` session reports (2025-12-02 → 2026-03-06) were removed from the tree on 2026-11-02. Their findings are reconciled into this backlog and the register above. To read one, find the deleting commit with `git log --diff-filter=D --oneline -- docs/ux-testing` and show the file from its parent, e.g. `git show <commit>^:docs/ux-testing/2026-03-06/UX_TESTING_REPORT.md`.

**Next:** the BL-908-0 pilot, then the first BL-908 review run (SALT-1 baseline + browser pass; last browser pass was 2026-03-06).
