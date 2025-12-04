/**
 * Maps account state to badge variant
 * @param state - Account state string
 * @returns Badge variant string
 */
export function getAccountStatusVariant(
  state?: string
): 'success' | 'destructive' | 'warning' | 'secondary' | 'outline' {
  switch (state) {
    case 'OPEN':
      return 'success';
    case 'CLOSED':
      return 'destructive';
    case 'PENDING':
      return 'warning';
    case 'SUSPENDED':
      return 'secondary';
    default:
      return 'outline';
  }
}


