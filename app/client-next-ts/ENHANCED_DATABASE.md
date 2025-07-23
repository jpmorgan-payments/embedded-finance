# Enhanced Database Functionality

## Overview

The MSW database has been enhanced to properly handle accounts, balances, and
transaction processing with automatic balance updates. This ensures that when
transactions are created or their status changes, the corresponding account
balances are automatically updated to reflect the financial impact.

## Database Models

### Account Model

```javascript
account: {
  id: primaryKey(String),
  clientId: String,
  label: String,
  state: String, // 'OPEN', 'CLOSED', 'FROZEN'
  category: String, // 'LIMITED_DDA', 'LIMITED_DDA_PAYMENTS', etc.
  paymentRoutingInformation: Object,
  createdAt: String,
  updatedAt: String,
}
```

### Account Balance Model

```javascript
accountBalance: {
  id: primaryKey(String),
  accountId: String,
  date: String,
  currency: String,
  balanceTypes: Array, // Array of { typeCode: String, amount: Number }
  updatedAt: String,
}
```

### Transaction Model (Enhanced)

```javascript
transaction: {
  id: primaryKey(String),
  type: String, // 'ACH', 'WIRE', 'RTP'
  status: String, // 'COMPLETED', 'PENDING', 'FAILED'
  amount: Number,
  currency: String,
  paymentDate: String,
  effectiveDate: String,
  creditorAccountId: String,
  debtorAccountId: String,
  creditorName: String,
  debtorName: String,
  postingVersion: Number,
  reference: String,
  description: String,
  createdAt: String,
}
```

## Core Functions

### 1. `updateAccountBalance(accountId, amount, transactionType)`

Updates the balance of a specific account based on transaction type.

**Parameters:**

- `accountId` (String): The account ID to update
- `amount` (Number): The amount to add/subtract
- `transactionType` (String): 'CREDIT' or 'DEBIT'

**Returns:** Updated balance object or null if account not found

**Example:**

```javascript
// Add $100 to account
updateAccountBalance('acc-001', 100.0, 'CREDIT');

// Subtract $50 from account
updateAccountBalance('acc-001', 50.0, 'DEBIT');
```

### 2. `processTransaction(transactionData)`

Processes a transaction and updates account balances if the transaction is
completed.

**Parameters:**

- `transactionData` (Object): Transaction object with creditorAccountId,
  debtorAccountId, amount, type, status

**Behavior:**

- Only processes transactions with status 'COMPLETED'
- Credits the creditor account (money coming in)
- Debits the debtor account (money going out)

**Example:**

```javascript
processTransaction({
  creditorAccountId: 'acc-001',
  debtorAccountId: 'acc-002',
  amount: 500.0,
  type: 'ACH',
  status: 'COMPLETED',
});
```

### 3. `createTransactionWithBalanceUpdate(transactionData)`

Creates a new transaction and automatically updates balances if the transaction
is completed.

**Parameters:**

- `transactionData` (Object): Transaction data with optional fields

**Returns:** Created transaction object

**Example:**

```javascript
const transaction = createTransactionWithBalanceUpdate({
  type: 'ACH',
  status: 'COMPLETED',
  amount: 1000.0,
  creditorAccountId: 'acc-001',
  debtorAccountId: 'acc-002',
  creditorName: 'SellSense Marketplace',
  debtorName: 'Customer Name',
  description: 'Payment for order #12345',
});
```

### 4. `updateTransactionStatus(transactionId, newStatus)`

Updates a transaction's status and handles balance changes accordingly.

**Parameters:**

- `transactionId` (String): The transaction ID to update
- `newStatus` (String): New status ('COMPLETED', 'PENDING', 'FAILED', etc.)

**Returns:** Updated transaction object

**Behavior:**

- If status changes to 'COMPLETED', updates balances
- If status changes from 'COMPLETED' to something else, reverses balance changes
- Maintains data integrity across status changes

**Example:**

```javascript
// Complete a pending transaction
updateTransactionStatus('txn-123', 'COMPLETED');

// Mark a completed transaction as failed (reverses balances)
updateTransactionStatus('txn-123', 'FAILED');
```

## API Endpoints

### Transaction Management

#### Create Transaction with Balance Updates

```
POST /ef/do/v1/transactions
```

**Request Body:**

```json
{
  "type": "ACH",
  "status": "COMPLETED",
  "amount": 500.0,
  "currency": "USD",
  "creditorAccountId": "acc-001",
  "debtorAccountId": "acc-002",
  "creditorName": "SellSense Marketplace",
  "debtorName": "Customer Name",
  "description": "Payment for order"
}
```

