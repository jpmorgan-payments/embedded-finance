# RecipientsWidget

Thin wrapper for the `BaseRecipientsWidget`, configured for `RECIPIENT` type without microdeposit verification.

## Overview

The `RecipientsWidget` enables users to manage payment recipients within your application. Unlike `LinkedAccountWidget`, it provides a simpler flow without microdeposit verification, ideal for managing payees and beneficiaries.

## Features

| Feature                     | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| 👤 **Recipient Management** | View, add, edit, and remove payment recipients                  |
| 📱 **Responsive Design**    | Adapts from desktop to mobile with grid and compact layouts     |
| 💸 **Payment Integration**  | Render custom payment actions for each recipient card           |
| 📊 **User Event Tracking**  | Integrate with RUM/analytics systems (Dynatrace, Datadog, etc.) |

## Usage

```tsx
import { EBComponentsProvider, RecipientsWidget } from '@embedded-components';

function App() {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://api.example.com/v1"
      headers={{ Authorization: 'Bearer token' }}
    >
      <RecipientsWidget
        mode="list"
        onRecipientAdded={(recipient, error) => {
          if (error) {
            console.error('Add failed:', error);
          } else {
            console.log('Recipient added:', recipient);
          }
        }}
      />
    </EBComponentsProvider>
  );
}
```

## Props

### Display & Layout

| Prop               | Type                                    | Default   | Description                                                   |
| ------------------ | --------------------------------------- | --------- | ------------------------------------------------------------- |
| `mode`             | `'list' \| 'single'`                    | `'list'`  | **list**: Show all recipients. **single**: Show one recipient |
| `variant`          | `'cards' \| 'compact-cards' \| 'table'` | `'cards'` | Visual display style                                          |
| `hideCreateButton` | `boolean`                               | `false`   | Hide the "Add New Recipient" button                           |
| `className`        | `string`                                | —         | Additional CSS classes                                        |

### Scrolling & Pagination

| Prop              | Type                    | Default      | Description                                   |
| ----------------- | ----------------------- | ------------ | --------------------------------------------- |
| `scrollable`      | `boolean`               | `false`      | Enable scrollable container with virtual list |
| `maxHeight`       | `number \| string`      | `'400px'`    | Maximum height when scrollable                |
| `paginationStyle` | `'loadMore' \| 'pages'` | `'loadMore'` | Pagination style                              |
| `pageSize`        | `number`                | `10`         | Number of recipients per page                 |

### Callbacks

| Prop                  | Type                           | Description                               |
| --------------------- | ------------------------------ | ----------------------------------------- |
| `onRecipientAdded`    | `(recipient?, error?) => void` | Called when recipient is added            |
| `renderPaymentAction` | `(recipient) => ReactNode`     | Render custom action button for each card |

### Payment / FX (non-breaking)

Additive props for multicurrency payouts. Omitting them keeps domestic behavior.

| Prop                        | Type                 | Default                            | Description                                                                  |
| --------------------------- | -------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `paymentFlowVariant`        | `'domestic' \| 'fx'` | `'domestic'`                       | Pay opens `PaymentFlow` or `PaymentFlowFX`                                   |
| `showRecipientCurrency`     | `boolean`            | Auto: `true` when FX, else `false` | Currency column, badges, and details. Usually omit — FX variant auto-enables |
| `fxConfig`                  | `FxConfig`           | —                                  | Forwarded to `PaymentFlowFX` (rate mode). Used only when variant is `'fx'`   |
| `supportedTargetCurrencies` | `string[]`           | —                                  | Restrict FX target currencies. Used only when variant is `'fx'`              |

```tsx
<RecipientsWidget
  viewMode="table"
  paymentFlowVariant="fx"
  fxConfig={{ mode: 'ratesheet' }}
/>
```

### User Event Tracking

| Prop                  | Type                   | Description                         |
| --------------------- | ---------------------- | ----------------------------------- |
| `userEventsHandler`   | `(context) => void`    | Handler for user interaction events |
| `userEventsLifecycle` | `{ onEnter, onLeave }` | Lifecycle hooks for action tracking |

## Recipient Status Lifecycle

Recipients have a simpler status flow without microdeposit verification:

```
PENDING → ACTIVE
```

| Status       | Description            | User Action         |
| ------------ | ---------------------- | ------------------- |
| **PENDING**  | Initial processing     | Wait for processing |
| **ACTIVE**   | Ready for transactions | Can send payments   |
| **REJECTED** | Creation failed        | Re-add recipient    |
| **INACTIVE** | Deactivated            | Contact support     |

## Storybook

See the full documentation and interactive examples in Storybook:

- **Core/RecipientsWidget** - Main stories and documentation
- **Core/RecipientsWidget/FX Payments** - FX variant with currency column and PaymentFlowFX
- **Core/RecipientsWidget/Account Statuses** - All lifecycle states
- **Core/RecipientsWidget/Interactive Workflows** - Step-by-step demos
- **Core/RecipientsWidget/User Journey Tracking** - Analytics integration examples

## Architecture

This component is a thin wrapper around `BaseRecipientsWidget` with:

- `recipientType="RECIPIENT"`
- Semantic callback prop name (`onRecipientAdded`)
- i18n namespace: `recipients`
- Microdeposit verification support disabled

## Comparison with LinkedAccountWidget

| Feature                   | LinkedAccountWidget      | RecipientsWidget   |
| ------------------------- | ------------------------ | ------------------ |
| Recipient Type            | `LINKED_ACCOUNT`         | `RECIPIENT`        |
| i18n Namespace            | `linked-accounts`        | `recipients`       |
| Microdeposit Verification | ✅ Supported             | ❌ Not supported   |
| Callback Prop             | `onAccountLinked`        | `onRecipientAdded` |
| Verification Callback     | `onVerificationComplete` | N/A                |
