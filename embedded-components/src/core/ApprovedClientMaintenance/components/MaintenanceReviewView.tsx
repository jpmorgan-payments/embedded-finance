import { useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  Clock3Icon,
  FileTextIcon,
  Loader2Icon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Checkbox, Label } from '@/components/ui';

import type { MaintenanceStatus } from '../models/maintenanceApi.types';
import type { MaintenanceEntityTasks } from '../utils/buildMaintenanceEntityTasks';
import type { MaintenanceProjection } from '../utils/buildMaintenanceProjection';
import {
  formatMaintenanceRoles,
  getMaintenancePartyIdentity,
} from '../utils/maintenanceDisplay';
import type { MaintenanceSubmissionBlocker } from '../utils/maintenanceReview';
import { MaintenanceSubmissionError } from '../utils/maintenanceReview';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceChangeTable } from './MaintenanceChangeTable';
import { MaintenanceDraftActions } from './MaintenanceDraftActions';
import { MaintenanceSection } from './MaintenanceSection';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';
import { UnavailableMaintenanceAction } from './UnavailableMaintenanceAction';

type MaintenanceReviewViewProps = {
  mode: 'draft' | 'submitted';
  projection: MaintenanceProjection;
  entityTasks: MaintenanceEntityTasks;
  requestStatus?: MaintenanceStatus;
  isDocumentDiscoveryPending: boolean;
  documentError?: unknown;
  blockers: MaintenanceSubmissionBlocker[];
  fingerprint: string;
  isSubmitting: boolean;
  submissionError?: unknown;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  onEditParty?: (partyId: string) => void;
  onCancelParty?: (partyId: string) => void;
  canCancelAll?: boolean;
  onCancelAll?: () => void;
  onSelectDocument: (
    partyId: string | undefined,
    documentRequestId: string
  ) => void;
  onSubmit: (fingerprint: string) => Promise<void>;
  onBack?: () => void;
};

const BLOCKER_KEYS: Record<MaintenanceSubmissionBlocker['type'], string> = {
  documents: 'submission.blockers.documents',
  questions: 'submission.blockers.questions',
  parties: 'submission.blockers.parties',
  roles: 'submission.blockers.roles',
  attestations: 'submission.blockers.attestations',
  unresolved: 'submission.blockers.unresolved',
  conflict: 'submission.blockers.conflict',
  request: 'submission.blockers.request',
};

