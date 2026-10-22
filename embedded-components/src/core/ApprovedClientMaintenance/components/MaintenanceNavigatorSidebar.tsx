import type { ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

import { useMaintenancePartyCaption } from '../hooks/useMaintenancePartyCaption';
import {
  useMaintenanceRequestSummary,
  type MaintenanceUpdateScope,
} from '../hooks/useMaintenanceRequestSummary';
import type { MaintenanceEntityTasks } from '../utils/buildMaintenanceEntityTasks';
import {
  getMaintenanceMedallionTone,
  getMaintenancePartyStatus,
  type MaintenancePartyStatus,
} from '../utils/getMaintenancePartyStatus';
import type { MaintenanceRequestSummaryState } from '../utils/getMaintenanceRequestSummaryState';
import { getMaintenancePartyIdentity } from '../utils/maintenanceDisplay';
import { MaintenanceEntityMedallion } from './MaintenanceEntityMedallion';
import { MaintenancePartyStatusPill } from './MaintenancePartyStatusLabel';

export type MaintenanceNavigatorTarget =
  | { kind: 'overview' }
  | { kind: 'organization' }
  | { kind: 'ownership' }
  | { kind: 'request' }
  | { kind: 'party'; partyId: string };

function NavItem({
  entityKind,
  label,
  caption,
  status,
  isActive,
  onClick,
}: {
  entityKind: 'person' | 'business' | 'structure';
  label: string;
  caption?: ReactNode;
  status?: MaintenancePartyStatus;
  isActive: boolean;
  onClick: () => void;
}) {
  const tone = getMaintenanceMedallionTone(status);

  return (
    <li>
      <button
        type="button"
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'eb-group eb-relative eb-flex eb-w-full eb-items-start eb-gap-2.5 eb-px-4 eb-py-2 eb-text-left eb-transition-colors hover:eb-bg-muted focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring',
          !caption && 'eb-items-center',
          isActive && 'eb-bg-accent hover:eb-bg-accent'
        )}
        onClick={onClick}
      >
        {isActive ? (
          <span
            aria-hidden="true"
            className="eb-absolute eb-inset-y-2 eb-left-0 eb-w-0.5 eb-rounded-full eb-bg-primary"
          />
        ) : null}
        <MaintenanceEntityMedallion
          kind={entityKind}
          tone={tone}
          size="sm"
          className={cn(
            caption && 'eb-mt-0.5',
            isActive &&
              tone === 'neutral' &&
              'eb-bg-background eb-text-foreground'
          )}
        />
        <span className="eb-min-w-0 eb-flex-1">
          <span
            title={label}
            className={cn(
              'eb-block eb-truncate eb-text-sm eb-leading-5',
              isActive && 'eb-font-medium'
            )}
          >
            {label}
          </span>
          {caption ? (
            <span className="eb-block eb-text-xs eb-leading-4 eb-text-muted-foreground">
              {caption}
            </span>
          ) : null}
          {status ? (
            <MaintenancePartyStatusPill status={status} className="eb-mt-1.5" />
          ) : null}
        </span>
      </button>
    </li>
  );
}

