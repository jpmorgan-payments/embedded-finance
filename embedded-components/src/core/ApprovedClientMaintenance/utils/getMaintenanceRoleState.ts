export type MaintenanceRoleState =
  | 'active'
  | 'pending-addition'
  | 'pending-removal'
  | 'absent';

export function getMaintenanceRoleState(
  approvedRoles: string[] | undefined,
  proposedRoles: string[] | undefined,
  role: string
): MaintenanceRoleState {
  const isApproved = approvedRoles?.includes(role) ?? false;
  const isProposed = proposedRoles?.includes(role) ?? false;

  if (isApproved && isProposed) return 'active';
  if (!isApproved && isProposed) return 'pending-addition';
  if (isApproved && !isProposed) return 'pending-removal';
  return 'absent';
}
