import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';

export function getMaintenancePartyName(party: PartyResponse): string {
  const organizationName = party.organizationDetails?.organizationName;
  if (organizationName) return organizationName;

  const individualName = [
    party.individualDetails?.firstName,
    party.individualDetails?.middleName,
    party.individualDetails?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return individualName || party.email || party.id || 'Unnamed party';
}

export function formatMaintenanceStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