export function MaintenanceNavigatorSidebar({
  clientName,
  clientPartyId,
  entityTasks,
  showsOwnershipStructure,
  activeTarget,
  hasActiveUpdate,
  summaryState,
  updateScope,
  changeCount,
  isDocumentDiscoveryPending,
  onNavigate,
  onReviewAndSubmit,
  onViewRequestDetails,
}: {
  clientName: string;
  clientPartyId?: string;
  entityTasks: MaintenanceEntityTasks;
  showsOwnershipStructure: boolean;
  activeTarget?: MaintenanceNavigatorTarget;
  hasActiveUpdate: boolean;
  summaryState: MaintenanceRequestSummaryState;
  updateScope: MaintenanceUpdateScope;
  /** Parties and products changed in the request. */
  changeCount: number;
  isDocumentDiscoveryPending: boolean;
  onNavigate: (target: MaintenanceNavigatorTarget) => void;
  onReviewAndSubmit: () => void;
  onViewRequestDetails: () => void;
}) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const requestSummary = useMaintenanceRequestSummary(
    summaryState,
    updateScope
  );
  const isDraftRequest =
    summaryState === 'draft' || summaryState === 'draftRequirements';
  const isActive = (target: MaintenanceNavigatorTarget) =>
    activeTarget?.kind === target.kind &&
    (target.kind !== 'party' ||
      (activeTarget.kind === 'party' &&
        activeTarget.partyId === target.partyId));
  const isRequestActive = isActive({ kind: 'request' });
  // Only a submitted request is waiting on the reviewer rather than the user.
  const awaitsUser = summaryState !== 'submitted';
  const toneDotClass = requestSummary.needsAttention
    ? 'eb-bg-warning'
    : 'eb-bg-informative';

  const describeParty = useMaintenancePartyCaption(clientPartyId);
  const relatedPartyTasks = [
    ...entityTasks.parties,
    ...entityTasks.intermediaryOrganizations,
  ];

  return (
    <nav
      data-maintenance-navigator=""
      aria-label={tString('navigator.label')}
      className="eb-overflow-hidden eb-rounded eb-border eb-bg-background"
    >
      {/* Leaves the drilldown for the overview, which has no sidebar, so it reads as a way back. */}
      <div className="eb-border-b eb-border-border eb-bg-muted/20 eb-px-1.5 eb-py-1.5">
        <button
          type="button"
          data-navigator-exit=""
          className="eb-group eb-flex eb-w-full eb-items-center eb-gap-2 eb-rounded-md eb-px-2.5 eb-py-1.5 eb-text-left eb-text-sm eb-font-medium eb-text-muted-foreground eb-transition-colors hover:eb-bg-muted hover:eb-text-foreground focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
          onClick={() => onNavigate({ kind: 'overview' })}
        >
          <ArrowLeftIcon
            aria-hidden="true"
            className="group-hover:eb--translate-x-0.5 eb-size-4 eb-shrink-0 eb-transition-transform motion-reduce:eb-transition-none"
          />
          {tString('flow.title')}
        </button>
      </div>
      <ul className="eb-py-2">
        <NavItem
          entityKind="business"
          label={clientName}
          caption={tString('organization')}
          status={getMaintenancePartyStatus(
            entityTasks.organization,
            isDocumentDiscoveryPending
          )}
          isActive={isActive({ kind: 'organization' })}
          onClick={() => onNavigate({ kind: 'organization' })}
        />
        {showsOwnershipStructure ? (
          <NavItem
            entityKind="structure"
            label={tString('ownership.title')}
            isActive={isActive({ kind: 'ownership' })}
            onClick={() => onNavigate({ kind: 'ownership' })}
          />
        ) : null}
      </ul>

      {relatedPartyTasks.length > 0 ? (
        <div className="eb-border-t eb-border-border eb-py-2">
          <p className="eb-flex eb-items-center eb-justify-between eb-px-4 eb-pb-1 eb-pt-1 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
            {t('people')}
            <span className="eb-rounded-full eb-bg-muted eb-px-1.5 eb-text-[0.6875rem] eb-font-medium eb-tabular-nums eb-tracking-normal">
              {relatedPartyTasks.length}
            </span>
          </p>
          <ul>
            {relatedPartyTasks.map((task) => (
              <NavItem
                key={task.partyId}
                entityKind={
                  task.proposedParty.roles?.includes('INTERMEDIARY_OWNER')
                    ? 'business'
                    : 'person'
                }
                label={
                  getMaintenancePartyIdentity(
                    task.proposedParty,
                    task.change,
                    tString('notProvided')
                  ).displayName
                }
                caption={describeParty(task.proposedParty)}
                status={getMaintenancePartyStatus(
                  task,
                  isDocumentDiscoveryPending
                )}
                isActive={isActive({ kind: 'party', partyId: task.partyId })}
                onClick={() =>
                  onNavigate({ kind: 'party', partyId: task.partyId })
                }
              />
            ))}
          </ul>
        </div>
      ) : null}

      {hasActiveUpdate ? (
        <div
          data-navigator-request-state={summaryState}
          className={cn(
            'eb-border-t',
            isRequestActive
              ? 'eb-border-border'
              : requestSummary.needsAttention
                ? 'eb-border-warning/50'
                : 'eb-border-informative/50'
          )}
        >
          {/* The open request page carries the status banner, so the card steps back to the nav's active style. */}
          <section
            aria-labelledby="navigator-request-heading"
            data-navigator-request-cta=""
            className={cn(
              'eb-relative eb-px-4 eb-pb-4 eb-pt-3',
              isRequestActive
                ? 'eb-bg-accent'
                : requestSummary.needsAttention
                  ? 'eb-bg-warning-accent'
                  : 'eb-bg-informative-accent'
            )}
          >
            {isRequestActive ? (
              <span
                aria-hidden="true"
                data-navigator-active-marker=""
                className="eb-absolute eb-inset-y-3 eb-left-0 eb-w-0.5 eb-rounded-full eb-bg-primary"
              />
            ) : null}
            <p className="eb-flex eb-items-center eb-gap-2 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
              {awaitsUser ? (
                <span
                  aria-hidden="true"
                  className="eb-relative eb-flex eb-size-2"
                >
                  {isRequestActive ? null : (
                    <span
                      className={cn(
                        'eb-absolute eb-inline-flex eb-size-full eb-animate-ping eb-rounded-full eb-opacity-60 motion-reduce:eb-animate-none',
                        toneDotClass
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      'eb-relative eb-inline-flex eb-size-2 eb-rounded-full',
                      toneDotClass
                    )}
                  />
                </span>
              ) : (
                <requestSummary.Icon
                  aria-hidden="true"
                  className="eb-size-3.5 eb-shrink-0 eb-text-informative"
                />
              )}
              {t([
                `navigator.requestHeading.${updateScope}`,
              ] as unknown as TemplateStringsArray)}
            </p>
            <h3
              id="navigator-request-heading"
              className="eb-mt-2 eb-text-sm eb-font-semibold eb-leading-5"
            >
              {isDraftRequest && changeCount > 0
                ? t(
                    requestSummary.needsAttention
                      ? 'navigator.changesSaved'
                      : 'navigator.changesReady',
                    { count: changeCount }
                  )
                : requestSummary.title}
            </h3>
            {summaryState === 'draft' ? null : (
              <p className="eb-mt-0.5 eb-text-xs eb-leading-4 eb-text-muted-foreground">
                {summaryState === 'draftRequirements'
                  ? t('navigator.requirementsHint')
                  : requestSummary.description}
              </p>
            )}
            <Button
              size="sm"
              variant={isRequestActive || !awaitsUser ? 'outline' : 'default'}
              aria-current={isRequestActive ? 'page' : undefined}
              className="eb-group eb-mt-3 eb-w-full eb-shadow-sm"
              onClick={
                isDraftRequest ? onReviewAndSubmit : onViewRequestDetails
              }
            >
              {isDraftRequest
                ? t('submission.reviewAndSubmit')
                : requestSummary.actionLabel}
              <ArrowRightIcon
                aria-hidden="true"
                className="group-hover:eb-translate-x-0.5 eb-transition-transform"
              />
            </Button>
          </section>
        </div>
      ) : null}
    </nav>
  );
}
