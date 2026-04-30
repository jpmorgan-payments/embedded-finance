# OnboardingFlow testing strategy

This document describes how we test **OnboardingFlow**: layers of the pyramid, where tests live, and how they relate to Storybook and the SellSense showcase.

## Layers

| Layer | Tooling | Purpose |
| -------- | --------- | --------- |
| **Schema / pure logic** | Vitest | Zod rules, refinements, field transforms (`*.schema.test.ts`, `*.schema.test.tsx`). Fast, no DOM. |
| **Screen / form UI** | Vitest + RTL | Single screen behaviour, loading/error branches (`*.test.tsx` next to screens/forms). |
| **Flow integration** | Vitest + RTL + MSW | Multi-step journeys inside the library with real handlers (`OnboardingFlow.test.tsx`, `*.integration.test.tsx`). Uses `EBComponentsProvider` / `clientId` when the flow depends on loaded client data. |
| **Seeded client scenarios (GET /clients)** | Vitest + RTL + MSW `db` | One integration file **per scenario**, each paired with a colocated fixture under **`fixtures/scenarios/`**. Render with `clientId` after `resetAndSeedClient(fixture)` so `GET /clients/:id` reflects **pre-created** API shapes: **`OnboardingFlow.scenarioMinimalLlc.seeded.integration.test.tsx`** + `minimalLlcNew.fixture.ts` (sparse LLC org-only party); **`OnboardingFlow.scenarioLlcCorpRich.seeded.integration.test.tsx`** + `llcCorpRichNew.fixture.ts` (same payload as Storybook **`mockClientNew`**, isolated Vitest id); **`OnboardingFlow.scenarioSoleProp.seeded.integration.test.tsx`** + `solePropNew.fixture.ts` (**`efClientSolPropNew`**). Shared RTL helpers: **`onboardingSeededScenarioTestUtils.tsx`**. Distinct from **`OnboardingFlow.test.tsx`**, which stays **green-field** (no `clientId`; gateway → `POST /clients` → typed journey). |
| **Bad API / seeded invalid data** | Vitest + MSW | Mirrors Storybook **Bad API Data** seeds (`fixtures/badApiClient.fixtures.ts`, `OnboardingFlow.badApiStoryScenarios.integration.test.tsx`). Asserts **field-level** validation: invalid seed shows `FormMessage` (ⓘ prefix), correction clears **that field’s** message (not necessarily zero errors elsewhere on the step). |
| **Storybook** | Chromatic / manual | Visual scenarios, MSW loaders, play functions (`stories/`). Prefer importing **`mockClientNew`** / **`efClientSolPropNew`** (or factories built from them) so Vitest seeds stay aligned with Storybook and the demo. |
| **Showcase E2E (browser)** | Playwright (`app/client-next-ts/tests/e2e/`) | Smoke **scenarios** against the SellSense demo (deployed or local): gateway vs prefilled LLC, document-only mode, etc. Not a substitute for Vitest coverage; catches routing/MSW/host wiring issues. |

## Per-scenario seeded clients for RTL and Storybook

This pattern **emulates different already-created clients** for **`GET /clients/:id`**: MSW serves a specific `ClientResponse`, then **`OnboardingFlow`** renders inside **`EBComponentsProvider`** with matching **`clientId`**. That skips the gateway and exercises resume/overview/section behaviour per API shape—distinct from **`OnboardingFlow.test.tsx`** green-field onboarding (no `clientId` until **`POST /clients`**).

### Layout: one fixture file per integration test

| Integration test | Fixture (factory + id) | What it emulates | Storybook / shared mock parity |
|------------------|------------------------|------------------|--------------------------------|
| `OnboardingFlow.scenarioMinimalLlc.seeded.integration.test.tsx` | `fixtures/scenarios/minimalLlcNew.fixture.ts` — `createMinimalLlcNewClient()`, `MINIMAL_LLC_NEW_CLIENT_ID` | Sparse **NEW** LLC: org-only party, minimum fields (spirit of a thin `POST /clients` result) | RTL-only shape today; extend Storybook later if we add a matching story |
| `OnboardingFlow.scenarioLlcCorpRich.seeded.integration.test.tsx` | `fixtures/scenarios/llcCorpRichNew.fixture.ts` — `createLlcCorpRichNewClient()`, `LLC_CORP_RICH_NEW_SEEDED_CLIENT_ID` | Rich **NEW** LLC + individuals (controller, UBOs, etc.) | **`cloneDeep(mockClientNew)`** from **`stories/story-utils.tsx`** — same payload as default NEW corp stories; **id** overridden in tests so Vitest can run beside suites that seed **`DEFAULT_CLIENT_ID`** |
| `OnboardingFlow.scenarioSoleProp.seeded.integration.test.tsx` | `fixtures/scenarios/solePropNew.fixture.ts` — `createSolePropNewClient()`, `SOLE_PROP_NEW_CLIENT_ID` | **NEW** sole proprietorship | **`efClientSolPropNew`** (`src/mocks/efClientSolPropNew.mock.ts`) — same id **`0030000135`** everywhere |

