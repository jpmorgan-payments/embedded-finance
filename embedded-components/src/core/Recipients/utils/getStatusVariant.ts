import type { RecipientStatus } from '@/api/generated/ep-recipients.schemas';

/**
 * Get status badge variant based on recipient status
 *
 * Maps recipient status values to appropriate badge variants using Salt Status tokens:
 * - success: statusSuccess tokens (for ACTIVE)
 * - warning: statusWarning tokens (for PENDING, READY_FOR_VALIDATION)
 * - destructive: sentimentNegative tokens (maps to statusError) (for REJECTED)
 * - informative: statusInfo tokens (for MICRODEPOSITS_INITIATED)
 * - outline: neutral/secondary (for INACTIVE)
 *
 * @param status - The recipient status (e.g., "ACTIVE", "PENDING", "REJECTED")
 * @returns Badge variant string appropriate for the status
 *
 * @example
 * getStatusVariant("ACTIVE") // Returns "success"
 * getStatusVariant("PENDING") // Returns "warning"
 * getStatusVariant("REJECTED") // Returns "destructive"
 */
export const getStatusVariant = (
  status?: RecipientStatus
): 'success' | 'warning' | 'destructive' | 'informative' | 'outline' => {
  switch (status) {
    case 'ACTIVE':
      return 'success'; // Uses statusSuccess tokens (statusSuccessAccentBackground + statusSuccessForeground)
    case 'PENDING':
    case 'READY_FOR_VALIDATION':
      return 'warning'; // Uses statusWarning tokens (statusWarningAccentBackground + statusWarningForeground)
    case 'REJECTED':
      return 'destructive'; // Uses sentimentNegative tokens (maps to statusError)
    case 'MICRODEPOSITS_INITIATED':
      return 'informative'; // Uses statusInfo tokens (statusInfoAccentBackground + statusInfoForeground)
    case 'INACTIVE':
    default:
      return 'outline'; // Neutral/secondary styling
  }
};
