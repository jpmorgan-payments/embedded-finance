/**
 * Formats a number with thousands separators, keeping decimal places separate
 * @param value - The number to format
 * @param locale - The locale string (e.g., 'en-US', 'fr-CA'). Defaults to 'en-US'
 * @returns Object with whole and decimal parts formatted
 */
export function formatNumberWithCommas(
  value: number,
  locale: string = 'en-US'
): {
  whole: string;
  decimal: string;
} {
  // Format the number with thousands separators but keep decimal places separate
  const parts = value.toFixed(2).split('.');
  const formattedWhole = new Intl.NumberFormat(locale).format(Number(parts[0]));
  return { whole: formattedWhole, decimal: parts[1] };
}
