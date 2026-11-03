---
name: efs-components-best-practices
description: Integrate J.P. Morgan Embedded Finance & Solutions (EF&S) into a partner platform - Embedded Payments and Digital Onboarding REST APIs, the @jpmorgan-payments/embedded-finance-components React library (EBComponentsProvider, OnboardingFlow, LinkedAccountWidget, RecipientsWidget, PaymentFlow, Accounts, TransactionsDisplay), partially hosted onboarding through session transfer and an iframe, and webhooks. Use when building or debugging an EF&S integration, choosing between REST-only, embedded components, or hosted UI, or looking up the official recipes, OpenAPI specs, and showcase demos.
license: Apache-2.0
metadata:
  author: jpmorgan-payments
  source: https://github.com/jpmorgan-payments/embedded-finance
---

# Embedded Finance & Solutions (EF&S) integration

The open-source repo https://github.com/jpmorgan-payments/embedded-finance is the source of truth. The component library is pre-1.0: pin an exact version and check its `CHANGELOG.md` before relying on a prop.

## Choose an integration path

| Path | Choose when | Start with |
| --- | --- | --- |
| REST APIs only | You own the whole UI, or the work is server-side (client onboarding, payments, webhooks, reconciliation) | OpenAPI specs and recipes below |
| Embedded UI components | A React 18/19 host app wants ready-made onboarding, account, recipient, payment, or transaction UI | [embedded-components README](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md) |
| Partially hosted UI | You want J.P. Morgan-hosted onboarding or linked-account UI in an iframe with minimal frontend work | [Partially hosted integration guide](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md) |

In every path, EF&S credentials stay on your backend. Browser code talks to your platform service layer, which authenticates the user and forwards calls to EF&S.

## Embedded UI components

```bash
npm install @jpmorgan-payments/embedded-finance-components
```

Peer dependencies: `react` and `react-dom` `^18.2.0 || ^19`.

Every component must render inside `EBComponentsProvider`:

```tsx
import {
  EBComponentsProvider,
  OnboardingFlow,
} from '@jpmorgan-payments/embedded-finance-components';

<EBComponentsProvider
  apiBaseUrl="https://your-platform.example.com/ef/v1" // your proxy, not EF&S directly
  headers={{ Authorization: `Bearer ${platformSessionToken}` }}
  contentTokens={{ name: 'enUS' }} // 'enUS' | 'frCA' | 'esUS'
  theme={{ colorScheme: 'light', variables: { primaryColor: '#0b5394' } }}
>
  <OnboardingFlow
    availableProducts={['EMBEDDED_PAYMENTS']}
    availableJurisdictions={['US']}
    onPostClientSettled={(client, error) => {
      // uncontrolled mode: persist client?.id on your platform
    }}
  />
</EBComponentsProvider>;
```

Provider props (`EBConfig`): `apiBaseUrl` (required), `apiBaseUrlTransforms` (rewrite the base URL per first path segment, e.g. `clients`), `headers`, `queryParams`, `theme` (`colorScheme`, `variables`, `light`, `dark`), `contentTokens` (`name`, per-namespace `tokens` overrides, `showTokenIds`), `reactQueryDefaultOptions`, `clientId`.

Exports from the package root:

| Export | Purpose |
| --- | --- |
| `OnboardingFlow` | Digital onboarding for a new client (controlled with `clientId`, or uncontrolled - creates the client) |
| `ClientExperience` | Routes a client to `OnboardingFlow` or `ApprovedClientMaintenance` by status |
| `ApprovedClientMaintenance`, `ClientDetails` | Post-approval profile, ownership, and KYC views |
| `LinkedAccountWidget` | External bank account linking with microdeposit verification |
| `RecipientsWidget` | Payment recipient management |
| `Accounts`, `TransactionsDisplay` | Account balances and transaction history |
| `PaymentFlow`, `PaymentFlowInline` | Domestic payouts (ACH, RTP, Wire) |
| `PaymentFlowFX`, `PaymentFlowFXInline` | Cross-border FX payouts with quotes |
| `initEBComponentsManager` | Mount components from non-React (vanilla JS) hosts |
| `types` | Generated API request/response types |

Component maturity varies (Stable, In Testing, Beta, In Progress); the README table is current.

Integration notes:

