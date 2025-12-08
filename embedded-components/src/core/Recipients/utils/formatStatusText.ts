/**
 * Format recipient status text for display (convert from uppercase with underscores to title case)
 *
 * Converts status strings like "ACTIVE" to "Active", "MICRODEPOSITS_INITIATED" to "Microdeposits Initiated", etc.
 * Handles underscores by replacing them with spaces and then converting to title case.
 * Now uses translations when available.
 *
 * @param status - The status string to format (e.g., "ACTIVE", "MICRODEPOSITS_INITIATED")
 * @param t - Optional translation function. If provided, will use translations for status text.
 * @returns Formatted status string in title case, or "N/A" if status is undefined/null/empty
 *
 * @example
 * formatStatusText("ACTIVE") // Returns "Active"
 * formatStatusText("MICRODEPOSITS_INITIATED", t) // Returns translated status text
 * formatStatusText(undefined) // Returns "N/A"
 */
export const formatStatusText = (
  status?: string,
  t?: (key: string, options?: any) => string
): string => {
  if (!status) {
    return t ? t('common:na', { defaultValue: 'N/A' }) : 'N/A';
  }

  // Try to use translation if available
  if (t) {
    const statusKey = `recipients:status.${status.toLowerCase()}`;
    const translated = t(statusKey, { defaultValue: undefined });
    if (translated !== statusKey) {
      return translated;
    }
  }

  // Fallback to formatting: Replace underscores with spaces, then convert to title case
  // "MICRODEPOSITS_INITIATED" -> "MICRODEPOSITS INITIATED" -> "Microdeposits Initiated"
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
