---
name: efs-components-best-practices
description: EF&S integration links — REST APIs behind partner platforms; partially hosted onboarding; recipes/webhooks; monorepo as WS reference; released embedded UI + provider wiring.
---

# Embedded Finance & Solutions — agents

1. **REST integration** — Embedded Finance REST APIs behind platform backends; honor environment API specs plus lifecycle patterns (onboarding, webhooks, reconciliation) instead of treating UI snippets as sufficient documentation.

2. **Partially hosted UI** — Session transfer, iframe layout, origins, `postMessage`, hardened operational boundaries.

3. **Workspace reference** — Use this OSS tree (handlers, mocks, demos, requirement `.md` next to features) without requiring the NPM install path.

4. **Released embedded UI** — Only when integrating shipped React surfaces: embedded-components readme (install/export), `EBComponentsProvider`, design/content tokens—that path is narrower than bespoke frontends built only on REST.

## Partially hosted

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md  

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UTILITY_GUIDE.md  

## Recipes (`embedded-components/docs/`)

Webhook UX:  

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/WEBHOOK_INTEGRATION_RECIPE.md  

Dates:  

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/DATE_PARSING_GUIDE.md  

Important-date selector constraints:  

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/IMPORTANT_DATE_SELECTOR_RECIPE.md  

Onboarding-flow narrative + UX cues:  

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/DIGITAL_ONBOARDING_FLOW_RECIPE.md  

## Monorepo

Root:  

https://github.com/jpmorgan-payments/embedded-finance  

Readme (`embedded-components/`):  

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md  

Architecture:  

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/ARCHITECTURE.md  

`src/core` index:  

https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/README.md  

## Showcase

https://embedded-finance-dev.com/ — demos, `/stories` recipe pages, `/partially-hosted-demo`.

## Embedded UI (when mounting released components)

- Mount under `EBComponentsProvider`; follow readme for tokens and customization.
- Library sources often use Tailwind utilities with an `eb-` prefix; host apps frequently use unprefixed utilities—don't mix arbitrarily.
- `package.json` `"exports"` and `FUNCTIONAL_REQUIREMENTS.md` beside each feature under `embedded-components/src/core/` trail props/contracts.
- For LLM ingestion, prefer bundled showcase recipe text or GitHub-rendered markdown over guessing from partial snippets.
