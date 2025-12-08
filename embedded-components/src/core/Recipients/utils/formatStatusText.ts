/**
 * Format recipient status text for display (convert from uppercase with underscores to title case)
 *
 * Converts status strings like "ACTIVE" to "Active", "MICRODEPOSITS_INITIATED" to "Microdeposits Initiated", etc.
 * Handles underscores by replacing them with spaces and then converting to title case.
 *
 * @param status - The status string to format (e.g., "ACTIVE", "MICRODEPOSITS_INITIATED")
 * @returns Formatted status string in title case, or "N/A" if status is undefined/null/empty
 *
 * @example
 * formatStatusText("ACTIVE") // Returns "Active"
 * formatStatusText("MICRODEPOSITS_INITIATED") // Returns "Microdeposits Initiated"
 * formatStatusText(undefined) // Returns "N/A"
 */
export const formatStatusText = (status?: string): string => {
  if (!status) return 'N/A';
  // Replace underscores with spaces, then convert to title case
  // "MICRODEPOSITS_INITIATED" -> "MICRODEPOSITS INITIATED" -> "Microdeposits Initiated"
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
