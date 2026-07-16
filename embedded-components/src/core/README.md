# Core Components Organization

This directory contains the main embedded banking components organized by functionality.

## Directory Structure

### Core Components (public API)

Exported from `src/index.tsx`:

| Directory            | Components                                      | Notes                                      |
| -------------------- | ----------------------------------------------- | ------------------------------------------ |
| `OnboardingFlow/`    | `OnboardingFlow`                                | Stable; optional PTC via `enablePubliclyTradedCompanies` |
| `PaymentFlow/`       | `PaymentFlow`, `PaymentFlowInline`              | Domestic USD payments                      |
| `PaymentFlowFX/`     | `PaymentFlowFX`, `PaymentFlowFXInline`          | **Beta** — cross-border / FX payouts       |
| `Accounts/`          | `Accounts`                                      | In testing                                 |
| `ClientDetails/`     | `ClientDetails`                                 | In testing                                 |
| `RecipientWidgets/`  | `LinkedAccountWidget`, `RecipientsWidget`       | Stable                                     |
| `TransactionsDisplay/` | `TransactionsDisplay`                         | In testing                                 |
| `EBComponentsProvider/` | `EBComponentsProvider`                       | Required wrapper for all components        |

### Internal / not yet public

- **`IndirectOwnership/`** — Ownership hierarchy UI used in onboarding-adjacent flows; **not** exported from the package root yet.

### Removed (do not reference in new docs)

| Former component         | Replacement                         | Removed |
| ------------------------ | ----------------------------------- | ------- |
| `MakePayment`            | `PaymentFlow` / `PaymentFlowInline` | v0.15   |
| `OnboardingWizardBasic`  | `OnboardingFlow`                    | v0.15   |
| `Recipients`             | `RecipientsWidget`                  | earlier |
| `RecipientListWidget`    | `RecipientsWidget`                  | earlier |

## Storybook Tags Strategy

### Core Tags

- `@core` — Main business components
- `@utility` — Supporting infrastructure
- `@beta` — Pre-stable surfaces (e.g. PaymentFlowFX)

### Component-Specific Tags

- `@accounts` — Account-related components
- `@recipient-widgets` — LinkedAccountWidget, RecipientsWidget
- `@payment` — PaymentFlow / PaymentFlowFX
- `@transactions` — Transaction display
- `@onboarding` — Onboarding flows
- `@client-details` — ClientDetails

### Feature Tags

- `@sellsense` — SellSense themed stories
- `@theme` — Theme-related stories

## Story Organization

```
Core/OnboardingFlow
Core/PaymentFlow
Beta/PaymentFlowFX
Core/Accounts
Core/ClientDetails
Core/RecipientWidgets/LinkedAccountWidget
Core/RecipientWidgets/RecipientsWidget
Core/TransactionsDisplay
```

## Theme Integration

All core components support theming through the centralized `themes.ts` file:

```typescript
import { SELLSENSE_THEME } from '@storybook-themes';

// In story args
theme: SELLSENSE_THEME;
```

Theme types are derived from `EBComponentsProvider/config.types.ts` (`EBTheme`).

## Adding New Components

1. Create directory under `src/core/`
2. Export from `src/index.tsx` (public React/npm API)
3. Optionally register in `src/vanilla/componentRegistry.ts` for `initEBComponentsManager()`
4. Add Storybook stories with `@core` (or `@beta`) and a component-specific tag
5. Follow `ARCHITECTURE.md` for file layout (no aggregation barrels under `components/`)
