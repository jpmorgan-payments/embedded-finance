import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

/**
 * Returns the appropriate icon component for account status
 * @param state - Account state string
 * @returns Icon component or null
 */
export function getAccountStatusIcon(state?: string) {
  const iconClass = 'eb-h-3.5 eb-w-3.5';
  switch (state) {
    case 'OPEN':
      return <CheckCircle2 className={iconClass} />;
    case 'CLOSED':
      return <XCircle className={iconClass} />;
    case 'PENDING':
      return <Clock className={iconClass} />;
    case 'SUSPENDED':
      return <AlertTriangle className={iconClass} />;
    default:
      return null;
  }
}
