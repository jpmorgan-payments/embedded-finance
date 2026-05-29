# LinkedAccountWidget

Thin wrapper for the `BaseRecipientsWidget`, configured for `LINKED_ACCOUNT` type with microdeposit verification support.

## Overview

The `LinkedAccountWidget` enables users to link and manage external bank accounts within your application. It provides a complete solution for account linking via ACH, including microdeposit verification workflows.

## Features

| Feature | Description |
|---------|-------------|
| 🏦 **Account Management** | View, add, edit, and remove linked bank accounts |
| ✅ **Microdeposit Verification** | Built-in workflow for microdeposit confirmation |
| 📱 **Responsive Design** | Adapts from desktop to mobile with grid and compact layouts |
| 💸 **Payment Integration** | Render custom payment actions for each account card |
| 📊 **User Event Tracking** | Integrate with RUM/analytics systems (Dynatrace, Datadog, etc.) |

## Usage

```tsx
import { EBComponentsProvider, LinkedAccountWidget } from '@embedded-components';

function App() {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://api.example.com/v1"
      headers={{ Authorization: 'Bearer token' }}
    >
      <LinkedAccountWidget
        mode="list"
        onAccountLinked={(recipient, error) => {
          if (error) {
            console.error('Link failed:', error);
          } else {
            console.log('Account linked:', recipient);
          }
        }}
        onVerificationComplete={(response, recipient) => {
          console.log('Verification result:', response.status);
        }}
      />
    </EBComponentsProvider>
  );
}
```

## Props

### Display & Layout

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'list' \| 'single'` | `'list'` | **list**: Show all accounts. **single**: Show one account |
| `variant` | `'cards' \| 'compact-cards' \| 'table'` | `'cards'` | Visual display style |
| `hideCreateButton` | `boolean` | `false` | Hide the "Link New Account" button |
| `hideRemoveRecipient` | `boolean` | `false` | Hide **Remove** in card overflow menus and **table** row actions (unlink disabled in UI) |
| `className` | `string` | — | Additional CSS classes |

### OnboardingFlow vs `hideRemoveRecipient`

**`hideRemoveRecipient`** applies only to this widget (`LinkedAccountWidget` → `BaseRecipientsWidget` →
`RecipientCard` / `RecipientsTableView`). It does **not** control the Remove button on **OnboardingFlow →
Overview**.

For onboarding Overview, pass **`hideLinkedAccountRemoval`** on **`OnboardingFlow`**. That prop does **not**
replace `hideRemoveRecipient`; hosts that embed **both** UIs should set each flag on the component where that
UI is rendered so behavior stays aligned.

### Scrolling & Pagination

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scrollable` | `boolean` | `false` | Enable scrollable container with virtual list |
| `maxHeight` | `number \| string` | `'400px'` | Maximum height when scrollable |
| `paginationStyle` | `'loadMore' \| 'pages'` | `'loadMore'` | Pagination style |
| `pageSize` | `number` | `10` | Number of accounts per page |

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onAccountLinked` | `(recipient?, error?) => void` | Called when account linking completes |
| `onVerificationComplete` | `(response, recipient?) => void` | Called when microdeposit verification completes |
| `renderPaymentAction` | `(recipient) => ReactNode` | Render custom action button for each card |

### User Event Tracking

| Prop | Type | Description |
|------|------|-------------|
| `userEventsHandler` | `(context) => void` | Handler for user interaction events |
| `userEventsLifecycle` | `{ onEnter, onLeave }` | Lifecycle hooks for action tracking |

## Account Status Lifecycle

```
PENDING → MICRODEPOSITS_INITIATED → READY_FOR_VALIDATION → ACTIVE
```

| Status | Description | User Action |
|--------|-------------|-------------|
| **PENDING** | Initial processing | Wait for verification |
| **MICRODEPOSITS_INITIATED** | Two small deposits sent | Wait 3-5 business days |
| **READY_FOR_VALIDATION** | Deposits arrived | Enter deposit amounts |
| **ACTIVE** | Verified and ready | Can send/receive payments |
| **REJECTED** | Verification failed | Re-link account |
| **INACTIVE** | Deactivated or expired | Contact support |

> **💡 Instant Verification**: Some accounts may verify instantly and skip directly to `ACTIVE` status.

## Storybook

See the full documentation and interactive examples in Storybook:

- **Core/LinkedAccountWidget** - Main stories and documentation
- **Core/LinkedAccountWidget/Account Statuses** - All lifecycle states
- **Core/LinkedAccountWidget/Interactive Workflows** - Step-by-step demos
- **Core/LinkedAccountWidget/User Journey Tracking** - Analytics integration examples

## Architecture

This component is a thin wrapper around `BaseRecipientsWidget` with:
- `recipientType="LINKED_ACCOUNT"`
- Semantic callback prop names (`onAccountLinked`, `onVerificationComplete`)
- i18n namespace: `linked-accounts`
- Microdeposit verification support enabled
