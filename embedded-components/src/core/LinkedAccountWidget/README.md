# LinkedAccountWidget

A comprehensive React component for managing linked bank accounts (external bank account linking) in the Embedded Finance Components library.

## Overview

The `LinkedAccountWidget` is a complex, feature-rich component that handles the complete lifecycle of linked bank accounts, including:

- Displaying existing linked accounts
- Linking new bank accounts
- Verifying microdeposits
- Managing account status and actions
- Integration with payment components

## Responsive Design

The `LinkedAccountWidget` uses **container queries** to adapt to its container width, making it responsive regardless of where it's placed in your application. This is particularly useful when the component is placed in sidebars, modals, or variable-width containers.

### Container Query Breakpoints

- **@md (448px)**: Header switches from stacked to horizontal layout, button becomes full-width on mobile
- **@2xl (896px)**: Account cards switch from single-column to two-column grid layout

### Layout Behaviors

**Narrow containers (< 448px)**:

- Header title and button stack vertically
- Button becomes full-width
- Single-column account card layout

**Medium containers (448px - 896px)**:

- Header becomes horizontal with title on left, button on right
- Button returns to auto width
- Single-column account card layout

**Wide containers (> 896px)**:

- Header remains horizontal
- Account cards display in a two-column grid
- Component has a max-width of 1024px and centers itself

### Usage in Different Contexts

```tsx
// In a narrow sidebar (will adapt to narrow layout)
<aside className="w-80">
  <LinkedAccountWidget />
</aside>

// In a full-width page (will use max-width and center itself)
<main className="container">
  <LinkedAccountWidget />
</main>

// In a modal or dialog (will adapt to modal width)
<Dialog>
  <DialogContent className="max-w-2xl">
    <LinkedAccountWidget />
  </DialogContent>
</Dialog>
```

## Architecture

This component follows a modular architecture with clear separation of concerns:

```
LinkedAccountWidget/
├── index.ts                           # Public API exports
├── LinkedAccountWidget.tsx            # Main orchestrator component
├── LinkedAccountWidget.test.tsx       # Integration tests
├── LinkedAccountWidget.types.ts       # TypeScript type definitions
├── LinkedAccountWidget.constants.ts   # Constants and configuration
├── LINKED_ACCOUNTS_REQUIREMENTS.md    # Business requirements
├── README.md                          # This file
├── components/                        # Internal presentational components
│   ├── LinkedAccountCard.tsx          # Individual account card display
│   ├── StatusBadge.tsx                # Status indicator component
│   └── EmptyState.tsx                 # No accounts state
├── forms/                             # Complex form sub-components
│   ├── LinkAccountForm/               # New account linking flow
│   │   ├── LinkAccountForm.tsx
│   │   ├── LinkAccountForm.schema.ts
│   │   └── LinkAccountConfirmation.tsx
│   └── MicrodepositsForm/             # Microdeposit verification flow
│       ├── MicrodepositsForm.tsx
│       └── MicrodepositsForm.schema.ts
├── hooks/                             # Custom React hooks
│   └── useLinkedAccounts.ts           # Data fetching and state management
├── utils/                             # Helper functions
│   └── recipientHelpers.ts            # Business logic utilities
└── stories/                           # Storybook documentation
    ├── LinkedAccountWidget.story.tsx
    └── LinkedAccountWidget.create.story.tsx
```

## Component Layers

### 1. Main Component Layer

**File:** `LinkedAccountWidget.tsx`

The main orchestrator that:

- Manages component state (selected recipient for verification)
- Coordinates between data layer (hooks) and presentation layer (sub-components)
- Handles user interactions and callbacks
- Provides the overall layout structure

### 2. Data Layer

**File:** `hooks/useLinkedAccounts.ts`

Custom hook that:

- Fetches linked accounts from the API
- Filters data based on component variant
- Provides derived state (hasActiveAccount, loading states)
- Exposes refetch functionality

### 3. Presentation Layer

**Directory:** `components/`

Presentational components that:

- Display data in a consistent manner
- Are pure and reusable
- Handle their own internal UI logic
- Receive all data through props

**Components:**

- `LinkedAccountCard` - Displays individual account details and actions
- `StatusBadge` - Shows account status with appropriate styling
- `EmptyState` - Displays message when no accounts exist

### 4. Form Layer

**Directory:** `forms/`

Complex form components that:

- Handle multi-step user input flows
- Manage their own form state
- Integrate with validation schemas
- Communicate results through callbacks

### 5. Utility Layer

**Files:** `utils/recipientHelpers.ts`, `LinkedAccountWidget.constants.ts`

Helper functions and constants that:

- Extract and format data from complex objects
- Provide business logic decisions
- Define reusable constants
- Keep logic DRY across the component

### 6. Type Layer

**File:** `LinkedAccountWidget.types.ts`

TypeScript definitions that:

- Define public API interfaces
- Document prop shapes and purposes
- Provide type safety across the component
- Enable better IDE autocomplete

## Usage

### Basic Usage

```tsx
import { LinkedAccountWidget } from '@/core/LinkedAccountWidget';

function MyApp() {
  return (
    <EBComponentsProvider apiBaseUrl="https://api.example.com">
      <LinkedAccountWidget />
    </EBComponentsProvider>
  );
}
```

### Advanced Usage

