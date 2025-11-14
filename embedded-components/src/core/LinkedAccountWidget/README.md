# LinkedAccountWidget

A React component for managing linked bank accounts (external bank account linking) in embedded finance applications.

## What It Does

The LinkedAccountWidget provides a complete interface for end users to:

- **View** their linked external bank accounts
- **Add** new bank accounts via ACH
- **Verify** accounts through microdeposit validation
- **Monitor** account status (active, pending, verification needed)
- **Initiate** payments from active accounts (optional integration)

## Quick Start

```tsx
import { LinkedAccountWidget } from '@/core/LinkedAccountWidget';

// Simplest usage - show all linked accounts
<LinkedAccountWidget />

// With callback to handle when accounts are linked/verified
<LinkedAccountWidget
  onLinkedAccountSettled={(recipient, error) => {
    if (error) {
      showNotification('Failed to link account');
    } else {
      showNotification('Account linked successfully!');
    }
  }}
/>
```

## Usage Examples

### Show All Linked Accounts (Default)

```tsx
import { LinkedAccountWidget } from '@/core/LinkedAccountWidget';

function AccountsPage() {
  return (
    <div className="container">
      <LinkedAccountWidget />
    </div>
  );
}
```

### Single Account Mode (Only Show First Active Account)

Useful when you only want users to link one account:

```tsx
<LinkedAccountWidget
  variant="singleAccount"
  showCreateButton={false} // Hide "Link Account" if one already exists
/>
```

### With Payment Integration

The widget includes a built-in payment button for active accounts by default. You typically **don't need to pass** `makePaymentComponent` unless you have a custom implementation:

```tsx
// Default behavior - uses embedded-components MakePayment automatically
<LinkedAccountWidget />

// Only override if you need a custom payment component
import { CustomPaymentButton } from './CustomPaymentButton';

<LinkedAccountWidget
  makePaymentComponent={<CustomPaymentButton />}
/>
```

### Handle Account Linking Events

Get notified when accounts are successfully linked or verified:

```tsx
function MyApp() {
  const handleAccountSettled = (recipient, error) => {
    if (error) {
      toast.error('Failed to link account');
      analytics.track('account_link_failed', { error });
    } else {
      toast.success(`Account ${recipient.accountNumberMask} linked!`);
      analytics.track('account_link_success', { recipientId: recipient.id });
      // Refresh other data, redirect, etc.
    }
  };

  return <LinkedAccountWidget onLinkedAccountSettled={handleAccountSettled} />;
}
```

### Responsive Layouts

The widget uses **container queries** to adapt to its container width:

```tsx
// In a narrow sidebar (< 448px): stacked layout, full-width button
<aside className="w-80">
  <LinkedAccountWidget />
</aside>

// In a modal (448px - 896px): horizontal header, single column cards
<Dialog>
  <DialogContent className="max-w-2xl">
    <LinkedAccountWidget />
  </DialogContent>
</Dialog>

// In full-width page (> 896px): two-column card grid, max-width 1024px
<main className="container">
  <LinkedAccountWidget />
</main>
```

## Props

| Prop                     | Type                           | Default     | Description                                                                                                                                              |
| ------------------------ | ------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`                | `'default' \| 'singleAccount'` | `'default'` | **`default`**: Show all linked accounts<br>**`singleAccount`**: Only show first active account                                                           |
| `showCreateButton`       | `boolean`                      | `true`      | Show/hide the "Link A New Account" button<br>In `singleAccount` mode, hides if account exists                                                            |
| `makePaymentComponent`   | `ReactNode`                    | Built-in    | **Optional**: Custom payment component for active accounts<br>Uses embedded-components `MakePayment` by default—only override for custom implementations |
| `onLinkedAccountSettled` | `(recipient?, error?) => void` | `undefined` | Callback fired when account is linked or verified<br>Use for notifications, analytics, data refresh                                                      |
| `className`              | `string`                       | `undefined` | Additional CSS classes for the root container                                                                                                            |

## User Flows

### Adding a New Account

1. User clicks "Link A New Account" button
2. Dialog opens with bank account form
3. User enters:
   - Bank routing number (ACH)
   - Account number
   - Account type (Individual/Business, Checking/Savings)
   - Account holder name
4. Form validates and submits
5. Success confirmation shown
6. `onLinkedAccountSettled` callback fires
7. Account appears in list with appropriate status

### Verifying with Microdeposits

For accounts requiring verification:

1. Account shows "Verify" button when status is `READY_FOR_VALIDATION`
2. User clicks "Verify Account"
3. Dialog opens requesting two microdeposit amounts
4. User enters amounts as decimal values (e.g., `0.12`, `0.32`)
5. Verification submitted
6. Success/error feedback shown
7. Account status updates to `ACTIVE` if successful

### Account Statuses

| Status                    | Badge Color | Description                              | User Action Available |
| ------------------------- | ----------- | ---------------------------------------- | --------------------- |
| `ACTIVE`                  | Green       | Ready to use for payments                | Make Payment          |
| `PENDING`                 | Yellow      | Processing, no action needed             | None                  |
| `MICRODEPOSITS_INITIATED` | Blue        | Deposits sent, waiting for user to check | None                  |
| `READY_FOR_VALIDATION`    | Purple      | Ready to verify microdeposits            | Verify Account        |
| `INACTIVE`                | Gray        | Linked but not active                    | None                  |
| `REJECTED`                | Red         | Failed to link                           | None                  |

## Common Scenarios

### Scenario: Only Allow One Linked Account

```tsx
<LinkedAccountWidget
  variant="singleAccount"
  showCreateButton={false} // Button auto-hides when account exists
