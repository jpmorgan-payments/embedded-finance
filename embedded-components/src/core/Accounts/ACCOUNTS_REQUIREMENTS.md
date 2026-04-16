# Accounts Management Embedded Component Requirements

> **Documentation References:**
>
> - [JPMorgan Embedded Payments - Add Account](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-account)
>
> **API References:**
>
> - [List Accounts API (v1)](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccounts)
> - [List Accounts API (v2)](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccountsListV2)
> - [Get Account Balance API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccountBalance)

---

## API Version Migration: v1 → v2

> **The Accounts API v2 (`2.0.47`) is available and should be adopted for new development.**

| | v1 (`1.0.23`) | v2 (`2.0.47`) |
|---|---|---|
| **OAS file** | `embedded-finance-pub-ep-accounts-1.0.23.yaml` | `embedded-finance-pub-ep-accounts-2.0.47.yaml` |
| **List accounts** | `getAccounts` | `getAccountsListV2` |
| **Get account** | — | `getAccountsV2` |
| **Create account** | — | `postAccountsV2` |
| **Manage account** | — | `manageAccountsV2` |
| **Get balance** | `getAccountBalance` | `getAccountBalance` (unchanged) |
| **Restrictions** | — | `addAccountRestriction` |

**Migration notes:**
- v2 adds create, manage, and restriction operations not available in v1
- The balance endpoint is unchanged between versions
- Generated hooks and types should be regenerated from the v2 OAS
- Existing `useGetAccounts` usage should migrate to `useGetAccountsListV2`

---

## Technical Design Philosophy Alignment

### Integration Scenarios

- **Platform Dashboard**: Display client accounts with balances and routing information
- **Account Management**: Show filtered accounts by category (LIMITED_DDA, LIMITED_DDA_PAYMENTS)
- **Balance Monitoring**: Real-time balance display with multiple balance types (ITAV, ITBD)
- **Routing Information**: Display payment routing details for external funding

### OAS & Code Generation

- **Current OAS (v1)**: `embedded-finance-pub-ep-accounts-1.0.23.yaml`
- **Upcoming OAS (v2)**: `embedded-finance-pub-ep-accounts-2.0.47.yaml` — adopt for new development
- **Generated Hooks (v1)**: `useGetAccounts`, `useGetAccountBalance`
- **Generated Hooks (v2)**: `useGetAccountsListV2`, `useGetAccountsV2`, `usePostAccountsV2`, `useManageAccountsV2`, `useGetAccountBalance`
- **Generated Types**: `AccountResponse`, `AccountBalanceResponse`, `ListAccountsResponse`
- **API Endpoints**: `/accounts`, `/accounts/{id}`, `/accounts/{id}/balances`, `/accounts/{id}/restrictions`

### Key Technical Design Principles

- **OAS-Driven Development**: All types and API contracts generated from OpenAPI Specification
- **Generated Hooks Integration**: Use Orval-generated React Query hooks for data fetching
- **Opinionated Layer**: Enhanced UX with balance type mapping, sensitive data masking, and responsive layouts
- **Type Safety**: Full TypeScript integration with generated types ensuring API-UI consistency

---

## Implementation Plan

### Phase 1: Core Architecture & Data Models

- **OAS-Based Code Generation Setup**
  - Configure Orval for `embedded-finance-pub-ep-accounts-1.0.23.yaml`
  - Generate `useGetAccounts` and `useGetAccountBalance` hooks
  - Generate `AccountResponse`, `AccountBalanceResponse`, `ListAccountsResponse` types
- **Generated Data Structures**

  ```typescript
  // Generated from OAS
  interface AccountResponse {
    id: string;
    clientId: string;
    label: string;
    state: string;
    category: string;
    paymentRoutingInformation?: PaymentRoutingInformation;
    createdAt: string;
  }

  interface AccountBalanceResponse {
    id: string;
    date: string;
    currency: string;
    balanceTypes: BalanceType[];
  }
  ```

- **Client ID Requirements**
  - Requires client ID to be provided by parent application (cannot create clients)
  - Support optional client ID filtering via props

### Phase 2: Core Components

- **Accounts Container Component**
  - Filter accounts by `allowedCategories` prop
  - Handle loading, error, and empty states
  - Responsive layout for single vs multiple accounts
- **AccountCard Component**
  - Display account information with masked sensitive data
  - Show routing information and balance types
  - Toggle sensitive information visibility
- **Balance Display Component**
  - Display both Available Balance (`ITAV`) and Current Balance (`ITBD`) simultaneously
  - Map balance type codes to user-friendly labels
  - Show info popovers for balance type descriptions (content token driven)
  - Format currency amounts with proper precision

### Phase 3: Business Logic & Integration

- **Account Filtering Logic**
  - Filter by allowed categories from props
  - Support client ID filtering
  - Handle empty states gracefully
- **Balance Type Configuration**
  ```typescript
  const BALANCE_TYPE_LABELS: Record<
    string,
    { label: string; description: string }
  > = {
    ITAV: {
      label: 'Available Balance',
      description: 'Funds you can use now, including pending credits and minus holds.',
    },
    ITBD: {
      label: 'Current Balance',
      description: 'Balance from settled transactions; may not reflect pending activity.',
    },
  };
  ```
