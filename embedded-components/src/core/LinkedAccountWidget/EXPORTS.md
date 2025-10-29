# LinkedAccountWidget - Component Index

## Public Exports (Recommended)

These are the recommended exports for external use:

```typescript
// Main component
export { LinkedAccountWidget } from './LinkedAccountWidget';

// Public types
export type { LinkedAccountWidgetProps } from './LinkedAccountWidget.types';
```

**Usage:**

```typescript
import { LinkedAccountWidget } from '@jpmorgan-payments/embedded-finance-components';
import type { LinkedAccountWidgetProps } from '@jpmorgan-payments/embedded-finance-components';
```

---

## Internal Exports (Advanced Use)

These exports are available for advanced use cases but are not guaranteed to be stable:

### Components

```typescript
// Presentational components
export { LinkedAccountCard } from './components/LinkedAccountCard';
export { StatusBadge } from './components/StatusBadge';
export { EmptyState } from './components/EmptyState';

// Form components
export { LinkAccountFormDialogTrigger } from './forms/LinkAccountForm/LinkAccountForm';
export { MicrodepositsFormDialogTrigger } from './forms/MicrodepositsForm/MicrodepositsForm';
```

**Usage:**

```typescript
import { StatusBadge } from '@jpmorgan-payments/embedded-finance-components/LinkedAccountWidget/components/StatusBadge';
```

### Hooks

```typescript
export { useLinkedAccounts } from './hooks/useLinkedAccounts';
export type {
  UseLinkedAccountsOptions,
  UseLinkedAccountsResult,
} from './hooks/useLinkedAccounts';
```

**Usage:**

```typescript
import { useLinkedAccounts } from '@jpmorgan-payments/embedded-finance-components/LinkedAccountWidget/hooks/useLinkedAccounts';

function MyCustomComponent() {
  const { recipients, isLoading, hasActiveAccount } = useLinkedAccounts({
    variant: 'default'
  });

  // Build your own UI with the data
  return <div>{recipients.length} accounts</div>;
}
```

### Utilities

```typescript
export {
  getSupportedPaymentMethods,
  getMaskedAccountNumber,
  getRecipientDisplayName,
  canVerifyMicrodeposits,
  canMakePayment,
  shouldShowCreateButton,
  formatRecipientDate,
} from './utils/recipientHelpers';
```

**Usage:**

```typescript
import { getMaskedAccountNumber } from '@jpmorgan-payments/embedded-finance-components/LinkedAccountWidget/utils/recipientHelpers';

const masked = getMaskedAccountNumber(recipient); // "****1234"
```

### Constants

```typescript
export {
  STATUS_BADGE_VARIANTS,
  RECIPIENT_STATUS_MESSAGES,
  ROUTING_NUMBER_LENGTH,
  MIN_MICRODEPOSIT_AMOUNT,
  MAX_MICRODEPOSIT_AMOUNT,
  MAX_VERIFICATION_ATTEMPTS,
} from './LinkedAccountWidget.constants';
```

**Usage:**

```typescript
import { ROUTING_NUMBER_LENGTH } from '@jpmorgan-payments/embedded-finance-components/LinkedAccountWidget/LinkedAccountWidget.constants';

if (routingNumber.length !== ROUTING_NUMBER_LENGTH) {
  // Show error
}
```

### Types

```typescript
export type {
  LinkedAccountWidgetProps,
  LinkedAccountCardProps,
} from './LinkedAccountWidget.types';
```

---

## File Map

Quick reference for finding specific functionality:

| Need to...              | Look in...                         |
| ----------------------- | ---------------------------------- |
| Use the main component  | `LinkedAccountWidget.tsx`          |
| Understand props        | `LinkedAccountWidget.types.ts`     |
| Fetch account data      | `hooks/useLinkedAccounts.ts`       |
| Format account data     | `utils/recipientHelpers.ts`        |
| Show a status badge     | `components/StatusBadge.tsx`       |
| Display an account card | `components/LinkedAccountCard.tsx` |
| Configure constants     | `LinkedAccountWidget.constants.ts` |
| Link a new account      | `forms/LinkAccountForm/`           |
| Verify microdeposits    | `forms/MicrodepositsForm/`         |
| See usage examples      | `stories/`                         |
| Understand architecture | `COMPONENT_STRUCTURE.md`           |
| Read documentation      | `README.md`                        |

---

## Import Patterns

### Pattern 1: Main Component Only (Recommended)

```typescript
import { LinkedAccountWidget } from '@/core/LinkedAccountWidget';

<LinkedAccountWidget variant="default" />
```

### Pattern 2: With Types

```typescript
import { LinkedAccountWidget } from '@/core/LinkedAccountWidget';
import type { LinkedAccountWidgetProps } from '@/core/LinkedAccountWidget';

const props: LinkedAccountWidgetProps = {
  variant: 'singleAccount',
  showCreateButton: true,
};

<LinkedAccountWidget {...props} />
```

### Pattern 3: Custom Implementation with Hook

```typescript
import { useLinkedAccounts } from '@/core/LinkedAccountWidget/hooks/useLinkedAccounts';
import { LinkedAccountCard } from '@/core/LinkedAccountWidget/components/LinkedAccountCard';

function MyCustomList() {
  const { recipients, isLoading } = useLinkedAccounts();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {recipients.map(r => (
        <LinkedAccountCard key={r.id} recipient={r} />
      ))}
    </div>
  );
}
```

### Pattern 4: Using Utilities

```typescript
import { getMaskedAccountNumber, canMakePayment } from '@/core/LinkedAccountWidget/utils/recipientHelpers';

function MyComponent({ recipient }) {
  const accountNumber = getMaskedAccountNumber(recipient);
  const canPay = canMakePayment(recipient);

  return (
    <div>
      <span>{accountNumber}</span>
      {canPay && <button>Pay</button>}
    </div>
  );
}
```

---

## Related Documentation

- [README.md](./README.md) - Complete component documentation
- [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md) - Architecture diagrams
- [LINKED_ACCOUNTS_REQUIREMENTS.md](./LINKED_ACCOUNTS_REQUIREMENTS.md) - Business requirements
