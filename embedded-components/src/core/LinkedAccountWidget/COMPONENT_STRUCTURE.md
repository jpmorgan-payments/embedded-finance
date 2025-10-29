# LinkedAccountWidget Component Structure

## Visual Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      LinkedAccountWidget.tsx                         │
│                    (Main Orchestrator Component)                     │
│                                                                       │
│  State: [selectedRecipientId]                                       │
│  Handlers: [handleVerifyClick]                                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
          ┌─────────▼─────────┐   ┌────────▼──────────┐
          │  useLinkedAccounts│   │  Card (UI Layer)  │
          │      (Hook)       │   │                   │
          └─────────┬─────────┘   └───────────────────┘
                    │
          ┌─────────▼─────────┐
          │ useGetAllRecipients│
          │   (API Query)      │
          └────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         Component Tree                               │
└─────────────────────────────────────────────────────────────────────┘

LinkedAccountWidget
├── CardHeader
│   ├── CardTitle: "Linked Accounts"
│   └── LinkAccountFormDialogTrigger (conditional: showCreate)
│       └── Button: "Link A New Account"
│
├── CardContent
│   ├── Loading State (conditional: isLoading)
│   ├── Error State (conditional: isError)
│   ├── EmptyState (conditional: isSuccess && no recipients)
│   └── Accounts List (conditional: isSuccess && has recipients)
│       └── LinkedAccountCard[] (map over recipients)
│           ├── Account Info Section
│           │   ├── Recipient Name
│           │   └── Badge: Account Type (Individual/Business)
│           ├── Status Section
│           │   ├── StatusBadge
│           │   └── Creation Date
│           ├── Account Details Section
│           │   └── Masked Account Number
│           ├── Payment Methods Section
│           │   └── Badge[] (supported methods)
│           └── Actions Section
│               ├── Button: "Verify microdeposits" (conditional)
│               └── makePaymentComponent (conditional)
│
└── MicrodepositsFormDialogTrigger (conditional: selectedRecipientId)
    └── Hidden trigger element

┌─────────────────────────────────────────────────────────────────────┐
│                         Data Flow                                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   API Call   │────▶│  useLinkedAccounts  │────▶│ LinkedAccountWidget │
│ (Recipients) │     │      Hook          │     │     Component        │
└──────────────┘     └─────────────────┘     └──────────────────────┘
                             │
                             │ transforms
                             ▼
                     ┌────────────────┐
                     │   recipients   │
                     │ hasActiveAccount│
                     │   isLoading    │
                     │    isError     │
                     └────────┬───────┘
                              │
                              │ passed as props
                              ▼
                     ┌────────────────┐
                     │LinkedAccountCard│
                     │  (renders UI)  │
                     └────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      User Interaction Flow                           │
└─────────────────────────────────────────────────────────────────────┘

1. Link New Account Flow:
   User clicks "Link A New Account"
   ├─▶ LinkAccountFormDialogTrigger opens
   ├─▶ User fills LinkAccountForm
   ├─▶ Form submits to API
   ├─▶ LinkAccountConfirmation shows result
   └─▶ onLinkedAccountSettled callback fires

2. Verify Microdeposits Flow:
   User clicks "Verify microdeposits" on a card
   ├─▶ handleVerifyClick sets selectedRecipientId
   ├─▶ MicrodepositsFormDialogTrigger opens
   ├─▶ User enters microdeposit amounts
   ├─▶ Form submits to API
   └─▶ onLinkedAccountSettled callback fires

3. Make Payment Flow (Optional):
   User interacts with makePaymentComponent
   ├─▶ Component receives recipientId prop
   └─▶ Payment flow handled by parent component

┌─────────────────────────────────────────────────────────────────────┐
│                      File Dependencies                               │
└─────────────────────────────────────────────────────────────────────┘

LinkedAccountWidget.tsx
├── imports from @/api/generated/ep-recipients (via hook)
├── imports from @/components/ui/* (Button, Card, etc.)
├── imports from ./LinkedAccountWidget.types
├── imports from ./hooks/useLinkedAccounts
├── imports from ./utils/recipientHelpers
├── imports from ./components/LinkedAccountCard
├── imports from ./components/EmptyState
└── imports from ./forms/*/

