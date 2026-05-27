# OnboardingFlow testing strategy

This document explains **how we test OnboardingFlow**: the testing trophy model we follow, what each tier is responsible for, and how we grow coverage across **modes**, **states**, and **combinations** of data and props—without duplicating confidence at every layer.

---

## Testing trophy (not a pyramid)

We follow the **testing trophy**: put the most effort where failures hurt most for a multi-screen, API-backed flow.

Conceptual band sizes (the **middle is widest** — that is the trophy idea):

```
┌─────────────────────────────────────────┐
│ E2E — few smoke journeys                │
├─────────────────────────────────────────┤
│ Integration — most scenarios live here    │  ← widest investment
├─────────────────────────────────────────┤
│ Unit — schemas, widgets, pure helpers    │
├─────────────────────────────────────────┤
│ Static — types, lint, mapping contracts   │
└─────────────────────────────────────────┘
```

- **Static** (TypeScript, ESLint, targeted “contract” tests for mappings) catches bad props, wrong enums, and broken wiring early and cheaply.
- **Unit** proves **rules and transforms** (e.g. Zod, formatting) and **single components** (loading, errors, one form) without mounting the whole flow.
- **Integration** (Vitest + React Testing Library + MSW) is our **primary safety net**: the same HTTP and store behaviour the product uses, with **different client payloads and flow props**. This is where most new scenarios belong.
- **End-to-end** (Playwright against the SellSense showcase) is **narrow**: smoke paths that prove the embedded shell, URLs, and scenario labels work with browser MSW—not a duplicate of every integration case.

We avoid treating “more unit tests” as the goal. We avoid relying on E2E for every permutation of organization type or API shape—that stays in integration with mocks.

---

## What each tier covers for OnboardingFlow

| Tier | Role |
|------|------|
| **Static / contracts** | Types align with generated APIs; mapping helpers (e.g. organization type ↔ gateway buckets) stay correct when enums grow. |
| **Unit** | Schema behaviour, screen-only UX branches, utilities (documents copy, warnings, array-field behaviour). |
| **Integration** | **Green-field** onboarding (gateway → create client → critical path through sections). **Seeded clients** (`GET /clients` shapes): sparse LLC, rich LLC, sole prop, and future factories—resume/overview and deep sections without repeating gateway setup. **Bad API seeds**: invalid stored values surface field-level messages until corrected. Screen-level integration tests where multiple hooks or mutations matter (e.g. gateway mutations, document flows). |
| **Storybook / visual** | Representative UI states and demos; Chromatic or manual review when layout or tokens change. Keeps mocks aligned with RTL seeds where we reuse the same canonical client objects. |
| **E2E** | A small set of named SellSense scenarios (green-field LLC and sole prop, prefilled client, document-focused mode) to validate **host + demo + MSW** integration. |

---

## Dimensions we cover and deliberately combine

Onboarding behaviour varies along several axes. Tests should **vary these intentionally** rather than relying on one giant journey.

### Functional modes and props

Examples we combine or extend over time:

- **Entry**: Green-field (no client id) vs **resume** (existing client).
- **Organization exposure**: Which legal structures `availableOrganizationTypes` allows—must stay consistent with gateway options and seeded payloads.
- **Product / jurisdiction**: Props that flip required fields or disabled regions (e.g. formation country rules).
- **Flow toggles**: Document-upload-only mode, link-account step visibility, sidebar visibility, alerts on exit—each changes navigation and chrome.

New toggles should add **at least one integration case** that asserts user-visible outcome (landing screen, hidden controls, or section availability), plus **unit/schema** coverage when validation rules change.

### Client lifecycle and data shape

We combine **lifecycle** (e.g. brand-new vs further along vs doc-heavy) with **party richness** (org-only vs multiple individuals, controllers, beneficial owners):

- **Minimal** payloads stress defaults and empty optional paths.
- **Rich** payloads stress prepopulated fields, readonly copy, and multi-party screens.
- **Invalid stored data** stresses recovery: user sees scoped errors and can fix without silent data loss.

Extending coverage means adding **fixtures** that differ along these axes—not only new screen tests in isolation.

### Non-functional concerns (where we invest)

- **Resilience**: Mutation and load failure paths belong in integration with MSW (errors, empty responses), scoped to the screen that owns the request—not in every E2E run.
- **Accessibility and i18n**: Critical paths should remain reachable by role/name; locale-specific formatting and copy live in schema or colocated tests when risk is high (see repo testing guidelines).
- **Performance**: Not a separate OnboardingFlow suite; heavy work stays in build budgets and profiling. Integration tests stay **deterministic** (retries off where we assert failure).

---

## How we extend coverage systematically

When you add behaviour, choose the **lowest tier that still proves the risk**:

1. **New validation or transform** → schema or util unit test first; add integration only if DOM wiring matters (masks, `validateOnMount`, server error mapping).
2. **New screen or branch** → colocated screen test, then extend **green-field** or **seeded** integration if it changes navigation or shared context.
3. **New supported entity / organization shape or API response variant** → new **scenario fixture** + integration test that lands on overview or the affected section; align Storybook/visual mocks when UX differs materially.
4. **New “bad API” field oddity** → seed fixture + behavioural parity with Storybook “Bad API Data” patterns so invalid stored values don’t slip past silently.
5. **Demo-facing scenario** → optional Playwright row using the showcase **scenario display name** (must match config)—only when host wiring or fullscreen embedding must be exercised.

Keeping **named client mocks** consistent across Vitest seeds, Storybook, and the SellSense demo reduces drift between automated layers.

---

## Where tests live (orientation)

- Flow and scenario integration: `src/core/OnboardingFlow/` (`*.integration.test.tsx`, `OnboardingFlow.test.tsx`).
- Scenario fixtures: `fixtures/scenarios/`, `fixtures/badApiClient.fixtures.ts`.
- Shared seeded-render helpers: `onboardingSeededScenarioTestUtils.tsx`.
- Screen and form units: beside the implementation under `screens/` and `forms/`.
- Showcase E2E: `app/client-next-ts/tests/e2e/onboarding-flow.spec.ts`.

For MSW architecture in the demo app, see `app/client-next-ts/MSW_SETUP.md` and `app/client-next-ts/AGENTS.md`.

---

## Commands

**embedded-components**

```bash
cd embedded-components
yarn test OnboardingFlow
yarn test:coverage:onboarding   # onboarding-focused coverage report
yarn typecheck
```

**Playwright (SellSense onboarding smoke)**

```bash
cd app/client-next-ts
yarn e2e:onboarding
```

---

## References

- Repo-wide testing patterns: `docs/testing-guidelines.md`
- Architecture: `embedded-components/ARCHITECTURE.md`
- Product-facing flow docs: `README.md`, `stories/Docs.mdx`
