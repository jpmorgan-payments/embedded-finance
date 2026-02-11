/**
 * Get display name for a party (organization name or individual full name).
 */

import type { PartyResponse } from '@/api/generated/smbdo.schemas';

export function getPartyDisplayName(party: PartyResponse): string {
  if (party.organizationDetails?.organizationName) {
    return party.organizationDetails.organizationName;
  }
  const first = party.individualDetails?.firstName ?? '';
  const last = party.individualDetails?.lastName ?? '';
  return [first, last].filter(Boolean).join(' ').trim() || 'Unknown';
}
