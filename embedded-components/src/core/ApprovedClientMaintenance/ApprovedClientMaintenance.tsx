import { useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Skeleton } from '@/components/ui';
import type { IndividualLegalNameValues } from '@/core/ClientProfile/models/individualLegalName.types';
import { useClientId } from '@/core/EBComponentsProvider/EBComponentsProvider';

import type { ApprovedClientMaintenanceProps } from './ApprovedClientMaintenance.types';
import { CancelMaintenanceDialog } from './components/CancelMaintenanceDialog';
import type { MaintenanceBreadcrumbItem } from './components/MaintenanceBreadcrumb';
import { MaintenanceDocumentView } from './components/MaintenanceDocumentView';
import { MaintenanceEditView } from './components/MaintenanceEditView';
import { MaintenanceEntityView } from './components/MaintenanceEntityView';
import { MaintenanceOrganizationView } from './components/MaintenanceOrganizationView';
import { MaintenanceProfileOverview } from './components/MaintenanceProfileOverview';
import { MaintenanceReceiptView } from './components/MaintenanceReceiptView';
import { MaintenanceReviewView } from './components/MaintenanceReviewView';
import {
  useMaintenanceWorkspace,
  type MaintenanceWorkspace,
} from './hooks/useMaintenanceWorkspace';
import type { MaintenanceParty } from './models/maintenanceApi.types';
import { buildMaintenanceEntityTasks } from './utils/buildMaintenanceEntityTasks';
import { buildMaintenanceProjection } from './utils/buildMaintenanceProjection';
import type { PartyNameUpdateRequest } from './utils/buildPartyNameUpdate';
import { isMaintenanceOperationEligible } from './utils/isMaintenanceOperationEligible';
import { getMaintenancePartyIdentity } from './utils/maintenanceDisplay';
import {
  createMaintenanceReviewFingerprint,
  getMaintenanceSubmissionBlockers,
} from './utils/maintenanceReview';

type MaintenanceReturnView =
  | { id: 'profile' }
  | { id: 'organization' }
  | { id: 'entity'; partyId: string }
  | { id: 'review' }
  | { id: 'submitted-review' };

type MaintenanceView =
  | MaintenanceReturnView
  | { id: 'edit'; partyId: string; returnTo: MaintenanceReturnView }
  | {
      id: 'document';
      partyId?: string;
      documentRequestId: string;
      returnTo: MaintenanceReturnView;
    }
  | { id: 'receipt' };

type CancelTarget = { scope: 'all' } | { scope: 'party'; partyId: string };

const getLegalName = (party: MaintenanceParty): IndividualLegalNameValues => ({
  firstName: party.individualDetails?.firstName ?? '',
  middleName: party.individualDetails?.middleName ?? '',
  lastName: party.individualDetails?.lastName ?? '',
});

export function ApprovedClientMaintenance({
  clientId: clientIdProp,
  ...props
}: ApprovedClientMaintenanceProps) {
  const providerClientId = useClientId();
  const clientId = clientIdProp ?? providerClientId ?? '';
  const workspace = useMaintenanceWorkspace(clientId);

  return (
    <ApprovedClientMaintenanceWorkspace
      {...props}
      clientId={clientId}
      workspace={workspace}
    />
  );
}

type ApprovedClientMaintenanceWorkspaceProps = Omit<
  ApprovedClientMaintenanceProps,
  'clientId'
> & {
  clientId: string;
  workspace: MaintenanceWorkspace;
};

