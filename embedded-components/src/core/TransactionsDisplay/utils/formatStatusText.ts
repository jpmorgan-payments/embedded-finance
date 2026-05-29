/**
 * Format status text for display (convert from uppercase to title case)
 *
 * Converts status strings like "COMPLETED" to "Completed", "PENDING" to "Pending", etc.
 *
 * @param status - The status string to format (e.g., "COMPLETED", "PENDING")
 * @returns Formatted status string in title case, or "N/A" if status is undefined/null/empty
 *
 * @example
 * formatStatusText("COMPLETED") // Returns "Completed"
 * formatStatusText("PENDING") // Returns "Pending"
 * formatStatusText(undefined) // Returns "N/A"
 */
export const formatStatusText = (status?: string): string => {
  if (!status) return 'N/A';
  // Convert "COMPLETED" to "Completed", "PENDING" to "Pending", etc.
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};
