/**
 * PartiesSection – C2 client-facing party data grouped by business role.
 * Renders Organization, Controller, and Beneficial owners with business labels only (no internal IDs).
 */

import type { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';

import {
  getBeneficialOwnerParties,
  getControllerParty,
  getOrganizationParty,
} from '../../utils/partyGrouping';
import { formatRoleLabels } from '../../utils/formatClientFacing';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface PartiesSectionProps {
  client: ClientResponse;
  title?: string;
}

const SECTION_TITLES = {
  organization: 'Organization',
  controller: 'Controller',
  beneficialOwners: 'Beneficial owners',
} as const;

function PartyBlockWithRole({
  party,
  roleLabel,
  compact,
  itemKey,
}: {
  party: PartyResponse;
  roleLabel: string;
  compact?: boolean;
  itemKey: string;
}) {
  const subheading = formatRoleLabels(party.roles ?? undefined);
  return (
    <PartyDetailsBlock
      key={itemKey}
      party={party}
      subheading={roleLabel || subheading}
      compact={compact}
    />
  );
}

export function PartiesSection({
  client,
  title = 'Parties',
}: PartiesSectionProps) {
  const organization = getOrganizationParty(client);
  const controller = getControllerParty(client);
  const beneficialOwners = getBeneficialOwnerParties(client);

  const hasAny =
    !!organization || !!controller || (beneficialOwners?.length ?? 0) > 0;
  if (!hasAny) return null;

  return (
    <section
      className="eb-w-full"
      aria-labelledby={title ? 'client-details-parties' : undefined}
    >
      {title ? (
        <h2
          id="client-details-parties"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {title}
        </h2>
      ) : null}
      <div className="eb-flex eb-flex-col eb-gap-6 @md:eb-gap-8">
        {organization ? (
          <div className="eb-flex eb-flex-col eb-gap-3">
            <h3 className="eb-text-xs eb-font-medium eb-tracking-tight eb-text-muted-foreground @md:eb-text-sm">
              {SECTION_TITLES.organization}
            </h3>
            <PartyDetailsBlock party={organization} />
          </div>
        ) : null}
        {controller ? (
          <div className="eb-flex eb-flex-col eb-gap-3">
            <h3 className="eb-text-xs eb-font-medium eb-tracking-tight eb-text-muted-foreground @md:eb-text-sm">
              {SECTION_TITLES.controller}
            </h3>
            <PartyBlockWithRole
              itemKey="controller"
              party={controller}
              roleLabel={SECTION_TITLES.controller}
            />
          </div>
        ) : null}
        {(beneficialOwners?.length ?? 0) > 0 ? (
          <div className="eb-flex eb-flex-col eb-gap-3">
            <h3 className="eb-text-xs eb-font-medium eb-tracking-tight eb-text-muted-foreground @md:eb-text-sm">
              {SECTION_TITLES.beneficialOwners}
            </h3>
            <div className="eb-flex eb-flex-col eb-gap-4 @md:eb-gap-5">
              {beneficialOwners.map((party, index) => (
                <PartyBlockWithRole
                  key={`beneficial-owner-${index}`}
                  itemKey={`beneficial-owner-${index}`}
                  party={party}
                  roleLabel="Beneficial owner"
                  compact
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
