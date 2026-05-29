/**
 * Get status badge variant based on transaction status
 *
 * Maps transaction status values to appropriate badge variants using Salt Status tokens:
 * - success: statusSuccess tokens
 * - warning: statusWarning tokens
 * - destructive: sentimentNegative tokens (maps to statusError)
 * - informative: statusInfo tokens
 *
 * @param status - The transaction status string (e.g., "COMPLETED", "PENDING")
 * @returns Badge variant string appropriate for the status
 *
 * @example
 * getStatusVariant("COMPLETED") // Returns "success"
 * getStatusVariant("PENDING") // Returns "warning"
 * getStatusVariant("REJECTED") // Returns "destructive"
 */
export const getStatusVariant = (
  status?: string
): 'success' | 'warning' | 'destructive' | 'informative' | 'outline' => {
  switch (status) {
    case 'COMPLETED':
      return 'success'; // Uses statusSuccess tokens (statusSuccessAccentBackground + statusSuccessForeground)
    case 'PENDING':
      return 'warning'; // Uses statusWarning tokens (statusWarningAccentBackground + statusWarningForeground)
    case 'REJECTED':
    case 'RETURNED':
    case 'FAILED':
      return 'destructive'; // Uses sentimentNegative tokens (maps to statusError)
    default:
      return 'informative'; // Uses statusInfo tokens (statusInfoAccentBackground + statusInfoForeground)
  }
};
