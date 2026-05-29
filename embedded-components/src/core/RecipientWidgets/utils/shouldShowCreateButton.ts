/**
 * Determines if the create button should be shown based on variant and account state
 */
export function shouldShowCreateButton(
  variant: 'default' | 'singleAccount',
  hasActiveAccount: boolean,
  showCreateButton: boolean
): boolean {
  if (!showCreateButton) return false;

  // Single account mode: hide create button if an active account exists
  if (variant === 'singleAccount' && hasActiveAccount) return false;

  return true;
}
