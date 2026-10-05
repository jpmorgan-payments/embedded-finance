import { useTranslationWithTokens } from '@/i18n';
import {
  ArrowRightIcon,
  ArrowRightLeftIcon,
  Building2Icon,
  UserRoundPlusIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

import {
  isActiveMaintenanceStatus,
  type MaintenanceParty,
} from '../models/maintenanceApi.types';
import type { MaintenancePartyStatus } from '../utils/getMaintenancePartyStatus';
import type { OwnershipNodeChange } from '../utils/getOwnershipChanges';
import {
  MaintenanceActionMenu,
  type MaintenanceAction,
} from './MaintenanceActionMenu';
import { MaintenanceEntityMedallion } from './MaintenanceEntityMedallion';
import { MaintenancePartyStatusLabel } from './MaintenancePartyStatusLabel';

export type OwnershipNodeAction = MaintenanceAction;

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
  focusedPartyId,
  compact = false,
  canAddBeneficialOwner = false,
  canAddIntermediary = false,
  ownerLimitReached = false,
  nodeChanges,
  previousParentIds,
  getPartyStatus,
  getPartyActions,
  onSelectOwner,
  onSelectBusiness,
  onAddBeneficialOwner,
  onAddIntermediary,
}: {
  clientPartyId: string;
  clientName: string;
  parties: MaintenanceParty[];
  focusedPartyId?: string;
  compact?: boolean;
  canAddBeneficialOwner?: boolean;
  canAddIntermediary?: boolean;
  ownerLimitReached?: boolean;
  nodeChanges?: ReadonlyMap<string, OwnershipNodeChange>;
  previousParentIds?: ReadonlyMap<string, string>;
  getPartyStatus?: (partyId: string) => MaintenancePartyStatus | undefined;
  getPartyActions?: (partyId: string) => OwnershipNodeAction[];
  onSelectOwner?: (partyId: string) => void;
  onSelectBusiness?: (partyId: string) => void;
  onAddBeneficialOwner?: (parentPartyId: string) => void;
  onAddIntermediary?: (parentPartyId: string) => void;
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
  const focusedParty = focusedPartyId
    ? ownershipParties.find((party) => party.id === focusedPartyId)
    : undefined;
  const rootPartyId = focusedParty?.id ?? clientPartyId;
  const rootParty = focusedParty ?? clientParty;
  const rootName = focusedParty
    ? getPartyName(focusedParty, tString('notProvided'))
    : clientName;

  const showAddIntermediaryButton =
    Boolean(onAddIntermediary) && canAddIntermediary;
  // Owners of the business follow the root rule; owners through an intermediary are indirect.
  const canAddOwnerUnder = (parentPartyId: string) =>
    Boolean(onAddBeneficialOwner) &&
    (parentPartyId === clientPartyId
      ? canAddBeneficialOwner
      : canAddIntermediary);

  const renderAddRow = (parentPartyId: string, depth: number) => (
    <li
      data-ownership-placeholder={parentPartyId}
      className={cn('eb-relative', depth > 0 && 'eb-pl-4')}
    >
      {depth > 0 ? (
        <>
          <span
            aria-hidden="true"
            className="eb-absolute eb--top-2 eb-bottom-[calc(100%-1.25rem)] eb-left-0 eb-border-l-2 eb-border-dashed eb-border-border"
          />
          <span
            aria-hidden="true"
            className="eb-absolute eb-left-0 eb-top-5 eb-w-4 eb-border-t-2 eb-border-dashed eb-border-border"
          />
        </>
      ) : null}
      <div className="eb-flex eb-flex-wrap eb-gap-2 eb-rounded-md eb-border eb-border-dashed eb-border-border eb-p-1.5">
        {canAddOwnerUnder(parentPartyId) ? (
          <Button
            variant="ghost"
            size="sm"
            className="eb-h-8 eb-text-muted-foreground hover:eb-text-foreground"
            disabled={ownerLimitReached}
            title={
              ownerLimitReached
                ? tString('ownership.ownerLimitReached')
                : undefined
            }
            onClick={() => onAddBeneficialOwner?.(parentPartyId)}
          >
            <UserRoundPlusIcon />
            {t('ownership.addBeneficialOwner')}
          </Button>
        ) : null}
        {showAddIntermediaryButton ? (
          <Button
            variant="ghost"
            size="sm"
            className="eb-h-8 eb-text-muted-foreground hover:eb-text-foreground"
            onClick={() => onAddIntermediary?.(parentPartyId)}
          >
            <Building2Icon />
            {t('ownership.addIntermediary')}
          </Button>
        ) : null}
      </div>
    </li>
  );

  const renderChildren = (
    parentPartyId: string,
    visitedPartyIds: Set<string>,
    depth: number,
    parentCanOwnChildren: boolean
  ): React.ReactNode => {
    const children = ownershipParties.filter(
      (party) =>
        party.id &&
        (party.parentPartyId === parentPartyId ||
          (parentPartyId === clientPartyId && !party.parentPartyId))
    );
    const showAddRow =
      parentCanOwnChildren &&
      (canAddOwnerUnder(parentPartyId) || showAddIntermediaryButton);
    if (children.length === 0 && !showAddRow) return null;

    return (
      <ul className={cn('eb-space-y-2', depth > 0 && 'eb-ml-4')}>
        {children.map((party, index) => {
          const partyId = party.id!;
          if (visitedPartyIds.has(partyId)) return null;
          const nextVisited = new Set(visitedPartyIds).add(partyId);
          const isIntermediary = party.roles?.includes('INTERMEDIARY_OWNER');
          const nodeChange = nodeChanges?.get(partyId);
          const isPendingAddition =
            nodeChange === 'added' ||
            (party.updateRequest?.action === 'ADD' &&
              isActiveMaintenanceStatus(party.updateRequest.status));
          const isPendingRemoval = nodeChange === 'removed';
          const isMoved = nodeChange === 'moved';
          const previousParentId = isMoved
            ? previousParentIds?.get(partyId)
            : undefined;
          const previousParent = previousParentId
            ? parties.find((candidate) => candidate.id === previousParentId)
            : undefined;
          const previousParentName =
            previousParentId === clientPartyId || !previousParent
              ? clientName
              : getPartyName(previousParent, tString('notProvided'));
          const partyStatus =
            isPendingAddition || isPendingRemoval
              ? undefined
              : getPartyStatus?.(partyId);
          const isFirst = index === 0;
          const isLast = index === children.length - 1 && !showAddRow;
          const nodeName = getPartyName(party, tString('notProvided'));
          const actions = getPartyActions?.(partyId) ?? [];
          const activateNode = isIntermediary
            ? onSelectBusiness
              ? () => onSelectBusiness(partyId)
              : undefined
            : onSelectOwner
              ? () => onSelectOwner(partyId)
              : undefined;
          const nodeContent = (
            <>
              <MaintenanceEntityMedallion
                kind={isIntermediary ? 'business' : 'person'}
                tone={
                  isPendingRemoval
                    ? 'destructive'
                    : isPendingAddition
                      ? 'informative'
                      : partyStatus?.kind === 'unreviewed'
                        ? 'warning'
                        : 'neutral'
                }
                size={compact ? 'sm' : 'md'}
              />
              <div className="eb-min-w-0 eb-flex-1">
                <p className="eb-truncate eb-text-sm eb-font-medium">
                  {nodeName}
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
                      : t(
                          parentPartyId === clientPartyId
                            ? 'ownership.directOwner'
                            : 'ownership.indirectOwner'
                        )}
                  </span>
                  {isPendingAddition ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="eb-font-medium eb-text-informative">
                        {t('status.PENDING_ADDITION')}
                      </span>
                    </>
                  ) : isPendingRemoval ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="eb-font-medium eb-text-destructive">
                        {t('status.PENDING_REMOVAL')}
                      </span>
                    </>
                  ) : partyStatus ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <MaintenancePartyStatusLabel status={partyStatus} />
                    </>
                  ) : null}
                </div>
                {isMoved ? (
                  <p
                    data-ownership-moved-from={previousParentId}
                    className="eb-mt-1.5 eb-inline-flex eb-max-w-full eb-items-center eb-gap-1.5 eb-rounded-full eb-bg-primary/10 eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-primary"
                  >
                    <ArrowRightLeftIcon
                      aria-hidden="true"
                      className="eb-size-3.5 eb-shrink-0"
                    />
                    <span className="eb-truncate">
                      {t('ownership.movedFrom', { name: previousParentName })}
                    </span>
                  </p>
                ) : null}
              </div>
            </>
          );

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
                      'eb-absolute eb-left-0 eb-border-l-2 eb-border-border',
                      isFirst
                        ? depth === 1
                          ? 'eb--top-3'
                          : 'eb--top-2'
                        : 'eb--top-2',
                      isLast
                        ? compact
                          ? 'eb-bottom-[calc(100%-1.25rem)]'
                          : 'eb-bottom-[calc(100%-1.5rem)]'
                        : 'eb-bottom-0'
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'eb-absolute eb-left-0 eb-w-4 eb-border-t-2',
                      isMoved
                        ? 'eb-border-dashed eb-border-primary'
                        : 'eb-border-border',
                      compact ? 'eb-top-5' : 'eb-top-6'
                    )}
                  />
                  <span
                    aria-hidden="true"
                    data-ownership-tree-junction=""
                    className={cn(
                      'eb-absolute eb-left-0 eb-size-2 eb--translate-x-1/2 eb--translate-y-1/2 eb-rounded-full eb-border-2 eb-border-background eb-bg-border',
                      compact ? 'eb-top-5' : 'eb-top-6'
                    )}
                  />
                </>
              ) : null}
              <article
                className={cn(
                  'eb-flex eb-items-stretch eb-overflow-hidden eb-rounded-md eb-border eb-border-border eb-bg-background eb-transition-colors',
                  isPendingAddition &&
                    'eb-border-informative/60 eb-bg-informative-accent/20',
                  isPendingRemoval &&
                    'eb-border-destructive/50 eb-bg-destructive-accent/20',
                  isMoved && 'eb-border-primary/50 eb-bg-primary/5',
                  partyStatus?.kind === 'unreviewed' &&
                    'eb-border-warning/60 eb-bg-warning-accent/20'
                )}
              >
                {activateNode ? (
                  <button
                    type="button"
                    className={cn(
                      'eb-flex eb-min-w-0 eb-flex-1 eb-cursor-pointer eb-items-start eb-gap-3 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring',
                      compact ? 'eb-p-2.5' : 'eb-p-3'
                    )}
                    aria-label={tString(
                      isIntermediary
                        ? 'ownership.viewBusiness'
                        : 'ownership.viewOwner'
                    )}
                    onClick={activateNode}
                  >
                    {nodeContent}
                    <ArrowRightIcon
                      className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <div
                    className={cn(
                      'eb-flex eb-min-w-0 eb-flex-1 eb-items-start eb-gap-3',
                      compact ? 'eb-p-2.5' : 'eb-p-3'
                    )}
                  >
                    {nodeContent}
                  </div>
                )}
                {actions.length > 0 ? (
                  <div
                    data-relationship-actions=""
                    className="eb-flex eb-shrink-0 eb-items-start eb-border-l eb-border-border eb-p-1.5"
                  >
                    <MaintenanceActionMenu
                      label={tString('ownership.nodeMenu', { name: nodeName })}
                      actions={actions}
                    />
                  </div>
                ) : null}
              </article>
              <div className="eb-mt-2">
                {renderChildren(
                  partyId,
                  nextVisited,
                  depth + 1,
                  Boolean(isIntermediary) && !isPendingRemoval
                )}
              </div>
            </li>
          );
        })}
        {showAddRow ? renderAddRow(parentPartyId, depth) : null}
      </ul>
    );
  };

  const rootContent = (
    <>
      <MaintenanceEntityMedallion
        kind="business"
        size={compact ? 'sm' : 'md'}
      />
      <div className="eb-min-w-0 eb-flex-1">
        <p className="eb-truncate eb-text-sm eb-font-semibold">{rootName}</p>
        {getBusinessMeta(rootParty) ? (
          <p className="eb-mt-0.5 eb-truncate eb-text-xs eb-text-muted-foreground">
            {getBusinessMeta(rootParty)}
          </p>
        ) : null}
        <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
          {t(
            focusedParty
              ? 'ownership.intermediaryOwner'
              : 'ownership.clientRoot'
          )}
        </p>
      </div>
    </>
  );

  return (
    <div className="eb-space-y-3">
      <article className="eb-overflow-hidden eb-rounded-md eb-border eb-border-border eb-bg-background">
        {onSelectBusiness ? (
          <button
            type="button"
            className={cn(
              'eb-flex eb-w-full eb-items-start eb-gap-3 eb-text-left hover:eb-bg-muted/30 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring',
              compact ? 'eb-p-2.5' : 'eb-p-4'
            )}
            aria-label={tString('ownership.viewBusiness')}
            onClick={() => onSelectBusiness(clientPartyId)}
          >
            {rootContent}
            <ArrowRightIcon
              className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        ) : (
          <div
            className={cn(
              'eb-flex eb-items-start eb-gap-3',
              compact ? 'eb-p-2.5' : 'eb-p-4'
            )}
          >
            {rootContent}
          </div>
        )}
      </article>
      <div>{renderChildren(rootPartyId, new Set([rootPartyId]), 1, true)}</div>
    </div>
  );
}
