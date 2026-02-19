/**
 * PartyDetailsBlock - Compact party details display
 * Information-dense layout with minimal spacing
 */

import { useTranslation } from 'react-i18next';

import { _get, cn, isValueEmpty } from '@/lib/utils';
import type { PartyResponse } from '@/api/generated/smbdo.schemas';

import { getPartyDisplayName } from '../../utils/getPartyDisplayName';
import {
  individualFieldDefinitions,
  organizationFieldDefinitions,
} from '../../utils/partyFieldDefinitions';
import type { PartyFieldConfig } from '../../utils/partyFieldDefinitions';

interface PartyDetailsBlockProps {
  party: PartyResponse;
  heading?: string;
  subheading?: string;
  compact?: boolean;
}

function renderFields(party: PartyResponse, fields: PartyFieldConfig[]) {
  const rows: React.ReactNode[] = [];

  fields.forEach(({ label, path, transform }) => {
    const raw = _get(party, path);
    if (isValueEmpty(raw)) return;
    const value = transform ? transform(raw) : raw;
    if (
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    )
      return;

    const display = Array.isArray(value) ? value.join(', ') : String(value);

    rows.push(
      <div
        key={path}
        className="eb-flex eb-justify-between eb-gap-2 eb-py-0.5 eb-text-xs"
      >
        <span className="eb-shrink-0 eb-text-muted-foreground">{label}</span>
        <span className="eb-truncate eb-text-right eb-text-foreground">
          {display}
        </span>
      </div>
    );
  });

  return rows;
}

export function PartyDetailsBlock({
  party,
  heading,
  subheading,
  compact = false,
}: PartyDetailsBlockProps) {
  const { t } = useTranslation('client-details');
  const isOrg = party.partyType === 'ORGANIZATION';
  const fields = isOrg
    ? organizationFieldDefinitions
    : individualFieldDefinitions;
  const name = heading ?? getPartyDisplayName(party);

  // Format role labels using i18n
  const roleLabel = party.roles?.length
    ? party.roles.map((r) => t(`roles.${r}`, { defaultValue: r })).join(', ')
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
      <div className="eb-space-y-0">{renderFields(party, fields)}</div>
    </div>
  );
}
