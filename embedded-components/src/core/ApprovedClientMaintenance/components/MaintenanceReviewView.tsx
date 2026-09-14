import { useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  Clock3Icon,
  Loader2Icon,
  SendIcon,
  Undo2Icon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Checkbox, Label } from '@/components/ui';

import type {
  MaintenanceParty,
  MaintenanceStatus,
} from '../models/maintenanceApi.types';
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
import { MaintenanceDocumentRequestRow } from './MaintenanceDocumentRequestRow';
import { MaintenanceDraftActions } from './MaintenanceDraftActions';
import { MaintenanceOwnershipTree } from './MaintenanceOwnershipTree';
import {
  MaintenanceProductFamily,
  type MaintenanceProductState,
} from './MaintenanceProductFamily';
import { MaintenanceSection } from './MaintenanceSection';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';
import { ProductCancellationDialog } from './ProductCancellationDialog';
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
  clientPartyId?: string;
  clientName: string;
  ownershipParties: MaintenanceParty[];
  onEditParty?: (partyId: string) => void;
  onEditOrganization?: () => void;
  onCancelOrganization?: () => void;
  onCancelParty?: (partyId: string) => void;
  canCancelAll?: boolean;
  onCancelAll?: () => void;
  onEditOwnership?: () => void;
  isCancellingProduct?: boolean;
  productCancellationError?: unknown;
  onCancelProductAddition?: () => Promise<void>;
  onSelectDocument: (
    partyId: string | undefined,
    documentRequestId: string
  ) => void;
  onSubmit: (fingerprint: string) => Promise<void>;
  onBack?: () => void;
  onCompleteRequirement?: (type: MaintenanceSubmissionBlocker['type']) => void;
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
  clientPartyId,
  clientName,
  ownershipParties,
  onEditParty,
  onEditOrganization,
  onCancelOrganization,
  onCancelParty,
  canCancelAll,
  onCancelAll,
  onEditOwnership,
  isCancellingProduct = false,
  productCancellationError,
  onCancelProductAddition,
  onSelectDocument,
  onSubmit,
  onBack,
  onCompleteRequirement,
}: MaintenanceReviewViewProps) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const [isInformationConfirmed, setIsInformationConfirmed] = useState(false);
  const [isOwnershipConfirmed, setIsOwnershipConfirmed] = useState(false);
  const [isProductCancellationOpen, setIsProductCancellationOpen] =
    useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const previousFingerprintRef = useRef(fingerprint);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (previousFingerprintRef.current !== fingerprint) {
      previousFingerprintRef.current = fingerprint;
      setIsInformationConfirmed(false);
      setIsOwnershipConfirmed(false);
      setWasUpdated(true);
    }
  }, [fingerprint]);

  const localSubmissionError =
    submissionError instanceof MaintenanceSubmissionError
      ? submissionError.message
      : undefined;
  const getProductState = (status?: string): MaintenanceProductState => {
    switch (status) {
      case 'NEW':
        return 'pending';
      case 'REVIEW_IN_PROGRESS':
        return 'review';
      case 'INFORMATION_REQUESTED':
        return 'action';
      case 'DECLINED':
      case 'TERMINATED':
        return 'declined';
      default:
        return 'active';
    }
  };
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
  const intermediaryWorkUnits = entityTasks.intermediaryOrganizations.filter(
    (task) =>
      task.change ||
      task.unresolvedDocumentRequestIds.length > 0 ||
      task.documentRequests.some(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      )
  );
  const hasOrganizationRequirements =
    organizationDocumentActions.length > 0 || unresolvedDocumentCount > 0;
  const organizationChange = entityTasks.organization.change;
  const hasPartyRequirements = partyWorkUnits.some(
    (task) =>
      task.unresolvedDocumentRequestIds.length > 0 ||
      task.documentRequests.some(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      )
  );
  const hasIntermediaryRequirements = intermediaryWorkUnits.some(
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
    hasPartyRequirements ||
    hasIntermediaryRequirements;
  const isSubmissionBlocked = hasRequirements || blockers.length > 0;
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

      {mode === 'draft' &&
      (isDocumentDiscoveryPending ||
        hasOrganizationRequirements ||
        hasPartyRequirements ||
        hasIntermediaryRequirements) ? (
        <section
          aria-labelledby="maintenance-draft-requirements-heading"
          className="eb-flex eb-items-start eb-gap-3 eb-border-b eb-border-informative/50 eb-bg-informative-accent/50 eb-px-4 eb-py-3.5"
        >
          <ClipboardListIcon className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-informative" />
          <div>
            <h3
              id="maintenance-draft-requirements-heading"
              className="eb-text-sm eb-font-semibold"
            >
              {t('requestSummary.draftRequirements.title')}
            </h3>
            <p className="eb-mt-0.5 eb-text-sm eb-leading-5 eb-text-muted-foreground">
              {t('requestSummary.draftRequirements.description')}
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
          {projection.productChanges.length > 0 ? (
            <li>
              <MaintenanceProductFamily
                productName={tString('common:products.EMBEDDED_PAYMENTS')}
                productLabel={t('product')}
                subProductLabel={t('subProduct')}
                subProducts={[
                  {
                    id: 'limited-dda',
                    label: tString('common:subProducts.LIMITED_DDA'),
                    state: 'active',
                  },
                  ...projection.productChanges.map((change) => {
                    const state = getProductState(change.onboardingStatus);
                    return {
                      id: `${change.product}-${change.subProduct ?? ''}`,
                      label: change.subProduct
                        ? tString(
                            [
                              `common:subProducts.${change.subProduct}`,
                            ] as unknown as TemplateStringsArray,
                            { defaultValue: change.subProduct }
                          )
                        : tString(
                            [
                              `common:products.${change.product}`,
                            ] as unknown as TemplateStringsArray,
                            { defaultValue: change.product }
                          ),
                      state,
                      eyebrow: tString([
                        `productNode.${state}`,
                      ] as unknown as TemplateStringsArray),
                      action:
                        mode === 'draft' &&
                        change.subProduct === 'LIMITED_DDA_PAYMENTS' &&
                        state === 'pending' &&
                        onCancelProductAddition ? (
                          <Button
                            variant="outlineSurface"
                            size="sm"
                            className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                            onClick={() => setIsProductCancellationOpen(true)}
                          >
                            <Undo2Icon />
                            {t('productCancellation.action')}
                          </Button>
                        ) : undefined,
                    };
                  }),
                ]}
              />
            </li>
          ) : null}
          {organizationChange || hasOrganizationRequirements ? (
            <li className="eb-overflow-hidden eb-rounded-md eb-border eb-bg-background">
              <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-3 eb-bg-muted/20 eb-px-4 eb-py-3">
                <div>
                  <p className="eb-text-sm eb-font-medium">
                    {entityTasks.organization.party?.organizationDetails
                      ?.organizationName ?? tString('notProvided')}
                  </p>
                  <p className="eb-text-xs eb-text-muted-foreground">
                    {t('changes.business')}
                  </p>
                </div>
                {mode === 'draft' &&
                organizationChange &&
                onEditOrganization ? (
                  <MaintenanceDraftActions
                    editLabel={tString('changes.editDraft')}
                    removeLabel={
                      onCancelOrganization
                        ? tString('cancel.discardChanges')
                        : undefined
                    }
                    moreLabel={tString('flow.moreActions')}
                    onEdit={onEditOrganization}
                    onRemove={onCancelOrganization}
                  />
                ) : null}
              </div>
              {organizationChange ? (
                <div className="eb-border-t">
                  <MaintenanceChangeTable
                    changes={organizationChange.fieldChanges}
                    mode={mode === 'draft' ? 'draft' : 'submitted'}
                  />
                </div>
              ) : null}
              {hasOrganizationRequirements ? (
                <ul className="eb-divide-y eb-border-t eb-border-warning/50">
                  {organizationDocumentActions.map((documentRequest) => (
                    <li key={documentRequest.id}>
                      <MaintenanceDocumentRequestRow
                        documentRequest={documentRequest}
                        onSelect={(documentRequestId) =>
                          onSelectDocument(undefined, documentRequestId)
                        }
                      />
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
              ) : null}
            </li>
          ) : null}
          {intermediaryWorkUnits.map((intermediaryTask) => {
            const intermediaryName =
              intermediaryTask.proposedParty.organizationDetails
                ?.organizationName ?? tString('notProvided');
            const intermediaryDocuments =
              intermediaryTask.documentRequests.filter(
                (documentRequest) => documentRequest.status !== 'CLOSED'
              );
            return (
              <li
                key={intermediaryTask.partyId}
                className={cn(
                  'eb-overflow-hidden eb-rounded-md eb-border eb-bg-background',
                  intermediaryTask.isPendingAddition &&
                    'eb-border-informative/70 eb-bg-informative-accent/20'
                )}
              >
                <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-3 eb-bg-muted/20 eb-px-4 eb-py-3">
                  <div>
                    <p className="eb-text-sm eb-font-medium">
                      {intermediaryName}
                    </p>
                    <p className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
                      {t('ownership.intermediaryOwner')}
                      {intermediaryTask.isPendingAddition
                        ? ` · ${tString('status.PENDING_ADDITION')}`
                        : ''}
                    </p>
                  </div>
                  {mode === 'draft' &&
                  intermediaryTask.isPendingAddition &&
                  onCancelParty ? (
                    <Button
                      variant="outlineSurface"
                      size="sm"
                      className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                      onClick={() => onCancelParty(intermediaryTask.partyId)}
                    >
                      <Undo2Icon />
                      {t('pendingAddition.discard')}
                    </Button>
                  ) : null}
                </div>
                <div className="eb-border-t eb-px-4 eb-py-3">
                  <p className="eb-text-sm eb-font-medium">
                    {t('pendingAddition.detailsTitle')}
                  </p>
                  <p className="eb-mt-1 eb-text-xs eb-leading-5 eb-text-muted-foreground">
                    {t('ownership.intermediaryCaption')}
                  </p>
                </div>
                {intermediaryDocuments.length > 0 ||
                intermediaryTask.unresolvedDocumentRequestIds.length > 0 ? (
                  <ul className="eb-divide-y eb-border-t eb-border-warning/50">
                    {intermediaryDocuments.map((documentRequest) => (
                      <li key={documentRequest.id}>
                        <MaintenanceDocumentRequestRow
                          documentRequest={documentRequest}
                          onSelect={(documentRequestId) =>
                            onSelectDocument(
                              intermediaryTask.partyId,
                              documentRequestId
                            )
                          }
                        />
                      </li>
                    ))}
                    {intermediaryTask.unresolvedDocumentRequestIds.length >
                    0 ? (
                      <li className="eb-bg-warning-accent eb-px-4 eb-py-3 eb-text-sm">
                        {t('documents.unresolved', {
                          count:
                            intermediaryTask.unresolvedDocumentRequestIds
                              .length,
                        })}
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </li>
            );
          })}
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
                      {partyTask.isPendingAddition
                        ? `${tString('status.PENDING_ADDITION')} · ${roles}`
                        : roles}
                    </p>
                  </div>
                  {mode === 'draft' && change && onEditParty ? (
                    <MaintenanceDraftActions
                      editLabel={
                        partyTask.isPendingAddition
                          ? tString('pendingAddition.edit')
                          : tString('changes.editDraft')
                      }
                      removeLabel={
                        onCancelParty
                          ? partyTask.isPendingAddition
                            ? tString('pendingAddition.discard')
                            : tString('cancel.discardChanges')
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
                {change && !partyTask.isPendingAddition ? (
                  <div className="eb-border-t">
                    <MaintenanceChangeTable
                      changes={change.fieldChanges}
                      mode={mode === 'draft' ? 'draft' : 'submitted'}
                    />
                  </div>
                ) : null}
                {partyTask.isPendingAddition ? (
                  <div className="eb-border-t eb-px-4 eb-py-3">
                    <p className="eb-text-sm eb-font-medium">
                      {t('pendingAddition.detailsTitle')}
                    </p>
                    <p className="eb-mt-1 eb-text-xs eb-leading-5 eb-text-muted-foreground">
                      {t('pendingAddition.reviewGuidance')}
                    </p>
                  </div>
                ) : null}
                {partyDocumentActions.length > 0 ||
                (partyTask?.unresolvedDocumentRequestIds.length ?? 0) > 0 ? (
                  <ul className="eb-divide-y eb-border-t eb-border-warning/50">
                    {partyDocumentActions.map((documentRequest) => (
                      <li key={documentRequest.id}>
                        <MaintenanceDocumentRequestRow
                          documentRequest={documentRequest}
                          onSelect={(documentRequestId) =>
                            onSelectDocument(
                              partyTask.partyId,
                              documentRequestId
                            )
                          }
                        />
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

      {clientPartyId ? (
        <MaintenanceSection
          id="review-ownership-heading"
          title={t('submission.ownershipTitle')}
          caption={t('submission.ownershipDescription')}
          divided
          unframed
          afterContent={
            mode === 'draft' && onEditOwnership ? (
              <Button
                variant="outlineSurface"
                size="sm"
                onClick={onEditOwnership}
              >
                {t('submission.updateOwnership')}
              </Button>
            ) : undefined
          }
        >
          <MaintenanceOwnershipTree
            clientPartyId={clientPartyId}
            clientName={clientName}
            parties={ownershipParties}
            compact
          />
        </MaintenanceSection>
      ) : null}

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
                    {(blocker.type === 'questions' ||
                      blocker.type === 'attestations') &&
                    onCompleteRequirement ? (
                      <Button
                        variant="outlineSurface"
                        size="sm"
                        onClick={() => onCompleteRequirement(blocker.type)}
                      >
                        {t('submission.completeRequirement')}
                      </Button>
                    ) : (
                      <UnavailableMaintenanceAction>
                        {t('submission.completeRequirement')}
                      </UnavailableMaintenanceAction>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </MaintenanceSection>
      ) : null}

      {mode === 'draft' ? (
        <MaintenanceSection
          id="review-ready-heading"
          title={t(
            isSubmissionBlocked
              ? 'submission.blockedTitle'
              : 'submission.readyTitle'
          )}
          tone={isSubmissionBlocked ? 'warning' : 'default'}
          divided
          footer={
            <div className="eb-flex eb-justify-end">
              <Button
                size="sm"
                onClick={() => onSubmit(fingerprint)}
                disabled={
                  !isInformationConfirmed ||
                  !isOwnershipConfirmed ||
                  isSubmissionBlocked ||
                  isSubmitting
                }
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
            {isSubmissionBlocked ? (
              <div className="eb-flex eb-items-start eb-gap-2 eb-text-warning-foreground">
                <AlertCircleIcon className="eb-mt-0.5 eb-size-4 eb-shrink-0" />
                <div>
                  <p className="eb-text-sm eb-font-medium">
                    {t('submission.blockedDescription')}
                  </p>
                  <p className="eb-mt-1 eb-text-xs eb-leading-5 eb-text-muted-foreground">
                    {t('submission.blockedGuidance')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="eb-text-sm eb-text-muted-foreground">
                {t('submission.lockWarning')}
              </p>
            )}
            <p className="eb-mt-2 eb-text-xs eb-leading-5 eb-text-muted-foreground">
              {t('submission.confirmationDescription')}
            </p>
            <div className="eb-mt-4 eb-space-y-3">
              <div className="eb-flex eb-items-start eb-gap-2">
                <Checkbox
                  id="maintenance-information-confirmation"
                  checked={isInformationConfirmed}
                  onCheckedChange={(checked) =>
                    setIsInformationConfirmed(checked === true)
                  }
                  disabled={isSubmissionBlocked || isSubmitting}
                />
                <Label
                  htmlFor="maintenance-information-confirmation"
                  className="eb-text-sm eb-font-normal eb-leading-5"
                >
                  {t('submission.informationConfirmation')}
                </Label>
              </div>
              <div className="eb-flex eb-items-start eb-gap-2">
                <Checkbox
                  id="maintenance-ownership-confirmation"
                  checked={isOwnershipConfirmed}
                  onCheckedChange={(checked) =>
                    setIsOwnershipConfirmed(checked === true)
                  }
                  disabled={isSubmissionBlocked || isSubmitting}
                />
                <Label
                  htmlFor="maintenance-ownership-confirmation"
                  className="eb-text-sm eb-font-normal eb-leading-5"
                >
                  {t('submission.ownershipConfirmation')}
                </Label>
              </div>
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
                variant="outlineSurface"
                size="sm"
                className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                onClick={onCancelAll}
              >
                <Undo2Icon />
                {t('cancel.cancelAll')}
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {onCancelProductAddition ? (
        <ProductCancellationDialog
          open={isProductCancellationOpen}
          isPending={isCancellingProduct}
          error={productCancellationError}
          hasMaintenanceChanges={projection.partyChanges.length > 0}
          onOpenChange={setIsProductCancellationOpen}
          onConfirm={onCancelProductAddition}
        />
      ) : null}
    </div>
  );
}