### RTL plumbing

1. **`beforeEach`**: `server.resetHandlers()` (via shared hooks) then **`resetAndSeedClient(fixture, clientId)`** (**`stories/story-utils.tsx`**) upserts that client into the MSW **`db`** used by **`@/msw/server`**.
2. **Render**: **`renderSeededOnboardingFlow(clientId)`** in **`onboardingSeededScenarioTestUtils.tsx`** mirrors the Storybook/demo-style **`EBComponentsProvider`** wiring (API base URL transforms, content tokens, `clientId`).
3. **Assert**: Navigate to Business (or rely on Overview) using RTL; **`assertSeededLegalNameVisibleInBusinessSection`** accounts for **business identity** vs **Check your answers** vs **sole prop** readonly legal name copy.

**`onboardingSeededScenarioTestUtils.tsx`** also centralizes **`clearSharedQueryClient`**, hook-order **`console.error`** noise suppression, and the **`setupSeededOnboardingScenarioHooks(server)`** lifecycle so each scenario file stays thin.

### Storybook and visual regression

Stories should import the **same canonical objects** (**`mockClientNew`**, **`efClientSolPropNew`**, `efClientCorpEBMock`-derived helpers) as the Vitest factories where possible. RTL proves behaviour against those shapes; **Storybook / Chromatic** (or other visual regression on stories) stays trustworthy because the underlying mock client JSON matches.

## Playwright end-to-end flows (SellSense)

Spec file: **`app/client-next-ts/tests/e2e/onboarding-flow.spec.ts`**.

Each test opens fullscreen onboarding with fixed query params (same shape as manual QA):

| Query param | Value |
|-------------|--------|
| `fullscreen` | `true` |
| `component` | `onboarding` |
| `theme` | `Empty` |
| `scenario` | SellSense **display name** from **`SCENARIOS_CONFIG`** (`app/client-next-ts/src/components/sellsense/scenarios-config.ts`) |

Base URL: **`ONBOARDING_E2E_URL`** env var, or default `https://embedded-finance-dev.com/sellsense-demo` (strip trailing slash). Example local run:  
`ONBOARDING_E2E_URL=http://localhost:3000/sellsense-demo yarn e2e:onboarding`.

### Covered journeys

| Playwright test | `scenario` (display name) | Flow exercised | Assertions |
|-----------------|---------------------------|----------------|------------|
| LLC minimal data | `New Seller - Onboarding` | Gateway → **Registered business** → LLC legal structure → **Get started** → Overview | Shell `#embedded-component-layout` visible; gateway heading **Let's help you get started**; ends on **Verify your business** |
| Sole proprietorship minimal | `New Seller - Onboarding` | Gateway → **I'm the sole owner of my business** → **Get started** → Overview | Same shell/gateway visibility; ends on **Verify your business** |
| LLC prefilled / almost complete | `Onboarding - Seller with prefilled data` | Existing client: skips gateway | Overview section CTAs (`business-section-button`, `personal-section-button`); **Verify your business** copy |
| Documents needed / doc-upload-only | `Onboarding - Docs Needed` | Existing client + document-focused mode | Heading **Supporting documents** |

Scenario labels in tests **must match** `displayName` strings in **`SCENARIOS_CONFIG`** exactly.

## How mock data is wired

### SellSense showcase + Playwright (browser MSW)

- **Transport**: The demo runs **Mock Service Worker** in the browser (`app/client-next-ts/src/msw/`). Embedded **`OnboardingFlow`** is rendered inside **`KycOnboarding`** (`kyc-onboarding.tsx`), which passes **`EBComponentsProvider`** `apiBaseUrl="/ef/do/v1/"` and optional **`clientId`** from scenario config.
- **Scenario → `clientId`**: **`getClientIdFromScenario`** (`sellsense-scenarios.ts`) reads **`SCENARIOS_CONFIG[<key>].clientId`**. **New Seller - Onboarding** uses **`undefined`** — no prefetched client; the user goes through the gateway and **`POST /clients`** creates the record. **Prefilled** and **Docs Needed** pass **`0030000132`** and **`0030000133`** respectively so **`GET /clients/:id`** returns seeded rows from the in-memory DB.
- **DB reset**: Changing scenarios triggers **`DatabaseResetUtils.resetDatabaseForScenario`** (`database-reset-utils.ts`), which **`POST`s `/ef/do/v1/_reset`** with `{ scenario, overrides }`. **`overrides`** comes from **`localStorage`** (mock API editor); the body is applied **atomically** with the seed so the worker never reads `localStorage` directly. Onboarding scenarios use **`resetDbScenario: 'empty'`** — see **`handlers.ts`** → **`resetDb`** in **`db.ts`**.
- **Predefined clients**: **`app/client-next-ts/src/msw/db.ts`** seeds **`predefinedClients`** (e.g. **`0030000132`** LLC review-style shape, **`0030000133`** LLC with outstanding documents). The **`empty`** scenario still creates these client rows (and related parties) but uses an “empty” recipient/transaction layout; green-field onboarding does not mount a `clientId` until after **POST /clients**.
- **Docs-needed mode**: **`isOnboardingDocsNeededScenario`** sets **`docUploadOnlyMode`** on **`OnboardingFlow`** so the UI lands on the document path for the docs-needed scenario.
- **Deeper detail**: **`app/client-next-ts/AGENTS.md`** (MSW DB override architecture) and **`app/client-next-ts/MSW_SETUP.md`** (worker setup and mocking overview).

