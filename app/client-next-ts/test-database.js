// Test script for enhanced database functionality
// Run with: node test-database.js

import {
  db,
  createTransactionWithBalanceUpdate,
  updateTransactionStatus,
  updateAccountBalance,
  resetDb,
  getDbStatus,
  logDbState,
} from './src/msw/db.js';

console.log('=== Testing Enhanced Database Functionality ===\n');

// Initialize database
console.log('1. Initializing database...');
resetDb();
const initialStatus = getDbStatus();
console.log('Initial database status:', initialStatus);

// Test 1: Check initial accounts and balances
console.log('\n2. Checking initial accounts and balances...');
const accounts = db.account.getAll();
const balances = db.accountBalance.getAll();

console.log(
  'Accounts:',
  accounts.map((a) => ({ id: a.id, label: a.label, state: a.state })),
);
console.log(
  'Balances:',
  balances.map((b) => ({
    accountId: b.accountId,
    balanceTypes: b.balanceTypes.map((bt) => `${bt.typeCode}: $${bt.amount}`),
  })),
);

// Test 2: Create a new transaction (PENDING status - should not affect balances)
console.log('\n3. Creating a PENDING transaction...');
const pendingTransaction = createTransactionWithBalanceUpdate({
  type: 'ACH',
  status: 'PENDING',
  amount: 500.0,
  creditorAccountId: 'acc-001',
  debtorAccountId: 'acc-002',
  creditorName: 'Test Creditor',
  debtorName: 'Test Debtor',
  description: 'Test pending transaction',
});

console.log('Created pending transaction:', {
  id: pendingTransaction.id,
  amount: pendingTransaction.amount,
  status: pendingTransaction.status,
});

// Check balances after pending transaction (should be unchanged)
const balancesAfterPending = db.accountBalance.getAll();
console.log(
  'Balances after pending transaction:',
  balancesAfterPending.map((b) => ({
    accountId: b.accountId,
    balanceTypes: b.balanceTypes.map((bt) => `${bt.typeCode}: $${bt.amount}`),
  })),
);

// Test 3: Update transaction to COMPLETED status
console.log('\n4. Updating transaction to COMPLETED status...');
const completedTransaction = updateTransactionStatus(
  pendingTransaction.id,
  'COMPLETED',
);

console.log('Updated transaction:', {
  id: completedTransaction.id,
  amount: completedTransaction.amount,
  status: completedTransaction.status,
});

// Check balances after completed transaction (should be updated)
const balancesAfterCompleted = db.accountBalance.getAll();
console.log(
  'Balances after completed transaction:',
  balancesAfterCompleted.map((b) => ({
    accountId: b.accountId,
    balanceTypes: b.balanceTypes.map((bt) => `${bt.typeCode}: $${bt.amount}`),
  })),
);

// Test 4: Create a direct balance update
console.log('\n5. Testing direct balance update...');
const updatedBalance = updateAccountBalance('acc-001', 100.0, 'CREDIT');
console.log('Direct balance update result:', {
  accountId: updatedBalance.accountId,
  balanceTypes: updatedBalance.balanceTypes.map(
    (bt) => `${bt.typeCode}: $${bt.amount}`,
  ),
});

// Test 5: Create a completed transaction directly
console.log('\n6. Creating a completed transaction directly...');
const directCompletedTransaction = createTransactionWithBalanceUpdate({
  type: 'WIRE',
  status: 'COMPLETED',
  amount: 250.0,
  creditorAccountId: 'acc-002',
  debtorAccountId: 'acc-001',
  creditorName: 'Direct Creditor',
  debtorName: 'Direct Debtor',
  description: 'Direct completed transaction',
});

console.log('Created direct completed transaction:', {
  id: directCompletedTransaction.id,
  amount: directCompletedTransaction.amount,
  status: directCompletedTransaction.status,
});

// Final balance check
console.log('\n7. Final balance check...');
const finalBalances = db.accountBalance.getAll();
console.log(
  'Final balances:',
  finalBalances.map((b) => ({
    accountId: b.accountId,
    balanceTypes: b.balanceTypes.map((bt) => `${bt.typeCode}: $${bt.amount}`),
  })),
);

// Test 6: Check all transactions
console.log('\n8. All transactions in database...');
const allTransactions = db.transaction.getAll();
console.log(
  'Transactions:',
  allTransactions.map((t) => ({
    id: t.id,
    type: t.type,
    status: t.status,
    amount: t.amount,
    creditorAccountId: t.creditorAccountId,
    debtorAccountId: t.debtorAccountId,
  })),
);

// Final database status
console.log('\n9. Final database status...');
const finalStatus = getDbStatus();
console.log('Final database status:', finalStatus);

console.log('\n=== Test Complete ===');