- **Sensitive Data Management**
  - Mask account numbers (show only last 4 digits)
  - Toggle visibility for sensitive information
  - Secure display of routing information

### Phase 4: User Experience & Technical Design Polish

- **Responsive Technical Design**
  - Horizontal layout for desktop, stacked for mobile
  - Visual separation for multiple accounts
  - Consistent spacing and typography
- **Loading States**
  - Skeleton loading for accounts list
  - Individual balance loading states
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
  - Test account filtering logic
  - Test sensitive data masking
  - Test responsive layout behavior
- **Storybook Integration**
  - Multiple account scenarios
  - Loading and error states
  - Theme variations

---

## Functional Requirements

### Account Display

- **Account Information**: Category, label, state, routing details
- **Balance Information**: Display both **Available Balance** (`INTERIM_AVAILABLE` / `ITAV`) and **Current Balance** (`INTERIM_BOOKED` / `ITBD`) simultaneously. Each balance type must include an info icon with a popover:
  - **Available Balance**: _"Funds you can use now, including pending credits and minus holds."_
  - **Current Balance**: _"Balance from settled transactions; may not reflect pending activity."_
- **Sensitive Data**: Masked account numbers with toggle visibility
- **Routing Information**: ACH, Wire/RTP routing numbers for payment accounts. ACH payments do **not** require bank name or bank address — only routing number and account number.
- **Ledger Balance**: When displaying balance context alongside transactions, use `ledgerBalance` only when the transaction is in a terminal state (`status = COMPLETED` or `REJECTED`).

### Filtering & Customization

- **Category Filtering**: Display only specified account categories
- **Client Filtering**: Filter by provided client ID
- **Responsive Layout**: Adapt to single vs multiple accounts
- **Configurable Account Label**: Support platforms renaming "Funding accounts" to a platform-specific term via content tokens or props. Disclosure and UI verbiage must be customizable without code changes.

### Data Management

- **Real-time Balances**: Fetch and display current account balances
- **Balance Types**: Support ITAV (Available) and ITBD (Booked) balances
- **Currency Display**: Show proper currency formatting

---

## Technical Integration Points

### API Integration

- **Generated Hooks**: Use `useGetAccounts` and `useGetAccountBalance` from OAS
- **Error Handling**: Graceful handling of API failures
- **Caching**: Leverage React Query caching for performance

### Authentication Integration

- **Client ID Management**: Requires client ID from parent application
- **Secure Display**: Mask sensitive routing and account information

### Content Management Integration

- **Localization**: Support content tokens for labels and descriptions
- **Configurable Labels**: Platform-specific terminology (e.g., account label overrides) must be configurable via content tokens or props without code changes
- **Theme Integration**: Use design tokens for consistent styling

---

## Configuration System

### Account Categories

```typescript
const ALLOWED_CATEGORIES = ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'] as const;
```

### Balance Type Mapping

```typescript
const BALANCE_TYPE_LABELS = {
  ITAV: {
    label: 'Available Balance',
    description: 'Funds you can use now, including pending credits and minus holds.',
  },
  ITBD: {
    label: 'Current Balance',
    description: 'Balance from settled transactions; may not reflect pending activity.',
  },
};
```

### Component Props

```typescript
interface AccountsProps {
  allowedCategories: string[];
  clientId?: string;
  title?: string;
}
```

---

## Testing Strategy

### Generated Code Testing

- Test `useGetAccounts` and `useGetAccountBalance` hook integration
- Verify generated types match API responses
- Test error handling for API failures

### Component Testing

- Test account filtering by category
- Test client ID filtering
- Test sensitive data masking and toggle
- Test responsive layout behavior
- Test loading and error states

### Integration Testing

- Test with real API endpoints
- Test theme integration
- Test accessibility compliance

---

## Non-Functional Requirements

### Performance

- Load accounts within 2 seconds
- Parallel balance fetching for multiple accounts
- Efficient re-rendering with React Query caching

### Accessibility

- WCAG 2.1 compliance
- Keyboard navigation for interactive elements
- Proper ARIA labels for info popovers
- Color contrast standards

### Security

- Mask sensitive account and routing information
- Secure API communication
- No sensitive data in client-side logs

### Usability

- Mobile-responsive technical design
- Clear visual hierarchy
- Intuitive information display
- Consistent with other embedded components

---

## Scope Boundaries

- **Linked Accounts**: The partially hosted UI does not yet include Linked Accounts. Platforms building ACH pull functionality should follow the "Link External Bank Account" demo at [embedded-finance-dev.com/components](https://embedded-finance-dev.com/components) as reference.
- **Family Office Onboarding**: Out of scope for the current implementation phase.
- **Transaction Field Mapping**: Pay-in / pay-out direction logic, date field usage, and description mapping are documented in the [TransactionsDisplay requirements](../TransactionsDisplay/TRANSACTIONS_DISPLAY_REQUIREMENTS.md).

---

## Storybook Reference

- **Live stories**: [Accounts — Storybook](https://storybook.embedded-finance-dev.com/?path=/story/core-accounts--default)
- **Showcase demo**: [Embedded Finance Showcase](https://embedded-finance-dev.com/sellsense-demo)

Storybook stories serve as living documentation and implementation recipes. Each story demonstrates a specific scenario (loading, error, empty state, multiple accounts, theme variants) that maps directly to the functional requirements above.
