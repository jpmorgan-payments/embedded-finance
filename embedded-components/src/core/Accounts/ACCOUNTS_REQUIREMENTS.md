# Accounts Management Embedded Component Requirements

> **Documentation References:**
>
> - [JPMorgan Embedded Payments - Add Account](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-account)
>
> **API References:**
>
> - [List Accounts API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccounts)
> - [Get Account Balance API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccountBalance)

---

## 1. Overview

The Accounts Management Embedded Component provides a read-only, responsive UI for displaying all accounts associated with a client, including their categories, states, routing information, and balances. It is designed for use in embedded finance solutions, supporting business users and platform operators.

### 1.1 Account Types Supported

- **LIMITED_DDA**: Used for client funds management.
- **LIMITED_DDA_PAYMENTS**: Used for client payments.
- **Other categories**: (e.g., PROCESSING, MANAGEMENT, DDA) as returned by the API and optionally filtered via component props.

---

## 2. Target Users

- Platform operators managing client accounts
- Business users viewing account details and balances
- Support and operations teams

---

## 3. Functional Requirements

### 3.1 View Accounts List

- Fetch and display all accounts for a client using the [List Accounts API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccounts).
- Filter accounts by category via component props (e.g., show only LIMITED_DDA and/or LIMITED_DDA_PAYMENTS).
- Display each account as a horizontal panel/card, showing:
  - **Category** (with human-friendly label)
  - **Label** (e.g., MAIN)
  - **State** (OPEN, CLOSED, etc.)
  - **Masked account number** (last 4 digits)
  - **Routing information** (all routing numbers, if present)
  - **Balances** (all available types, e.g., ITAV, ITBD, with English labels and info popover)
- If multiple accounts, visually separate each with its own card and spacing.
- Responsive layout: horizontal on desktop, stacked on mobile.
- Show loading skeletons while fetching.
- Show error state if API fails.
- Show empty state if no accounts are found.

### 3.2 Account Details

- Mask account numbers except for the last 4 digits.
- Show all routing numbers associated with the account.
- Display all available balances, mapping ITAV/ITBD to user-friendly labels and providing info popovers for each.
- Show currency for each balance.

### 3.3 Filtering and Customization

- Allow filtering by account category via `allowedCategories` prop.
- Allow filtering by clientId via `clientId` prop.

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Accounts list should load within 2 seconds.
- Balance fetches should be parallelized for multiple accounts.

### 4.2 Usability

- Consistent UI/UX with other components (Recipients, TransactionsDisplay).
- Mobile-responsive design.
- Tooltips and info icons for balance types.

### 4.3 Accessibility

- All interactive elements (info popovers) must be keyboard accessible.
- Proper ARIA labels for info icons and popovers.
- Color contrast must meet WCAG standards.

### 4.4 Security

- Mask all sensitive account numbers.
- Do not display full routing/account numbers in the UI.
- API calls must use secure authentication and HTTPS.

---

## 5. Technical Integration Points

### 5.1 API Integration

- Use `/accounts` endpoint to fetch accounts.
- Use `/accounts/{id}/balances` endpoint to fetch balances for each account.
- Handle API errors gracefully.

### 5.2 Theming and Localization

- Support content tokens for localization.
- Use design tokens for colors, spacing, and typography.

---

## 6. User Flows

### 6.1 Viewing Accounts

1. User navigates to the Accounts section/component.
2. System fetches accounts for the client.
3. System displays each account as a horizontal card/panel.
4. User can view all balances and routing info for each account.
5. If no accounts are found, show an empty state.

---

## 7. Data Model

### 7.1 Account

- **id**: Unique account identifier
- **clientId**: Client identifier
- **label**: Account label (e.g., MAIN)
- **category**: Account category (LIMITED_DDA, etc.)
- **state**: Account state (OPEN, CLOSED, etc.)
- **paymentRoutingInformation**: Object containing:
  - **accountNumber**: Account number (masked in UI)
  - **country**: Country code
  - **routingInformation**: Array of routing numbers (type, value)
- **createdAt**: Creation timestamp

### 7.2 Balance

- **id**: Account identifier
- **date**: Balance date
- **currency**: Currency code (e.g., USD)
- **balanceTypes**: Array of balances:
  - **typeCode**: ITAV, ITBD, etc.
  - **amount**: Numeric value

---

## 8. Metrics & Analytics

- Number of accounts loaded per client
- Time to load accounts and balances
- Error rates for API calls

---

## 9. Implementation Considerations

- Use React Query for data fetching and caching.
- Use MSW for mocking in Storybook and tests.
- Use Tailwind CSS with `eb-` prefix for all custom classes.
- Use Radix UI and Lucide icons for popovers and info icons.
- Ensure all code is TypeScript strict-mode compatible.

---

## 10. Additional Resources

- [JPMorgan Add Account Guide](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-account)
- [List Accounts API Reference](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccounts)
- [Get Account Balance API Reference](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/accounts#/operations/getAccountBalance)
