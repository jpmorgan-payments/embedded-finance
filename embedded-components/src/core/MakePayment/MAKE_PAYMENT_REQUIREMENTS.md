# Make Payment Embedded Component Requirements

> **Documentation References:**
>
> - [JPMorgan Embedded Payments - Make Payment](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/make-payment)
>
> **API References:**
>
> - [Create Transaction API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/transactions#/operations/createTransaction)
> - [List Accounts API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccounts)
> - [List Recipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)
> - [Get Account Balance API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccountBalance)

---

## Technical Design Philosophy Alignment

### Integration Scenarios

- **Payment Initiation**: Allow users to make payments from eligible accounts to recipients
- **Business Dashboard**: Embedded in client or operator portals for payment workflows
- **Payment Method Selection**: Support for multiple payment rails (ACH, RTP, WIRE)
- **Dynamic Recipient Filtering**: Only show valid recipients based on account and payment method

### OAS & Code Generation

- **Primary OAS**: `embedded-finance-pub-ef-2.0.8.yaml`
- **Generated Hooks**: `useCreateTransactionV2`, `useGetAccounts`, `useGetAllRecipients`, `useGetAccountBalance`
- **Generated Types**: `TransactionRequestV2`, `TransactionResponseV2`, `AccountResponse`, `RecipientResponse`
- **API Endpoints**: `/transactions`, `/accounts`, `/recipients`, `/accounts/{id}/balances`

### Key Technical Design Principles

- **OAS-Driven Development**: All types and API contracts generated from OpenAPI Specification
- **Generated Hooks Integration**: Use Orval-generated React Query hooks for data fetching and mutation
- **Opinionated Layer**: Dynamic form logic, validation, and recipient filtering based on business rules
- **Type Safety**: Full TypeScript integration with generated types ensuring API-UI consistency

---

## Implementation Plan

### Phase 1: Core Architecture & Data Models

- **OAS-Based Code Generation Setup**
  - Configure Orval for `embedded-finance-pub-ef-2.0.8.yaml`
  - Generate hooks and types for transactions, accounts, recipients, and balances
- **Generated Data Structures**

  ```typescript
  // Generated from OAS
  interface TransactionRequestV2 {
    from: string; // Account ID
    to: string; // Recipient ID
    amount: string;
    method: string; // Payment method (ACH, RTP, WIRE)
    memo?: string;
  }

  interface TransactionResponseV2 {
    id: string;
    status: string;
    amount: number;
    currency: string;
    // ... other transaction fields
  }

  interface AccountResponse {
    id: string;
    label: string;
    category: string;
    // ... other account fields
  }

  interface RecipientResponse {
    id: string;
    type: string;
    status: string;
    // ... other recipient fields
  }
  ```

- **Account & Recipient Requirements**
  - Requires account and recipient IDs to be provided/selected by the user
  - Only eligible accounts and recipients are shown based on business rules

### Phase 2: Core Components

- **MakePayment Container Component**
  - Dialog/modal or inline form for payment initiation
  - Handles loading, error, and success states
  - Supports custom trigger button and theming
- **Dynamic Form Logic**
  - Account selection, recipient selection, amount, payment method, memo
  - Auto-selects when only one option is available
  - Filters recipients based on selected account and payment method
- **Payment Method Configuration**
  - Supports multiple payment rails (ACH, RTP, WIRE)
  - Dynamic fee display and validation

### Phase 3: Business Logic & Integration

- **Form Validation**
  - Uses Zod schema for validation (amount format, required fields)
  - Validates available balance before submission
- **Recipient Filtering Logic**
  - For LIMITED_DDA accounts, only show active linked accounts
  - For other account types, show all recipients
- **Payment Method Filtering**
  - Only show payment methods supported by the selected recipient's routing info
- **Submission & Result Handling**
  - Calls `useCreateTransactionV2` on submit
  - Handles API errors and success callbacks

### Phase 4: User Experience & Technical Design Polish

- **Responsive Technical Design**
  - Works in modal/dialog or inline
  - Mobile-friendly form layout
- **Loading & Error States**
  - Loading indicators for accounts, recipients, and balances
  - Error messages for failed API calls or validation
- **Success State**
  - Confirmation message and option to make another payment
  - Callback for parent integration

### Phase 5: Testing & Documentation

- **Generated Code Testing**
  - Test generated hooks and types
  - Mock API responses using MSW
- **Component Testing**
  - Test form validation, filtering, and submission
  - Test dynamic recipient and payment method logic
- **Storybook Integration**
  - Scenarios for different account/recipient/payment method combinations
  - Loading, error, and success states

---

## Functional Requirements

### Payment Form

- **Account Selection**: List eligible accounts for payment
- **Recipient Selection**: List eligible recipients based on account and method
- **Amount Entry**: Validate format and available balance
- **Payment Method Selection**: Show only supported methods for recipient
- **Memo Field**: Optional memo for payment
- **Fee Display**: Show dynamic fee based on method

### Filtering & Customization

- **Dynamic Filtering**: Recipients and methods filtered by account and routing info
- **Auto-Selection**: Auto-select fields when only one option is available
- **Custom Trigger**: Support for custom trigger button and variant

### Data Management

- **Real-time Data**: Fetch latest accounts, recipients, and balances
- **Validation**: Prevent overdraw and invalid payments

---

## Technical Integration Points

### API Integration

- **Generated Hooks**: Use Orval-generated hooks for all data fetching and mutation
- **Error Handling**: Graceful handling of API failures and validation errors
- **Caching**: Use React Query for caching and refetching

### Authentication Integration

- **Account/Recipient Management**: Requires valid account and recipient IDs
- **Secure Display**: Mask sensitive account/recipient info as needed

### Content Management Integration

- **Localization**: Support content tokens for labels and messages
- **Theme Integration**: Use design tokens for consistent styling

---

## Configuration System

### Payment Methods

```typescript
// Default: No fees
const PAYMENT_METHODS = [
  { id: 'ACH', name: 'ACH' },
  { id: 'RTP', name: 'RTP' },
  { id: 'WIRE', name: 'WIRE' },
] as const;

// With optional fees - fee UI is hidden when fee is 0 or undefined
const PAYMENT_METHODS_WITH_FEES = [
  { id: 'ACH', name: 'ACH', fee: 2.5, description: 'Standard processing' },
  { id: 'RTP', name: 'RTP', fee: 1, description: 'Real-time payment' },
  { id: 'WIRE', name: 'WIRE', fee: 25, description: 'Wire transfer' },
] as const;
```

### Form Schema

```typescript
const paymentSchema = z.object({
  from: z.string().min(1, 'From account is required'),
  to: z.string().min(1, 'Recipient is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^[\d]+(\.\d{1,2})?$/, 'Invalid amount format'),
  method: z.string().min(1, 'Payment method is required'),
  memo: z.string().optional(),
});
```

### Component Props

```typescript
interface MakePaymentProps {
  triggerButton?: React.ReactNode;
  triggerButtonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  accounts?: Account[];
  paymentMethods?: PaymentMethod[];
  icon?: string;
  recipientId?: string;
  onTransactionSettled?: (
    response?: TransactionResponseV2,
    error?: ApiErrorV2
  ) => void;
}
```

---

## Testing Strategy

### Generated Code Testing

- Test `useCreateTransactionV2`, `useGetAccounts`, `useGetAllRecipients`, `useGetAccountBalance` integration
- Verify generated types match API responses
- Test error handling for API failures

### Component Testing

- Test form validation and error states
- Test dynamic filtering of recipients and payment methods
- Test submission and success callback
- Test loading and empty states

### Integration Testing

- Test with real API endpoints
- Test theme and localization integration
- Test accessibility compliance

---

## Non-Functional Requirements

### Performance

- Load accounts, recipients, and balances within 2 seconds
- Efficient filtering and validation
- Optimized re-rendering with React Query caching

### Accessibility

- WCAG 2.1 compliance
- Keyboard navigation for all form fields and buttons
- Proper ARIA labels for form elements
- Color contrast standards

### Security

- Secure API communication
- No sensitive data in client-side logs
- Mask sensitive account/recipient info as needed

### Usability

- Mobile-responsive technical design
- Clear visual hierarchy and error feedback
- Intuitive payment workflow
- Consistent with other embedded components
