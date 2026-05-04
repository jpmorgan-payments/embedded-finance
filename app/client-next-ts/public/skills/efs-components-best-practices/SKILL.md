---
name: efs-components-best-practices
description: Canonical links and onboarding for JP Morgan Embedded Finance UI components — GitHub readme, recipes, partially hosted onboarding, webhook UX, Storybook-aligned docs paths, and EBComponentsProvider usage.
---

# Embedded Finance UI components — agent quick reference

Use this skill when integrating or refactoring code that consumes `@jpmorgan-payments/embedded-finance-components` or mirroring repo patterns.

## Canonical repository (GitHub)

- Repo root: [jpmorgan-payments/embedded-finance](https://github.com/jpmorgan-payments/embedded-finance)
- Package: `embedded-components/`
- **Library readme (integration concepts, EBComponentsProvider, props overview):**
  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md
- **Component architecture (mandatory patterns for codegen in this repo):**
  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/ARCHITECTURE.md
- **Core components folder index:**
  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/README.md

## Hosted / partially hosted onboarding

- Partially hosted UI integration guide (session transfer, iframe, postMessage, security):

  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md

- Hosted utility behaviors (partner-side helpers):

  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UTILITY_GUIDE.md

## Engineering recipes (`embedded-components/docs/`)

- Webhook integration UX recipe:

  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/WEBHOOK_INTEGRATION_RECIPE.md

- Date parsing guide (timezone / ambiguous strings):

  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/DATE_PARSING_GUIDE.md

- Important Date Selector recipe:

  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/IMPORTANT_DATE_SELECTOR_RECIPE.md

- Digital onboarding flow (product-oriented):

  https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/DIGITAL_ONBOARDING_FLOW_RECIPE.md

## Operational guidance

1. **Provider:** All embedded UI must sit under `EBComponentsProvider` (see library readme).
2. **Styling:** In the NPM package repo, Tailwind utilities use the `eb-` prefix inside `embedded-components` only — do not copy that prefix into host apps unless that app is configured for it (the public showcase uses plain Tailwind).
3. **Types & APIs:** Prefer reading `*.tsx` component props beside each export and `embedded-components/package.json` `"exports"`; functional requirements Markdown files live next to implementations under `embedded-components/src/core/<Component>/` (often `FUNCTIONAL_REQUIREMENTS.md` or component-specific filenames).
4. **Recipes:** For LLM ingestion, paste the GitHub-rendered Markdown or fetch raw URLs from GitHub (`raw.githubusercontent.com` / bundled copies in showcase stories).
