// =============================================================================
// Embedded Payments error catalog
// Source: https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/error-codes
// =============================================================================

export interface CatalogEntry {
  code: string;
  message: string;
  /** Plain-English explanation shown to the player when they trigger this code. */
  teaches: string;
}

/**
 * A curated slice of the published catalog — the codes a platform integrator
 * realistically hits, plus the money-movement rejects that make good scenarios.
 */
export const errorCatalog: Record<string, CatalogEntry> = {
  '10001': {
    code: '10001',
    message: 'Mandatory field missing or invalid',
    teaches: 'A required field is missing or has an invalid value.',
  },
  '10002': {
    code: '10002',
    message: 'Minimum length violation',
    teaches: 'The value is too short.',
  },
  '10003': {
    code: '10003',
    message: 'Maximum length violation',
    teaches: 'The value is too long. Check the field limit in the API help.',
  },
  '10100': {
    code: '10100',
    message: 'Minimum value violation',
    teaches: 'The number is below the allowed minimum.',
  },
  '10101': {
    code: '10101',
    message: 'Maximum value violation',
    teaches: 'The number is above the allowed maximum.',
  },
  '10102': {
    code: '10102',
    message: 'Range violation',
    teaches: 'Two related values conflict, such as an end date before a start date.',
  },
  '10103': {
    code: '10103',
    message: 'Bad format',
    teaches:
      'The value has the wrong format. US tax IDs need 9 digits. A transactionReferenceId allows letters, numbers, and underscores.',
  },
  '10104': {
    code: '10104',
    message: 'Bad value',
    teaches: 'The field has a value that is not allowed. Check the list in the API help.',
  },
  '10105': {
    code: '10105',
    message: 'Unexpected field',
    teaches: 'The request includes a field the API does not accept. Check its spelling or remove it.',
  },
  '10106': {
    code: '10106',
    message: 'Client sent a duplicate idempotency key but with different payload',
    teaches:
      'The same Idempotency-Key was used for a changed request. The API blocked it to prevent an incorrect payment.',
  },
  '10107': {
    code: '10107',
    message: 'Two concurrent requests with same idempotency key and same payload received',
    teaches:
      'Two matching requests used the same Idempotency-Key. Only one can be processed, which prevents a duplicate payment.',
  },
  '10199': {
    code: '10199',
    message: 'Request cannot be completed',
    teaches: 'The resource is not eligible for this action. Check its type and current state.',
  },
  '11001': {
    code: '11001',
    message: 'Account number is invalid or missing',
    teaches: 'The sending or receiving account could not be found.',
  },
  '11004': {
    code: '11004',
    message: 'Account is closed',
    teaches: 'A closed account cannot send or receive money.',
  },
  '11005': {
    code: '11005',
    message: 'Debtor account number closed',
    teaches: 'The account sending the money is closed.',
  },
  '11006': {
    code: '11006',
    message: 'Blocked Account',
    teaches: 'An account restriction blocks this payment.',
  },
  '11007': {
    code: '11007',
    message: 'Creditor account number closed',
    teaches: 'The account receiving the money is closed.',
  },
  '11017': {
    code: '11017',
    message: 'Transaction Forbidden',
    teaches:
      'These accounts cannot be used together. LIMITED_DDA cannot pay a third-party RECIPIENT.',
  },
  '11019': {
    code: '11019',
    message: 'Transaction type not supported/authorized on this account',
    teaches:
      'The selected payment method is not enabled for this account or recipient.',
  },
  '11506': {
    code: '11506',
    message: 'Amount of funds available to cover specified message amount is insufficient',
    teaches: 'The available balance is too low for this payment.',
  },
  '11507': {
    code: '11507',
    message: 'Duplication',
    teaches: 'The payment system found a duplicate request.',
  },
  '11514': {
    code: '11514',
    message: 'Transaction amount exceeds limits set by clearing system',
    teaches: 'The amount is above the limit for this payment method.',
  },
  '11587': {
    code: '11587',
    message: 'Payment is a duplicate of another payment',
    teaches: 'This payment matches one already submitted. Use Idempotency-Key to prevent retries from creating duplicates.',
  },
  '11657': {
    code: '11657',
    message:
      'Associated message, payment information block, or transaction was received after agreed processing cut-off time',
    teaches: 'The request arrived after the daily cut-off time for this payment method.',
  },
  '11668': {
    code: '11668',
    message: 'Not sufficient funds',
    teaches: 'The account does not have enough available money.',
  },
  '11672': {
    code: '11672',
    message: 'Suspected fraud',
    teaches: 'A security check flagged the payment, so it may be placed on hold.',
  },
  '11675': {
    code: '11675',
    message: 'Transaction does not fulfill AML requirement',
    teaches: 'The payment did not pass an anti-money-laundering check.',
  },
  'GCA-001': {
    code: 'GCA-001',
    message: 'Unauthorized Access',
    teaches: 'The request does not have valid access credentials.',
  },
  'GCA-099': {
    code: 'GCA-099',
    message: 'System is Unavailable',
    teaches: 'The service is unavailable. Retry the same request with the same Idempotency-Key.',
  },
};

export function lookupError(code: string): CatalogEntry | undefined {
  return errorCatalog[code];
}
