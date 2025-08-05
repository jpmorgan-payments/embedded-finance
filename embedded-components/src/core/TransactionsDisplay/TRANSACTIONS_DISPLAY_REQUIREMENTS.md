# Transactions Display Embedded Component Requirements

> **Documentation References:**
>
> - [JPMorgan Embedded Payments - Transactions](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/manage-display-transactions-v2)
>
> **API References:**
>
> - [List Transactions API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/transactions#/operations/getTransactions)
> - [Get Transaction Details API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/transactions#/operations/getTransaction)

---

## Technical Design Philosophy Alignment

### Integration Scenarios

- **Account Dashboard**: Display transaction history for specific accounts
- **Transaction Monitoring**: Real-time transaction status and details
- **Payment Tracking**: Track incoming and outgoing payments with counterpart information
- **Financial Reporting**: Provide transaction data for reporting and analytics

### OAS & Code Generation

- **Primary OAS**: `embedded-finance-pub-ef-2.0.8.yaml`
- **Generated Hooks**: `useListTransactionsV2`, `useGetTransactionV2`
- **Generated Types**: `TransactionGetResponseV2`, `ListTransactionsResponseV2`, `TransactionDetailsResponse`
- **API Endpoints**: `/transactions`, `/transactions/{id}`

### Key Technical Design Principles

- **OAS-Driven Development**: All types and API contracts generated from OpenAPI Specification
- **Generated Hooks Integration**: Use Orval-generated React Query hooks for data fetching
- **Opinionated Layer**: Enhanced UX with transaction filtering, responsive layouts, and detailed views
- **Type Safety**: Full TypeScript integration with generated types ensuring API-UI consistency

---

## Implementation Plan

### Phase 1: Core Architecture & Data Models

- **OAS-Based Code Generation Setup**
  - Configure Orval for `embedded-finance-pub-ef-2.0.8.yaml`
  - Generate `useListTransactionsV2` and `useGetTransactionV2` hooks
  - Generate `TransactionGetResponseV2`, `ListTransactionsResponseV2` types
- **Generated Data Structures**

  ```typescript
  // Generated from OAS
  interface TransactionGetResponseV2 {
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    paymentDate: string;
    effectiveDate: string;
    createdAt: string;
    transactionReferenceId: string;
    memo?: string;
    debtorName?: string;
    creditorName?: string;
    debtorAccountId?: string;
    creditorAccountId?: string;
    postingVersion?: number;
  }

  interface ListTransactionsResponseV2 {
    items: TransactionGetResponseV2[];
    pagination?: PaginationInfo;
  }
  ```

- **Account ID Requirements**
  - Requires account ID to be provided by parent application
  - Filter transactions by account ID for PAYIN/PAYOUT determination

### Phase 2: Core Components

- **TransactionsDisplay Container Component**
  - Filter transactions by account ID
  - Handle loading, error, and empty states
  - Responsive layout (table for desktop, cards for mobile)
- **TransactionCard Component**
  - Display transaction information in mobile-friendly format
  - Show amount, status, date, counterpart information
  - Link to transaction details
- **TransactionDetailsSheet Component**
  - Modal dialog for detailed transaction information
  - Copy transaction ID functionality
  - Comprehensive transaction data display

### Phase 3: Business Logic & Integration

- **Transaction Filtering Logic**
  - Filter by account ID for PAYIN/PAYOUT determination
  - Sort by creation date, effective date, and posting version
  - Handle empty states gracefully
- **Data Transformation Logic**
  ```typescript
  interface ModifiedTransaction extends TransactionGetResponseV2 {
    payinOrPayout?: 'PAYIN' | 'PAYOUT';
    counterpartName?: string;
  }
  ```
- **Currency Formatting**
  - Format amounts with proper currency symbols
  - Support multiple currencies
  - Handle negative amounts for PAYOUT transactions

### Phase 4: User Experience & Technical Design Polish

- **Responsive Technical Design**
  - Data table for desktop view
  - Card layout for mobile view
  - Consistent spacing and typography
- **Loading States**
  - Loading indicators for transaction list
  - Individual transaction detail loading
  - Progressive loading for better UX
- **Error Handling**
  - Graceful API error display
  - Retry mechanisms for failed requests
  - User-friendly error messages

### Phase 5: Testing & Documentation

- **Generated Code Testing**
  - Test generated hooks integration
  - Verify type safety with generated types
  - Mock API responses using MSW
- **Component Testing**
  - Test transaction filtering logic
  - Test responsive layout behavior
  - Test transaction details modal
- **Storybook Integration**
  - Multiple transaction scenarios
  - Loading and error states
  - Theme variations

---

## Functional Requirements

### Transaction Display

- **Transaction List**: Display filtered transactions for specific account
- **Transaction Details**: Comprehensive transaction information in modal
- **Amount Display**: Formatted currency amounts with PAYIN/PAYOUT indicators
- **Status Information**: Transaction status with visual indicators

### Filtering & Customization

- **Account Filtering**: Display transactions for specified account ID
- **PAYIN/PAYOUT Logic**: Determine transaction direction based on account ID
- **Responsive Layout**: Adapt to desktop and mobile views

### Data Management

- **Real-time Data**: Fetch and display current transaction data
- **Transaction Sorting**: Sort by creation date, effective date, posting version
- **Currency Support**: Support multiple currencies with proper formatting

---

## Technical Integration Points

### API Integration

- **Generated Hooks**: Use `useListTransactionsV2` and `useGetTransactionV2` from OAS
- **Error Handling**: Graceful handling of API failures
- **Caching**: Leverage React Query caching for performance

### Authentication Integration

- **Account ID Management**: Requires account ID from parent application
- **Secure Display**: Handle sensitive transaction information appropriately

### Content Management Integration

- **Localization**: Support content tokens for labels and descriptions
- **Theme Integration**: Use design tokens for consistent styling

---

## Configuration System

### Transaction Types

```typescript
const TRANSACTION_TYPES = ['PAYMENT', 'TRANSFER', 'FEE'] as const;
```

### Currency Formatting

```typescript
const formatNumberToCurrency = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  return formatter.format(amount);
};
```

### Component Props

```typescript
interface TransactionsDisplayProps {
  accountId: string;
}

interface TransactionsDisplayRef {
  refresh: () => void;
}
```

---

## Testing Strategy

### Generated Code Testing

- Test `useListTransactionsV2` and `useGetTransactionV2` hook integration
- Verify generated types match API responses
- Test error handling for API failures

### Component Testing

- Test transaction filtering by account ID
- Test PAYIN/PAYOUT logic
- Test responsive layout behavior
- Test transaction details modal functionality
- Test loading and error states

### Integration Testing

- Test with real API endpoints
- Test theme integration
- Test accessibility compliance

---

## Non-Functional Requirements

### Performance

- Load transactions within 2 seconds
- Efficient sorting and filtering
- Optimized re-rendering with React Query caching

### Accessibility

- WCAG 2.1 compliance
- Keyboard navigation for interactive elements
- Proper ARIA labels for transaction details
- Color contrast standards

### Security

- Secure API communication
- No sensitive data in client-side logs
- Proper handling of transaction IDs

### Usability

- Mobile-responsive technical design
- Clear visual hierarchy
- Intuitive transaction information display
- Consistent with other embedded components
