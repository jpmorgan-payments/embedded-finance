/**
 * PartiesSection – C2 client-facing party data grouped by business role.
 * Renders Organization, Controller, and Beneficial owners with business labels only (no internal IDs).
 */

import { useTranslation } from 'react-i18next';

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import {
  getBeneficialOwnerParties,
  getControllerParty,
  getOrganizationParty,
} from '../../utils/partyGrouping';
import { PartyDetailsBlock } from '../PartyDetailsBlock/PartyDetailsBlock';

interface PartiesSectionProps {
  client: ClientResponse;
  title?: string;
}

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
  return (
    <PartyDetailsBlock
      key={itemKey}
      party={party}
      subheading={roleLabel}
      compact={compact}
    />
  );
}

export function PartiesSection({ client, title }: PartiesSectionProps) {
  const { t } = useTranslation('client-details');

  const sectionTitle = title ?? t('sections.people');
  const organizationLabel = t('sections.organization');
  const controllerLabel = t('sections.controller');
  const beneficialOwnersLabel = t('sections.beneficialOwners');
  const beneficialOwnerRole = t('roles.BENEFICIAL_OWNER');

  const organization = getOrganizationParty(client);
  const controller = getControllerParty(client);
  const beneficialOwners = getBeneficialOwnerParties(client);

  const hasAny =
    !!organization || !!controller || (beneficialOwners?.length ?? 0) > 0;
  if (!hasAny) return null;

  return (
    <section
      className="eb-w-full"
      aria-labelledby={sectionTitle ? 'client-details-parties' : undefined}
    >
      {sectionTitle ? (
        <h2
          id="client-details-parties"
          className="eb-mb-3 eb-text-sm eb-font-semibold eb-tracking-tight eb-text-foreground @md:eb-text-base"
        >
          {sectionTitle}
        </h2>
      ) : null}
      <div className="eb-flex eb-flex-col eb-gap-6 @md:eb-gap-8">
        {organization ? (
          <div className="eb-flex eb-flex-col eb-gap-3">
            <h3 className="eb-text-xs eb-font-medium eb-tracking-tight eb-text-muted-foreground @md:eb-text-sm">
              {organizationLabel}
            </h3>
            <PartyDetailsBlock party={organization} />
          </div>
        ) : null}
        {controller ? (
          <div className="eb-flex eb-flex-col eb-gap-3">
            <h3 className="eb-text-xs eb-font-medium eb-tracking-tight eb-text-muted-foreground @md:eb-text-sm">
              {controllerLabel}
            </h3>
            <PartyBlockWithRole
              itemKey="controller"
              party={controller}
              roleLabel={controllerLabel}
            />
          </div>
        ) : null}
        {(beneficialOwners?.length ?? 0) > 0 ? (
          <div className="eb-flex eb-flex-col eb-gap-3">
            <h3 className="eb-text-xs eb-font-medium eb-tracking-tight eb-text-muted-foreground @md:eb-text-sm">
              {beneficialOwnersLabel}
            </h3>
            <div className="eb-flex eb-flex-col eb-gap-4 @md:eb-gap-5">
              {beneficialOwners.map((party, index) => (
                <PartyBlockWithRole
                  key={`beneficial-owner-${index}`}
                  itemKey={`beneficial-owner-${index}`}
                  party={party}
                  roleLabel={beneficialOwnerRole}
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