export function MaintenanceReviewView({
  mode,
  projection,
  entityTasks,
  requestStatus,
  isDocumentDiscoveryPending,
  documentError,
  blockers,
  fingerprint,
  isSubmitting,
  submissionError,
  breadcrumbs,
  onEditParty,
  onCancelParty,
  canCancelAll,
  onCancelAll,
  onSelectDocument,
  onSubmit,
  onBack,
}: MaintenanceReviewViewProps) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const previousFingerprintRef = useRef(fingerprint);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (previousFingerprintRef.current !== fingerprint) {
      previousFingerprintRef.current = fingerprint;
      setIsConfirmed(false);
      setWasUpdated(true);
    }
  }, [fingerprint]);

  const localSubmissionError =
    submissionError instanceof MaintenanceSubmissionError
      ? submissionError.message
      : undefined;
  const organizationDocumentActions =
    entityTasks.organization.documentRequests.filter(
      (documentRequest) => documentRequest.status !== 'CLOSED'
    );
  const unresolvedDocumentCount =
    entityTasks.organization.unresolvedDocumentRequestIds.length;
  const nonDocumentBlockers = blockers.filter(
    (blocker) => blocker.type !== 'documents'
  );
  const partyWorkUnits = entityTasks.parties.filter(
    (task) =>
      task.change ||
      task.unresolvedDocumentRequestIds.length > 0 ||
      task.documentRequests.some(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      )
  );
  const hasOrganizationRequirements =
    organizationDocumentActions.length > 0 || unresolvedDocumentCount > 0;
  const hasPartyRequirements = partyWorkUnits.some(
    (task) =>
      task.unresolvedDocumentRequestIds.length > 0 ||
      task.documentRequests.some(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      )
  );
  const hasGlobalRequirements = nonDocumentBlockers.length > 0;
  const hasRequirements =
    isDocumentDiscoveryPending ||
    Boolean(documentError) ||
    hasGlobalRequirements ||
    hasOrganizationRequirements ||
    hasPartyRequirements;
  const requestActivityDates = projection.partyChanges
    .map((change) => change.proposal.updateRequest?.submittedAt)
    .filter((submittedAt): submittedAt is string => Boolean(submittedAt))
    .map((submittedAt) => new Date(submittedAt))
    .filter((submittedAt) => !Number.isNaN(submittedAt.getTime()));
  const latestRequestActivity = requestActivityDates.sort(
    (left, right) => right.getTime() - left.getTime()
  )[0];
  const locale =
    i18n.resolvedLanguage === 'esUS'
      ? 'es-US'
      : i18n.resolvedLanguage === 'frCA'
        ? 'fr-CA'
        : 'en-US';
  const requestActivityLabel = latestRequestActivity?.toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="eb-text-lg eb-font-semibold focus:eb-outline-none"
        >
          {mode === 'draft'
            ? t('submission.reviewTitle')
            : t('requestDetails.title')}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {mode === 'draft'
            ? t('submission.reviewDescription')
            : t('requestDetails.description')}
        </p>
        {projection.activeRequestId ? (
          <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-x-4 eb-gap-y-1 eb-text-xs eb-text-muted-foreground">
            <span>
              {t('flow.changeSet', { requestId: projection.activeRequestId })}
            </span>
            {requestActivityLabel ? (
              <span>
                {t(
                  mode === 'draft'
                    ? 'requestDetails.lastUpdated'
                    : 'requestDetails.submittedAt',
                  { date: requestActivityLabel }
                )}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {mode === 'submitted' ? (
        <section
          aria-labelledby="maintenance-request-status-heading"
          className={cn(
            'eb-flex eb-items-start eb-gap-3 eb-border-b eb-px-4 eb-py-3.5',
            requestStatus === 'INFORMATION_REQUESTED'
              ? 'eb-border-warning/50 eb-bg-warning-accent'
              : 'eb-border-informative/50 eb-bg-informative-accent'
          )}
        >
          {requestStatus === 'INFORMATION_REQUESTED' ? (
            <AlertCircleIcon className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-warning" />
          ) : (
            <Clock3Icon className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-informative" />
          )}
          <div className="eb-min-w-0">
            <h3
              id="maintenance-request-status-heading"
              className="eb-text-sm eb-font-semibold eb-leading-5"
            >
              {requestStatus === 'INFORMATION_REQUESTED'
                ? t('requestSummary.action.title')
                : t('requestSummary.submitted.title')}
            </h3>
            <p className="eb-mt-0.5 eb-text-sm eb-leading-5 eb-text-muted-foreground">
              {requestStatus === 'INFORMATION_REQUESTED'
                ? t('requestSummary.action.description')
                : t('requestSummary.submitted.description')}
            </p>
          </div>
        </section>
      ) : null}

      {wasUpdated ? (
        <Alert variant="informative" noTitle className="eb-m-4 eb-mb-0">
          <AlertDescription>{t('submission.reviewUpdated')}</AlertDescription>
        </Alert>
      ) : null}

      <MaintenanceSection
        id="review-updates-heading"
        title={t('submission.profileUpdates')}
        caption={t('sectionCaption.updates')}
        unframed
      >
        <ul className="eb-space-y-3">
          {hasOrganizationRequirements ? (
            <li className="eb-overflow-hidden eb-rounded-md eb-border eb-bg-background">
              <div className="eb-bg-muted/20 eb-px-4 eb-py-3">
                <p className="eb-text-sm eb-font-medium">
                  {entityTasks.organization.party?.organizationDetails
                    ?.organizationName ?? tString('notProvided')}
                </p>
              </div>
              <ul className="eb-divide-y eb-border-t eb-border-warning/50">
                {organizationDocumentActions.map((documentRequest) => (
                  <li key={documentRequest.id}>
                    <button
                      type="button"
                      className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-bg-warning-accent eb-px-4 eb-py-3 eb-text-left hover:eb-bg-warning-accent/70 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
                      onClick={() =>
                        documentRequest.id &&
                        onSelectDocument(undefined, documentRequest.id)
                      }
                    >
                      <FileTextIcon className="eb-size-5 eb-shrink-0 eb-text-warning" />
                      <span className="eb-min-w-0 eb-flex-1">
                        <span className="eb-block eb-text-sm eb-font-medium">
                          {t('entity.documentRequest')}
                        </span>
                        <span
                          className="eb-line-clamp-2 eb-text-xs eb-leading-5 eb-text-muted-foreground"
                          title={documentRequest.description}
                        >
                          {documentRequest.description ||
                            t('entity.documentsDescription')}
                        </span>
                      </span>
                      <ChevronRightIcon className="eb-size-4 eb-shrink-0 eb-text-muted-foreground" />
                    </button>
                  </li>
                ))}
                {unresolvedDocumentCount > 0 ? (
                  <li className="eb-bg-warning-accent eb-px-4 eb-py-3 eb-text-sm">
                    {t('documents.unresolved', {
                      count: unresolvedDocumentCount,
                    })}
                  </li>
                ) : null}
              </ul>
            </li>
          ) : null}
          {partyWorkUnits.map((partyTask) => {
            const change = partyTask.change;
            const identity = getMaintenancePartyIdentity(
              partyTask.party,
              undefined,
              tString('notProvided')
            );
            const roles = formatMaintenanceRoles(
              partyTask.party.roles,
              (role, fallback) =>
                tString(
                  [
                    `common:partyRoles.${role}`,
                  ] as unknown as TemplateStringsArray,
                  { defaultValue: fallback }
                ),
              tString('noRoles')
            );
            const partyDocumentActions = partyTask.documentRequests.filter(
              (documentRequest) => documentRequest.status !== 'CLOSED'
            );
            return (
              <li
                key={partyTask.partyId}
                className="eb-overflow-hidden eb-rounded-md eb-border eb-bg-background"
              >
                <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-3 eb-bg-muted/20 eb-px-4 eb-py-3">
                  <div>
                    <p className="eb-text-sm eb-font-medium">
                      {identity.displayName}
                    </p>
                    <p className="eb-text-xs eb-text-muted-foreground">
                      {roles}
                    </p>
                  </div>
                  {mode === 'draft' && change && onEditParty ? (
                    <MaintenanceDraftActions
                      editLabel={tString('changes.editDraft')}
                      removeLabel={
                        onCancelParty
                          ? tString('cancel.removePerson')
                          : undefined
                      }
                      moreLabel={tString('flow.moreActions')}
                      onEdit={() => onEditParty(partyTask.partyId)}
                      onRemove={
                        onCancelParty
                          ? () => onCancelParty(partyTask.partyId)
                          : undefined
                      }
                    />
                  ) : null}
                </div>
                {change ? (
                  <div className="eb-border-t">
                    <MaintenanceChangeTable
                      changes={change.fieldChanges}
                      mode={mode === 'draft' ? 'draft' : 'submitted'}
                    />
                  </div>
                ) : null}
                {partyDocumentActions.length > 0 ||
                (partyTask?.unresolvedDocumentRequestIds.length ?? 0) > 0 ? (
                  <ul className="eb-divide-y eb-border-t eb-border-warning/50">
                    {partyDocumentActions.map((documentRequest) => (
                      <li key={documentRequest.id}>
                        <button
                          type="button"
                          className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-bg-warning-accent eb-px-4 eb-py-3 eb-text-left hover:eb-bg-warning-accent/70 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
                          onClick={() =>
                            documentRequest.id &&
                            onSelectDocument(
                              partyTask.partyId,
                              documentRequest.id
                            )
                          }
                        >
                          <FileTextIcon className="eb-size-5 eb-shrink-0 eb-text-warning" />
                          <span className="eb-min-w-0 eb-flex-1">
                            <span className="eb-block eb-text-sm eb-font-medium">
                              {t('entity.documentRequest')}
                            </span>
                            <span
                              className="eb-line-clamp-2 eb-text-xs eb-leading-5 eb-text-muted-foreground"
                              title={documentRequest.description}
                            >
                              {documentRequest.description ||
                                t('entity.documentsDescription')}
                            </span>
                          </span>
                          <ChevronRightIcon className="eb-size-4 eb-shrink-0 eb-text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                    {(partyTask?.unresolvedDocumentRequestIds.length ?? 0) >
                    0 ? (
                      <li className="eb-bg-warning-accent eb-px-4 eb-py-3 eb-text-sm">
                        {t('documents.unresolved', {
                          count:
                            partyTask?.unresolvedDocumentRequestIds.length ?? 0,
                        })}
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </MaintenanceSection>

      {isDocumentDiscoveryPending || documentError || hasGlobalRequirements ? (
        <MaintenanceSection
          id="review-requirements-heading"
          title={
            mode === 'draft'
              ? t('submission.beforeSubmission')
              : t('requestDetails.actionRequired')
          }
          caption={t('sectionCaption.requirements')}
          tone={hasGlobalRequirements || documentError ? 'warning' : 'default'}
          divided
        >
          {documentError ? (
            <div className="eb-p-4">
              <ServerErrorAlert error={documentError as never} />
            </div>
          ) : isDocumentDiscoveryPending ? (
            <p className="eb-px-4 eb-py-3.5 eb-text-sm eb-text-muted-foreground">
              {t('flow.preparingDocuments')}
            </p>
          ) : !hasRequirements ? (
            <div className="eb-flex eb-items-center eb-gap-2 eb-px-4 eb-py-3.5 eb-text-sm eb-text-success">
              <CheckCircle2Icon className="eb-size-4" />
              {t('submission.allRequirementsComplete')}
            </div>
          ) : (
            <ul className="eb-divide-y">
              {nonDocumentBlockers.map((blocker) => {
                return (
                  <li
                    key={blocker.type}
                    className="eb-flex eb-items-center eb-gap-3 eb-px-4 eb-py-3.5"
                  >
                    <AlertCircleIcon className="eb-size-4 eb-shrink-0 eb-text-warning" />
                    <span className="eb-min-w-0 eb-flex-1 eb-text-sm">
                      {t(
                        [
                          BLOCKER_KEYS[blocker.type],
                        ] as unknown as TemplateStringsArray,
                        { count: blocker.count }
                      )}
                    </span>
                    <UnavailableMaintenanceAction>
                      {t('submission.completeRequirement')}
                    </UnavailableMaintenanceAction>
                  </li>
                );
              })}
            </ul>
          )}
        </MaintenanceSection>
      ) : null}

      {mode === 'draft' && !hasRequirements ? (
        <MaintenanceSection
          id="review-ready-heading"
          title={t('submission.readyTitle')}
          divided
          footer={
            <div className="eb-flex eb-justify-end">
              <Button
                size="sm"
                onClick={() => onSubmit(fingerprint)}
                disabled={!isConfirmed || blockers.length > 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2Icon className="eb-animate-spin" />
                ) : (
                  <SendIcon />
                )}
                {t('submission.submitForReview')}
              </Button>
            </div>
          }
        >
          <div className="eb-px-4 eb-py-3.5">
            <p className="eb-text-sm eb-text-muted-foreground">
              {t('submission.lockWarning')}
            </p>
            <div className="eb-mt-4 eb-flex eb-items-start eb-gap-2">
              <Checkbox
                id="maintenance-submission-confirmation"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked === true)}
                disabled={blockers.length > 0 || isSubmitting}
              />
              <Label
                htmlFor="maintenance-submission-confirmation"
                className="eb-text-sm eb-font-normal eb-leading-5"
              >
                {t('submission.confirmation')}
              </Label>
            </div>

            {localSubmissionError ? (
              <Alert variant="warning" noTitle className="eb-mt-4">
                <AlertDescription>{localSubmissionError}</AlertDescription>
              </Alert>
            ) : submissionError ? (
              <div className="eb-mt-4">
                <ServerErrorAlert error={submissionError as never} />
              </div>
            ) : null}
          </div>
        </MaintenanceSection>
      ) : null}
      {onBack ? (
        <MaintenanceViewNavigation
          backLabel={tString('submission.backToProfile')}
          onBack={onBack}
          action={
            mode === 'draft' && canCancelAll && onCancelAll ? (
              <Button
                variant="outline"
                size="sm"
                className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                onClick={onCancelAll}
              >
                <Trash2Icon />
                {t('cancel.cancelAll')}
              </Button>
            ) : undefined
          }
        />
      ) : null}
    </div>
  );
}
