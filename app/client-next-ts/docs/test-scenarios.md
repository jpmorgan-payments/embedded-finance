# Isolated onboarding demo routes

This document is for **maintainers**. It describes how mocked onboarding demos are split across **separate URL paths**, each with its own MSW seed and UI configuration. These routes are **not** SellSense: SellSense uses `POST /ef/do/v1/_reset` with `{ scenario, overrides }` only. The demo routes may add `testDemoScenario` / `testScenarioBundle` on `_reset` and never read SellSense `localStorage` (`sellsense-mock-overrides`).

## Routes (end-user entry points)

| Path                                                        | MSW bundle id (internal)    | Notes                                                                                                                                                                              |
| ----------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`/test-scenario`](http://localhost:3000/test-scenario)     | `test-scenario`   | Operator 80–shaped LLC client; Salt theme; full login paths including link-bank.                                                                                                   |
| [`/test-scenario-2`](http://localhost:3000/test-scenario-2) | `test-scenario-2` | Top Dog Construction client; **warm-neutral demo theme** (`test-scenario-2-theme.ts`, not in SellSense picker); **full onboarding-style logins** (happy path, docs, **linked-microdeposit** / **linked-active** with **zero** pre-mocked linked recipients) **plus** one optional login that pre-seeds **three** linked accounts (`3-linked@demo.test`). |
| [`/test-scenario-3`](http://localhost:3000/test-scenario-3) | `test-scenario-3` | Health & Benefit Solutions client; **single** link-bank account (ACH + WIRE + RTP); standard login profiles only (no pre-seeded multi-link); health-sector `priorityIndustryCodes`. |
| [`/test-scenario-4`](http://localhost:3000/test-scenario-4) | `test-scenario-4` | Faster Fulfilment Corp.; `Empty` theme; logistics `priorityIndustryCodes`. **Two happy paths:** `happy-path-ptc@demo.test` (`happy-path-ptc` mode, C-corp + Nasdaq PTC in MSW, `enablePubliclyTradedCompanies: true`) and `happy-path@demo.test` (LLC in MSW, no `publiclyTraded`, component flag off). Other logins match `/test-scenario-2` (docs, linked accounts, `3-linked@demo.test`). Same **root chrome** as other test-scenario routes (no Solutions Showcase `LandingHeader`). |

Each path renders only its own flow. **Do not** add UI on these pages that refers to the other paths or “scenario numbers.”

## Concepts

### Bundle (internal)

A **bundle** ties together:

- **Route** → fixed `bundleId` passed from [`src/routes/test-scenario*.tsx`](../src/routes/test-scenario.tsx).
- **UI**: theme, content tokens, `OnboardingFlow` flags via [`test-scenario-bundles.ts`](../src/components/test-scenario/test-scenario-bundles.ts) (e.g. `enablePubliclyTradedCompanies` for PTC gateway/review UI—not only MSW party data).
- **`clientId`** for `EBComponentsProvider`, matching the client MSW seeds for that bundle.

### Login profile / mode

Each username profile maps to a **`TestDemoScenarioMode`** (`happy-path`, `doc-request`, …). It is sent as `testDemoScenario` on `_reset` and as **`X-Test-Demo-Scenario`** after Continue. Handler behavior lives in [`src/msw/db.ts`](../src/msw/db.ts) and [`src/msw/handlers.ts`](../src/msw/handlers.ts).

### Persistence

- **SellSense**: `sellsense-mock-overrides` + atomic `_reset` (see [AGENTS.md — MSW DB Override Architecture](../AGENTS.md)).
- **These demos**: [`resetTestDemoDatabase`](../src/lib/database-reset-utils.ts) sends `overrides: {}` so SellSense overrides never apply.

Pathname → bundle mapping for reference:

```ts
// test-scenario-bundles.ts — TEST_SCENARIO_ROUTE_BY_BUNDLE
```

## How to add a new demo route

1. Choose a **unique pathname** (e.g. `/test-scenario-4`) and add `src/routes/test-scenario-4.tsx` that renders `<TestScenarioPage bundleId="…" />`.
2. Extend **`TestScenarioBundleId`** and **`parseTestScenarioBundleId`** / **`applyTestDemoScenario`** in [`src/msw/db.ts`](../src/msw/db.ts); add client mock(s) under `src/mocks/`.
3. Register the bundle in **`BUNDLES`** and **`TEST_SCENARIO_ROUTE_BY_BUNDLE`** in [`test-scenario-bundles.ts`](../src/components/test-scenario/test-scenario-bundles.ts).
4. Include the new pathname in **`isTestScenario`** in [`src/routes/__root.tsx`](../src/routes/__root.tsx) if it should use the same chrome as other demos (no landing header/footer).
5. Add an integration test in [`handlers.integration.test.ts`](../src/msw/handlers.integration.test.ts) if MSW behavior is new.
6. Keep each page’s copy **scoped to that demo only** (no cross-links or comparative wording).

## Related files

| File                                                                                                            | Role                            |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [`src/routes/test-scenario.tsx`](../src/routes/test-scenario.tsx)                                               | `/test-scenario`                |
| [`src/routes/test-scenario-2.tsx`](../src/routes/test-scenario-2.tsx)                                           | `/test-scenario-2`              |
| [`src/routes/test-scenario-3.tsx`](../src/routes/test-scenario-3.tsx)                                           | `/test-scenario-3`              |
| [`src/routes/test-scenario-4.tsx`](../src/routes/test-scenario-4.tsx)                                           | `/test-scenario-4`              |
| [`src/components/test-scenario/test-scenario-page.tsx`](../src/components/test-scenario/test-scenario-page.tsx) | Shared login + `OnboardingFlow` |
| [`src/lib/database-reset-utils.ts`](../src/lib/database-reset-utils.ts)                                         | `resetTestDemoDatabase`         |
| [`src/msw/db.ts`](../src/msw/db.ts)                                                                             | `applyTestDemoScenario`, seeds  |

## MSW packages

`msw` and `@mswjs/data` versions are aligned with the rest of the monorepo; bump after checking release notes.
