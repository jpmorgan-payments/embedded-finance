/**
 * PartyDetailsBlock - Renders party fields in a clean block (card-style).
 */

import { _get, cn, isValueEmpty } from '@/lib/utils';
import type { PartyResponse } from '@/api/generated/smbdo.schemas';

import { formatRoleLabels } from '../../utils/formatClientFacing';
import { getPartyDisplayName } from '../../utils/getPartyDisplayName';
import {
  individualFieldDefinitions,
  organizationFieldDefinitions,
} from '../../utils/partyFieldDefinitions';
import type { PartyFieldConfig } from '../../utils/partyFieldDefinitions';
import { DetailRow } from '../DetailRow/DetailRow';

interface PartyDetailsBlockProps {
  party: PartyResponse;
  /** Optional heading (e.g. party name). If not provided, display name is used. */
  heading?: string;
  /** Optional subheading (e.g. roles) */
  subheading?: string;
  /** Compact layout (e.g. inside accordion) */
  compact?: boolean;
}

function renderFields(party: PartyResponse, fields: PartyFieldConfig[]) {
  return fields.map(({ label, path, transform }) => {
    const raw = _get(party, path);
    if (isValueEmpty(raw)) return null;
    const value = transform ? transform(raw) : raw;
    if (
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    )
      return null;
    return <DetailRow key={path} label={label} value={value} />;
  });
}

export function PartyDetailsBlock({
  party,
  heading,
  subheading,
  compact = false,
}: PartyDetailsBlockProps) {
  const isOrg = party.partyType === 'ORGANIZATION';
  const fields = isOrg
    ? organizationFieldDefinitions
    : individualFieldDefinitions;
  const name = heading ?? getPartyDisplayName(party);
  const roleLabel = formatRoleLabels(party.roles ?? undefined);

  return (
    <div
      className={cn(
        'eb-w-full eb-rounded-lg eb-border eb-border-border eb-bg-muted/20 eb-p-4 eb-transition-colors',
        compact && 'eb-p-3'
      )}
    >
      <div
        className={cn(
          'eb-mb-3 eb-flex eb-flex-col eb-gap-0.5',
          compact && 'eb-mb-2'
        )}
      >
        <h3 className="eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base">
          {name}
        </h3>
        {(subheading ?? roleLabel) && (
          <p className="eb-text-xs eb-text-muted-foreground @md:eb-text-sm">
            {subheading ?? roleLabel}
          </p>
        )}
      </div>
      <dl className="eb-divide-y eb-divide-border/60">
        {renderFields(party, fields)}
      </dl>
    </div>
  );
}