/>
```

### Scenario: Refresh Data After Account Links

```tsx
const { refetch: refetchPayments } = usePayments();

<LinkedAccountWidget
  onLinkedAccountSettled={(recipient, error) => {
    if (!error) {
      refetchPayments(); // Refresh payment data
    }
  }}
/>;
```

### Scenario: Navigate After Successful Link

```tsx
const router = useRouter();

<LinkedAccountWidget
  onLinkedAccountSettled={(recipient, error) => {
    if (!error) {
      router.push(`/payment?account=${recipient.id}`);
    }
  }}
/>;
```

### Scenario: Custom Styling

```tsx
<LinkedAccountWidget className="rounded-xl bg-gray-50 p-6 shadow-lg" />
```

## Troubleshooting

### Account Not Appearing After Linking

**Problem**: User links an account but it doesn't show in the list.

**Solutions**:

- Check if `onLinkedAccountSettled` callback is refetching data
- Verify the API response includes `type: 'LINKED_ACCOUNT'`
- Check browser console for API errors

### "Link A New Account" Button Not Showing

**Problem**: Button is hidden when it should be visible.

**Causes**:

- `showCreateButton={false}` prop is set
- In `singleAccount` variant with an existing active account
- Check `shouldShowCreateButton` utility logic

### Microdeposit Verification Failing

**Problem**: User enters amounts but verification fails.

**Common Issues**:

- Amounts must be decimal values between 0.01 and 0.99 (e.g., `0.12` for $0.12)
- Maximum 2 decimal places allowed
- Check API error response for specific validation errors
- Ensure account status is `READY_FOR_VALIDATION`

### Payment Component Not Showing

**Problem**: `makePaymentComponent` passed but not rendering.

**Check**:

- Account status must be `ACTIVE`
- Ensure component is passed correctly as JSX: `makePaymentComponent={<Component />}`
- Verify account has necessary data (`id`, `status`)

## Testing

Run tests for this component:

```bash
# All LinkedAccountWidget tests
npm test -- LinkedAccountWidget

# Specific test file
npm test -- useLinkedAccounts.test

# Watch mode
npm test -- --watch LinkedAccountWidget
```

## API Requirements

This component requires the following API endpoints (provided by `EBComponentsProvider`):

- **GET** `/recipients` - Fetch all recipients (filtered by `type: 'LINKED_ACCOUNT'`)
- **POST** `/recipients` - Create new linked account
- **PUT** `/recipients/{id}` - Update/verify linked account
- **POST** `/recipients/{id}/validate-microdeposits` - Verify microdeposit amounts

See [LINKED_ACCOUNTS_REQUIREMENTS.md](./LINKED_ACCOUNTS_REQUIREMENTS.md) for detailed API specifications.

## Related Documentation

- **Business Requirements**: [LINKED_ACCOUNTS_REQUIREMENTS.md](./LINKED_ACCOUNTS_REQUIREMENTS.md)
- **Storybook**: View interactive examples in Storybook
- **Architecture**: See main [ARCHITECTURE.md](../../ARCHITECTURE.md) for component patterns

## Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader announcements for status changes
- ✅ WCAG AA compliant color contrast
- ✅ Focus management in dialogs
