import { useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

import { useIPAddress } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Skeleton } from '@/components/ui';
import { useClientId } from '@/core/EBComponentsProvider/EBComponentsProvider';

import type { ApprovedClientMaintenanceProps } from './ApprovedClientMaintenance.types';
import { CancelMaintenanceDialog } from './components/CancelMaintenanceDialog';
import { MaintenanceAddIntermediaryView } from './components/MaintenanceAddIntermediaryView';
import { MaintenanceAddPartyView } from './components/MaintenanceAddPartyView';
import { MaintenanceAttestationView } from './components/MaintenanceAttestationView';
import type { MaintenanceBreadcrumbItem } from './components/MaintenanceBreadcrumb';
import { MaintenanceControllerReplacementView } from './components/MaintenanceControllerReplacementView';
import { MaintenanceDocumentDiscoveryView } from './components/MaintenanceDocumentDiscoveryView';
import { MaintenanceDocumentView } from './components/MaintenanceDocumentView';
import { MaintenanceEditView } from './components/MaintenanceEditView';
import { MaintenanceEntityView } from './components/MaintenanceEntityView';
import { MaintenanceOrganizationEditView } from './components/MaintenanceOrganizationEditView';
import { MaintenanceOrganizationView } from './components/MaintenanceOrganizationView';
import { MaintenanceOwnerRelationshipView } from './components/MaintenanceOwnerRelationshipView';
import { MaintenanceOwnershipView } from './components/MaintenanceOwnershipView';
import { MaintenanceProductAdditionView } from './components/MaintenanceProductAdditionView';
import { MaintenanceProfileOverview } from './components/MaintenanceProfileOverview';
import { MaintenanceQuestionsView } from './components/MaintenanceQuestionsView';
import { MaintenanceReceiptView } from './components/MaintenanceReceiptView';
import { MaintenanceReviewView } from './components/MaintenanceReviewView';
import { RemoveRelatedPartyDialog } from './components/RemoveRelatedPartyDialog';
import {
  useMaintenanceWorkspace,
  type MaintenanceWorkspace,
} from './hooks/useMaintenanceWorkspace';
import {
  isActiveMaintenanceStatus,
  type MaintenanceParty,
} from './models/maintenanceApi.types';
import { buildMaintenanceDiscardTargets } from './utils/buildMaintenanceDiscardTargets';
import { buildMaintenanceEntityTasks } from './utils/buildMaintenanceEntityTasks';
import { buildMaintenanceOwnershipPath } from './utils/buildMaintenanceOwnershipPath';
import { buildMaintenanceProjection } from './utils/buildMaintenanceProjection';
import { getOrganizationMaintenanceValues } from './utils/buildOrganizationPartyUpdate';
import type {
  IndividualMaintenanceValues,
  PartyNameUpdateRequest,
} from './utils/buildPartyNameUpdate';
import { isMaintenanceOperationEligible } from './utils/isMaintenanceOperationEligible';
import { isProductUpgradeGateOpen } from './utils/isProductUpgradeGateOpen';
import { getMaintenancePartyIdentity } from './utils/maintenanceDisplay';
import {
  createMaintenanceReviewFingerprint,
  getMaintenanceSubmissionBlockers,
} from './utils/maintenanceReview';

type MaintenanceReturnView =
  | { id: 'profile' }
  | { id: 'organization'; returnTo?: MaintenanceReturnView }
  | {
      id: 'entity';
      partyId: string;
      returnTo?: MaintenanceReturnView;
    }
  | { id: 'review' }
  | { id: 'submitted-review' }
  | { id: 'ownership'; returnTo: MaintenanceReturnView };

type MaintenanceView =
  | MaintenanceReturnView
  | { id: 'add-product' }
  | {
      id: 'add-party';
      returnTo: MaintenanceReturnView;
      parentPartyId?: string;
      natureOfOwnership?: 'Direct' | 'Indirect';
      allowedRoles?: Array<'CONTROLLER' | 'BENEFICIAL_OWNER'>;
      replacementPartyId?: string;
      outgoingControllerRoles?: string[];
      ownershipPathReplacement?: boolean;
      discardReplacementParty?: boolean;
      initialPartyId?: string;
    }
  | {
      id: 'owner-relationship';
      mode: 'add-owner' | 'controller-owner' | 'change-owner-path';
      partyId?: string;
      returnTo: MaintenanceReturnView;
    }
  | {
      id: 'controller-replacement';
      outgoingPartyId: string;
      outgoingControllerRoles?: string[];
      returnTo: MaintenanceReturnView;
    }
  | {
      id: 'add-intermediary';
      parentPartyId: string;
      returnTo: MaintenanceReturnView;
      ownerToReplaceId?: string;
      discardOwnerToReplace?: boolean;
      ownerToAddId?: string;
      continueWithNewOwner?: boolean;
    }
  | { id: 'questions'; returnTo: MaintenanceReturnView }
  | { id: 'attestations'; returnTo: MaintenanceReturnView }
  | {
      id: 'edit-organization';
      partyId?: string;
      returnTo: MaintenanceReturnView;
    }
  | { id: 'edit'; partyId: string; returnTo: MaintenanceReturnView }
  | {
      id: 'document-discovery';
      partyId?: string;
      returnTo: MaintenanceReturnView;
    }
  | {
      id: 'document';
      partyId?: string;
      documentRequestId: string;
      returnTo: MaintenanceReturnView;
    }
  | { id: 'receipt' };

type CancelTarget =
  | { scope: 'all' }
  | { scope: 'party'; partyId: string }
  | { scope: 'pending-addition'; partyId: string }
  | { scope: 'organization'; partyId: string };

type PendingDocumentNavigation = {
  partyId?: string;
  knownDocumentRequestIds: string[];
  returnTo: MaintenanceReturnView;
};

const getIndividualMaintenanceValues = (
  party: MaintenanceParty
): IndividualMaintenanceValues => ({
  firstName: party.individualDetails?.firstName ?? '',
  middleName: party.individualDetails?.middleName ?? '',
  lastName: party.individualDetails?.lastName ?? '',
  nameSuffix: party.individualDetails?.nameSuffix ?? '',
  birthDate: party.individualDetails?.birthDate ?? '',
  countryOfResidence: party.individualDetails?.countryOfResidence ?? '',
  individualId: {
    idType: party.individualDetails?.individualIds?.[0]?.idType ?? '',
    value: party.individualDetails?.individualIds?.[0]?.value ?? '',
  },
  jobTitle: party.individualDetails?.jobTitle ?? '',
  jobTitleDescription: party.individualDetails?.jobTitleDescription ?? '',
  email: party.email ?? '',
  phone: {
    phoneType: party.individualDetails?.phone?.phoneType ?? '',
    countryCode: party.individualDetails?.phone?.countryCode ?? '',
    phoneNumber: party.individualDetails?.phone?.phoneNumber ?? '',
  },
  residentialAddress: {
    country: party.individualDetails?.addresses?.[0]?.country ?? '',
    primaryAddressLine:
      party.individualDetails?.addresses?.[0]?.addressLines?.[0] ?? '',
    secondaryAddressLine:
      party.individualDetails?.addresses?.[0]?.addressLines?.[1] ?? '',
    tertiaryAddressLine:
      party.individualDetails?.addresses?.[0]?.addressLines?.[2] ?? '',
    city: party.individualDetails?.addresses?.[0]?.city ?? '',
    state: party.individualDetails?.addresses?.[0]?.state ?? '',
    postalCode: party.individualDetails?.addresses?.[0]?.postalCode ?? '',
  },
});

