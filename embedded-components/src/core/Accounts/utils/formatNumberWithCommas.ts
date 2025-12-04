/**
 * Formats a number with thousands separators, keeping decimal places separate
 * @param value - The number to format
 * @returns Object with whole and decimal parts formatted
 */
export function formatNumberWithCommas(value: number): {
  whole: string;
  decimal: string;
} {
  // Format the number with thousands separators but keep decimal places separate
  const parts = value.toFixed(2).split('.');
  const formattedWhole = new Intl.NumberFormat('en-US').format(
    Number(parts[0])
  );
  return { whole: formattedWhole, decimal: parts[1] };
}


