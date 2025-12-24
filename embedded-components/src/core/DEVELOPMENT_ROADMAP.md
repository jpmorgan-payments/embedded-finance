# Refined Core Components Development Roadmap

Target: Align all core components with API docs, i18n, private labeling (design/content tokens), security (OWASP), performance (Core Web Vitals), a11y (WCAG 2.1 AA), UX-tested flows, and OAS-superset client validation.

**Last Updated:** December 9, 2025  
**Related Documents:**

- `BACKLOG.md` - Detailed task backlog with priorities and UX testing findings (updated with tracking IDs)
- `docs/ux-testing/2025-12-02/UX_TESTING_REPORT.md` - Comprehensive UX testing results (Dec 2, 2025)
- `docs/ux-testing/2025-12-09/UX_TESTING_REPORT.md` - UX testing results (Dec 9, 2025)
- `docs/ux-testing/2025-12-09/PHASE1_CODE_INSPECTION.md` - Code inspection findings (Dec 9, 2025)

## Components (scope)

- OnboardingFlow
- LinkedAccountWidget
- Recipients
- MakePayment
- TransactionsDisplay
- Accounts

## Timeline (visual)

Each theme applies to all components. Within every theme, we will review and enhance each component to meet the revised expectations and target state; many already comply for several themes and will be validated rather than reworked.

Baseline readiness: Basic functionality across all themes for all components is ready and verified. This roadmap captures the next iteration of enhancements and evolution.

**Last Updated:** December 9, 2025  
**Related Documents:** See `BACKLOG.md` for detailed task breakdown and UX testing findings. All backlog items now have unique tracking IDs (BL-XXX format).

```mermaid
gantt
    title Core Components Roadmap (Themes)
    dateFormat  YYYY-MM-DD

    section Foundation
    Theme 0 - Functional Enhancements    :active, t0, 2025-10-15, 2025-12-15
    Theme 1 - Security & Validation      :active, t1, 2025-10-20, 2025-12-20
    Theme 2 - i18n & Design Tokens       :active, t2, 2025-11-03, 2025-12-20

    section Early Quality Gates
    Theme 3 - Functional Testing (CAT)   :active, t3, 2025-10-10, 2025-12-15
    Theme 4 - React 19 Readiness         :t4, 2025-12-15, 2026-01-15

    section Experience & Perf
    Theme 5 - RUM & Analytics            :t5, 2025-12-15, 2026-01-15
    Theme 6 - Atomic Design & Perf       :t6, 2025-12-15, 2026-01-31

    section Compliance & Wrap-up
    Theme 7 - A11y & UX Testing          :active, t7, 2025-12-02, 2026-01-15
    Theme 8 - Comprehensive Testing      :t8, 2026-01-05, 2026-01-31
    Theme 9 - Docs & AI Guides           :t9, 2026-01-15, 2026-02-15
```

## Theme 0: Functional Enhancements (In Progress)

- OnboardingFlow
  - Add support for new entity types (with focus on publicly traded companies, government entities, and other non-profit entities)
  - Refine owner/controller flows
