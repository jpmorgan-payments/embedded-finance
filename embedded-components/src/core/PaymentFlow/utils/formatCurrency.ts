/**
 * Format a numeric value as a currency string for the payment flow.
 *
 * Uses `en-US` formatting with the currency's default fraction digits
 * (e.g. `$25.00`). Shared across PaymentFlow components to avoid duplicate
 * local implementations.
 *
 * @param value - Numeric amount to format
 * @param currency - ISO 4217 currency code (default: `'USD'`)
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}