const getRemainingRoles = (
  party: MaintenanceParty | undefined,
  roleToRemove: string
) => {
  const remainingRoles = (party?.roles ?? []).filter(
    (role) => role !== roleToRemove
  );
  return remainingRoles.length > 0 ? remainingRoles : undefined;
};

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
  initialProductVerificationAcceptedAt,
  onRequestLimitedDda,
  className,
  onStatusChange,
  workspace,
}: ApprovedClientMaintenanceWorkspaceProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const [view, setView] = useState<MaintenanceView>({ id: 'profile' });
  const [cancelTarget, setCancelTarget] = useState<CancelTarget>();
  const [removePartyId, setRemovePartyId] = useState<string>();
  const [replacementCreatedForPartyId, setReplacementCreatedForPartyId] =
    useState<string>();
  const [
    ownershipSourceRetiredForPartyId,
    setOwnershipSourceRetiredForPartyId,
  ] = useState<string>();
  const [isRequestingLimitedDda, setIsRequestingLimitedDda] = useState(false);
  const [returnFocusPartyId, setReturnFocusPartyId] = useState<string>();
  const [unsynchronizedName, setUnsynchronizedName] =
    useState<IndividualMaintenanceValues>();
  const [pendingDocumentNavigation, setPendingDocumentNavigation] =
    useState<PendingDocumentNavigation>();
  const { data: ipAddress } = useIPAddress();
  const {
    clientQuery,
    maintenanceQuery,
    questionsQuery,
    documentRequestsQuery,
    isDocumentDiscoveryPending,
    updatePartyNameMutation,
    updatePartyName,
    updatePartyMutation,
    updateParty,
    addProductMutation,
    addProduct,
    cancelProductAdditionMutation,
    cancelProductAddition,
    createPartyMutation,
    createParty,
    clientTaskMutation,
    updateClientTasks,
    downloadAttestation,
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
      : view.id === 'edit-organization'
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
          ...(entityTasks?.intermediaryOrganizations.flatMap(
            (task) => task.documentRequests
          ) ?? []),
        ].find(
          (documentRequest) => documentRequest.id === view.documentRequestId
        )
      : undefined;
  const selectedParty = selectedTask?.party;
  const selectedIntermediaryTask = selectedPartyId
    ? entityTasks?.intermediaryOrganizations.find(
        (task) => task.partyId === selectedPartyId
      )
    : undefined;
  const selectedChange = selectedTask?.change;
  const selectedProposedParty = selectedPartyId
    ? projection?.proposedClient.parties?.find(
        (party) => party.id === selectedPartyId
      )
    : undefined;
  const currentIndividualDetails =
    selectedProposedParty?.individualDetails ??
    selectedParty?.individualDetails;
  const editableName =
    selectedParty && currentIndividualDetails
      ? getIndividualMaintenanceValues(
          selectedProposedParty ?? {
            ...selectedParty,
            individualDetails: currentIndividualDetails,
          }
        )
      : undefined;
  const approvedName = selectedParty
    ? getIndividualMaintenanceValues(selectedParty)
    : undefined;
  const editableOrganizationTask =
    view.id === 'edit-organization' && view.partyId
      ? entityTasks?.intermediaryOrganizations.find(
          (task) => task.partyId === view.partyId
        )
      : entityTasks?.organization;
  const organizationPartyForEditing = editableOrganizationTask?.party;
  const proposedOrganizationPartyForEditing = organizationPartyForEditing?.id
    ? projection?.proposedClient.parties?.find(
        (party) => party.id === organizationPartyForEditing.id
      )
    : undefined;
  const currentOrganizationDetails =
    (organizationPartyForEditing?.id
      ? projection?.proposedClient.parties?.find(
          (party) => party.id === organizationPartyForEditing.id
        )?.organizationDetails
      : undefined) ?? organizationPartyForEditing?.organizationDetails;
  const approvedOrganizationValues = organizationPartyForEditing
    ? getOrganizationMaintenanceValues(
        organizationPartyForEditing.organizationDetails?.organizationName,
        organizationPartyForEditing.organizationDetails?.dbaName,
        organizationPartyForEditing.organizationDetails?.addresses?.[0],
        organizationPartyForEditing.organizationDetails,
        organizationPartyForEditing.email
      )
    : undefined;
  const editableOrganizationValues = currentOrganizationDetails
    ? getOrganizationMaintenanceValues(
        currentOrganizationDetails.organizationName,
        currentOrganizationDetails.dbaName,
        currentOrganizationDetails.addresses?.[0],
        currentOrganizationDetails,
        proposedOrganizationPartyForEditing?.email ??
          organizationPartyForEditing?.email
      )
    : approvedOrganizationValues;
  const reviewFingerprint = useMemo(
    () =>
      clientQuery.data && projection
        ? createMaintenanceReviewFingerprint(clientQuery.data, projection)
        : '',
    [clientQuery.data, projection]
  );
  const submissionBlockers = useMemo(() => {
    if (!clientQuery.data || !projection) return [];
    const blockers = getMaintenanceSubmissionBlockers(
      clientQuery.data,
      projection,
      documentRequestsQuery.data?.documentRequests ?? [],
      isDocumentDiscoveryPending
    );
    return blockers;
  }, [
    clientQuery.data,
    documentRequestsQuery.data?.documentRequests,
    isDocumentDiscoveryPending,
    projection,
  ]);
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
      !selectedTask &&
      !selectedIntermediaryTask
    ) {
      setView({ id: 'profile' });
    }
  }, [
    entityTasks,
    selectedIntermediaryTask,
    selectedPartyId,
    selectedTask,
    view.id,
  ]);

  useEffect(() => {
    if (
      view.id !== 'document-discovery' ||
      !pendingDocumentNavigation ||
      !entityTasks
    ) {
      return;
    }

    const targetTask = pendingDocumentNavigation.partyId
      ? entityTasks.parties.find(
          (task) => task.partyId === pendingDocumentNavigation.partyId
        )
      : entityTasks.organization;
    if (!targetTask) return;

    const knownRequestIds = new Set(
      pendingDocumentNavigation.knownDocumentRequestIds
    );
    const newDocumentRequest = targetTask.documentRequests.find(
      (documentRequest) =>
        documentRequest.id &&
        documentRequest.status !== 'CLOSED' &&
        !knownRequestIds.has(documentRequest.id)
    );
    if (newDocumentRequest?.id) {
      setPendingDocumentNavigation(undefined);
      setView({
        id: 'document',
        partyId: pendingDocumentNavigation.partyId,
        documentRequestId: newDocumentRequest.id,
        returnTo: pendingDocumentNavigation.returnTo,
      });
      return;
    }

    const hasNewUnresolvedRequest =
      targetTask.unresolvedDocumentRequestIds.some(
        (requestId) => !knownRequestIds.has(requestId)
      );
    if (
      documentRequestsQuery.error ||
      (!isDocumentDiscoveryPending &&
        !clientQuery.isFetching &&
        !maintenanceQuery.isFetching &&
        !hasNewUnresolvedRequest)
    ) {
      setPendingDocumentNavigation(undefined);
      setView(pendingDocumentNavigation.returnTo);
    }
  }, [
    clientQuery.isFetching,
    documentRequestsQuery.error,
    entityTasks,
    isDocumentDiscoveryPending,
    maintenanceQuery.isFetching,
    pendingDocumentNavigation,
    view.id,
  ]);

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

  const openParty = (
    partyId: string,
    returnTo: MaintenanceReturnView = { id: 'profile' }
  ) => {
    setView({ id: 'entity', partyId, returnTo });
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
    values: IndividualMaintenanceValues,
    request: PartyNameUpdateRequest
  ) => {
    if (!selectedPartyId) return;
    const shouldDiscoverDocuments = !selectedChange;
    const returnTo =
      view.id === 'edit'
        ? view.returnTo
        : ({ id: 'entity', partyId: selectedPartyId } as const);
    const knownDocumentRequestIds = shouldDiscoverDocuments
      ? [
          ...(selectedTask?.documentRequests.flatMap(
            (documentRequest) => documentRequest.id ?? []
          ) ?? []),
          ...(selectedTask?.unresolvedDocumentRequestIds ?? []),
        ]
      : [];
    if (shouldDiscoverDocuments) setUnsynchronizedName(values);
    try {
      await updatePartyName(selectedPartyId, request);
      if (shouldDiscoverDocuments) {
        setPendingDocumentNavigation({
          partyId: selectedPartyId,
          knownDocumentRequestIds,
          returnTo,
        });
        setView({
          id: 'document-discovery',
          partyId: selectedPartyId,
          returnTo,
        });
      } else {
        setView(returnTo);
      }
    } catch (error) {
      setUnsynchronizedName(undefined);
      throw error;
    }
  };

  const saveOrganization = async (
    requestBody: Parameters<typeof updateParty>[1]
  ) => {
    if (!organizationPartyForEditing?.id) return;
    const shouldDiscoverDocuments = !editableOrganizationTask?.change;
    const returnTo =
      view.id === 'edit-organization'
        ? view.returnTo
        : ({ id: 'organization' } as const);
    const knownDocumentRequestIds = shouldDiscoverDocuments
      ? [
          ...(editableOrganizationTask?.documentRequests.flatMap(
            (documentRequest) => documentRequest.id ?? []
          ) ?? []),
          ...(editableOrganizationTask?.unresolvedDocumentRequestIds ?? []),
        ]
      : [];
    await updateParty(organizationPartyForEditing.id, requestBody);
    if (shouldDiscoverDocuments) {
      setPendingDocumentNavigation({
        partyId:
          organizationPartyForEditing.id === client.partyId
            ? undefined
            : organizationPartyForEditing.id,
        knownDocumentRequestIds,
        returnTo,
      });
      setView({
        id: 'document-discovery',
        partyId:
          organizationPartyForEditing.id === client.partyId
            ? undefined
            : organizationPartyForEditing.id,
        returnTo,
      });
      return;
    }
    setView(returnTo);
  };

  const saveNewParty = async (
    requestBody: Parameters<typeof createParty>[0]
  ) => {
    if (view.id === 'add-party' && view.replacementPartyId) {
      if (view.ownershipPathReplacement) {
        if (view.discardReplacementParty) {
          if (!currentProjection.activeRequestId) {
            throw new Error(
              'The active maintenance request could not be identified.'
            );
          }
          if (replacementCreatedForPartyId !== view.replacementPartyId) {
            await createParty(requestBody);
            setReplacementCreatedForPartyId(view.replacementPartyId);
          }
          if (view.outgoingControllerRoles) {
            await updateParty(view.replacementPartyId, {
              roles: view.outgoingControllerRoles,
            });
            setReplacementCreatedForPartyId(undefined);
            setView(view.returnTo);
            return;
          }
          await cancelChanges(
            currentProjection.activeRequestId,
            view.replacementPartyId
          );
          setReplacementCreatedForPartyId(undefined);
          setView(view.returnTo);
          return;
        }
        if (ownershipSourceRetiredForPartyId !== view.replacementPartyId) {
          await updateParty(
            view.replacementPartyId,
            view.outgoingControllerRoles
              ? { roles: view.outgoingControllerRoles }
              : { active: false }
          );
          setOwnershipSourceRetiredForPartyId(view.replacementPartyId);
        }
        await createParty(requestBody);
        setOwnershipSourceRetiredForPartyId(undefined);
        setView({ id: 'profile' });
        return;
      }
      if (replacementCreatedForPartyId !== view.replacementPartyId) {
        await createParty(requestBody);
        setReplacementCreatedForPartyId(view.replacementPartyId);
      }
      await updateParty(
        view.replacementPartyId,
        view.outgoingControllerRoles
          ? { roles: view.outgoingControllerRoles }
          : { active: false }
      );
      setReplacementCreatedForPartyId(undefined);
      setView({ id: 'profile' });
      return;
    }
    await createParty(requestBody);
    setView(view.id === 'add-party' ? view.returnTo : { id: 'profile' });
  };

  const saveIntermediary = async (
    requestBody: Parameters<typeof createParty>[0]
  ) => {
    const intermediary = await createParty(requestBody);
    if (view.id === 'add-intermediary' && view.ownerToReplaceId) {
      const ownerToReplace = currentProjection.proposedClient.parties?.find(
        (party) => party.id === view.ownerToReplaceId
      );
      if (!intermediary?.id || !ownerToReplace?.id) {
        throw new Error('The ownership path could not be correlated.');
      }
      const remainingRoles = (ownerToReplace.roles ?? []).filter(
        (role) => role !== 'BENEFICIAL_OWNER'
      );
      setView({
        id: 'add-party',
        parentPartyId: intermediary.id,
        natureOfOwnership: 'Indirect',
        allowedRoles: ['BENEFICIAL_OWNER'],
        replacementPartyId: ownerToReplace.id,
        outgoingControllerRoles:
          remainingRoles.length > 0 ? remainingRoles : undefined,
        ownershipPathReplacement: true,
        discardReplacementParty: view.discardOwnerToReplace,
        initialPartyId: ownerToReplace.id,
        returnTo: view.returnTo,
      });
      return;
    }
    if (
      view.id === 'add-intermediary' &&
      (view.ownerToAddId || view.continueWithNewOwner)
    ) {
      if (!intermediary?.id) {
        throw new Error(
          'The intermediary ownership path could not be correlated.'
        );
      }
      setView({
        id: 'add-party',
        parentPartyId: intermediary.id,
        natureOfOwnership: 'Indirect',
        allowedRoles: ['BENEFICIAL_OWNER'],
        initialPartyId: view.ownerToAddId,
        returnTo: view.returnTo,
      });
      return;
    }
    setView({
      id: 'ownership',
      returnTo:
        view.id === 'add-intermediary' ? view.returnTo : { id: 'profile' },
    });
  };

  const confirmPartyRemoval = async () => {
    if (!removePartyId) return;
    await updateParty(removePartyId, { active: false });
    setRemovePartyId(undefined);
    setView({ id: 'profile' });
  };

  const saveQuestions = async (
    questionResponses: Parameters<
      typeof updateClientTasks
    >[0]['questionResponses']
  ) => {
    await updateClientTasks({ questionResponses });
    setView(view.id === 'questions' ? view.returnTo : { id: 'review' });
  };

  const saveAttestations = async (
    addAttestations: NonNullable<
      Parameters<typeof updateClientTasks>[0]['addAttestations']
    >
  ) => {
    await updateClientTasks({ addAttestations });
    setView(view.id === 'attestations' ? view.returnTo : { id: 'review' });
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
              <Button
                size="sm"
                variant="outlineSurface"
                onClick={retryWorkspace}
              >
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
  const clientOrganizationName =
    currentEntityTasks.organization.party?.organizationDetails
      ?.organizationName ?? tString('notProvided');
  const selectedOwnershipPath =
    selectedPartyId && client.partyId
      ? buildMaintenanceOwnershipPath({
          parties: currentProjection.proposedClient.parties ?? [],
          clientPartyId: client.partyId,
          clientName: clientOrganizationName,
          ownerPartyId: selectedPartyId,
          fallback: tString('notProvided'),
        })
      : [];
  const activeClientRequestStatus = isActiveMaintenanceStatus(
    client.updateRequest?.status
  )
    ? client.updateRequest.status
    : undefined;
  const requestStatus =
    currentProjection.partyChanges[0]?.proposal.updateRequest?.status ??
    activeClientRequestStatus ??
    currentProjection.productChanges[0]?.onboardingStatus;
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
  const hasProductUpdate = currentProjection.productChanges.length > 0;
  const hasMaintenanceUpdate = currentProjection.partyChanges.length > 0;
  const canCancelProductAddition = currentProjection.productChanges.some(
    (change) =>
      change.subProduct === 'LIMITED_DDA_PAYMENTS' &&
      change.requestedAction === 'ADD' &&
      change.onboardingStatus === 'NEW'
  );
  const updateScope =
    hasProductUpdate && hasMaintenanceUpdate
      ? 'combined'
      : hasProductUpdate
        ? 'product'
        : 'maintenance';
  const isLockedForEditing =
    activeRequestStatus === 'REVIEW_IN_PROGRESS' ||
    activeRequestStatus === 'INFORMATION_REQUESTED';
  const canMutateDraft =
    !verificationMutation.data &&
    !isLockedForEditing &&
    (client.status === 'APPROVED' || activeRequestStatus === 'NEW');
  const canEdit = isEligible && canMutateDraft;
  const canEditOrganization =
    canMutateDraft &&
    isMaintenanceOperationEligible(client, eligibility, 'EDIT_ORGANIZATION');
  const canRequestProduct = isMaintenanceOperationEligible(
    client,
    eligibility,
    'ADD_LIMITED_DDA_PAYMENTS'
  );
  const hasApprovedLimitedDda =
    (client.productDetails ?? []).some(
      (detail) =>
        detail.product === 'EMBEDDED_PAYMENTS' &&
        (!detail.subProduct || detail.subProduct === 'LIMITED_DDA') &&
        detail.onboardingStatus === 'APPROVED'
    ) ||
    ((client.productDetails?.length ?? 0) === 0 &&
      client.status === 'APPROVED' &&
      (client.products ?? []).some(
        (product) =>
          product === 'EMBEDDED_PAYMENTS' ||
          (typeof product === 'object' &&
            product !== null &&
            (product as Record<string, unknown>).product ===
              'EMBEDDED_PAYMENTS')
      ));
  const hasLimitedDda =
    hasApprovedLimitedDda ||
    (client.productDetails ?? []).some(
      (detail) =>
        detail.product === 'EMBEDDED_PAYMENTS' &&
        (!detail.subProduct || detail.subProduct === 'LIMITED_DDA')
    );
  const hasLimitedDdaPayments = (client.productDetails ?? []).some(
    (detail) =>
      detail.product === 'EMBEDDED_PAYMENTS' &&
      detail.subProduct === 'LIMITED_DDA_PAYMENTS'
  );
  const canAddProduct =
    canMutateDraft &&
    canRequestProduct &&
    isProductUpgradeGateOpen(
      initialProductVerificationAcceptedAt,
      hasApprovedLimitedDda
    ) &&
    !hasLimitedDdaPayments;
  const shouldOfferLimitedDda = !hasLimitedDda && !hasLimitedDdaPayments;
  const canRequestLimitedDda =
    shouldOfferLimitedDda && canMutateDraft && Boolean(onRequestLimitedDda);
  const productGateOpensAt = initialProductVerificationAcceptedAt
    ? new Date(initialProductVerificationAcceptedAt).getTime() + 5 * 60 * 1000
    : undefined;
  const addProductUnavailableReason = shouldOfferLimitedDda
    ? !canMutateDraft
      ? tString('availability.requestLocked')
      : !onRequestLimitedDda
        ? tString('availability.limitedDdaHostAction')
        : undefined
    : hasLimitedDdaPayments
      ? tString('availability.productAlreadyAdded')
      : !canMutateDraft
        ? tString('availability.requestLocked')
        : !canRequestProduct
          ? tString('availability.productNotEligible')
          : !hasApprovedLimitedDda
            ? tString('availability.originalProductPending')
            : !initialProductVerificationAcceptedAt
              ? tString('availability.verificationRequired')
              : !canAddProduct && productGateOpensAt
                ? tString('availability.productLeadTime', {
                    time: new Date(productGateOpensAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    }),
                  })
                : undefined;
  const projectedIndividuals = (
    currentProjection.proposedClient.parties ?? []
  ).filter(
    (party) => party.partyType === 'INDIVIDUAL' && party.active !== false
  );
  const beneficialOwnerCount = projectedIndividuals.filter((party) =>
    party.roles?.includes('BENEFICIAL_OWNER')
  ).length;
  const controllerCount = projectedIndividuals.filter((party) =>
    party.roles?.includes('CONTROLLER')
  ).length;
  const controllerReplacementCandidates =
    view.id === 'controller-replacement'
      ? projectedIndividuals.filter(
          (party) =>
            Boolean(party.id) &&
            party.id !== view.outgoingPartyId &&
            (party.parentPartyId === client.partyId || !party.parentPartyId) &&
            !party.roles?.includes('CONTROLLER') &&
            client.parties?.some(
              (approvedParty) => approvedParty.id === party.id
            )
        )
      : [];
  const allowedAddPartyRoles = [
    ...(beneficialOwnerCount < 4 &&
    isMaintenanceOperationEligible(client, eligibility, 'ADD_BENEFICIAL_OWNER')
      ? (['BENEFICIAL_OWNER'] as const)
      : []),
  ];
  const canAddParty = canMutateDraft && allowedAddPartyRoles.length > 0;
  const canManageOwnership =
    canMutateDraft &&
    (isMaintenanceOperationEligible(
      client,
      eligibility,
      'ADD_BENEFICIAL_OWNER'
    ) ||
      isMaintenanceOperationEligible(
        client,
        eligibility,
        'DISCLOSE_INDIRECT_OWNERSHIP'
      ));
  const canManageIndirectOwnership =
    canMutateDraft &&
    isMaintenanceOperationEligible(
      client,
      eligibility,
      'DISCLOSE_INDIRECT_OWNERSHIP'
    );
  const canRemoveSelectedParty = Boolean(
    selectedTask &&
      !selectedTask.change &&
      canMutateDraft &&
      isMaintenanceOperationEligible(
        client,
        eligibility,
        'REMOVE_RELATED_PARTY'
      )
  );
  const canAddBeneficialOwnerRole = Boolean(
    selectedTask &&
      selectedTask.proposedParty.roles?.includes('CONTROLLER') &&
      !selectedTask.proposedParty.roles?.includes('BENEFICIAL_OWNER') &&
      beneficialOwnerCount < 4 &&
      canMutateDraft &&
      isMaintenanceOperationEligible(
        client,
        eligibility,
        'ADD_BENEFICIAL_OWNER'
      )
  );
  const canDiscardPendingOwnerChanges = Boolean(
    selectedTask &&
      !selectedTask.isPendingAddition &&
      !selectedTask.party.roles?.includes('BENEFICIAL_OWNER') &&
      selectedTask.proposedParty.roles?.includes('BENEFICIAL_OWNER') &&
      selectedTask.change?.proposal.updateRequest?.status === 'NEW' &&
      canMutateDraft
  );
  const canManageSelectedOwnership = Boolean(
    canManageOwnership &&
      selectedTask?.proposedParty.roles?.includes('BENEFICIAL_OWNER')
  );
  const pendingReplacementController = currentProjection.partyChanges.find(
    (change) =>
      change.action === 'ADD' && change.proposal.roles?.includes('CONTROLLER')
  );
  const selectedPartyNeedsReplacementController = Boolean(
    selectedTask?.party.roles?.includes('CONTROLLER') &&
      (controllerCount === 1 || pendingReplacementController) &&
      !selectedTask.change &&
      canMutateDraft &&
      isMaintenanceOperationEligible(
        client,
        eligibility,
        'REMOVE_RELATED_PARTY'
      )
  );
  const canAddReplacementController =
    selectedPartyNeedsReplacementController &&
    isMaintenanceOperationEligible(client, eligibility, 'ADD_CONTROLLER');
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
        change.approvedParty ?? change.proposal,
        undefined,
        tString('notProvided')
      ).displayName
  );
  const discardTargets = buildMaintenanceDiscardTargets(
    currentProjection,
    currentEntityTasks,
    submissionBlockers
      .filter((blocker) => blocker.type !== 'documents')
      .reduce((count, blocker) => count + blocker.count, 0),
    {
      product: (product, subProduct) =>
        tString('cancel.targets.product', {
          product: [
            tString(
              [`common:products.${product}`] as unknown as TemplateStringsArray,
              { defaultValue: product }
            ),
            subProduct
              ? tString(
                  [
                    `common:subProducts.${subProduct}`,
                  ] as unknown as TemplateStringsArray,
                  { defaultValue: subProduct }
                )
              : undefined,
          ]
            .filter(Boolean)
            .join(' · '),
        }),
      business: tString('cancel.targets.business'),
      personChange: (name) => tString('cancel.targets.personChange', { name }),
      personAddition: (name) =>
        tString('cancel.targets.personAddition', { name }),
      intermediaryAddition: (name) =>
        tString('cancel.targets.intermediaryAddition', { name }),
      requiredWork: (count) =>
        tString('cancel.targets.requiredWork', { count }),
      notProvided: tString('notProvided'),
    }
  );
  const cancelPartyChange =
    cancelTarget?.scope === 'party' ||
    cancelTarget?.scope === 'pending-addition'
      ? currentProjection.partyChanges.find(
          (change) => change.partyId === cancelTarget.partyId
        )
      : undefined;
  const cancelOrganizationChange =
    cancelTarget?.scope === 'organization'
      ? currentEntityTasks.organization.change
      : undefined;

  const confirmCancellation = async () => {
    if (!cancelTarget || !currentProjection.activeRequestId) return;
    await cancelChanges(
      currentProjection.activeRequestId,
      cancelTarget.scope === 'all' ? undefined : cancelTarget.partyId
    );
    setUnsynchronizedName(undefined);
    setView({ id: 'profile' });
  };

  const submitDraft = async (fingerprint: string) => {
    await submitForReview(fingerprint);
    setView({ id: 'receipt' });
  };
  const confirmProductAddition = async () => {
    if (!hasLimitedDdaPayments) {
      await addProduct?.();
    }
    setView({ id: 'review' });
  };
  const requestLimitedDda = async () => {
    if (!onRequestLimitedDda || isRequestingLimitedDda) return;
    setIsRequestingLimitedDda(true);
    try {
      await onRequestLimitedDda();
    } finally {
      setIsRequestingLimitedDda(false);
    }
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
          label: getMaintenancePartyIdentity(
            currentProjection.proposedClient.parties?.find(
              (party) => party.id === returnView.partyId
            ) ?? {},
            undefined,
            tString('notProvided')
          ).displayName,
          onSelect: () => setView(returnView),
        };
      case 'ownership':
        return {
          label: tString('ownership.title'),
          onSelect: () => setView(returnView),
        };
      case 'profile':
        return profileBreadcrumb();
    }
  };
  const getReturnViewBreadcrumbs = (
    returnView: MaintenanceReturnView
  ): MaintenanceBreadcrumbItem[] => {
    if (returnView.id === 'profile') return [profileBreadcrumb()];
    if (returnView.id === 'ownership') {
      return [
        ...getReturnViewBreadcrumbs(returnView.returnTo),
        getReturnViewBreadcrumb(returnView),
      ];
    }
    if (returnView.id === 'entity' && returnView.returnTo) {
      return [
        ...getReturnViewBreadcrumbs(returnView.returnTo),
        getReturnViewBreadcrumb(returnView),
      ];
    }
    if (returnView.id === 'organization' && returnView.returnTo) {
      return [
        ...getReturnViewBreadcrumbs(returnView.returnTo),
        getReturnViewBreadcrumb(returnView),
      ];
    }
    return [profileBreadcrumb(), getReturnViewBreadcrumb(returnView)];
  };
  return (
    <div className={cn('eb-component eb-w-full eb-@container', className)}>
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
      ) : view.id === 'add-product' ? (
        <MaintenanceProductAdditionView
          isSubmitting={addProductMutation?.isPending ?? false}
          error={addProductMutation?.error}
          onBack={() => setView({ id: 'profile' })}
          onConfirm={confirmProductAddition}
        />
      ) : view.id === 'document-discovery' ? (
        <MaintenanceDocumentDiscoveryView
          breadcrumbs={[
            profileBreadcrumb(),
            { label: tString('flow.preparingRequiredDocuments') },
          ]}
        />
      ) : view.id === 'profile' ? (
        <MaintenanceProfileOverview
          client={client}
          entityTasks={currentEntityTasks}
          ownershipParties={currentProjection.proposedClient.parties ?? []}
          hasActiveUpdate={Boolean(activeRequestStatus || displayedRequestId)}
          updateScope={updateScope}
          activeRequestStatus={activeRequestStatus}
          isDocumentDiscoveryPending={isDocumentDiscoveryPending}
          isEligible={isEligible}
          canAddProduct={canAddProduct}
          offerLimitedDda={shouldOfferLimitedDda}
          canRequestLimitedDda={canRequestLimitedDda}
          addProductUnavailableReason={addProductUnavailableReason}
          isAddingProduct={
            (addProductMutation?.isPending ?? false) || isRequestingLimitedDda
          }
          isCancellingProduct={cancelProductAdditionMutation.isPending}
          productCancellationError={cancelProductAdditionMutation.error}
          onSelectOrganization={() => setView({ id: 'organization' })}
          onSelectParty={openParty}
          onSelectIntermediary={openParty}
          onAddProduct={() => {
            if (shouldOfferLimitedDda) {
              void requestLimitedDda();
              return;
            }
            if (hasLimitedDdaPayments) {
              setView({ id: 'review' });
              return;
            }
            setView({ id: 'add-product' });
          }}
          onCancelProductAddition={
            canCancelProductAddition ? cancelProductAddition : undefined
          }
          onManageOwnership={() =>
            setView({ id: 'ownership', returnTo: { id: 'profile' } })
          }
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
          clientPartyId={client.partyId}
          clientName={clientOrganizationName}
          ownershipParties={currentProjection.proposedClient.parties ?? []}
          onEditParty={(partyId) =>
            setView({
              id: 'edit',
              partyId,
              returnTo: { id: 'review' },
            })
          }
          onEditOrganization={() =>
            setView({
              id: 'edit-organization',
              returnTo: { id: 'review' },
            })
          }
          onCancelOrganization={() =>
            currentEntityTasks.organization.change &&
            setCancelTarget({
              scope: 'organization',
              partyId: currentEntityTasks.organization.change.partyId,
            })
          }
          onCancelParty={(partyId) =>
            setCancelTarget({
              scope:
                currentProjection.partyChanges.find(
                  (change) => change.partyId === partyId
                )?.action === 'ADD'
                  ? 'pending-addition'
                  : 'party',
              partyId,
            })
          }
          canCancelAll={canCancel}
          onCancelAll={() => setCancelTarget({ scope: 'all' })}
          onEditOwnership={() =>
            setView({ id: 'ownership', returnTo: { id: 'review' } })
          }
          isCancellingProduct={cancelProductAdditionMutation.isPending}
          productCancellationError={cancelProductAdditionMutation.error}
          onCancelProductAddition={
            canCancelProductAddition ? cancelProductAddition : undefined
          }
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
          onCompleteRequirement={(type) => {
            if (type === 'questions') {
              setView({ id: 'questions', returnTo: { id: 'review' } });
            } else if (type === 'attestations') {
              setView({ id: 'attestations', returnTo: { id: 'review' } });
            }
          }}
        />
      ) : view.id === 'questions' ? (
        <MaintenanceQuestionsView
          questions={questionsQuery?.data ?? []}
          isLoading={questionsQuery?.isPending ?? false}
          isSubmitting={clientTaskMutation?.isPending ?? false}
          error={questionsQuery?.error ?? clientTaskMutation?.error}
          breadcrumbs={[
            profileBreadcrumb(),
            {
              label: tString('submission.reviewTitle'),
              onSelect: () => setView(view.returnTo),
            },
            { label: tString('questions.title') },
          ]}
          onBack={() => setView(view.returnTo)}
          onSubmit={saveQuestions}
        />
      ) : view.id === 'attestations' ? (
        <MaintenanceAttestationView
          documentIds={client.outstanding?.attestationDocumentIds ?? []}
          ipAddress={ipAddress}
          isSubmitting={clientTaskMutation?.isPending ?? false}
          error={clientTaskMutation?.error}
          breadcrumbs={[
            profileBreadcrumb(),
            {
              label: tString('submission.reviewTitle'),
              onSelect: () => setView(view.returnTo),
            },
            { label: tString('attestation.title') },
          ]}
          onBack={() => setView(view.returnTo)}
          onDownload={downloadAttestation}
          onSubmit={saveAttestations}
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
          clientPartyId={client.partyId}
          clientName={clientOrganizationName}
          ownershipParties={currentProjection.proposedClient.parties ?? []}
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
          onCompleteRequirement={(type) => {
            if (type === 'questions') {
              setView({
                id: 'questions',
                returnTo: { id: 'submitted-review' },
              });
            } else if (type === 'attestations') {
              setView({
                id: 'attestations',
                returnTo: { id: 'submitted-review' },
              });
            }
          }}
        />
      ) : view.id === 'organization' ? (
        <MaintenanceOrganizationView
          task={currentEntityTasks.organization}
          isLoadingDocuments={isDocumentDiscoveryPending}
          documentError={documentRequestsQuery.error}
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo ?? { id: 'profile' }),
            { label: tString('flow.businessInformation') },
          ]}
          canEdit={canEditOrganization}
          canCancel={
            canCancel && Boolean(currentEntityTasks.organization.change)
          }
          onBack={() => setView(view.returnTo ?? { id: 'profile' })}
          onEdit={() =>
            setView({
              id: 'edit-organization',
              returnTo: view,
            })
          }
          onViewRequestDetails={() => {
            if (activeRequestStatus === 'NEW') {
              resetVerificationAttempt();
            }
            setView({
              id: activeRequestStatus === 'NEW' ? 'review' : 'submitted-review',
            });
          }}
          onCancelChanges={() =>
            currentEntityTasks.organization.change &&
            setCancelTarget({
              scope: 'organization',
              partyId: currentEntityTasks.organization.change.partyId,
            })
          }
          onSelectDocument={(documentRequestId) =>
            setView({
              id: 'document',
              documentRequestId,
              returnTo: { id: 'organization' },
            })
          }
        />
      ) : view.id === 'ownership' && client.partyId ? (
        <MaintenanceOwnershipView
          clientPartyId={client.partyId}
          clientName={
            currentEntityTasks.organization.party?.organizationDetails
              ?.organizationName ?? tString('notProvided')
          }
          parties={currentProjection.proposedClient.parties ?? []}
          breadcrumbs={[
            profileBreadcrumb(),
            { label: tString('ownership.title') },
          ]}
          canAddDirectOwner={canAddParty}
          ownerLimitReached={beneficialOwnerCount >= 4}
          canManageIndirectOwnership={canManageIndirectOwnership}
          onAddBeneficialOwner={(parentPartyId) => {
            if (parentPartyId === client.partyId) {
              setView({
                id: 'owner-relationship',
                mode: 'add-owner',
                returnTo: view,
              });
              return;
            }
            setView({
              id: 'add-party',
              parentPartyId,
              natureOfOwnership: 'Indirect',
              allowedRoles: ['BENEFICIAL_OWNER'],
              returnTo: view,
            });
          }}
          onAddIntermediary={(parentPartyId) =>
            setView({
              id: 'add-intermediary',
              parentPartyId,
              returnTo: view,
            })
          }
          onSelectBusiness={(partyId) =>
            partyId === client.partyId
              ? setView({ id: 'organization', returnTo: view })
              : openParty(partyId, view)
          }
          onChangeOwnerPath={(ownerId) =>
            setView({
              id: 'owner-relationship',
              mode: 'change-owner-path',
              partyId: ownerId,
              returnTo: view,
            })
          }
          onSelectOwner={(partyId) => openParty(partyId, view)}
          backLabel={
            view.returnTo.id === 'review'
              ? tString('ownership.backToReview')
              : tString('submission.backToProfile')
          }
          onBack={() => setView(view.returnTo)}
        />
      ) : view.id === 'controller-replacement' ? (
        <MaintenanceControllerReplacementView
          candidates={controllerReplacementCandidates}
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo),
            { label: tString('controllerReplacement.title') },
          ]}
          isSubmitting={updatePartyMutation.isPending}
          onSelectCandidate={async (candidatePartyId) => {
            const candidate = currentProjection.proposedClient.parties?.find(
              (party) => party.id === candidatePartyId
            );
            await updateParty(candidatePartyId, {
              roles: [...new Set([...(candidate?.roles ?? []), 'CONTROLLER'])],
            });
            await updateParty(
              view.outgoingPartyId,
              view.outgoingControllerRoles
                ? { roles: view.outgoingControllerRoles }
                : { active: false }
            );
            setView({ id: 'profile' });
          }}
          onAddNew={() =>
            setView({
              id: 'add-party',
              parentPartyId: client.partyId,
              allowedRoles: ['CONTROLLER'],
              replacementPartyId: view.outgoingPartyId,
              outgoingControllerRoles: view.outgoingControllerRoles,
              returnTo: view.returnTo,
            })
          }
          onBack={() => setView(view.returnTo)}
        />
      ) : view.id === 'owner-relationship' && client.partyId ? (
        <MaintenanceOwnerRelationshipView
          mode={view.mode}
          ownerName={
            view.partyId
              ? getMaintenancePartyIdentity(
                  currentProjection.proposedClient.parties?.find(
                    (party) => party.id === view.partyId
                  ) ?? {},
                  undefined,
                  tString('notProvided')
                ).displayName
              : undefined
          }
          intermediaries={(
            currentProjection.proposedClient.parties ?? []
          ).filter(
            (party) =>
              party.active !== false &&
              party.roles?.includes('INTERMEDIARY_OWNER')
          )}
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo),
            { label: tString('ownerRelationship.title') },
          ]}
          onChooseDirect={async () => {
            if (view.mode === 'controller-owner' && view.partyId) {
              const party = currentProjection.proposedClient.parties?.find(
                (candidate) => candidate.id === view.partyId
              );
              await updateParty(view.partyId, {
                roles: [
                  ...new Set([...(party?.roles ?? []), 'BENEFICIAL_OWNER']),
                ],
                individualDetails: { natureOfOwnership: 'Direct' },
              });
              setView(view.returnTo);
              return;
            }
            setView({
              id: 'add-party',
              parentPartyId: client.partyId!,
              natureOfOwnership: 'Direct',
              allowedRoles: ['BENEFICIAL_OWNER'],
              returnTo: view.returnTo,
            });
          }}
          onChooseIntermediary={(parentPartyId) =>
            setView(
              view.mode === 'change-owner-path' && view.partyId
                ? {
                    id: 'add-party',
                    parentPartyId,
                    natureOfOwnership: 'Indirect',
                    allowedRoles: ['BENEFICIAL_OWNER'],
                    replacementPartyId: view.partyId,
                    outgoingControllerRoles: getRemainingRoles(
                      currentProjection.proposedClient.parties?.find(
                        (party) => party.id === view.partyId
                      ),
                      'BENEFICIAL_OWNER'
                    ),
                    ownershipPathReplacement: true,
                    discardReplacementParty: currentEntityTasks.parties.find(
                      (task) => task.partyId === view.partyId
                    )?.isPendingAddition,
                    initialPartyId: view.partyId,
                    returnTo: view.returnTo,
                  }
                : {
                    id: 'add-party',
                    parentPartyId,
                    natureOfOwnership: 'Indirect',
                    allowedRoles: ['BENEFICIAL_OWNER'],
                    initialPartyId:
                      view.mode === 'controller-owner'
                        ? view.partyId
                        : undefined,
                    returnTo: view.returnTo,
                  }
            )
          }
          onAddIntermediary={() =>
            setView({
              id: 'add-intermediary',
              parentPartyId: client.partyId!,
              ownerToReplaceId:
                view.mode === 'change-owner-path' ? view.partyId : undefined,
              discardOwnerToReplace:
                view.mode === 'change-owner-path'
                  ? currentEntityTasks.parties.find(
                      (task) => task.partyId === view.partyId
                    )?.isPendingAddition
                  : undefined,
              ownerToAddId:
                view.mode === 'controller-owner' ? view.partyId : undefined,
              continueWithNewOwner: view.mode === 'add-owner',
              returnTo: view.returnTo,
            })
          }
          onBack={() => setView(view.returnTo)}
        />
      ) : view.id === 'add-intermediary' ? (
        <MaintenanceAddIntermediaryView
          parentPartyId={view.parentPartyId}
          parentIsClient={view.parentPartyId === client.partyId}
          isOwnershipPathInsertion={Boolean(
            view.ownerToReplaceId ||
              view.ownerToAddId ||
              view.continueWithNewOwner
          )}
          pathOwnerName={
            view.ownerToReplaceId || view.ownerToAddId
              ? getMaintenancePartyIdentity(
                  currentProjection.proposedClient.parties?.find(
                    (party) =>
                      party.id === (view.ownerToReplaceId ?? view.ownerToAddId)
                  ) ?? {},
                  undefined,
                  tString('notProvided')
                ).displayName
              : undefined
          }
          isSubmitting={createPartyMutation?.isPending ?? false}
          error={createPartyMutation?.error}
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo),
            { label: tString('ownership.addIntermediary') },
          ]}
          onBack={() => setView(view.returnTo)}
          onSave={saveIntermediary}
        />
      ) : view.id === 'add-party' && (view.parentPartyId ?? client.partyId) ? (
        <MaintenanceAddPartyView
          parentPartyId={view.parentPartyId ?? client.partyId!}
          natureOfOwnership={view.natureOfOwnership}
          isControllerReplacement={
            Boolean(view.replacementPartyId) && !view.ownershipPathReplacement
          }
          isOwnershipPathReplacement={view.ownershipPathReplacement}
          initialParty={
            view.initialPartyId
              ? currentProjection.proposedClient.parties?.find(
                  (party) => party.id === view.initialPartyId
                )
              : undefined
          }
          canAlsoBeBeneficialOwner={beneficialOwnerCount < 4}
          allowedRoles={
            view.allowedRoles ??
            (view.natureOfOwnership === 'Indirect'
              ? ['BENEFICIAL_OWNER']
              : allowedAddPartyRoles)
          }
          isSubmitting={createPartyMutation?.isPending ?? false}
          mutationError={createPartyMutation?.error}
          lockedCountry={
            currentEntityTasks.organization.party?.organizationDetails
              ?.organizationType === 'SOLE_PROPRIETORSHIP'
              ? currentEntityTasks.organization.party.organizationDetails
                  .countryOfFormation
              : undefined
          }
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo),
            ...((view.parentPartyId ?? client.partyId) !== client.partyId
              ? [
                  {
                    label:
                      currentProjection.proposedClient.parties?.find(
                        (party) =>
                          party.id === (view.parentPartyId ?? client.partyId)
                      )?.organizationDetails?.organizationName ??
                      tString('ownership.intermediaryOwner'),
                  },
                ]
              : []),
            { label: tString('addParty.title') },
          ]}
          onBack={() => setView(view.returnTo)}
          onSave={saveNewParty}
        />
      ) : view.id === 'edit-organization' &&
        editableOrganizationValues &&
        approvedOrganizationValues ? (
        <MaintenanceOrganizationEditView
          variant={view.partyId ? 'intermediary' : 'client'}
          initialValues={editableOrganizationValues}
          approvedValues={approvedOrganizationValues}
          isSubmitting={updatePartyMutation.isPending}
          mutationError={updatePartyMutation.error}
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo),
            ...(view.partyId && organizationPartyForEditing
              ? [
                  {
                    label:
                      organizationPartyForEditing.organizationDetails
                        ?.organizationName ?? tString('notProvided'),
                  },
                ]
              : []),
            { label: tString('placeholders.editBusiness') },
          ]}
          onBack={() => setView(view.returnTo)}
          onSave={saveOrganization}
        />
      ) : view.id === 'entity' && selectedIntermediaryTask ? (
        <MaintenanceOrganizationView
          task={selectedIntermediaryTask}
          isIntermediary
          isLoadingDocuments={isDocumentDiscoveryPending}
          documentError={documentRequestsQuery.error}
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo ?? { id: 'profile' }),
            {
              label:
                selectedIntermediaryTask.proposedParty.organizationDetails
                  ?.organizationName ?? tString('notProvided'),
            },
          ]}
          canEdit={
            selectedIntermediaryTask.isPendingAddition
              ? canMutateDraft
              : canEditOrganization
          }
          canCancel={canCancel && Boolean(selectedIntermediaryTask.change)}
          onBack={() => setView(view.returnTo ?? { id: 'profile' })}
          onEdit={() =>
            setView({
              id: 'edit-organization',
              partyId: view.partyId,
              returnTo: view,
            })
          }
          onViewRequestDetails={() => {
            if (activeRequestStatus === 'NEW') {
              resetVerificationAttempt();
            }
            setView({
              id: activeRequestStatus === 'NEW' ? 'review' : 'submitted-review',
            });
          }}
          onCancelChanges={() =>
            setCancelTarget({
              scope: selectedIntermediaryTask.isPendingAddition
                ? 'pending-addition'
                : 'party',
              partyId: view.partyId,
            })
          }
          onSelectDocument={(documentRequestId) =>
            setView({
              id: 'document',
              partyId: view.partyId,
              documentRequestId,
              returnTo: view,
            })
          }
        />
      ) : view.id === 'entity' && selectedTask ? (
        <MaintenanceEntityView
          task={selectedTask}
          canEdit={selectedTask.isPendingAddition ? canMutateDraft : canEdit}
          canCancel={canCancel && Boolean(selectedTask.change)}
          canRemove={canRemoveSelectedParty}
          canAddBeneficialOwnerRole={canAddBeneficialOwnerRole}
          canDiscardPendingOwnerChanges={canDiscardPendingOwnerChanges}
          canManageOwnership={canManageSelectedOwnership}
          isLoadingDocuments={isDocumentDiscoveryPending}
          documentError={documentRequestsQuery.error}
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo ?? { id: 'profile' }),
            { label: selectedPartyName },
          ]}
          onBack={() => {
            if (!view.returnTo || view.returnTo.id === 'profile') {
              returnToProfile(view.partyId);
              return;
            }
            setView(view.returnTo);
          }}
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
              returnTo: view,
            })
          }
          onSelectDocument={(documentRequestId) =>
            setView({
              id: 'document',
              partyId: view.partyId,
              documentRequestId,
              returnTo: view,
            })
          }
          onCancelChanges={() =>
            setCancelTarget({
              scope: selectedTask.isPendingAddition
                ? 'pending-addition'
                : 'party',
              partyId: view.partyId,
            })
          }
          onRemove={() => setRemovePartyId(view.partyId)}
          onAddBeneficialOwnerRole={() => {
            setView({
              id: 'owner-relationship',
              mode: 'controller-owner',
              partyId: view.partyId,
              returnTo: view,
            });
          }}
          onManageOwnership={() =>
            setView(
              view.returnTo?.id === 'ownership'
                ? view.returnTo
                : {
                    id: 'ownership',
                    returnTo: view,
                  }
            )
          }
          onInsertIntermediary={() => {
            setView({
              id: 'owner-relationship',
              mode: 'change-owner-path',
              partyId: view.partyId,
              returnTo: view,
            });
          }}
          ownershipPath={selectedOwnershipPath}
        />
      ) : view.id === 'edit' && editableName && approvedName ? (
        <MaintenanceEditView
          key={`${view.partyId}-${currentProjection.activeRequestId ?? 'new'}`}
          initialValues={editableName}
          originalValues={approvedName}
          approvedAddresses={
            selectedTask?.party.individualDetails?.addresses ?? []
          }
          approvedIndividualIds={
            selectedTask?.party.individualDetails?.individualIds ?? []
          }
          isSubmitting={updatePartyNameMutation.isPending}
          mutationError={updatePartyNameMutation.error}
          lockedCountry={
            currentEntityTasks.organization.party?.organizationDetails
              ?.organizationType === 'SOLE_PROPRIETORSHIP'
              ? currentEntityTasks.organization.party.organizationDetails
                  .countryOfFormation
              : undefined
          }
          breadcrumbs={[
            ...getReturnViewBreadcrumbs(view.returnTo),
            { label: tString('entity.editDetails') },
          ]}
          onBack={() => setView(view.returnTo)}
          onSave={saveName}
        />
      ) : view.id === 'document' &&
        (selectedTask || selectedIntermediaryTask) ? (
        <MaintenanceDocumentView
          documentRequestId={view.documentRequestId}
          documentRequestSummary={selectedDocumentRequest}
          entityName={
            selectedIntermediaryTask?.party.organizationDetails
              ?.organizationName ??
            selectedDocumentPartyIdentity?.displayName ??
            selectedPartyName
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
          (cancelTarget?.scope === 'party' ||
            cancelTarget?.scope === 'pending-addition') &&
          cancelPartyChange
            ? [
                getMaintenancePartyIdentity(
                  cancelPartyChange.approvedParty ?? cancelPartyChange.proposal,
                  undefined,
                  tString('notProvided')
                ).displayName,
              ]
            : cancelTarget?.scope === 'organization' && cancelOrganizationChange
              ? [
                  cancelOrganizationChange.approvedParty?.organizationDetails
                    ?.organizationName ??
                    cancelOrganizationChange.proposal.organizationDetails
                      ?.organizationName ??
                    tString('notProvided'),
                ]
              : affectedNames
        }
        allTargets={discardTargets.map((target) => target.label)}
        changedFieldLabels={(
          cancelPartyChange ?? cancelOrganizationChange
        )?.fieldChanges.map((fieldChange) =>
          t([fieldChange.labelKey] as unknown as TemplateStringsArray)
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
      <RemoveRelatedPartyDialog
        open={Boolean(removePartyId)}
        name={selectedPartyName}
        isPending={updatePartyMutation?.isPending ?? false}
        error={updatePartyMutation?.error}
        replacementRequired={selectedPartyNeedsReplacementController}
        controllerIsBeneficialOwner={Boolean(
          selectedTask?.party.roles?.includes('BENEFICIAL_OWNER')
        )}
        canAddReplacement={canAddReplacementController}
        replacementAlreadyAdded={Boolean(pendingReplacementController)}
        onOpenChange={(open) => {
          if (!open) setRemovePartyId(undefined);
        }}
        onConfirm={confirmPartyRemoval}
        onAddReplacement={async (remainsBeneficialOwner) => {
          const partyId = removePartyId;
          if (!partyId) return;
          const outgoingController =
            currentProjection.proposedClient.parties?.find(
              (party) => party.id === partyId
            );
          const outgoingControllerRoles = remainsBeneficialOwner
            ? (outgoingController?.roles ?? []).filter(
                (role) => role !== 'CONTROLLER'
              )
            : undefined;
          if (pendingReplacementController) {
            await updateParty(
              partyId,
              outgoingControllerRoles
                ? { roles: outgoingControllerRoles }
                : { active: false }
            );
            setRemovePartyId(undefined);
            setView({ id: 'profile' });
            return;
          }
          const returnTo = { id: 'entity', partyId } as const;
          setRemovePartyId(undefined);
          setView({
            id: 'controller-replacement',
            outgoingPartyId: partyId,
            outgoingControllerRoles,
            returnTo,
          });
        }}
      />
    </div>
  );
}
