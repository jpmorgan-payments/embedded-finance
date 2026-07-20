# PaymentFlow

Domestic (USD) payment / funds-transfer UI.

| Export | Description |
| ------ | ----------- |
| `PaymentFlow` | Dialog variant (optional `trigger`) |
| `PaymentFlowInline` | Embedded / full-page variant |

## Docs

| File | Purpose |
| ---- | ------- |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Business rules, API contracts, validation |
| [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md) | UI / flow behaviour requirements |

For cross-border / multicurrency payouts, see **[PaymentFlowFX](../PaymentFlowFX/README.md)** (**Beta**).

## Quick usage

```tsx
import {
  EBComponentsProvider,
  PaymentFlow,
  PaymentFlowInline,
} from '@jpmorgan-payments/embedded-finance-components';

<EBComponentsProvider apiBaseUrl="https://api-url">
  <PaymentFlow trigger={<button type="button">Pay</button>} />
  <PaymentFlowInline />
</EBComponentsProvider>
```

> **Migration:** The legacy `MakePayment` component was removed in v0.15. Use `PaymentFlow` / `PaymentFlowInline`.
