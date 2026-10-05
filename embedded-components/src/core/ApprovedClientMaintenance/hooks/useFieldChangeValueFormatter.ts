import { useTranslationWithTokens } from '@/i18n';

import type { PartyFieldChange } from '../utils/buildMaintenanceProjection';

/** Display text for one side of a field change, translating role codes. */
export function useFieldChangeValueFormatter() {
  const { tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);

  return (change: PartyFieldChange, side: 'approved' | 'proposed') => {
    const rawValue =
      side === 'approved' ? change.approvedRawValue : change.proposedRawValue;
    const displayValue =
      side === 'approved' ? change.approvedValue : change.proposedValue;
    if (change.field === 'roles' && Array.isArray(rawValue)) {
      return rawValue
        .map((role) =>
          tString(
            [
              `common:partyRoles.${String(role)}`,
            ] as unknown as TemplateStringsArray,
            { defaultValue: String(role) }
          )
        )
        .join(', ');
    }
    return displayValue;
  };
}