- LinkedAccountWidget
  - ✅ Handle verification responses (PR #583 - Dec 2, 2025) [BL-401-1]
  - ✅ Add interaction stories (PR #583 - Dec 2, 2025) [BL-401-1]
  - [ ] Parity with Recipients payment methods [BL-401-2]
  - [ ] Better status messaging [BL-401-3]
  - [ ] Robust microdeposit flows (retry/lockout messaging) [BL-401-4]
- Recipients
  - ✅ Server-side pagination implemented (PR #601 - Dec 9, 2025)
  - ✅ Type filtering implemented (PR #601 - Dec 9, 2025)
  - ✅ Status formatting refined with normalizeRecipientStatus (PR #601 - Dec 9, 2025)
  - [ ] Conditional attributes per payment method (ACH/RTP/WIRE) [BL-402-1]
  - [ ] Edit flows parity + masking [BL-402-2]
  - [ ] Recipient duplicate detection UX [BL-402-3]
- MakePayment
  - ✅ Recipient mode toggle refactored to RadioGroup (PR #601 - Dec 9, 2025) [BL-010]
  - ✅ Manual recipient creation with save option (PR #601 - Dec 9, 2025) [BL-010]
  - ✅ Payment method selector UI overhaul with icons (PR #601 - Dec 9, 2025) [BL-010]
  - ✅ Section headings standardized to h3 (PR #601 - Dec 9, 2025) [BL-310]
  - ✅ Account selector error handling and retry (PR #601 - Dec 9, 2025)
  - [ ] Recipient/method filtering logic [BL-403-1]
  - [ ] Review fee/time ETA display [BL-403-2, BL-031]
  - [ ] Review/confirmation UX [BL-403-3]
  - [ ] Cross-currency payment support [BL-403-4]
- TransactionsDisplay
  - [ ] Pagination [BL-404-1]
  - [ ] Review details attribute mapping [BL-404-2]
  - [ ] Review PAYIN/PAYOUT derivation and counterpart display [BL-404-3]
  - [ ] Fix "$NaN" display for Ledger Balance [BL-050-1]
  - [ ] Replace "N/A" values with meaningful data or hide fields [BL-050-2]
- Accounts
  - ✅ Account number masking code updated to `****${number.slice(-4)}` (Dec 3, 2025) [BL-003-1]
  - ✅ Browser verification completed - all components use `****1098` pattern (Dec 9, 2025) [BL-003-2]
  - [ ] Responsive cards [BL-405-1]
  - [ ] Review balance types mapping and tooltips [BL-405-2]
  - [ ] Masking/toggle for sensitive routing/account info [BL-405-3]
  - [ ] Add "View Transactions" / "Transfer Funds" buttons [BL-090-1, BL-090-2]
  - [ ] Remove redundant "Accounts" heading [BL-091-1]

## Theme 1: Security & Validation (In Progress)

- OWASP hardening (XSS sanitization with dompurify, sensitive-data masking, idempotency keys, auth/CSRF via axios interceptor, throttling on verification flows).
- Client-side validation: centralize Zod schemas (superset of OAS), strict regex for routing/account numbers, progressive and accessible errors.
- OAS alignment: verify against latest specs; prefer generated hooks/types; no ad-hoc fetch clients.

## Theme 2: i18n & Tokens (In Progress)

- ✅ Enhanced i18n support in Recipients components (PR #599 - Dec 8, 2025) [BL-420]
- ✅ Updated SellSense themes with new editable properties (PR #600 - Dec 8, 2025) [BL-330]
- ✅ Theme configuration aligned with Salt Design System (PR #586 - Dec 3, 2025) [BL-330]
- [ ] Extract content tokens and wire `react-i18next` + `zod-i18n-map` [BL-420-1, BL-420-2]
- [ ] Expand design tokens for full theming/private labeling [BL-420-3]
- [ ] Ensure runtime overrides via `EBComponentsProvider` [BL-420-4]

## Theme 3: Functional Testing (CAT) (In Progress)

- Wire environment config for CAT endpoints/headers.
- Smoke and regression suites against CAT APIs using generated hooks; record diffs, capture contract mismatches.

## Theme 4: React 19 Readiness

- Verify peer compatibility, incremental adoption plan, and guardrails.
- Migrate low-risk areas (test environment, Storybook, non-critical flows) first; keep feature flags.

## Theme 5: RUM & Analytics

- Standard event catalog per component; configurable `userEventsHandler` hooks; perf timing utilities.

## Theme 6: Refined Atomic Design & Performance

- Extract shared atoms/molecules/organisms and utilities.
- Core Web Vitals targets TBD; apply memoization, virtualization, code-splitting.

## Theme 7: A11y & UX Testing (In Progress)

- ✅ UX scenarios per component (completed Dec 2, 2025 - see UX_TESTING_REPORT.md) [BL-470-1]
- ✅ Code inspection completed (Dec 9, 2025 - see PHASE1_CODE_INSPECTION.md)
- 🚧 Mitigate found issues (see BACKLOG.md Priority 1-3 for detailed items) [BL-470-2]
- [ ] WCAG 2.1 AA compliance [BL-470-3]
- [ ] Axe automated tests [BL-470-4]
- [ ] Keyboard/focus management [BL-470-5]
- [ ] ARIA correctness [BL-470-6]
- **Key Findings from UX Testing (Dec 2, 2025):**
  - Design system inconsistencies (button styles, colors, labels) [BL-001, BL-002, BL-009]
  - Make Payment form discoverability issues [BL-010]
  - Missing tooltips and accessibility features [BL-070]
  - Responsive design issues [BL-080]
  - Data quality and display issues [BL-050]
- **Progress Since Dec 2 Testing:**
  - ✅ Account number masking code standardized and browser verified (Dec 9, 2025) [BL-003]
  - ✅ Make Payment form structure improved (PR #601) [BL-010]
  - ✅ Recipients server-side pagination implemented (PR #601)
  - ✅ Browser testing completed (Dec 9, 2025) - See `docs/ux-testing/2025-12-09/UX_TESTING_REPORT.md`
- **New Findings from Dec 9 Testing:**
  - ✅ Recipients data inconsistency (table vs pagination) [BL-600] - **RESOLVED** (Dec 9, 2025 - Re-test confirmed)
  - 🟠 Duplicate API calls across all components [BL-602]
  - 🟡 Dialog accessibility warnings [BL-601]
  - 🟡 MSW initialization errors [BL-603]

## Theme 8: Comprehensive Testing

- [ ] 90%+ coverage: unit (validators/hooks), component, integration (MSW), E2E for critical paths [BL-480-1]
- [ ] Storybook scenarios: loading/error/empty/edge/i18n/theme/a11y [BL-480-2]
- ✅ Enhanced test setup with ResizeObserver mock (PR #582 - Dec 3, 2025) [BL-480-3]
- ✅ Improved test reliability and structure (PR #582 - Dec 3, 2025) [BL-480-4]
- ✅ Test warnings fixed and MSW handlers updated for onboarding (PR #602 - Dec 9, 2025)

## Theme 9: Documentation & AI Guides

## Theme 10: Tech Debt & Dependency Hygiene

- Dependency audit and hygiene
  - Review and update all package dependencies (runtime and dev) with a security-first allowlist.
  - Remove obsolete or unused devDependencies (eslint plugins/configs, storybook addons, test utilities, etc.).
  - Consolidate eslint/prettier configs; drop overlapping/legacy rules.
- TypeScript and related toolchain
  - Consider bumping TypeScript and all related type utilities and tooling (tsc, @types/\*, vitest, tsconfig libs) to latest compatible versions.
  - Validate build output and generated d.ts after bump; fix any strictness regressions.
- Build/test infrastructure
  - Verify Vite/Storybook compatibility after bumps; adjust configs if needed.
  - Rebaseline CI (typecheck/lint/test/storybook build) performance and caching.

- Per-component docs (usage, configuration, validation, security, a11y, testing, performance).
- Enhanced AI agent skills and codegen/dev templates.

## Orval & Dependencies

- Review and update Orval codegen to latest 7.x; ensure React Query v5 generators and axios mutator are configured. Regenerate from latest OAS in `api-specs/`.
- Dependency policy: prioritize security patches; keep React 18.3 baseline now, React 19 in Theme 4. Track axios/react-query/radix/msw/storybook/vite minors.
- Package manager: migrate to pnpm (workspaces) for speed and content-addressable store. Update docs/CI to use `pnpm -w` equivalents (build, test, storybook, generate-api). Keep Yarn lock for a short deprecation window if needed.

### package.json audit (components)

- React/DOM peers already support `^19`; keep runtime on 18.3 until Theme 4.
- Vite 6 and Storybook 9 are aligned (OK). Ensure any Storybook addon minor bumps remain compatible.
- MSW 2.7 is current; keep handlers typed and update if breaking changes appear.
- Orval 7.0.1 can be bumped within 7.x after changelog review.
- dompurify 3.2.x is fine; avoid major bumps without review.
- Consider removing unused runtime deps if identified during Theme 0 (Functional Enhancements) hardening.

## Refined Security Recommendations

This guide outlines security controls applied across embedded-components, leveraging existing stack capabilities to avoid duplication.

### Input & Output Handling

- Sanitize any HTML using `dompurify`. Avoid `dangerouslySetInnerHTML` unless sanitized.
- Enforce strict Zod schemas (superset of OAS). Validate lengths, character sets, formats.
- Mask sensitive values (account/routing numbers, SSN/EIN) in UI (show last 4 only).

### Network & Auth

- All API calls via Orval-generated React Query hooks using a shared axios instance.
- Axios interceptors:
  - Inject auth headers/tenant headers from `EBComponentsProvider`.
  - Add `Idempotency-Key` on mutating requests.
  - Redact tokens/PII in error logs.
  - Optional CSRF header propagation (if environment requires).

### File Uploads

- Restrict mime types and size limits client-side. Prefer signed uploads when possible.

Tailor to host application domains.

### Logging & Telemetry

- Do not log secrets/tokens/PII.
- Use RUM hooks for business events; prefer hashed IDs when possible.

### Dependency Hygiene

- Run dependency audits (CodeQL/Snyk/npm audit).
- Prefer minor/patch updates first; isolate risky major bumps.

### Browser & Clickjacking

- Recommend host to set `X-Frame-Options: SAMEORIGIN` or CSP `frame-ancestors` as needed.

### Rate Limiting & Abuse

- Throttle verification and retry loops client-side to reduce abuse patterns.

### Testing

- Include OWASP test cases in component suites (XSS, validation bypass, sensitive data leakage).
