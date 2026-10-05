import { useTranslationWithTokens } from '@/i18n';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import { formatMaintenanceRoles } from '../utils/maintenanceDisplay';

/** Role caption for a related party, e.g. "Controller · Indirect beneficial owner". */
export function useMaintenancePartyCaption(clientPartyId?: string) {
  const { tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);

  return (party: MaintenanceParty) => {
    if (party.roles?.includes('INTERMEDIARY_OWNER')) {
      return tString('ownership.intermediaryOwner');
    }
    const ownershipNature = party.roles?.includes('BENEFICIAL_OWNER')
      ? (party.individualDetails?.natureOfOwnership ??
        (party.parentPartyId && party.parentPartyId !== clientPartyId
          ? 'Indirect'
          : 'Direct'))
      : undefined;
    return formatMaintenanceRoles(
      party.roles,
      (role, fallback) =>
        role === 'BENEFICIAL_OWNER' && ownershipNature
          ? tString(
              ownershipNature === 'Indirect'
                ? 'ownership.indirectOwner'
                : 'ownership.directOwner'
            )
          : tString(
              [`common:partyRoles.${role}`] as unknown as TemplateStringsArray,
              { defaultValue: fallback }
            ),
      tString('noRoles')
    );
  };
}