### Vitest + RTL (embedded-components, Node MSW)

- **Transport**: **`@/msw/server`** + **`@mswjs/data`** **`db`**; **`resetAndSeedClient(client, id)`** (**`stories/story-utils.tsx`**) seeds **`GET /clients/:id`** before render.
- **Green-field**: **`OnboardingFlow.test.tsx`** — no `clientId`; **`POST /clients`** and typed journey.
- **Seeded GET / multiple client shapes**: see **[Per-scenario seeded clients for RTL and Storybook](#per-scenario-seeded-clients-for-rtl-and-storybook)** — **`fixtures/scenarios/*.fixture.ts`** + **`OnboardingFlow.scenario*.seeded.integration.test.tsx`** + **`onboardingSeededScenarioTestUtils.tsx`**.
- **Invalid API shapes**: **`fixtures/badApiClient.fixtures.ts`** + **`OnboardingFlow.badApiStoryScenarios.integration.test.tsx`** — field-level **`FormMessage`** behaviour.

Keeping **named mocks** aligned (**`mockClientNew`**, **`efClientSolPropNew`**, showcase **`predefinedClients`**) across Storybook, RTL, and SellSense reduces drift between automated RTL, visual regression on stories, and the demo.

## Where to add tests

- **New validation rule** → extend or add `BusinessIdentityForm.schema.test.tsx`, `IndividualIdentityForm.schema.test.tsx`, etc., then optionally one behavioural integration example if wiring matters (masked inputs, `validateOnMount`).
- **New screen or branching** → colocated `*.test.tsx`, then extend `OnboardingFlow.test.tsx` if it changes the **green-field** critical path.
- **New pre-created client shape** (how `GET /clients` looks after API/onboarding-service creates a client) → add **`fixtures/scenarios/<scenario>.fixture.ts`** and **`OnboardingFlow.scenario<Name>.seeded.integration.test.tsx`** (reuse helpers from **`onboardingSeededScenarioTestUtils.tsx`**).
- **API-shaped regressions** → add fixture factory + Storybook Bad Data story + row in `OnboardingFlow.badApiStoryScenarios.integration.test.tsx` (field-scoped FormMessage assertions).
- **Demo scenario smoke** → `onboarding-flow.spec.ts` (Playwright) using the same **display names** as `SCENARIOS_CONFIG` in `app/client-next-ts/src/components/sellsense/scenarios-config.ts`.

## Commands (embedded-components)

```bash
cd embedded-components
yarn test OnboardingFlow              # pattern match Vitest
yarn vitest run src/core/OnboardingFlow/OnboardingFlow.badApiStoryScenarios.integration.test.tsx
yarn vitest run src/core/OnboardingFlow/OnboardingFlow.scenarioMinimalLlc.seeded.integration.test.tsx
yarn vitest run src/core/OnboardingFlow/OnboardingFlow.scenarioLlcCorpRich.seeded.integration.test.tsx
yarn vitest run src/core/OnboardingFlow/OnboardingFlow.scenarioSoleProp.seeded.integration.test.tsx
yarn typecheck
```

## Commands (Playwright onboarding scenarios)

```bash
cd app/client-next-ts
yarn e2e:onboarding
# Local MSW showcase:
# ONBOARDING_E2E_URL=http://localhost:3000/sellsense-demo yarn e2e:onboarding
```

See **[Playwright end-to-end flows (SellSense)](#playwright-end-to-end-flows-sellsense)** for URL shape, scenarios, and assertions.

## References

- Green-field vs seeded RTL: **`OnboardingFlow.test.tsx`** exercises gateway + POST client + long keyboard path; **`OnboardingFlow.scenario*.seeded.integration.test.tsx`** exercises **existing** clients only.
- Future improvements: map factories to named scenario keys (SellSense / Storybook parity), add `REVIEW_IN_PROGRESS` / `INFORMATION_REQUESTED` seeds, consider Vitest file-level isolation if MSW `db` races appear under parallel workers.
- Architecture: `embedded-components/ARCHITECTURE.md`
- Component README (journeys / analytics): `README.md`
- Storybook docs block: `stories/Docs.mdx`
- Repo-wide testing patterns: `docs/testing-guidelines.md`
