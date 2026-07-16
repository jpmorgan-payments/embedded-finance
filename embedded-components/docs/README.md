# Embedded Components — Docs Index

Maintainer and integrator documentation for `@jpmorgan-payments/embedded-finance-components`.

## Start here

| Doc | Audience | Purpose |
| --- | -------- | ------- |
| [../README.md](../README.md) | Integrators | Public component inventory, props, theming, i18n |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | Contributors | Source of truth for code structure |
| [../AGENTS.md](../AGENTS.md) | Agents / contributors | Package commands and conventions |
| [../CHANGELOG.md](../CHANGELOG.md) | Everyone | Release notes |

## Integration recipes

| Doc | Topic |
| --- | ----- |
| [DIGITAL_ONBOARDING_FLOW_RECIPE.md](./DIGITAL_ONBOARDING_FLOW_RECIPE.md) | OnboardingFlow screens & flow model |
| [DIGITAL_ONBOARDING_RECIPE.md](./DIGITAL_ONBOARDING_RECIPE.md) | **Archived** stub (legacy wizard removed) |
| [LINKED_ACCOUNTS_RECIPE.md](./LINKED_ACCOUNTS_RECIPE.md) | Linked account linking |
| [LIST_TRANSACTIONS_RECIPE.md](./LIST_TRANSACTIONS_RECIPE.md) | Transactions list |
| [DOCS_UPLOAD_FORM_RECIPE.md](./DOCS_UPLOAD_FORM_RECIPE.md) | Document upload |
| [WEBHOOK_INTEGRATION_RECIPE.md](./WEBHOOK_INTEGRATION_RECIPE.md) | Webhooks |
| [IMPORTANT_DATE_SELECTOR_RECIPE.md](./IMPORTANT_DATE_SELECTOR_RECIPE.md) | Date selector UX |
| [partially-hosted/](./partially-hosted/) | Partially hosted onboarding |

## Architecture & quality

| Doc | Topic |
| --- | ----- |
| [CONTENT_TOKENS_ARCHITECTURE.md](./CONTENT_TOKENS_ARCHITECTURE.md) | Content tokens / i18n overrides |
| [EMBEDDED_FINANCE_PATTERNS.md](./EMBEDDED_FINANCE_PATTERNS.md) | Cross-component UI/UX patterns |
| [THEME_QA_GUIDE.md](./THEME_QA_GUIDE.md) | Theme token QA |
| [TESTING_CATALOG.md](./TESTING_CATALOG.md) | Test catalog |
| [COVERAGE_IMPROVEMENT_PLAN.md](./COVERAGE_IMPROVEMENT_PLAN.md) | Coverage roadmap (living) |
| [DATE_PARSING_GUIDE.md](./DATE_PARSING_GUIDE.md) | Date parsing pitfalls |
| [ACCELERATING_API_IMPLEMENTATION.md](./ACCELERATING_API_IMPLEMENTATION.md) | OAS → UI acceleration notes |
| [CONNECT_TO_API_QA.md](./CONNECT_TO_API_QA.md) | API connectivity QA |
| [NAICS_RECOMMENDATION_IMPLEMENTATION_GUIDE.md](./NAICS_RECOMMENDATION_IMPLEMENTATION_GUIDE.md) | NAICS industry suggestions |

## Component-level docs (in `src/core/`)

| Component | Docs |
| --------- | ---- |
| OnboardingFlow | `README.md`, `FUNCTIONAL_REQUIREMENTS.md`, `DELTA_MODE_SPEC.md`, `TESTING.md` |
| PaymentFlow | `REQUIREMENTS.md`, `FUNCTIONAL_REQUIREMENTS.md` |
| PaymentFlowFX | `README.md`, `SPECIFICATION.md` (**Beta**) |
| RecipientWidgets | `README.md`, per-widget READMEs, requirements |
| Accounts / TransactionsDisplay / ClientDetails / IndirectOwnership | `README.md` and/or `*_REQUIREMENTS.md` |

## UX testing archives

Historical session reports live under [ux-testing/](./ux-testing/). They are **point-in-time** evidence (may mention removed components such as `MakePayment`). Prefer [../BACKLOG.md](../BACKLOG.md) for open work.

## Related root docs

Repo-wide guides: [../../docs/README.md](../../docs/README.md) (setup, testing, code quality, PTC feature plan).
