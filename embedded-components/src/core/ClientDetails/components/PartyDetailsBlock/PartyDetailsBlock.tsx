/**
 * PartyDetailsBlock - Compact party details display
 * Information-dense layout with minimal spacing
 */

import { useTranslationWithTokens } from '@/hooks';

import { _get, cn, isValueEmpty } from '@/lib/utils';
import type { PartyResponse } from '@/api/generated/smbdo.schemas';

import { getPartyDisplayName } from '../../utils/getPartyDisplayName';
import {
  individualFieldDefinitions,
  organizationFieldDefinitions,
} from '../../utils/partyFieldDefinitions';

interface PartyDetailsBlockProps {
  party: PartyResponse;
  heading?: string;
  /** Subheading - can be a translated ReactNode */
  subheading?: React.ReactNode;
  compact?: boolean;
}

interface FieldRowProps {
  labelId: string;
  path: string;
  party: PartyResponse;
  transform?: (value: unknown) => string | string[] | undefined;
}

/** Single field row with i18n label */
function FieldRow({ labelId, path, party, transform }: FieldRowProps) {
  const { t } = useTranslationWithTokens('client-details');
  const raw = _get(party, path);
  if (isValueEmpty(raw)) return null;

  let value = transform ? transform(raw) : raw;

  // Handle boolean values with i18n
  if (typeof value === 'boolean') {
    value = value
      ? t('booleanValues.true' as 'booleanValues.true')
      : t('booleanValues.false' as 'booleanValues.false');
  }

  if (
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
    return null;

  const display = Array.isArray(value) ? value.join(', ') : String(value);
  // Type assertion needed for dynamic keys
  const translatedLabel = t(`partyLabels.${labelId}` as 'partyLabels.email');

  return (
    <div className="eb-flex eb-justify-between eb-gap-2 eb-py-0.5 eb-text-xs">
      <span className="eb-shrink-0 eb-text-muted-foreground">
        {translatedLabel}
      </span>
      <span className="eb-truncate eb-text-right eb-text-foreground">
        {display}
      </span>
    </div>
  );
}

export function PartyDetailsBlock({
  party,
  heading,
  subheading,
  compact = false,
}: PartyDetailsBlockProps) {
  const { t } = useTranslationWithTokens('client-details');
  const isOrg = party.partyType === 'ORGANIZATION';
  const fields = isOrg
    ? organizationFieldDefinitions
    : individualFieldDefinitions;
  const name = heading ?? getPartyDisplayName(party);

  // Format role labels using i18n
  const roleLabel = party.roles?.length
    ? party.roles
        .map((r) => t(`roles.${r}` as 'roles.CONTROLLER', { defaultValue: r }))
        .join(', ')
    : undefined;

  return (
    <div
      className={cn(
        'eb-w-full eb-rounded eb-border eb-border-border eb-bg-card',
        compact ? 'eb-p-2' : 'eb-p-2.5'
      )}
    >
      <div className="eb-mb-1.5 eb-border-b eb-border-border eb-pb-1.5">
        <div className="eb-flex eb-items-baseline eb-justify-between eb-gap-2">
          <h3 className="eb-truncate eb-text-xs eb-font-semibold eb-text-foreground">
            {name}
          </h3>
          {(subheading ?? roleLabel) && (
            <span className="eb-shrink-0 eb-text-xs eb-text-muted-foreground">
              {subheading ?? roleLabel}
            </span>
          )}
        </div>
      </div>
      <div className="eb-space-y-0">
        {fields.map((field) => (
          <FieldRow
            key={field.path}
            labelId={field.labelId}
            path={field.path}
            party={party}
            transform={field.transform}
          />
        ))}
      </div>
    </div>
  );
}
