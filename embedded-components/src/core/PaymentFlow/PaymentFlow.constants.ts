import type {
  PaymentMethod,
  PaymentMethodFieldRequirement,
  PaymentMethodType,
} from './PaymentFlow.types';

/**
 * Default payment methods configuration
 */
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    description: '1-3 business days',
    estimatedDelivery: '1-3 business days',
  },
  {
    id: 'RTP',
    name: 'Real-Time Payment',
    description: 'Instant',
    estimatedDelivery: 'Instant',
  },
  {
    id: 'WIRE',
    name: 'Wire Transfer',
    description: 'Same day',
    estimatedDelivery: 'Same day',
  },
];

/**
 * Field requirements by payment method
 * ACH requires base fields only, other methods may require additional fields
 */
export const PAYMENT_METHOD_REQUIREMENTS: Record<
  PaymentMethodType,
  PaymentMethodFieldRequirement[]
> = {
  ACH: [
    { field: 'accountNumber', label: 'Account Number', required: true },
    { field: 'routingNumber', label: 'Routing Number', required: true },
  ],
  RTP: [
    { field: 'accountNumber', label: 'Account Number', required: true },
    { field: 'routingNumber', label: 'Routing Number', required: true },
  ],
  WIRE: [
    { field: 'accountNumber', label: 'Account Number', required: true },
    { field: 'routingNumber', label: 'Routing Number', required: true },
    {
      field: 'beneficiaryAddress',
      label: 'Beneficiary Address',
      required: true,
    },
    { field: 'beneficiaryCity', label: 'City', required: true },
    { field: 'beneficiaryState', label: 'State', required: true },
    { field: 'beneficiaryZip', label: 'ZIP Code', required: true },
    { field: 'bankAddress', label: 'Bank Address', required: true },
    { field: 'swiftBic', label: 'SWIFT/BIC Code', required: false },
  ],
};

/**
 * Payment flow view titles
 */
export const FLOW_VIEW_TITLES: Record<string, string> = {
  main: 'Transfer Funds',
  'payee-type': 'Add New Payee',
  'link-account': 'Link My Account',
  'add-recipient-method': 'Add a Recipient',
  'add-recipient-form': 'Add a Recipient',
  'enable-payment-method': 'Enable Payment Method',
};

/**
 * Panel IDs for expandable sections
 */
export const PANEL_IDS = {
  PAYEE: 'payee-selector',
  PAYMENT_METHOD: 'payment-method',
  FROM_ACCOUNT: 'from-account',
  AMOUNT: 'amount',
  MEMO: 'memo',
} as const;

/**
 * Default mobile review configuration
 */
export const DEFAULT_MOBILE_REVIEW_CONFIG = {
  requireReviewBeforeSubmit: true,
  collapsedPreview: {
    title: 'Review & Submit',
    subtitle: 'Tap to review your transfer',
    summary: '',
  },
};

/**
 * Currency options
 */
export const CURRENCY_OPTIONS = [{ value: 'USD', label: 'USD' }] as const;

/**
 * Recipient type options
 */
export const RECIPIENT_TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'BUSINESS', label: 'Business' },
] as const;

/**
 * Account type options
 */
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
] as const;