LinkedAccountCard.tsx
├── imports from @/components/ui/* (Badge, Button)
├── imports from ../LinkedAccountWidget.types
├── imports from ../components/StatusBadge
└── imports from ../utils/recipientHelpers

useLinkedAccounts.ts
└── imports from @/api/generated/ep-recipients

StatusBadge.tsx
├── imports from @/components/ui/badge
└── imports from ../LinkedAccountWidget.constants

recipientHelpers.ts
├── imports from @/api/generated/ep-recipients.schemas
└── imports from @/lib/utils

┌─────────────────────────────────────────────────────────────────────┐
│                      Responsibility Matrix                           │
└─────────────────────────────────────────────────────────────────────┘

Component/Module              │ Responsibilities
─────────────────────────────┼──────────────────────────────────────────
LinkedAccountWidget.tsx      │ • Orchestrate sub-components
                             │ • Manage dialog state
                             │ • Handle user interactions
                             │ • Provide layout structure
─────────────────────────────┼──────────────────────────────────────────
useLinkedAccounts.ts         │ • Fetch data from API
                             │ • Filter based on variant
                             │ • Compute derived state
                             │ • Provide loading/error states
─────────────────────────────┼──────────────────────────────────────────
LinkedAccountCard.tsx        │ • Display account details
                             │ • Render action buttons
                             │ • Handle card-level interactions
                             │ • Format display data
─────────────────────────────┼──────────────────────────────────────────
StatusBadge.tsx             │ • Display status with correct styling
                             │ • Format status text
─────────────────────────────┼──────────────────────────────────────────
EmptyState.tsx              │ • Show empty state message
                             │ • Provide consistent empty styling
─────────────────────────────┼──────────────────────────────────────────
recipientHelpers.ts         │ • Extract data from recipients
                             │ • Format display values
                             │ • Determine conditional logic
                             │ • Business rule decisions
─────────────────────────────┼──────────────────────────────────────────
LinkedAccountWidget.types.ts│ • Define public API interfaces
                             │ • Document prop shapes
                             │ • Provide type safety
─────────────────────────────┼──────────────────────────────────────────
LinkedAccountWidget.constants│ • Store configuration values
                             │ • Define status mappings
                             │ • Set validation constants

┌─────────────────────────────────────────────────────────────────────┐
│                      State Management                                │
└─────────────────────────────────────────────────────────────────────┘

Server State (via React Query):
  ├── recipients[] - List of linked accounts
  ├── loading states - API call status
  └── error states - API failure info

Local Component State:
  └── selectedRecipientId - For microdeposit verification dialog

Derived State (computed):
  ├── hasActiveAccount - Whether any account is active
  ├── showCreate - Whether to show create button
  ├── showVerifyButton - Per-account verification visibility
  └── showPaymentButton - Per-account payment button visibility

┌─────────────────────────────────────────────────────────────────────┐
│                      Props Flow                                      │
└─────────────────────────────────────────────────────────────────────┘

Parent Component
  │
  ├─ variant: 'default' | 'singleAccount'
  ├─ showCreateButton: boolean
  ├─ makePaymentComponent: ReactNode
  ├─ onLinkedAccountSettled: (recipient?, error?) => void
  └─ className: string
  │
  ▼
LinkedAccountWidget
  │
  ├─ (to LinkAccountFormDialogTrigger)
  │  └─ onLinkedAccountSettled
  │
  ├─ (to LinkedAccountCard)
  │  ├─ recipient: Recipient
  │  ├─ makePaymentComponent
  │  └─ onVerifyClick: (recipientId) => void
  │
  └─ (to MicrodepositsFormDialogTrigger)
     ├─ recipientId
     └─ onLinkedAccountSettled
```

## Design Patterns Used

### 1. **Container/Presentational Pattern**

- `LinkedAccountWidget.tsx` = Container (logic)
- `LinkedAccountCard.tsx` = Presentational (UI)

### 2. **Custom Hook Pattern**

- `useLinkedAccounts.ts` encapsulates data fetching logic
- Reusable across components if needed

### 3. **Composition Pattern**

- `makePaymentComponent` prop allows parent to compose functionality
- Forms are composed via DialogTrigger pattern

### 4. **Utility/Helper Pattern**

- `recipientHelpers.ts` keeps business logic DRY
- Single source of truth for data transformations

### 5. **Constants Pattern**

- `LinkedAccountWidget.constants.ts` for configuration
- Easy to modify without touching component logic

### 6. **Type-First Pattern**

- `LinkedAccountWidget.types.ts` defined before implementation
- Clear API contract
