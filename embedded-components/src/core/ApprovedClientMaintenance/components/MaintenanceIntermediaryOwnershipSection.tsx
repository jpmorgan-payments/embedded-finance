import { useTranslationWithTokens } from '@/i18n';
import {
  ArrowRightLeftIcon,
  Building2Icon,
  NetworkIcon,
  UserRoundIcon,
} from 'lucide-react';

import { Button } from '@/components/ui';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import { getOwnershipDescendants } from '../utils/getOwnershipDescendants';
import { MaintenanceOwnershipChain } from './MaintenanceOwnershipChain';
import { MaintenanceRoleCard } from './MaintenanceRoleCard';
import { MaintenanceSection } from './MaintenanceSection';

const getPartyName = (party: MaintenanceParty, fallback: string) =>
  party.partyType === 'ORGANIZATION'
    ? (party.organizationDetails?.organizationName ?? fallback)
    : [
        party.individualDetails?.firstName,
        party.individualDetails?.middleName,
        party.individualDetails?.lastName,
      ]
        .filter(Boolean)
        .join(' ') || fallback;

export function MaintenanceIntermediaryOwnershipSection({
  clientName,
  intermediaryPartyId,
  parties,
  ownershipPath,
  onViewOwnership,
  onChangeConnection,
}: {
  clientName: string;
  intermediaryPartyId: string;
  parties: MaintenanceParty[];
  ownershipPath: string[];
  onViewOwnership: (() => void) | undefined;
  onChangeConnection?: () => void;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const descendants = getOwnershipDescendants(intermediaryPartyId, [parties]);
  const partiesById = new Map(
    parties.flatMap((party) => (party.id ? [[party.id, party]] : []))
  );
  const getRelativeDepth = (party: MaintenanceParty) => {
    let depth = 0;
    let currentParentId = party.parentPartyId;
    const visited = new Set<string>();
    while (
      currentParentId &&
      currentParentId !== intermediaryPartyId &&
      !visited.has(currentParentId)
    ) {
      visited.add(currentParentId);
      depth += 1;
      currentParentId = partiesById.get(currentParentId)?.parentPartyId;
    }
    return depth;
  };
  const chain = ownershipPath.length > 0 ? ownershipPath : [clientName];

  return (
    <MaintenanceSection
      id="intermediary-role-ownership-heading"
      title={t('ownership.roleAndOwnership')}
      caption={t('ownership.intermediaryRoleDescription')}
      divided
      unframed
    >
      <MaintenanceRoleCard
        partyRole="INTERMEDIARY_OWNER"
        icon={<Building2Icon />}
        title={t('ownership.intermediaryOwner')}
        description={t('ownership.intermediaryRoleDetail')}
        detail={
          <div className="eb-space-y-4">
            <div>
              <p className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                {t('ownership.connectionChainTitle')}
              </p>
              <div className="eb-mt-2.5">
                <MaintenanceOwnershipChain
                  steps={chain}
                  finalLabel={tString('ownership.connectionChainThisBusiness')}
                />
              </div>
            </div>
            <div>
              <p className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                {t('ownership.ownersThroughTitle')}
              </p>
              {descendants.length > 0 ? (
                <ul className="eb-mt-2.5 eb-space-y-1.5">
                  {descendants.map((party) => {
                    const isIntermediary =
                      party.roles?.includes('INTERMEDIARY_OWNER');
                    return (
                      <li
                        key={party.id}
                        className="eb-flex eb-items-center eb-gap-2.5 eb-rounded-md eb-border eb-border-border eb-px-3 eb-py-2"
                        style={{
                          marginInlineStart: getRelativeDepth(party) * 12,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className="eb-shrink-0 eb-text-muted-foreground"
                        >
                          {isIntermediary ? (
                            <Building2Icon className="eb-size-4" />
                          ) : (
                            <UserRoundIcon className="eb-size-4" />
                          )}
                        </span>
                        <span className="eb-min-w-0">
                          <span className="eb-block eb-truncate eb-text-sm">
                            {getPartyName(party, tString('notProvided'))}
                          </span>
                          <span className="eb-mt-0.5 eb-block eb-text-xs eb-text-muted-foreground">
                            {isIntermediary
                              ? t('ownership.intermediaryOwner')
                              : t('ownership.indirectOwner')}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="eb-mt-2 eb-text-xs eb-text-muted-foreground">
                  {t('ownership.noBranchDescendants')}
                </p>
              )}
            </div>
          </div>
        }
        actions={
          onChangeConnection || onViewOwnership ? (
            <>
              {onChangeConnection ? (
                <Button
                  variant="outlineSurface"
                  size="sm"
                  onClick={onChangeConnection}
                >
                  <ArrowRightLeftIcon />
                  {t('ownershipEditor.moveAction')}
                </Button>
              ) : null}
              {onViewOwnership ? (
                <Button
                  variant="outlineSurface"
                  size="sm"
                  onClick={onViewOwnership}
                >
                  <NetworkIcon />
                  {t('ownership.viewStructure')}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />
    </MaintenanceSection>
  );
}
