import { useTranslationWithTokens } from '@/i18n';
import {
  ChevronRightIcon,
  NetworkIcon,
  PlusIcon,
  UserRoundPlusIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

import type { MaintenanceParty } from '../models/maintenanceApi.types';

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

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^./, (character) => character.toUpperCase());

export function MaintenanceOwnershipTree({
  clientPartyId,
  clientName,
  parties,
  compact = false,
  canManage = false,
  canAddBeneficialOwner = true,
  canAddIntermediary = true,
  ownerLimitReached = false,
  onSelectOwner,
  onSelectBusiness,
  onAddBeneficialOwner,
  onAddIntermediary,
  onInsertIntermediary,
}: {
  clientPartyId: string;
  clientName: string;
  parties: MaintenanceParty[];
  compact?: boolean;
  canManage?: boolean;
  canAddBeneficialOwner?: boolean;
  canAddIntermediary?: boolean;
  ownerLimitReached?: boolean;
  onSelectOwner?: (partyId: string) => void;
  onSelectBusiness?: (partyId: string) => void;
  onAddBeneficialOwner?: (parentPartyId: string) => void;
  onAddIntermediary?: (parentPartyId: string) => void;
  onInsertIntermediary?: (ownerId: string) => void;
}) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
    'common',
  ]);
  const getBusinessMeta = (party?: MaintenanceParty) => {
    const details = party?.organizationDetails;
    return [
      details?.organizationType
        ? tString(
            [
              `onboarding-overview:organizationTypes.${details.organizationType}`,
            ] as unknown as TemplateStringsArray,
            { defaultValue: formatEnumLabel(details.organizationType) }
          )
        : undefined,
      details?.countryOfFormation
        ? tString(
            [
              `common:countries.${details.countryOfFormation}`,
            ] as unknown as TemplateStringsArray,
            { defaultValue: details.countryOfFormation }
          )
        : undefined,
    ]
      .filter(Boolean)
      .join(' · ');
  };
  const clientParty = parties.find((party) => party.id === clientPartyId);
  const ownershipParties = parties.filter(
    (party) =>
      party.active !== false &&
      (party.roles?.includes('INTERMEDIARY_OWNER') ||
        party.roles?.includes('BENEFICIAL_OWNER'))
  );

  const renderChildren = (
    parentPartyId: string,
    visitedPartyIds: Set<string>,
    depth: number
  ): React.ReactNode => {
    const children = ownershipParties.filter(
      (party) =>
        party.id &&
        (party.parentPartyId === parentPartyId ||
          (parentPartyId === clientPartyId && !party.parentPartyId))
    );
    if (children.length === 0) return null;

    return (
      <ul className={cn('eb-space-y-2', depth > 0 && 'eb-ml-4')}>
        {children.map((party, index) => {
          const partyId = party.id!;
          if (visitedPartyIds.has(partyId)) return null;
          const nextVisited = new Set(visitedPartyIds).add(partyId);
          const isIntermediary = party.roles?.includes('INTERMEDIARY_OWNER');
          const isPendingAddition =
            party.updateRequest?.action === 'ADD' &&
            ['NEW', 'REVIEW_IN_PROGRESS', 'INFORMATION_REQUESTED'].includes(
              party.updateRequest.status ?? ''
            );
          const isDirectOwner = parentPartyId === clientPartyId;
          const isFirst = index === 0;
          const isLast = index === children.length - 1;

          return (
            <li
              key={partyId}
              data-ownership-node={partyId}
              data-last-ownership-node={isLast ? 'true' : 'false'}
              className={cn('eb-relative', depth > 0 && 'eb-pl-4')}
            >
              {depth > 0 ? (
                <>
                  <span
                    aria-hidden="true"
                    data-ownership-tree-spine=""
                    className={cn(
                      'eb-absolute eb-left-0 eb-border-l eb-border-border',
                      isFirst
                        ? depth === 1
                          ? 'eb--top-3'
                          : 'eb--top-2'
                        : 'eb--top-2',
                      isLast ? 'eb-bottom-1/2' : 'eb-bottom-0'
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className="eb-absolute eb-left-0 eb-top-1/2 eb-w-4 eb-border-t eb-border-border"
                  />
                </>
              ) : null}
              <article
                className={cn(
                  'eb-overflow-hidden eb-rounded-md eb-border eb-bg-background',
                  compact ? 'eb-p-2.5' : 'eb-p-3',
                  isPendingAddition &&
                    'eb-border-informative/60 eb-bg-informative-accent/20'
                )}
              >
                <div className="eb-flex eb-items-start eb-gap-3">
                  <div className="eb-min-w-0 eb-flex-1">
                    <p className="eb-truncate eb-text-sm eb-font-medium">
                      {getPartyName(party, tString('notProvided'))}
                    </p>
                    {isIntermediary && getBusinessMeta(party) ? (
                      <p className="eb-mt-0.5 eb-truncate eb-text-xs eb-text-muted-foreground">
                        {getBusinessMeta(party)}
                      </p>
                    ) : null}
                    <div className="eb-mt-1 eb-flex eb-flex-wrap eb-items-center eb-gap-x-2 eb-gap-y-1 eb-text-xs eb-text-muted-foreground">
                      <span>
                        {isIntermediary
                          ? t('ownership.intermediaryOwner')
                          : t('addParty.roles.BENEFICIAL_OWNER')}
                      </span>
                      {isPendingAddition ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="eb-font-medium eb-text-informative">
                            {t('status.PENDING_ADDITION')}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {(isIntermediary ? onSelectBusiness : onSelectOwner) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="eb-h-8 eb-shrink-0 eb-px-2"
                      aria-label={tString(
                        isIntermediary
                          ? 'ownership.viewBusiness'
                          : 'ownership.viewOwner'
                      )}
                      title={tString(
                        isIntermediary
                          ? 'ownership.viewBusiness'
                          : 'ownership.viewOwner'
                      )}
                      onClick={() =>
                        isIntermediary
                          ? onSelectBusiness?.(partyId)
                          : onSelectOwner?.(partyId)
                      }
                    >
                      <span className="eb-text-xs">
                        {t('ownership.viewDetails')}
                      </span>
                      <ChevronRightIcon />
                    </Button>
                  ) : null}
                </div>
                {!compact && canManage ? (
                  <div className="eb-mt-3 eb-flex eb-flex-wrap eb-gap-2 eb-border-t eb-pt-3">
                    {isIntermediary && onAddBeneficialOwner ? (
                      <Button
                        size="sm"
                        onClick={() => onAddBeneficialOwner(partyId)}
                        disabled={!canAddBeneficialOwner || ownerLimitReached}
                      >
                        <UserRoundPlusIcon />
                        {t('ownership.addOwnerThroughBusiness')}
                      </Button>
                    ) : null}
                    {isIntermediary &&
                    canAddIntermediary &&
                    onAddIntermediary ? (
                      <Button
                        variant="outlineSurface"
                        size="sm"
                        onClick={() => onAddIntermediary(partyId)}
                      >
                        <PlusIcon />
                        {t('ownership.addLayer')}
                      </Button>
                    ) : null}
                    {!isIntermediary &&
                    isDirectOwner &&
                    onInsertIntermediary ? (
                      <Button
                        variant="outlineSurface"
                        size="sm"
                        onClick={() => onInsertIntermediary(partyId)}
                      >
                        <NetworkIcon />
                        {t('ownership.insertBusinessForOwner')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </article>
              <div className="eb-mt-2">
                {renderChildren(partyId, nextVisited, depth + 1)}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="eb-space-y-3">
      <article className="eb-overflow-hidden eb-rounded-md eb-border eb-bg-background">
        <div
          className={cn(
            'eb-flex eb-items-start eb-gap-3',
            compact ? 'eb-p-2.5' : 'eb-p-4'
          )}
        >
          <div className="eb-min-w-0 eb-flex-1">
            <p className="eb-truncate eb-text-sm eb-font-semibold">
              {clientName}
            </p>
            {getBusinessMeta(clientParty) ? (
              <p className="eb-mt-0.5 eb-truncate eb-text-xs eb-text-muted-foreground">
                {getBusinessMeta(clientParty)}
              </p>
            ) : null}
            <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
              {t('ownership.clientRoot')}
            </p>
          </div>
        </div>
        {!compact && canManage ? (
          <div className="eb-flex eb-flex-wrap eb-gap-2 eb-border-t eb-bg-muted/15 eb-px-4 eb-py-3">
            {onAddBeneficialOwner ? (
              <Button
                size="sm"
                onClick={() => onAddBeneficialOwner(clientPartyId)}
                disabled={!canAddBeneficialOwner || ownerLimitReached}
              >
                <UserRoundPlusIcon />
                {t('ownership.addBeneficialOwner')}
              </Button>
            ) : null}
            {canAddIntermediary && onAddIntermediary ? (
              <Button
                variant="outlineSurface"
                size="sm"
                onClick={() => onAddIntermediary(clientPartyId)}
              >
                <PlusIcon />
                {t('ownership.addIntermediary')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </article>
      <div>{renderChildren(clientPartyId, new Set([clientPartyId]), 1)}</div>
    </div>
  );
}