```tsx
import { MakePaymentButton } from '@/components/MakePaymentButton';
import { LinkedAccountWidget } from '@/core/LinkedAccountWidget';

function MyApp() {
  const handleAccountSettled = (recipient, error) => {
    if (error) {
      console.error('Failed to link account:', error);
      // Show error notification
    } else {
      console.log('Account linked successfully:', recipient);
      // Show success notification
      // Maybe refresh other data
    }
  };

  return (
    <EBComponentsProvider apiBaseUrl="https://api.example.com">
      <LinkedAccountWidget
        variant="default"
        showCreateButton={true}
        makePaymentComponent={<MakePaymentButton />}
        onLinkedAccountSettled={handleAccountSettled}
        className="my-custom-class"
      />
    </EBComponentsProvider>
  );
}
```

### Single Account Mode

```tsx
<LinkedAccountWidget
  variant="singleAccount"
  showCreateButton={true}
  onLinkedAccountSettled={(recipient, error) => {
    // Handle account linking
  }}
/>
```

## Props API

| Prop                     | Type                           | Default     | Description                                              |
| ------------------------ | ------------------------------ | ----------- | -------------------------------------------------------- |
| `variant`                | `'default' \| 'singleAccount'` | `'default'` | Display mode - show all accounts or just one             |
| `showCreateButton`       | `boolean`                      | `true`      | Whether to show "Link A New Account" button              |
| `makePaymentComponent`   | `React.ReactNode`              | `undefined` | Optional payment component to render for active accounts |
| `onLinkedAccountSettled` | `(recipient?, error?) => void` | `undefined` | Callback when account linking/verification completes     |
| `className`              | `string`                       | `undefined` | Additional CSS classes                                   |

## Key Features

### 1. Account Listing

- Displays all linked accounts with key details
- Shows account status with visual indicators
- Displays masked account numbers for security
- Shows supported payment methods

### 2. Status Management

The component handles multiple account statuses:

- `ACTIVE` - Ready to use for payments
- `INACTIVE` - Linked but not active
- `PENDING` - Processing
- `MICRODEPOSITS_INITIATED` - Verification in progress
- `READY_FOR_VALIDATION` - Ready for microdeposit verification
- `REJECTED` - Failed to link

### 3. Account Linking Flow

- Dialog-based form for adding new accounts
- Support for both Individual and Business accounts
- ACH routing number validation
- Account type selection

### 4. Microdeposit Verification

- Separate verification flow for accounts requiring it
- Amount input validation
- Success/error feedback

### 5. Payment Integration

- Optional integration with payment components
- Automatic props passing to payment component
- Only shown for active accounts

## Internal Component Communication

```
LinkedAccountWidget (Main)
│
├─→ useLinkedAccounts (Hook)
│   └─→ API (useGetAllRecipients)
│
├─→ LinkAccountFormDialogTrigger (Form)
│   ├─→ LinkAccountForm
│   └─→ LinkAccountConfirmation
│
├─→ LinkedAccountCard (Presentation)
│   ├─→ StatusBadge
│   ├─→ Badge (UI)
│   └─→ Button (UI)
│
└─→ MicrodepositsFormDialogTrigger (Form)
    └─→ MicrodepositsForm
```

## Extension Points

### Custom Account Card

You can extend the `LinkedAccountCard` component to add custom actions or display additional information.

### Custom Status Mapping

Modify `LinkedAccountWidget.constants.ts` to change status badge variants or add new statuses.

### Custom Empty State

Pass a custom empty state message or component by modifying `EmptyState` component.

## Testing Strategy

### Unit Tests

Each utility function and helper should have unit tests:

- `recipientHelpers.ts` functions
- Status mapping logic
- Date formatting

### Component Tests

Test individual components in isolation:

- `LinkedAccountCard` rendering with different recipient states
- `StatusBadge` with different statuses
- `EmptyState` display

### Integration Tests

Test the complete widget functionality:

- Account listing with API mock
- Account creation flow
- Microdeposit verification flow
- Error handling
- Loading states

### Example Test Structure

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LinkedAccountWidget } from './LinkedAccountWidget';

describe('LinkedAccountWidget', () => {
  it('displays linked accounts', async () => {
    render(<LinkedAccountWidget />);

    await waitFor(() => {
      expect(screen.getByText(/Account:/i)).toBeInTheDocument();
    });
  });

  it('opens link account form when button clicked', async () => {
    const user = userEvent.setup();
    render(<LinkedAccountWidget />);

    await user.click(screen.getByText(/Link A New Account/i));

    expect(screen.getByText(/Bank Routing Number/i)).toBeInTheDocument();
  });
});
```

## Performance Considerations

1. **Memoization**: The `useLinkedAccounts` hook uses `useMemo` to prevent unnecessary re-computations
2. **Component Splitting**: Large forms are in separate components to reduce bundle size
3. **Lazy Loading**: Forms are only loaded when needed (dialog open)
4. **Efficient Updates**: React Query handles caching and refetching efficiently

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation fully supported
- Screen reader compatible
- Proper heading hierarchy
- Color contrast meets WCAG AA standards

## Future Enhancements

- [ ] Add bulk account operations
- [ ] Add account editing capability
- [ ] Add account deactivation flow
- [ ] Add filtering/sorting for multiple accounts
- [ ] Add export functionality
- [ ] Add account verification status polling
- [ ] Add analytics tracking hooks

## Related Components

- `MakePaymentWidget` - For initiating payments
- `TransactionHistoryWidget` - For viewing payment history
- `RecipientManager` - For managing all types of recipients

## Support

For questions or issues with this component:

1. Check the Storybook documentation
2. Review the LINKED_ACCOUNTS_REQUIREMENTS.md file
3. Check the API documentation
4. Contact the Embedded Finance team