export function ApprovedClientMaintenanceWorkspace({
  clientId,
  eligibility,
  docUploadMaxFileSizeBytes,
  className,
  onStatusChange,
  workspace,
}: ApprovedClientMaintenanceWorkspaceProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const [view, setView] = useState<MaintenanceView>({ id: 'profile' });
  const [cancelTarget, setCancelTarget] = useState<CancelTarget>();
  const [returnFocusPartyId, setReturnFocusPartyId] = useState<string>();
  const [unsynchronizedName, setUnsynchronizedName] =
    useState<IndividualLegalNameValues>();
  const {
    clientQuery,
    maintenanceQuery,
    documentRequestsQuery,
    isDocumentDiscoveryPending,
    updatePartyNameMutation,
    updatePartyName,
    cancelMaintenanceMutation,
    cancelChanges,
    verificationMutation,
    submitForReview,
    resetVerificationAttempt,
    refreshMaintenanceWorkspace,
  } = workspace;

  const projection = useMemo(() => {
    if (!clientQuery.data) return undefined;
    return buildMaintenanceProjection(
      clientQuery.data,
      maintenanceQuery.data?.parties ?? []
    );
  }, [clientQuery.data, maintenanceQuery.data?.parties]);
  const entityTasks = useMemo(() => {
    if (!clientQuery.data || !projection) return undefined;
    return buildMaintenanceEntityTasks(
      clientQuery.data,
      projection,
      documentRequestsQuery.data?.documentRequests ?? []
    );
  }, [
    clientQuery.data,
    documentRequestsQuery.data?.documentRequests,
    projection,
  ]);
  const selectedPartyId =
    view.id === 'entity' || view.id === 'edit'
      ? view.partyId
      : view.id === 'document'
        ? view.partyId
        : undefined;
  const selectedTask = entityTasks?.parties.find(
    (task) => task.partyId === selectedPartyId
  );
  const selectedDocumentRequest =
    view.id === 'document'
      ? [
          ...(entityTasks?.organization.documentRequests ?? []),
          ...(entityTasks?.parties.flatMap((task) => task.documentRequests) ??
            []),
        ].find(
          (documentRequest) => documentRequest.id === view.documentRequestId
        )
      : undefined;
  const selectedParty = selectedTask?.party;
  const selectedChange = selectedTask?.change;
  const editableName = useMemo(() => {
    if (!selectedParty) return undefined;
    const name = getLegalName(selectedParty);
    selectedChange?.fieldChanges.forEach((change) => {
      name[change.field] = change.proposedValue;
    });
    return name;
  }, [selectedChange, selectedParty]);
  const approvedName = selectedParty ? getLegalName(selectedParty) : undefined;
  const reviewFingerprint = useMemo(
    () =>
      clientQuery.data && projection
        ? createMaintenanceReviewFingerprint(clientQuery.data, projection)
        : '',
    [clientQuery.data, projection]
  );
  const submissionBlockers = useMemo(
    () =>
      clientQuery.data && projection
        ? getMaintenanceSubmissionBlockers(
            clientQuery.data,
            projection,
            documentRequestsQuery.data?.documentRequests ?? [],
            isDocumentDiscoveryPending
          )
        : [],
    [
      clientQuery.data,
      documentRequestsQuery.data?.documentRequests,
      isDocumentDiscoveryPending,
      projection,
    ]
  );
  const isEligible = clientQuery.data
    ? isMaintenanceOperationEligible(
        clientQuery.data,
        eligibility,
        'EDIT_PARTY_NAME'
      )
    : false;
  const maintenanceStatus =
    selectedChange?.proposal.updateRequest?.status ??
    clientQuery.data?.updateRequest?.status;
  useEffect(() => {
    onStatusChange?.(maintenanceStatus);
  }, [maintenanceStatus, onStatusChange]);

  useEffect(() => {
    if (
      (view.id === 'entity' ||
        view.id === 'edit' ||
        (view.id === 'document' && selectedPartyId)) &&
      entityTasks &&
      !selectedTask
    ) {
      setView({ id: 'profile' });
    }
  }, [entityTasks, selectedPartyId, selectedTask, view.id]);

  useEffect(() => {
    if (view.id === 'edit' && unsynchronizedName && selectedChange) {
      setUnsynchronizedName(undefined);
      setView(view.returnTo);
    }
  }, [selectedChange, unsynchronizedName, view]);

  useEffect(() => {
    if (
      !unsynchronizedName ||
      selectedChange ||
      updatePartyNameMutation.isPending ||
      clientQuery.isFetching ||
      maintenanceQuery.isFetching ||
      clientQuery.isError ||
      maintenanceQuery.isError
    ) {
      return undefined;
    }

    const confirmationTimer = window.setTimeout(() => {
      void Promise.all([clientQuery.refetch(), maintenanceQuery.refetch()]);
    }, 1500);
    return () => window.clearTimeout(confirmationTimer);
  }, [
    clientQuery,
    maintenanceQuery,
    selectedChange,
    unsynchronizedName,
    updatePartyNameMutation.isPending,
  ]);

  useEffect(() => {
    if (view.id !== 'profile' || !returnFocusPartyId) return;
    const partyRow = document.querySelector<HTMLElement>(
      `[data-party-id="${returnFocusPartyId}"]`
    );
    partyRow?.focus();
    setReturnFocusPartyId(undefined);
  }, [returnFocusPartyId, view.id]);

  const retryWorkspace = async () => {
    await Promise.all([clientQuery.refetch(), maintenanceQuery.refetch()]);
  };

  const openParty = (partyId: string) => {
    setView({ id: 'entity', partyId });
    setUnsynchronizedName(undefined);
    updatePartyNameMutation.reset();
  };

  const returnToProfile = (partyId: string) => {
    setReturnFocusPartyId(partyId);
    setView({ id: 'profile' });
  };

  const returnFromReview = () => {
    resetVerificationAttempt();
    setView({ id: 'profile' });
  };

  const saveName = async (
    values: IndividualLegalNameValues,
    request: PartyNameUpdateRequest
  ) => {
    if (!selectedPartyId) return;
    setUnsynchronizedName(values);
    try {
      await updatePartyName(selectedPartyId, request);
    } catch (error) {
      setUnsynchronizedName(undefined);
      throw error;
    }
  };

  if (!clientId) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errors.loadTitle')}</AlertTitle>
        <AlertDescription>{t('errors.loadDescription')}</AlertDescription>
      </Alert>
    );
  }

  if (clientQuery.isPending || maintenanceQuery.isPending) {
    return (
      <div className={cn('eb-component eb-w-full', className)}>
        <span className="eb-sr-only">{t('loading')}</span>
        <Skeleton className="eb-h-20 eb-w-full eb-rounded-lg" />
        <Skeleton className="eb-h-32 eb-w-full eb-rounded-lg" />
        <Skeleton className="eb-h-48 eb-w-full eb-rounded-lg" />
      </div>
    );
  }

  const hasInitialLoadError =
    !clientQuery.data ||
    (!maintenanceQuery.data && !unsynchronizedName) ||
    clientQuery.isError ||
    (maintenanceQuery.isError && !unsynchronizedName);
  if (hasInitialLoadError) {
    const loadError = clientQuery.error ?? maintenanceQuery.error;
    return (
      <div className={cn('eb-component eb-p-6', className)}>
        {loadError ? (
          <ServerErrorAlert
            error={loadError as never}
            tryAgainAction={retryWorkspace}
          />
        ) : (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{t('errors.loadTitle')}</AlertTitle>
            <AlertDescription className="eb-space-y-3">
              <p>{t('errors.loadDescription')}</p>
              <Button size="sm" variant="outline" onClick={retryWorkspace}>
                <RefreshCwIcon />
                {t('errors.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  const client = clientQuery.data;
  const currentProjection = projection!;
  const currentEntityTasks = entityTasks!;
  const requestStatus =
    currentProjection.partyChanges[0]?.proposal.updateRequest?.status ??
    client.updateRequest?.status;
  const activeRequestStatus = verificationMutation.data
    ? 'REVIEW_IN_PROGRESS'
    : requestStatus === 'NEW' ||
        requestStatus === 'REVIEW_IN_PROGRESS' ||
        requestStatus === 'INFORMATION_REQUESTED'
      ? requestStatus
      : undefined;
  const displayedRequestId =
    currentProjection.activeRequestId ??
    (activeRequestStatus ? client.updateRequest?.requestId : undefined);
  const isLockedForEditing =
    activeRequestStatus === 'REVIEW_IN_PROGRESS' ||
    activeRequestStatus === 'INFORMATION_REQUESTED';
  const canEdit =
    isEligible &&
    !verificationMutation.data &&
    !isLockedForEditing &&
    (client.status === 'APPROVED' || activeRequestStatus === 'NEW');
  const canCancel =
    !verificationMutation.data &&
    activeRequestStatus === 'NEW' &&
    Boolean(currentProjection.activeRequestId);
  const selectedApprovedPartyIdentity = selectedTask
    ? getMaintenancePartyIdentity(
        selectedTask.party,
        undefined,
        tString('notProvided')
      )
    : undefined;
  const selectedDocumentPartyIdentity = selectedTask
    ? getMaintenancePartyIdentity(
        selectedTask.party,
        selectedTask.change,
        tString('notProvided')
      )
    : undefined;
  const selectedPartyName = selectedApprovedPartyIdentity?.displayName ?? '';
  const affectedNames = currentProjection.partyChanges.map(
    (change) =>
      getMaintenancePartyIdentity(
        change.approvedParty,
        undefined,
        tString('notProvided')
      ).displayName
  );
  const cancelPartyChange =
    cancelTarget?.scope === 'party'
      ? currentProjection.partyChanges.find(
          (change) => change.partyId === cancelTarget.partyId
        )
      : undefined;

  const confirmCancellation = async () => {
    if (!cancelTarget || !currentProjection.activeRequestId) return;
    await cancelChanges(
      currentProjection.activeRequestId,
      cancelTarget.scope === 'party' ? cancelTarget.partyId : undefined
    );
    setUnsynchronizedName(undefined);
    setView({ id: 'profile' });
  };

  const submitDraft = async (fingerprint: string) => {
    await submitForReview(fingerprint);
    setView({ id: 'receipt' });
  };
  const profileBreadcrumb = (
    onSelect: () => void = () => setView({ id: 'profile' })
  ): MaintenanceBreadcrumbItem => ({
    label: tString('flow.title'),
    onSelect,
  });
  const getReturnViewBreadcrumb = (
    returnView: MaintenanceReturnView
  ): MaintenanceBreadcrumbItem => {
    switch (returnView.id) {
      case 'review':
        return {
          label: tString('submission.reviewTitle'),
          onSelect: () => setView(returnView),
        };
      case 'submitted-review':
        return {
          label: tString('requestDetails.title'),
          onSelect: () => setView(returnView),
        };
      case 'organization':
        return {
          label: tString('flow.businessInformation'),
          onSelect: () => setView(returnView),
        };
      case 'entity':
        return {
          label: selectedPartyName,
          onSelect: () => setView(returnView),
        };
      case 'profile':
        return profileBreadcrumb();
    }
  };

  return (
    <div className={cn('eb-component eb-w-full', className)}>
      {currentProjection.hasConflicts ||
      currentProjection.unresolvedProposals.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{t('errors.projectionTitle')}</AlertTitle>
          <AlertDescription>
            {t('errors.projectionDescription')}
          </AlertDescription>
        </Alert>
      ) : view.id === 'receipt' && verificationMutation.data ? (
        <MaintenanceReceiptView
          requestId={displayedRequestId}
          acceptedAt={verificationMutation.data.acceptedAt}
          receivedAt={verificationMutation.data.receivedAt}
          onReturn={() => setView({ id: 'profile' })}
        />
      ) : view.id === 'profile' ? (
        <MaintenanceProfileOverview
          client={client}
          entityTasks={currentEntityTasks}
          activeRequestId={displayedRequestId}
          activeRequestStatus={activeRequestStatus}
          isDocumentDiscoveryPending={isDocumentDiscoveryPending}
          isEligible={isEligible}
          onSelectOrganization={() => setView({ id: 'organization' })}
          onSelectParty={openParty}
          onReviewAndSubmit={() => {
            resetVerificationAttempt();
            setView({ id: 'review' });
          }}
          onViewRequestDetails={() => {
            if (activeRequestStatus === 'NEW') {
              resetVerificationAttempt();
            }
            setView({
              id: activeRequestStatus === 'NEW' ? 'review' : 'submitted-review',
            });
          }}
        />
      ) : view.id === 'review' ? (
        <MaintenanceReviewView
          mode="draft"
          projection={currentProjection}
          entityTasks={currentEntityTasks}
          requestStatus={activeRequestStatus}
          isDocumentDiscoveryPending={isDocumentDiscoveryPending}
          documentError={documentRequestsQuery.error}
          blockers={submissionBlockers}
          fingerprint={reviewFingerprint}
          isSubmitting={verificationMutation.isPending}
          submissionError={verificationMutation.error}
          breadcrumbs={[
            profileBreadcrumb(returnFromReview),
            { label: tString('submission.reviewTitle') },
          ]}
          onEditParty={(partyId) =>
            setView({
              id: 'edit',
              partyId,
              returnTo: { id: 'review' },
            })
          }
          onCancelParty={(partyId) =>
            setCancelTarget({ scope: 'party', partyId })
          }
          canCancelAll={canCancel}
          onCancelAll={() => setCancelTarget({ scope: 'all' })}
          onSelectDocument={(partyId, documentRequestId) =>
            setView({
              id: 'document',
              partyId,
              documentRequestId,
              returnTo: { id: 'review' },
            })
          }
          onSubmit={submitDraft}
          onBack={() => setView({ id: 'profile' })}
        />
      ) : view.id === 'submitted-review' ? (
        <MaintenanceReviewView
          mode="submitted"
          projection={currentProjection}
          entityTasks={currentEntityTasks}
          requestStatus={activeRequestStatus}
          isDocumentDiscoveryPending={isDocumentDiscoveryPending}
          documentError={documentRequestsQuery.error}
          blockers={submissionBlockers}
          fingerprint={reviewFingerprint}
          isSubmitting={false}
          submissionError={undefined}
          breadcrumbs={[
            profileBreadcrumb(),
            { label: tString('requestDetails.title') },
          ]}
          onSelectDocument={(partyId, documentRequestId) =>
            setView({
              id: 'document',
              partyId,
              documentRequestId,
              returnTo: { id: 'submitted-review' },
            })
          }
          onSubmit={async () => undefined}
          onBack={() => setView({ id: 'profile' })}
        />
      ) : view.id === 'organization' ? (
        <MaintenanceOrganizationView
          task={currentEntityTasks.organization}
          isLoadingDocuments={isDocumentDiscoveryPending}
          documentError={documentRequestsQuery.error}
          breadcrumbs={[
            profileBreadcrumb(),
            { label: tString('flow.businessInformation') },
          ]}
          onBack={() => setView({ id: 'profile' })}
          onSelectDocument={(documentRequestId) =>
            setView({
              id: 'document',
              documentRequestId,
              returnTo: { id: 'organization' },
            })
          }
        />
      ) : view.id === 'entity' && selectedTask ? (
        <MaintenanceEntityView
          task={selectedTask}
          canEdit={canEdit}
          canCancel={canCancel && Boolean(selectedTask.change)}
          isLoadingDocuments={isDocumentDiscoveryPending}
          documentError={documentRequestsQuery.error}
          breadcrumbs={[
            profileBreadcrumb(() => returnToProfile(view.partyId)),
            { label: selectedPartyName },
          ]}
          onBack={() => returnToProfile(view.partyId)}
          onViewRequestDetails={() => {
            if (activeRequestStatus === 'NEW') {
              resetVerificationAttempt();
            }
            setView({
              id: activeRequestStatus === 'NEW' ? 'review' : 'submitted-review',
            });
          }}
          onEdit={() =>
            setView({
              id: 'edit',
              partyId: view.partyId,
              returnTo: { id: 'entity', partyId: view.partyId },
            })
          }
          onSelectDocument={(documentRequestId) =>
            setView({
              id: 'document',
              partyId: view.partyId,
              documentRequestId,
              returnTo: { id: 'entity', partyId: view.partyId },
            })
          }
          onCancelChanges={() =>
            setCancelTarget({ scope: 'party', partyId: view.partyId })
          }
        />
      ) : view.id === 'edit' && editableName && approvedName ? (
        <MaintenanceEditView
          key={`${view.partyId}-${currentProjection.activeRequestId ?? 'new'}`}
          initialValues={editableName}
          originalValues={approvedName}
          isSubmitting={updatePartyNameMutation.isPending}
          mutationError={updatePartyNameMutation.error}
          breadcrumbs={[
            profileBreadcrumb(),
            getReturnViewBreadcrumb(view.returnTo),
            { label: tString('entity.editDetails') },
          ]}
          onBack={() => setView(view.returnTo)}
          onSave={saveName}
        />
      ) : view.id === 'document' && selectedTask ? (
        <MaintenanceDocumentView
          documentRequestId={view.documentRequestId}
          documentRequestSummary={selectedDocumentRequest}
          entityName={
            selectedDocumentPartyIdentity?.displayName ?? selectedPartyName
          }
          previousName={selectedDocumentPartyIdentity?.previousName}
          breadcrumbs={[
            profileBreadcrumb(),
            getReturnViewBreadcrumb(view.returnTo),
            { label: tString('document.requirementsTitle') },
          ]}
          maxFileSizeBytes={docUploadMaxFileSizeBytes}
          onBack={() => setView(view.returnTo)}
          onComplete={async () => {
            await refreshMaintenanceWorkspace();
            setView(view.returnTo);
          }}
        />
      ) : view.id === 'document' && !view.partyId ? (
        <MaintenanceDocumentView
          documentRequestId={view.documentRequestId}
          documentRequestSummary={selectedDocumentRequest}
          entityName={
            currentEntityTasks.organization.party?.organizationDetails
              ?.organizationName ?? tString('notProvided')
          }
          breadcrumbs={[
            profileBreadcrumb(),
            getReturnViewBreadcrumb(view.returnTo),
            { label: tString('document.requirementsTitle') },
          ]}
          maxFileSizeBytes={docUploadMaxFileSizeBytes}
          onBack={() => setView(view.returnTo)}
          onComplete={async () => {
            await refreshMaintenanceWorkspace();
            setView(view.returnTo);
          }}
        />
      ) : null}

      {unsynchronizedName &&
      !selectedChange &&
      view.id !== 'profile' &&
      !updatePartyNameMutation.isPending ? (
        clientQuery.isError || maintenanceQuery.isError ? (
          <div className="eb-mt-3">
            <ServerErrorAlert
              error={(clientQuery.error ?? maintenanceQuery.error) as never}
              tryAgainAction={retryWorkspace}
            />
          </div>
        ) : (
          <Alert variant="informative" noTitle className="eb-mt-3">
            <AlertDescription>{t('flow.confirmingChanges')}</AlertDescription>
          </Alert>
        )
      ) : null}

      <CancelMaintenanceDialog
        open={Boolean(cancelTarget)}
        scope={cancelTarget?.scope ?? 'all'}
        affectedNames={
          cancelTarget?.scope === 'party' && cancelPartyChange
            ? [
                getMaintenancePartyIdentity(
                  cancelPartyChange.approvedParty,
                  undefined,
                  tString('notProvided')
                ).displayName,
              ]
            : affectedNames
        }
        changedFieldLabels={cancelPartyChange?.fieldChanges.map((fieldChange) =>
          t([`editor.${fieldChange.field}`] as unknown as TemplateStringsArray)
        )}
        error={cancelMaintenanceMutation.error}
        isPending={cancelMaintenanceMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(undefined);
            cancelMaintenanceMutation.reset();
          }
        }}
        onConfirm={confirmCancellation}
      />
    </div>
  );
}
