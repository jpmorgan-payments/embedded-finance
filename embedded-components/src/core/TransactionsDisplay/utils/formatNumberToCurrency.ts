/**
 * Formats a number as currency using the specified locale
 *
 * @param amount - The amount to format
 * @param currency - The currency code (e.g., 'USD', 'CAD')
 * @param locale - The locale string (e.g., 'en-US', 'fr-CA'). Defaults to 'en-US'
 * @returns Formatted currency string
 */
export const formatNumberToCurrency = (
  amount: number,
  currency: string,
  locale: string = 'en-US'
) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });

  return formatter.format(amount);
};
