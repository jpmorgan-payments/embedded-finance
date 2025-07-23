// Mock data for MakePayment component

// Mock accounts for payment component
export const mockPaymentAccounts = [
  {
    id: 'account-001',
    name: 'Main Business Account',
    type: 'CHECKING',
    balance: 25000.0,
    currency: 'USD',
  },
  {
    id: 'account-002',
    name: 'Savings Account',
    type: 'SAVINGS',
    balance: 50000.0,
    currency: 'USD',
  },
  {
    id: 'account-003',
    name: 'Operating Account',
    type: 'CHECKING',
    balance: 15000.0,
    currency: 'USD',
  },
];

// Mock recipients
export const mockRecipients = [
  {
    id: 'recipient-001',
    name: 'John Doe',
    accountNumber: '****1234',
    type: 'INDIVIDUAL',
    status: 'ACTIVE',
  },
  {
    id: 'recipient-002',
    name: 'Acme Corporation',
    accountNumber: '****5678',
    type: 'ORGANIZATION',
    status: 'ACTIVE',
  },
  {
    id: 'recipient-003',
    name: 'Jane Smith',
    accountNumber: '****9012',
    type: 'INDIVIDUAL',
    status: 'ACTIVE',
  },
  {
    id: 'recipient-004',
    name: 'Tech Solutions Inc',
    accountNumber: '****3456',
    type: 'ORGANIZATION',
    status: 'ACTIVE',
  },
];

// Mock payment methods
export const mockPaymentMethods = [
  {
    id: 'ACH',
    name: 'ACH',
    fee: 2.5,
    description: 'Automated Clearing House (1-3 business days)',
    maxAmount: 1000000,
    minAmount: 1,
  },
  {
    id: 'RTP',
    name: 'RTP',
    fee: 1.0,
    description: 'Real-Time Payments (instant)',
    maxAmount: 100000,
    minAmount: 1,
  },
  {
    id: 'WIRE',
    name: 'WIRE',
    fee: 25.0,
    description: 'Wire Transfer (same day)',
    maxAmount: 10000000,
    minAmount: 100,
  },
];

// Mock payment response
export const mockPaymentResponse = {
  id: 'payment-001',
  status: 'SUBMITTED',
  amount: 1000.0,
  currency: 'USD',
  paymentMethod: 'ACH',
  fromAccount: 'account-001',
  toRecipient: 'recipient-001',
  reference: 'INV-2024-001',
  submittedAt: new Date().toISOString(),
  estimatedSettlementDate: new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000,
  ).toISOString(),
  fee: 2.5,
  totalAmount: 1002.5,
};

// Mock payment validation response
export const mockPaymentValidationResponse = {
  isValid: true,
  errors: [],
  warnings: [],
  fee: 2.5,
  estimatedSettlementDate: new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000,
  ).toISOString(),
};

// Mock payment error response
export const mockPaymentErrorResponse = {
  isValid: false,
  errors: [
    {
      field: 'amount',
      message: 'Amount exceeds available balance',
      code: 'INSUFFICIENT_FUNDS',
    },
  ],
  warnings: [],
};

// Function to create mock payment
export const createMockPayment = (overrides: any = {}) => {
  return {
    id: `payment-${Date.now()}`,
    status: 'SUBMITTED',
    amount: 1000.0,
    currency: 'USD',
    paymentMethod: 'ACH',
    fromAccount: 'account-001',
    toRecipient: 'recipient-001',
    reference: `INV-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    estimatedSettlementDate: new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    fee: 2.5,
    totalAmount: 1002.5,
    ...overrides,
  };
};

// Function to get payment method by ID
export const getPaymentMethodById = (id: string) => {
  return mockPaymentMethods.find((method) => method.id === id);
};

// Function to get recipient by ID
export const getRecipientById = (id: string) => {
  return mockRecipients.find((recipient) => recipient.id === id);
};

// Function to get account by ID
export const getAccountById = (id: string) => {
  return mockPaymentAccounts.find((account) => account.id === id);
};

// Function to calculate payment fee
export const calculatePaymentFee = (
  amount: number,
  paymentMethodId: string,
) => {
  const method = getPaymentMethodById(paymentMethodId);
  return method ? method.fee : 0;
};

// Function to validate payment
export const validatePayment = (paymentData: any) => {
  const { amount, fromAccount, paymentMethod } = paymentData;
  const account = getAccountById(fromAccount);
  const method = getPaymentMethodById(paymentMethod);

  const errors = [];
  const warnings = [];

  if (!account) {
    errors.push({
      field: 'fromAccount',
      message: 'Invalid account selected',
      code: 'INVALID_ACCOUNT',
    });
  }

  if (!method) {
    errors.push({
      field: 'paymentMethod',
      message: 'Invalid payment method selected',
      code: 'INVALID_PAYMENT_METHOD',
    });
  }

  if (amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'Amount must be greater than 0',
      code: 'INVALID_AMOUNT',
    });
  }

  if (account && amount > account.balance) {
    errors.push({
      field: 'amount',
      message: 'Amount exceeds available balance',
      code: 'INSUFFICIENT_FUNDS',
    });
  }

  if (method && amount > method.maxAmount) {
    errors.push({
      field: 'amount',
      message: `Amount exceeds maximum limit for ${method.name}`,
      code: 'AMOUNT_TOO_HIGH',
    });
  }

  if (method && amount < method.minAmount) {
    errors.push({
      field: 'amount',
      message: `Amount below minimum limit for ${method.name}`,
      code: 'AMOUNT_TOO_LOW',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fee: method ? method.fee : 0,
    estimatedSettlementDate: method
      ? new Date(
          Date.now() +
            (method.id === 'RTP' ? 0 : method.id === 'WIRE' ? 1 : 3) *
              24 *
              60 *
              60 *
              1000,
        ).toISOString()
      : new Date().toISOString(),
  };
};
