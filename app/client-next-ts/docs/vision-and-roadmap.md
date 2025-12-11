# Embedded Finance & Solutions Showcase — Vision & Roadmap

## 1) Vision

- Be a complementary, interactive companion to the official Embedded Payments
  docs and OpenAPI (not a replacement) -
  https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/overview
- Deliver a shareable, themeable, and API-faithful demo that takes developers
  from docs to a running embedded-payments experience in minutes, not days.
- Show end-to-end flows (onboarding, linked accounts, payouts, transactions)
  with copyable code and deep links to the Embedded Payments docs.

## 2) Problem & Opportunity

- Friction today: scattered snippets, unclear mocks vs prod, theming
  uncertainty, and slow time-to-first-successful-run.
- Opportunity: shorten evaluation → pilot → production by pairing live mocks,
  guardrails, and one-click starters.

## 3) Personas & JTBD

- API-first Developer: run locally, copy/paste, validate payloads, and swap
  mocks for real endpoints.
- Technical Product Sponsor: see brand/theming/tone fit and flows without
  engineering setup.
- Partner Solutions / PS: repeatable playbooks, health checks, and go-live
  checklists.

## 4) Scope & Non-goals

- In-scope: onboarding, linked accounts, payouts, transactions, theming
  (built-in + custom), MSW-backed mocks, copy-code, doc links.
- Out-of-scope: real money movement, production auth, analytics,
  localization/RTL.

## 5) Experience Pillars

- URL-driven, shareable state (scenario/theme/view/tone/fullscreen).
- Mock fidelity + observability (MSW status/reset, health checks).
- Validated theming (presets + custom JSON import/preview).
- Copy-code + doc deep links for every widget.
- Guardrails to go-live (preflight, checklists).

## 6) Key Metrics

- Time-to-first-successful-run (local).
- Copy-code coverage (% widgets with copy + doc link).
- Scenario-to-snippet completeness.
- Health-check pass rate (CI and local).
- Custom-theme validation pass rate.

## 7) Roadmap Backlog (unordered)

### Currently Implemented (Verify & Enhance)

- ✅ Landing page with component gallery (Client Onboarding, Link Bank Account,
  Recipients, Make Payouts, Transactions, Accounts).
- ✅ Component cards with action buttons (View Live Demo, View Source Code, View
  Implementation Recipe, View API Documentation, View NPM Components) — **verify
  all links work**.
- ✅ SellSense demo with scenario/theme/tone selector in header.
- ✅ Theme customization button (brush icon) — **verify drawer functionality**.
- ✅ MSW demo notice banner with status indicator and reset button.
- ✅ Engineering Recipes section (3 recipes: Date Input Challenges, Important
  Date Selector, Partially Hosted Onboarding).
- ✅ Utility components showcase (Important Date Selector, Industry
  Classification) — **verify code links work**.
- ✅ Fullscreen component mode via URL params
  (`?fullscreen=true&component=...`).
- ✅ Scenario navigation (prev/next buttons in header).

### High Priority (Missing Core Features)

- ❌ **Copy-code functionality**: No visible "Copy Code" buttons on component
  cards or demo pages. Add inline code snippets with copy-to-clipboard for each
  showcased component.
- ❌ **Component Details dialog**: "Component Details" button exists in demo but
  needs verification — ensure it shows code snippets, props, and API links.
- ❌ **Theme editor validation**: Theme customization drawer exists but needs
  schema validation, JSON import/export, and preset management.
- ❌ **MSW status/reset UX**: Banner exists but could be more prominent; add
  persistent status pill in header; add preflight checklist modal.
- ❌ **Component code links**: Landing page buttons exist but need verification
  — ensure "View Source Code" links to actual GitHub files, "View Live Demo"
  opens correct demo URLs.
- ❌ **Starter kits**: No downloadable starter templates (Vite/React/Next) for
  quick local setup.
- ❌ **README/docs overhaul**: Current docs page is minimal — needs quickstart
  guide, scenario explanations, magic values reference, MSW setup instructions.

### Medium Priority (Enhanced DX)

- ⚠️ **Playground tab**: Add interactive payload editor with MSW response
  preview, curl/SDK snippet generation side-by-side.
- ⚠️ **Role-based presets**: Add Admin/Analyst/Support persona toggles with
  feature flags (read-only vs full access).
- ⚠️ **OpenAPI/JSON schema bundles**: Downloadable Postman/Insomnia collections
  per scenario with pre-configured requests.
- ⚠️ **Component status badges**: Landing page shows "Testing", "In Progress",
  "Coming Soon" — add tooltips explaining what's available vs planned.
- ⚠️ **Theme preset JSONs**: Publish downloadable JSON files for each built-in
  theme (Default Blue, Salt Theme, SellSense, PayFicient, Create Commerce,
  Custom).
- ⚠️ **Documentation deep links**: Ensure all "View API Documentation" buttons
  link to specific sections of official docs (not just overview page).

### Lower Priority (Future Enhancements)

- 🔮 **Minimal e2e/health-check CI**: Automated smoke tests for Empty + Custom
  theme scenarios.
- 🔮 **Hosted try-it sandbox**: Ephemeral demo instances with shareable URLs.
- 🔮 **Design-token pipeline**: Designer-friendly JSON → validated import →
  preview workflow.
- 🔮 **CLI helper**: Scaffold scenario, inject theme, run health checks from
  command line.
- 🔮 **Analytics on snippet usage**: Track which code snippets are copied most,
  identify error hotspots.
- 🔮 **Component comparison matrix**: Side-by-side comparison of similar
  components (e.g., different onboarding approaches).
- 🔮 **Accessibility audit report**: WCAG 2.1 AA compliance summary and
  VPAT-style documentation.
- 🔮 **Internationalization demo**: Show locale switching (fr-FR, de-DE, etc.)
  with content token examples.
