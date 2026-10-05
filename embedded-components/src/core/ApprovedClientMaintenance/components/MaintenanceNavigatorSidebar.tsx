import type { ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

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
import type { MaintenanceStatusTone } from '../utils/maintenanceStatusTone';
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
  icon,
  tone: toneOverride,
  label,
  caption,
  status,
  showChevron = false,
  isActive,
  onClick,
}: {
  entityKind: 'person' | 'business' | 'structure';
  icon?: LucideIcon;
  tone?: MaintenanceStatusTone;
  label: string;
  caption?: ReactNode;
  status?: MaintenancePartyStatus;
  /** Signals a destination that is not self-evidently a link, such as the request row. */
  showChevron?: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const tone = toneOverride ?? getMaintenanceMedallionTone(status);

  return (
    <li>
      <button
        type="button"
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'eb-group eb-relative eb-flex eb-w-full eb-items-start eb-gap-2.5 eb-rounded-md eb-py-1.5 eb-pl-2.5 eb-pr-2 eb-text-left eb-transition-colors hover:eb-bg-muted focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring',
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
          icon={icon}
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
        {showChevron ? (
          <ChevronRightIcon
            aria-hidden="true"
            className="group-hover:eb-translate-x-0.5 eb-size-4 eb-shrink-0 eb-self-center eb-text-muted-foreground eb-transition-transform"
          />
        ) : null}
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
      <div className="eb-px-2 eb-py-2">
        <button
          type="button"
          className="eb-flex eb-w-full eb-items-center eb-gap-2 eb-rounded-md eb-px-3 eb-py-1.5 eb-text-left eb-text-sm eb-text-muted-foreground hover:eb-bg-muted hover:eb-text-foreground focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
          onClick={() => onNavigate({ kind: 'overview' })}
        >
          <ChevronLeftIcon
            className="eb-size-4 eb-shrink-0"
            aria-hidden="true"
          />
          {t('flow.title')}
        </button>
      </div>

      <ul className="eb-space-y-0.5 eb-border-t eb-border-border eb-px-2 eb-py-2">
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
        <div className="eb-border-t eb-border-border eb-px-2 eb-py-2">
          <p className="eb-flex eb-items-center eb-justify-between eb-px-2.5 eb-pb-1 eb-pt-1 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
            {t('people')}
            <span className="eb-rounded-full eb-bg-muted eb-px-1.5 eb-text-[0.6875rem] eb-font-medium eb-tabular-nums eb-tracking-normal">
              {relatedPartyTasks.length}
            </span>
          </p>
          <ul className="eb-space-y-0.5">
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
          className="eb-border-t eb-border-border eb-px-2 eb-py-2"
        >
          <p className="eb-px-2.5 eb-pb-1 eb-pt-1 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
            {t([
              `navigator.requestHeading.${updateScope}`,
            ] as unknown as TemplateStringsArray)}
          </p>
          <ul>
            <NavItem
              entityKind="structure"
              icon={requestSummary.Icon}
              tone={requestSummary.needsAttention ? 'warning' : 'informative'}
              label={tString(
                isDraftRequest
                  ? 'submission.reviewAndSubmit'
                  : 'navigator.requestDetails'
              )}
              caption={requestSummary.title}
              showChevron
              isActive={isActive({ kind: 'request' })}
              onClick={
                isDraftRequest ? onReviewAndSubmit : onViewRequestDetails
              }
            />
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
