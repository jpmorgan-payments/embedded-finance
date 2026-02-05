# Payment Flow - Functional Requirements

> **Purpose**: This document defines the functional requirements for building a funds transfer UI against the J.P. Morgan Embedded Payments API. It focuses on business rules, data contracts, validation logic, and edge cases—not implementation details.

---

## Table of Contents

1. [Core Functionality](#core-functionality)
2. [API Data Contracts](#api-data-contracts)
3. [Account Rules](#account-rules)
4. [Recipient Rules](#recipient-rules)
5. [Payment Method Rules](#payment-method-rules)
6. [Amount & Balance Rules](#amount--balance-rules)
7. [Validation Rules](#validation-rules)
8. [Transaction Submission](#transaction-submission)
9. [Error Handling Rules](#error-handling-rules)
10. [State Reset Rules](#state-reset-rules)

---

## Core Functionality

A payment flow must allow users to:

1. Select a source account (debtor account)
2. Select a destination (recipient or linked account)
3. Choose a payment method (ACH, WIRE, RTP)
4. Enter an amount
5. Optionally add a memo
6. Review and submit the transaction

### Required Data

Before a transaction can be submitted, the following must be collected:

| Field                    | Required | Source                                              |
| ------------------------ | -------- | --------------------------------------------------- |
| Source Account ID        | Yes      | User selection from fetched accounts                |
| Recipient ID             | Yes      | User selection from fetched recipients              |
| Payment Method           | Yes      | User selection based on recipient's enabled methods |
| Amount                   | Yes      | User input (must be > 0)                            |
| Currency                 | Yes      | Default to "USD"                                    |
| Memo                     | No       | User input                                          |
| Transaction Reference ID | Yes      | System-generated unique identifier                  |

---

## API Data Contracts

### Fetching Accounts

**Endpoint**: `GET /accounts?clientId={clientId}`

**Response fields used**:

- `id` - Account identifier
- `label` - User-friendly account name (may be null)
- `category` - Account type (e.g., "DDA", "LIMITED_DDA")
- `state` - Account status ("OPEN", "PENDING_CLOSE", "CLOSED", etc.)
- `paymentRoutingInformation.accountNumber` - For display (last 4 digits)

**Filtering requirement**: Only accounts with `state` of "OPEN" or "PENDING_CLOSE" should be usable for transactions.

### Fetching Account Balances

**Endpoint**: `GET /accounts/{accountId}/balance`

**Response fields used**:

- `balanceTypes` - Array of balance entries
  - `typeCode` - Balance type identifier
  - `amount` - Balance amount

**Balance extraction**: Use the balance with `typeCode === 'ITAV'` (Interim Available Balance) for validation. This represents the actual spendable amount.

### Fetching Recipients

**Endpoint**: `GET /recipients?clientId={clientId}&type={type}`

Two separate calls required:

1. `type=RECIPIENT` - External recipients (people/businesses)
2. `type=LINKED_ACCOUNT` - User's own accounts at other institutions

**Response fields used**:

- `id` - Recipient identifier
- `type` - "RECIPIENT" or "LINKED_ACCOUNT"
- `status` - Recipient status ("ACTIVE", "INACTIVE", etc.)
- `partyDetails.type` - "INDIVIDUAL" or "ORGANIZATION"
- `partyDetails.firstName`, `partyDetails.lastName` - For individuals
- `partyDetails.businessName` - For organizations
- `account.number` - Account number (for display)
- `account.routingInformation[]` - Array of enabled payment methods
  - `transactionType` - "ACH", "WIRE", or "RTP"
  - `routingNumber` - Routing number for this method

**Filtering requirement**: Only recipients with `status === 'ACTIVE'` should be displayed.

**Pagination**: The recipients endpoint is paginated. Large recipient lists require handling pagination or infinite scroll.

### Creating a Transaction

**Endpoint**: `POST /transactions`

**Request body**:

```json
{
  "amount": 1000.0,
  "currency": "USD",
  "debtorAccountId": "acc_123",
  "recipientId": "rec_456",
  "memo": "Optional memo text",
  "transactionReferenceId": "UNIQUE_REF_12345",
  "type": "ACH"
}
```

**Transaction Reference ID requirements**:

- Must be unique per transaction
- Maximum 35 characters
- Any format that satisfies uniqueness is acceptable

### Creating a Recipient

**Endpoint**: `POST /recipients`

Used when adding a new recipient inline during the payment flow. After creation, the new recipient should be immediately selectable without requiring a page refresh or API refetch.

### Enabling a Payment Method

**Endpoint**: `PATCH /recipients/{recipientId}`

Used to add additional routing information (e.g., enabling WIRE for a recipient that only has ACH). This requires collecting additional information specific to the payment method.

---

## Account Rules

### Account Category Restrictions

**Rule: LIMITED_DDA accounts can only pay to LINKED_ACCOUNT recipients**

This is a business constraint where certain account types (identified by `category === 'LIMITED_DDA'`) are restricted to transferring funds only to the user's own accounts at other institutions, not to external recipients.

**Implications**:

1. If a LIMITED_DDA account is selected, recipients of type "RECIPIENT" must be disabled or hidden
2. If a RECIPIENT is already selected and user selects a LIMITED_DDA account, the recipient selection must be cleared
3. If a RECIPIENT is pre-selected (via initial data), LIMITED_DDA accounts should be shown as unavailable

### Account State Handling

| State         | Can Use for Transactions |
| ------------- | ------------------------ |
| OPEN          | Yes                      |
| PENDING_CLOSE | Yes                      |
| CLOSED        | No                       |
| Other states  | No                       |

### Single Account Behavior

When only one usable account exists, it may be auto-selected. This is optional.

---

## Recipient Rules

### Recipient Types

| Type           | Description                  | Use Case                                |
| -------------- | ---------------------------- | --------------------------------------- |
| RECIPIENT      | External party               | Paying vendors, individuals, businesses |
| LINKED_ACCOUNT | User's own account elsewhere | Transferring between own accounts       |

### Party Types

Recipients have a `partyDetails.type` that affects display and potentially required fields:

| Party Type   | Name Source          | Examples          |
| ------------ | -------------------- | ----------------- |
| INDIVIDUAL   | firstName + lastName | Personal payments |
| ORGANIZATION | businessName         | Business payments |

### Newly Created Recipients

When a user creates a new recipient during the payment flow:

1. The recipient must be immediately available for selection without requiring a page refresh or flow restart
2. Auto-selecting the new recipient after creation is optional

---

## Payment Method Rules

### Available Payment Methods

| Method | Typical Speed     | Required Recipient Fields                                         |
| ------ | ----------------- | ----------------------------------------------------------------- |
| ACH    | 1-3 business days | Account number, Routing number                                    |
| RTP    | Instant           | Account number, Routing number                                    |
| WIRE   | Same day          | Account number, Routing number, Beneficiary address, Bank address |

### Payment Method Availability

A payment method is available for a recipient ONLY if:

- The recipient's `account.routingInformation[]` contains an entry with matching `transactionType`

**Example**: If a recipient only has `routingInformation: [{ transactionType: "ACH", ... }]`, then only ACH can be used. RTP and WIRE are unavailable unless enabled via the PATCH endpoint.

### Enabling Payment Methods

To enable a new payment method for an existing recipient:

1. Collect the required additional fields for that method
2. PATCH the recipient to add new routing information
3. After success, the method should be immediately selectable

**WIRE-specific requirements**:

- Beneficiary address (street, city, state, ZIP)
- Bank address
- SWIFT/BIC code (optional for domestic)

### Payment Method Persistence

When the user changes their recipient selection:

- If the new recipient supports the currently selected payment method → Keep it selected
- If the new recipient does NOT support the current method → Clear the payment method selection

---

## Amount & Balance Rules

### Amount Input Requirements

- Must be a positive number greater than zero
- Must support decimal values (currency amounts)
- Should limit to 2 decimal places for USD
- Should not allow non-numeric input (except decimal point)
- Should handle edge cases: leading zeros, multiple decimals

### Balance Fetching

Balances should be fetched separately from account data because:

1. Balance data may come from a different system
2. Balance fetching may fail independently of account fetching
3. Balances change frequently and may need refresh

### Balance States

For each account, the balance can be in one of three states:

| State   | Cause                | Validation Behavior                       |
| ------- | -------------------- | ----------------------------------------- |
| Loading | API call in progress | Do not validate against balance           |
| Error   | API call failed      | Do not validate against balance           |
| Loaded  | Successful response  | Validate amount against available balance |

**Note**: The backend performs its own balance validation. Client-side validation is an optimization, not a security measure.

### Insufficient Funds

When amount exceeds available balance:

- The user must be informed that the amount exceeds the available balance
- The available balance amount should be included in the error information
- Submission should not be blocked (backend performs final validation)

---

## Validation Rules

### Required Field Validation

All required fields must be validated before submission:

| Field          | Validation       |
| -------------- | ---------------- |
| Source Account | Must be selected |
| Recipient      | Must be selected |
| Payment Method | Must be selected |
| Amount         | Must be > 0      |

### Validation Timing

Validation must occur before the transaction request is sent to the API. If validation fails, the request must not be sent and the user must be informed which fields are invalid.

### Balance Validation

Only perform balance validation when:

1. A source account is selected
2. The balance for that account has loaded successfully (not loading, not errored)
3. The amount is greater than zero
4. The amount exceeds the available balance

### Pre-selected Data Validation

When initial values are provided (e.g., `initialAccountId`, `initialPayeeId`):

1. Verify the ID exists in the fetched data
2. If not found, clear the selection
3. The pre-selected entity may have been deleted or the user may no longer have access

---

## Transaction Submission

### Request Construction

```
{
  amount: <parsed numeric value>,
  currency: "USD",
  debtorAccountId: <selected account ID>,
  recipientId: <selected recipient ID>,
  memo: <optional user input>,
  transactionReferenceId: <unique generated ID>,
  type: <selected payment method: "ACH" | "WIRE" | "RTP">
}
```

### Success Handling

After successful transaction creation:

1. Confirmation of success must be shown
2. The transaction reference ID must be displayed
3. Option to initiate another payment must be available
4. Option to exit the flow must be available

### "Make Another Payment" Behavior

When user chooses to make another payment:

1. Clear all form selections (account, recipient, method, amount, memo)
2. Clear any transaction response data
3. Return to the initial form state
4. Do NOT close the dialog/flow

---

## Error Handling Rules

### Error Categories

| Error Type              | Severity    | Required Behavior                                  |
| ----------------------- | ----------- | -------------------------------------------------- |
| Account fetch failure   | Fatal       | Cannot proceed without account data                |
| No accounts available   | Fatal       | Cannot proceed without at least one usable account |
| Balance fetch failure   | Non-fatal   | Flow can proceed; skip balance validation          |
| Recipient fetch failure | Partial     | Can proceed if at least one recipient type loads   |
| Transaction failure     | Recoverable | User can modify inputs and retry                   |

### Transaction Error Parsing

The API may return errors with context information:

```json
{
  "httpStatus": 400,
  "title": "Bad Request",
  "context": [
    {
      "code": "10104",
      "field": "currency",
      "message": "Currency not supported"
    }
  ]
}
```

**Known error codes**:

- `10104` on `currency` or `targetCurrency` field → Payment method not supported for this account/recipient combination

**HTTP status fallbacks**:

- 400 → Invalid request, check payment details
- 401 → Session expired, need to re-authenticate
- 403 → Permission denied for this operation
- 404 → Account or recipient not found
- 422 → Validation failed
- 503 → Service temporarily unavailable

### Error Dismissal

Transaction errors should be:

1. Dismissible by user action
2. Automatically cleared when user attempts another submission
3. Cleared when the flow is closed and reopened

---

## State Reset Rules

### When to Reset State

The payment flow state should be completely reset when:

1. The flow is closed and reopened
2. User explicitly chooses "Make Another Payment"
3. An external reset trigger is provided

### What to Reset

- Form selections (account, recipient, payment method, amount, memo)
- Validation errors
- Transaction response/error state
- Any "in progress" states (adding recipient, enabling method)

---

## Summary: Critical Business Rules

1. **LIMITED_DDA → LINKED_ACCOUNT only**: Certain account types cannot pay external recipients
2. **Active recipients only**: Only show recipients with status "ACTIVE"
3. **Payment method availability is per-recipient**: Check routing information, not a global list
4. **Balance validation requires loaded data**: Don't validate against loading/errored balances
5. **New recipients are immediately available**: No refresh required after inline creation
6. **Pre-selected IDs must be validated**: They may no longer exist
7. **Payment method clears on incompatible recipient change**: Don't allow impossible combinations
8. **State resets on flow reopen**: Fresh start for each session
