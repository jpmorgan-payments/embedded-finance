/**
 * Format recipient status text for display (convert from uppercase with underscores to title case)
 *
 * Converts status strings like "ACTIVE" to "Active", "MICRODEPOSITS_INITIATED" to "Microdeposits Initiated", etc.
 * Handles underscores by replacing them with spaces and then converting to title case.
 *
 * Note: API status values are NOT translated - they are formatted for display only.
 *
 * @param status - The status string to format (e.g., "ACTIVE", "MICRODEPOSITS_INITIATED")
 * @param t - Optional translation function (only used for "N/A" fallback, not for status values)
 * @returns Formatted status string in title case, or "N/A" if status is undefined/null/empty
 *
 * @example
 * formatStatusText("ACTIVE") // Returns "Active"
 * formatStatusText("MICRODEPOSITS_INITIATED") // Returns "Microdeposits Initiated"
 * formatStatusText("READY_FOR_VALIDATION") // Returns "Ready For Validation"
 * formatStatusText(undefined) // Returns "N/A"
 */
export const normalizeRecipientStatus = (status?: string): string | undefined =>
  status
    ?.replace(/^recipients:status\./i, '')
    .replace(/^status\./i, '')
    .replace(/\./g, '_');

export const formatStatusText = (
  status?: string,
  t?: (key: string, options?: any) => string
): string => {
  const normalizedStatus = normalizeRecipientStatus(status);

  if (!normalizedStatus) {
    return t ? t('common:na', { defaultValue: 'N/A' }) : 'N/A';
  }

  // Format API status values directly - do NOT translate them
  // Replace underscores with spaces, then convert to title case
  return normalizedStatus
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