**Response:** Created transaction object with automatic balance updates

#### Update Transaction Status

```
PATCH /ef/do/v1/transactions/:id/status
```

**Request Body:**

```json
{
  "status": "COMPLETED"
}
```

**Response:** Updated transaction object with balance changes

### Account Management

#### Get All Accounts

```
GET /ef/do/v1/accounts
```

**Response:**

```json
{
  "items": [
    {
      "id": "acc-001",
      "clientId": "0030000131",
      "label": "Main Account",
      "state": "OPEN",
      "category": "LIMITED_DDA",
      "paymentRoutingInformation": {
        "accountNumber": "123456789012",
        "country": "US",
        "routingInformation": [{ "type": "ABA", "value": "987654321" }]
      }
    }
  ]
}
```

#### Get Account Balance

```
GET /ef/do/v1/accounts/:accountId/balances
```

**Response:**

```json
{
  "id": "acc-001",
  "accountId": "acc-001",
  "date": "2024-01-15",
  "currency": "USD",
  "balanceTypes": [
    { "typeCode": "ITAV", "amount": 6058.42 },
    { "typeCode": "ITBD", "amount": 6258.42 }
  ],
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Update Account Balance (Manual)

```
PATCH /ef/do/v1/accounts/:accountId/balances
```

**Request Body:**

```json
{
  "amount": 100.0,
  "transactionType": "CREDIT"
}
```

**Response:** Updated balance object

## Balance Types

The system supports multiple balance types:

- **ITAV** (Immediate Available): Funds immediately available for withdrawal
- **ITBD** (Immediate Booked): Total booked balance including pending items

## Transaction Processing Rules

### 1. Status-Based Processing

- **PENDING**: No balance changes
- **COMPLETED**: Updates both creditor and debtor account balances
- **FAILED/REJECTED**: No balance changes (or reverses if previously completed)

### 2. Balance Update Logic

- **Creditor Account**: Receives money (CREDIT operation)
- **Debtor Account**: Sends money (DEBIT operation)
- **Negative Balance Prevention**: Balances cannot go below 0

### 3. Status Change Handling

- **PENDING → COMPLETED**: Apply balance changes
- **COMPLETED → PENDING/FAILED**: Reverse balance changes
- **Other status changes**: No balance impact

## Database Initialization

The database is initialized with:

1. **Predefined Clients**: From mock data with proper party relationships
2. **Accounts**: From `mockAccounts` with routing information
3. **Account Balances**: From `mockAccountBalance` and `mockAccountBalance2`
4. **Transactions**: From `mockTransactionsResponse` with proper balance impact
5. **Recipients**: From mock recipient data

## Testing

### Manual Testing

Use the test script to verify functionality:

```bash
cd app/client-next-ts
node test-database.js
```

### API Testing

Test the endpoints using curl or Postman:

```bash
# Create a transaction
curl -X POST http://localhost:3000/ef/do/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ACH",
    "status": "COMPLETED",
    "amount": 500.00,
    "creditorAccountId": "acc-001",
    "debtorAccountId": "acc-002",
    "description": "Test transaction"
  }'

# Check account balance
curl http://localhost:3000/ef/do/v1/accounts/acc-001/balances

# Update transaction status
curl -X PATCH http://localhost:3000/ef/do/v1/transactions/txn-123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

## Database Reset

Reset the database to initial state:

```bash
curl -X POST http://localhost:3000/ef/do/v1/_reset
```

## Monitoring

### Database Status

Check database status:

```bash
curl http://localhost:3000/ef/do/v1/_status
```

### Console Logging

All balance updates and transaction processing are logged to the console for
debugging.

## Best Practices

### 1. Transaction Creation

- Always use `createTransactionWithBalanceUpdate()` instead of direct database
  creation
- Set appropriate initial status (PENDING for new transactions)
- Include both creditor and debtor account IDs

### 2. Status Management

- Use `updateTransactionStatus()` for status changes
- Avoid direct database updates for transaction status
- Consider the balance impact when changing status

### 3. Account Management

- Ensure accounts exist before creating transactions
- Use proper account IDs from the database
- Monitor balance changes through the API endpoints

### 4. Error Handling

- Check for account existence before balance updates
- Handle missing accounts gracefully
- Log all balance changes for audit purposes

## Integration with Components

The enhanced database integrates seamlessly with:

- **TransactionsDisplay**: Shows real-time transaction data with balance impact
- **MakePayment**: Creates transactions with automatic balance updates
- **Accounts**: Displays current account balances
- **LinkedAccountWidget**: Manages account relationships

All components now work with live data that reflects the actual financial state
of the system.
