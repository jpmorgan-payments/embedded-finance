# RecipientWidgets

This folder contains the `LinkedAccountWidget` and `RecipientsWidget`, along with shared base components and utilities for recipient-related widgets.

## Structure

```
RecipientWidgets/
├── LinkedAccountWidget/          # Widget for LINKED_ACCOUNT type (with microdeposits)
│   ├── LinkedAccountWidget.tsx
│   ├── index.ts
│   └── README.md
├── RecipientsWidget/             # Widget for RECIPIENT type (without microdeposits)
│   ├── RecipientsWidget.tsx
│   ├── index.ts
│   └── README.md
├── components/                   # Shared components
│   ├── BaseRecipientsWidget/    # Internal base component (used by both widgets)
│   ├── EmptyState/
│   ├── LinkedAccountCard/
│   ├── LinkedAccountFormDialog/
│   └── ...
├── hooks/                        # Shared hooks
│   ├── useLinkedAccounts.ts
│   ├── useLinkedAccountsTable.ts
│   └── useLinkedAccountForm.ts
├── types/                        # Shared types
│   └── recipientType.types.ts   # RecipientType configuration
├── utils/                        # Shared utilities
│   └── invalidateLinkedAccountQueries.ts
├── forms/                        # Shared forms
│   └── MicrodepositsForm/
├── index.ts                      # Main exports
└── README.md                     # This file
```

## Usage

Both widgets are exported from this folder:

```tsx
import { LinkedAccountWidget, RecipientsWidget } from '@/core/RecipientWidgets';

// For linked bank accounts with microdeposit verification
<LinkedAccountWidget
  onAccountLinked={(recipient, error) => {
    // Handle linked account
  }}
  onVerificationComplete={(response, recipient) => {
    // Handle microdeposit verification
  }}
/>

// For payment recipients without microdeposit verification
<RecipientsWidget
  onRecipientAdded={(recipient, error) => {
    // Handle recipient added
  }}
/>
```

## Architecture

- **BaseRecipientsWidget**: Internal base component that contains all the core logic for displaying and managing accounts/recipients. It accepts a `recipientType` prop to configure behavior.
- **LinkedAccountWidget**: Thin wrapper that passes `recipientType="LINKED_ACCOUNT"` and provides semantic prop names (`onAccountLinked`, `onVerificationComplete`).
- **RecipientsWidget**: Thin wrapper that passes `recipientType="RECIPIENT"` and provides semantic prop names (`onRecipientAdded`). Omits microdeposit-related functionality.

## Key Differences

| Feature                   | LinkedAccountWidget      | RecipientsWidget   |
| ------------------------- | ------------------------ | ------------------ |
| Recipient Type            | `LINKED_ACCOUNT`         | `RECIPIENT`        |
| i18n Namespace            | `linked-accounts`        | `recipients`       |
| Microdeposit Verification | ✅ Supported             | ❌ Not supported   |
| Account Validation        | ✅ Supported             | ✅ Supported       |
| Callback Prop             | `onAccountLinked`        | `onRecipientAdded` |
| Verification Callback     | `onVerificationComplete` | N/A                |