- **Contracts:** each component's props live in `embedded-components/src/core/<Component>/<Component>.types.ts`; behavior is specified in `FUNCTIONAL_REQUIREMENTS.md` next to it (Accounts, ClientDetails, OnboardingFlow, PaymentFlow, RecipientWidgets, TransactionsDisplay).
- **Styling isolation:** library styles use Tailwind with an `eb-` prefix and a preflight scoped to the component container, so they don't reset host styles. Host code should not add `eb-` classes; theme through `theme.variables` (see [DESIGN_TOKENS.md](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/DESIGN_TOKENS.md)).
- **Copy and locales:** override text with `contentTokens.tokens`; set `showTokenIds: true` to reveal token IDs while customizing. Locale JSON is importable from `@jpmorgan-payments/embedded-finance-components/i18n/<en-US|fr-CA|es-US>/<namespace>.json`.
- **Analytics:** components accept `userEventsHandler` to forward user-journey events to RUM tools (Dynatrace, Datadog).
- **Removing linked accounts:** `hideLinkedAccountRemoval` (on `OnboardingFlow`) and `hideRemoveRecipient` (on `LinkedAccountWidget` / `RecipientsWidget`) control different UIs; set both to hide unlinking everywhere.
- **Accessibility:** components follow ADA best practices, but the host is responsible for its own accessibility testing.

## Partially hosted onboarding

1. Create the client first (`POST /clients`); a session needs a client ID.
2. Your frontend calls **your** backend (for example `POST /sessions`); your backend authenticates the user (with MFA) and requests a session from the onboarding service with `{ "type": "EMBEDDED_UI", "target": { "id": "<clientId>", "type": "CLIENT" } }`.
3. The response contains a `url` carrying a short-lived JWT (about 60 seconds). Load it in an `<iframe>` right away; don't cache or log it.
4. Pick the UI with `experienceType`: `HOSTED_ONBOARDING_UI`, `HOSTED_DOC_UPLOAD_ONBOARDING_UI` (default), or `HOSTED_LINKED_ACCOUNTS_UI`.
5. Optionally listen for `postMessage` events; always check `event.origin`, and confirm final status server-side (`GET /clients/:id` or webhooks).

Guides: [integration guide](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md) (iframe security attributes, responsiveness, URL parameters), [utility library](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UTILITY_GUIDE.md), [URL size and compact config](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/URL_SIZE_AND_COMPACT_CONFIG.md).

## REST APIs and recipes

OpenAPI specs: [`embedded-components/api-specs/`](https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/api-specs) - `smbdo` (digital onboarding), `ef` (embedded finance v1/v2), `ep-accounts`, `ep-recipients`, `ep-transactions`, `fx-rate-sheet`. Product documentation: https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments.

Recipes in [`embedded-components/docs/`](https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/docs):

| Recipe | Use for |
| --- | --- |
| `DIGITAL_ONBOARDING_FLOW_RECIPE.md` | Onboarding steps, UX cues, client status handling |
| `WEBHOOK_INTEGRATION_RECIPE.md` | Webhook events and how the UI should react |
| `LINKED_ACCOUNTS_RECIPE.md` | Linking and verifying external bank accounts |
| `LIST_TRANSACTIONS_RECIPE.md` | Transaction history and pagination |
| `CROSS_BORDER_FX_PAYOUT_CLIENT_RECIPE.md` | FX quotes and cross-border payouts |
| `APPROVED_CLIENT_MAINTENANCE_RECIPE.md` | Changes after a client is approved |
| `REQUEST_FOR_INFORMATION_RECIPE.md` | Responding to information requests |
| `DOCS_UPLOAD_FORM_RECIPE.md` | Document upload requirements |
| `DATE_PARSING_GUIDE.md`, `IMPORTANT_DATE_SELECTOR_RECIPE.md` | Date handling and date-of-birth/incorporation inputs |
| `CONTENT_TOKENS_ARCHITECTURE.md` | Customizing component copy |

## Showcase and local mocks

- https://embedded-finance-dev.com/ - live demos: `/sellsense-demo` (full marketplace with mocked APIs), `/partially-hosted-demo`, `/webhook-explorer`, `/stories` (recipe walkthroughs), `/components`.
- No sandbox credentials yet? Reuse the MSW handlers in `embedded-components/src/msw/` and `app/client-next-ts/src/msw/` to run against realistic mock data.
- When reading this repo for context, prefer the markdown recipes and `*.types.ts` files over guessing from story snippets.
