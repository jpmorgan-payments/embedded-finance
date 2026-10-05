import { useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useElementWidth } from '@/utils/useElementWidth';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

import { useIPAddress } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Skeleton } from '@/components/ui';
import { useClientId } from '@/core/EBComponentsProvider/EBComponentsProvider';

import type {
  ApprovedClientMaintenanceOperation,
  ApprovedClientMaintenanceProps,
} from './ApprovedClientMaintenance.types';
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
import {
  MaintenanceNavigatorSidebar,
  type MaintenanceNavigatorTarget,
} from './components/MaintenanceNavigatorSidebar';
import { MaintenanceNavigatorVisibleProvider } from './components/MaintenanceNavigatorVisibleContext';
import { MaintenanceOrganizationEditView } from './components/MaintenanceOrganizationEditView';
import { MaintenanceOrganizationView } from './components/MaintenanceOrganizationView';
import { MaintenanceOwnerRelationshipView } from './components/MaintenanceOwnerRelationshipView';
import { MaintenanceOwnershipView } from './components/MaintenanceOwnershipView';
import { MaintenanceProductAdditionView } from './components/MaintenanceProductAdditionView';
import { MaintenanceProfileOverview } from './components/MaintenanceProfileOverview';
import { MaintenanceQuestionsView } from './components/MaintenanceQuestionsView';
import { MaintenanceReceiptView } from './components/MaintenanceReceiptView';
import { MaintenanceReviewView } from './components/MaintenanceReviewView';
import { MoveOwnershipDialog } from './components/MoveOwnershipDialog';
import { RemoveIntermediaryDialog } from './components/RemoveIntermediaryDialog';
import { RemoveRelatedPartyDialog } from './components/RemoveRelatedPartyDialog';
import {
  useMaintenanceWorkspace,
  type MaintenanceWorkspace,
} from './hooks/useMaintenanceWorkspace';
import {
  isActiveMaintenanceStatus,
  type MaintenanceParty,
  type MaintenancePartyUpdateRequest,
} from './models/maintenanceApi.types';
import { buildControllerReplacementUndo } from './utils/buildControllerReplacementUndo';
import { buildMaintenanceDiscardContent } from './utils/buildMaintenanceDiscardContent';
import {
  buildMaintenanceEntityTasks,
  type PartyMaintenanceEntityTask,
} from './utils/buildMaintenanceEntityTasks';
import { buildMaintenanceOwnershipPath } from './utils/buildMaintenanceOwnershipPath';
import {
  buildMaintenanceProjection,
  type PartyFieldChange,
} from './utils/buildMaintenanceProjection';
import { getOrganizationMaintenanceValues } from './utils/buildOrganizationPartyUpdate';
import type { IndividualMaintenanceValues } from './utils/buildPartyNameUpdate';
import { getControllerReplacement } from './utils/getControllerReplacement';
import { getEligibleMaintenanceOperations } from './utils/getEligibleMaintenanceOperations';
import { getMaintenancePartyStatus } from './utils/getMaintenancePartyStatus';
import { getMaintenanceRequestSummaryState } from './utils/getMaintenanceRequestSummaryState';
import { getOwnershipChanges } from './utils/getOwnershipChanges';
import { getOwnershipDescendants } from './utils/getOwnershipDescendants';
import { isProductUpgradeGateOpen } from './utils/isProductUpgradeGateOpen';
import { getMaintenancePartyIdentity } from './utils/maintenanceDisplay';
import {
  createMaintenanceReviewFingerprint,
  getMaintenanceSubmissionBlockers,
} from './utils/maintenanceReview';
import {
  buildMoveOwnershipPlan,
  buildRemoveIntermediaryPlan,
  getEligibleOwnershipParents,
} from './utils/ownershipOperations';

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

const OWNERSHIP_FIELDS = new Set<PartyFieldChange['field']>([
  'roles',
  'natureOfOwnership',
  'parentPartyId',
]);

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
  const [intermediaryRemovalTarget, setIntermediaryRemovalTarget] = useState<{
    partyId: string;
    returnTo: MaintenanceReturnView;
  }>();
  const [ownershipMovePartyId, setOwnershipMovePartyId] = useState<string>();
  const [replacementCreatedForPartyId, setReplacementCreatedForPartyId] =
    useState<string>();
  // Keeps a retried path change from adding the business twice.
  const [pathIntermediary, setPathIntermediary] = useState<{
    ownerPartyId: string;
    intermediaryPartyId: string;
  }>();
  const [isRequestingLimitedDda, setIsRequestingLimitedDda] = useState(false);
  const [returnFocusPartyId, setReturnFocusPartyId] = useState<string>();
  const [unsynchronizedName, setUnsynchronizedName] =
    useState<IndividualMaintenanceValues>();
  const [pendingDocumentNavigation, setPendingDocumentNavigation] =
    useState<PendingDocumentNavigation>();
  const [layoutRef, layoutWidth] = useElementWidth<HTMLDivElement>();
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
    ownershipOperationsMutation,
    applyOwnershipOperations,
    resetOwnershipOperations,
    clientTaskMutation,
    updateClientTasks,
    downloadAttestation,
    cancelMaintenanceMutation,
    cancelChanges,
    partyStepsMutation,
    applyPartySteps,
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
  const eligibleOperations = clientQuery.data
    ? getEligibleMaintenanceOperations(clientQuery.data, eligibility)
    : undefined;
  const allows = (operation: ApprovedClientMaintenanceOperation) =>
    Boolean(eligibleOperations?.has(operation));
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
      setView(
        (current) =>
          ('returnTo' in current && current.returnTo) || { id: 'profile' }
      );
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

  const openRequest = () => {
    if (activeRequestStatus === 'NEW') {
      resetVerificationAttempt();
    }
    setView({
      id: activeRequestStatus === 'NEW' ? 'review' : 'submitted-review',
    });
  };

  const saveName = async (
    values: IndividualMaintenanceValues,
    request: MaintenancePartyUpdateRequest
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

  // Roles left undefined remove the party; gaining the owner role also needs its ownership nature.
  const getRetiredPartyUpdate = (
    partyId: string,
    remainingRoles?: string[]
  ): Parameters<typeof updateParty>[1] => {
    if (!remainingRoles) return { active: false };
    const party = currentProjection.proposedClient.parties?.find(
      (candidate) => candidate.id === partyId
    );
    const becomesOwner =
      remainingRoles.includes('BENEFICIAL_OWNER') &&
      !party?.roles?.includes('BENEFICIAL_OWNER');
    return becomesOwner
      ? {
          roles: remainingRoles,
          individualDetails: { natureOfOwnership: 'Direct' },
        }
      : { roles: remainingRoles };
  };

  const saveNewParty = async (
    requestBody: Parameters<typeof createParty>[0]
  ) => {
    if (view.id === 'add-party' && view.replacementPartyId) {
      if (replacementCreatedForPartyId !== view.replacementPartyId) {
        await createParty(requestBody);
        setReplacementCreatedForPartyId(view.replacementPartyId);
      }
      await updateParty(
        view.replacementPartyId,
        getRetiredPartyUpdate(
          view.replacementPartyId,
          view.outgoingControllerRoles
        )
      );
      setReplacementCreatedForPartyId(undefined);
      setView(view.returnTo);
      return;
    }
    await createParty(requestBody);
    setView(view.id === 'add-party' ? view.returnTo : { id: 'profile' });
  };

  const moveOwner = async (partyId: string, destinationPartyId: string) => {
    const party = currentProjection.proposedClient.parties?.find(
      (candidate) => candidate.id === partyId
    );
    if (!party || !client.partyId) {
      throw new Error('The ownership path could not be correlated.');
    }
    await applyOwnershipOperations(
      buildMoveOwnershipPlan({
        party,
        destinationPartyId,
        clientPartyId: client.partyId,
      })
    );
  };

  const saveIntermediary = async (
    requestBody: Parameters<typeof createParty>[0]
  ) => {
    if (view.id === 'add-intermediary' && view.ownerToReplaceId) {
      const ownerPartyId = view.ownerToReplaceId;
      let intermediaryPartyId =
        pathIntermediary?.ownerPartyId === ownerPartyId
          ? pathIntermediary.intermediaryPartyId
          : undefined;
      if (!intermediaryPartyId) {
        intermediaryPartyId = (await createParty(requestBody))?.id;
        if (!intermediaryPartyId) {
          throw new Error('The ownership path could not be correlated.');
        }
        setPathIntermediary({ ownerPartyId, intermediaryPartyId });
      }
      await moveOwner(ownerPartyId, intermediaryPartyId);
      setPathIntermediary(undefined);
      setView(view.returnTo);
      return;
    }
    const intermediary = await createParty(requestBody);
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
  };

  const confirmIntermediaryRemoval = async (
    strategy: 'promote-children' | 'remove-branch'
  ) => {
    if (!intermediaryRemovalTarget || !client.partyId) {
      return;
    }
    await applyOwnershipOperations(
      buildRemoveIntermediaryPlan({
        intermediaryPartyId: intermediaryRemovalTarget.partyId,
        clientPartyId: client.partyId,
        parties: currentProjection.proposedClient.parties ?? [],
        strategy,
      })
    );
    const returnTo = intermediaryRemovalTarget.returnTo;
    setIntermediaryRemovalTarget(undefined);
    setView(returnTo);
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
  // Matches onboarding: sole proprietorships have no owners section.
  const hasOwnershipStructure =
    currentEntityTasks.organization.party?.organizationDetails
      ?.organizationType !== 'SOLE_PROPRIETORSHIP';
  // Pending removals stay in ownership displays until approved; the projection drops them.
  const ownershipChanges = getOwnershipChanges({
    approvedParties: currentProjection.approvedClient.parties ?? [],
    proposedParties: currentProjection.proposedClient.parties ?? [],
    clientPartyId: client.partyId,
  });
  const ownershipDisplayParties = ownershipChanges.displayParties;
  const selectedOwnershipPath =
    selectedPartyId && client.partyId
      ? buildMaintenanceOwnershipPath({
          parties: ownershipDisplayParties,
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
  const canManageProfile = canMutateDraft && allows('MANAGE_PROFILE');
  const canEdit = canManageProfile;
  const canEditOrganization = canManageProfile;
  const canRequestProduct = allows('ADD_LIMITED_DDA_PAYMENTS');
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
  const canManageDirectOwnership = canManageProfile && hasOwnershipStructure;
  // Indirect ownership extends the profile; configured alone it unlocks nothing.
  const canManageIndirectOwnership =
    canManageDirectOwnership && allows('MANAGE_INDIRECT_OWNERSHIP');
  const allowedAddPartyRoles = [
    ...(beneficialOwnerCount < 4 && canManageDirectOwnership
      ? (['BENEFICIAL_OWNER'] as const)
      : []),
  ];
  // Everything about an intermediary business is part of indirect ownership.
  const canEditIntermediary = canManageIndirectOwnership;
  const canRemoveRelatedParty = (task?: PartyMaintenanceEntityTask) => {
    if (!task || task.change || task.isUnreviewed || !canMutateDraft) {
      return false;
    }
    // A sole controller leaves only through replacement; see needsReplacementController.
    if (task.party.roles?.includes('CONTROLLER')) {
      return controllerCount > 1 && canManageProfile;
    }
    const ownsThroughBusiness = Boolean(
      task.proposedParty.parentPartyId &&
        task.proposedParty.parentPartyId !== client.partyId
    );
    return ownsThroughBusiness
      ? canManageIndirectOwnership
      : canManageDirectOwnership;
  };
  const canRemoveSelectedParty = canRemoveRelatedParty(selectedTask);
  const canRemoveIntermediary = (partyId: string) => {
    const intermediaryTask = currentEntityTasks.intermediaryOrganizations.find(
      (task) => task.partyId === partyId
    );
    return Boolean(
      intermediaryTask &&
        !intermediaryTask.change &&
        !intermediaryTask.isPendingAddition &&
        !intermediaryTask.isUnreviewed &&
        canManageIndirectOwnership
    );
  };
  const getOwnershipMoveDestinationIds = (partyId: string) => {
    if (!client.partyId) return [];
    const parties = currentProjection.proposedClient.parties ?? [];
    const currentParentPartyId =
      parties.find((party) => party.id === partyId)?.parentPartyId ??
      client.partyId;
    return getEligibleOwnershipParents({
      partyId,
      clientPartyId: client.partyId,
      parties,
    }).filter((candidateId) => candidateId !== currentParentPartyId);
  };
  const canMoveOwnershipParty = (partyId: string) => {
    const task = findRelatedPartyTask(partyId);
    const isDirectIndividualOwner =
      task?.proposedParty.partyType === 'INDIVIDUAL' &&
      (!task.proposedParty.parentPartyId ||
        task.proposedParty.parentPartyId === client.partyId);
    return Boolean(
      task &&
        canMutateDraft &&
        !task.isUnreviewed &&
        !task.change?.removesParty &&
        task.proposedParty.roles?.some(
          (role) => role === 'BENEFICIAL_OWNER' || role === 'INTERMEDIARY_OWNER'
        ) &&
        !isDirectIndividualOwner &&
        canManageIndirectOwnership &&
        getOwnershipMoveDestinationIds(partyId).length > 0
    );
  };
  const getIntermediaryRemovalBlockers = (partyId: string) =>
    getOwnershipDescendants(partyId, [
      client.parties ?? [],
      currentProjection.proposedClient.parties ?? [],
    ]);
  const intermediaryRemovalTask = intermediaryRemovalTarget
    ? currentEntityTasks.intermediaryOrganizations.find(
        (task) => task.partyId === intermediaryRemovalTarget.partyId
      )
    : undefined;
  const intermediaryRemovalBlockers = intermediaryRemovalTarget
    ? getIntermediaryRemovalBlockers(intermediaryRemovalTarget.partyId)
    : [];
  const intermediaryRemovalName =
    intermediaryRemovalTask?.proposedParty.organizationDetails
      ?.organizationName ?? tString('notProvided');
  const intermediaryRemovalDependentNames = intermediaryRemovalBlockers.map(
    (party) =>
      party.organizationDetails?.organizationName ??
      getMaintenancePartyIdentity(party, undefined, tString('notProvided'))
        .displayName
  );
  const intermediaryRemovalParty = intermediaryRemovalTarget
    ? currentProjection.proposedClient.parties?.find(
        (party) => party.id === intermediaryRemovalTarget.partyId
      )
    : undefined;
  const intermediaryRemovalParent = intermediaryRemovalParty?.parentPartyId
    ? currentProjection.proposedClient.parties?.find(
        (party) => party.id === intermediaryRemovalParty.parentPartyId
      )
    : undefined;
  const intermediaryRemovalParentName =
    intermediaryRemovalParent?.organizationDetails?.organizationName ??
    clientOrganizationName;
  const intermediaryRemovalDirectChildNames = intermediaryRemovalTarget
    ? (currentProjection.proposedClient.parties ?? [])
        .filter(
          (party) =>
            party.active !== false &&
            party.parentPartyId === intermediaryRemovalTarget.partyId
        )
        .map(
          (party) =>
            party.organizationDetails?.organizationName ??
            getMaintenancePartyIdentity(
              party,
              undefined,
              tString('notProvided')
            ).displayName
        )
    : [];
  const ownershipMoveParty = ownershipMovePartyId
    ? currentProjection.proposedClient.parties?.find(
        (party) => party.id === ownershipMovePartyId
      )
    : undefined;
  const ownershipMoveParent = ownershipMoveParty?.parentPartyId
    ? currentProjection.proposedClient.parties?.find(
        (party) => party.id === ownershipMoveParty.parentPartyId
      )
    : undefined;
  const ownershipMoveDestinations =
    ownershipMovePartyId && client.partyId
      ? getOwnershipMoveDestinationIds(ownershipMovePartyId).map((partyId) => {
          const party = currentProjection.proposedClient.parties?.find(
            (candidate) => candidate.id === partyId
          );
          return {
            partyId,
            name:
              partyId === client.partyId
                ? clientOrganizationName
                : (party?.organizationDetails?.organizationName ??
                  tString('notProvided')),
            path:
              partyId === client.partyId
                ? tString('ownershipEditor.moveDirectOption')
                : buildMaintenanceOwnershipPath({
                    parties: currentProjection.proposedClient.parties ?? [],
                    clientPartyId: client.partyId!,
                    clientName: clientOrganizationName,
                    ownerPartyId: partyId,
                    fallback: tString('notProvided'),
                  }).join(' › '),
            depth:
              partyId === client.partyId
                ? 0
                : Math.max(
                    0,
                    buildMaintenanceOwnershipPath({
                      parties: currentProjection.proposedClient.parties ?? [],
                      clientPartyId: client.partyId!,
                      clientName: clientOrganizationName,
                      ownerPartyId: partyId,
                      fallback: tString('notProvided'),
                    }).length - 2
                  ),
          };
        })
      : [];
  const canAddBeneficialOwnerRole = Boolean(
    selectedTask &&
      !selectedTask.isUnreviewed &&
      !selectedTask.change?.removesParty &&
      selectedTask.proposedParty.roles?.includes('CONTROLLER') &&
      !selectedTask.proposedParty.roles?.includes('BENEFICIAL_OWNER') &&
      beneficialOwnerCount < 4 &&
      canManageDirectOwnership
  );
  const canKeepReplacedControllerAsOwner = Boolean(
    selectedTask?.change?.removesParty &&
      getControllerReplacement(currentProjection)?.outgoingPartyId ===
        selectedTask.partyId &&
      (selectedTask.party.roles?.includes('BENEFICIAL_OWNER') ||
        beneficialOwnerCount < 4) &&
      canManageDirectOwnership
  );
  // Reverse the removal and apply the owner role together, so control never flips back on screen.
  const keepReplacedControllerAsOwner = async () => {
    const requestId = currentProjection.activeRequestId;
    if (!selectedTask || !requestId) return;
    const approvedRoles = selectedTask.party.roles ?? [];
    const wasOwner = approvedRoles.includes('BENEFICIAL_OWNER');
    await applyPartySteps([
      { kind: 'discard', requestId, partyId: selectedTask.partyId },
      {
        kind: 'update',
        partyId: selectedTask.partyId,
        requestBody: {
          roles: [
            ...new Set([
              ...approvedRoles.filter((role) => role !== 'CONTROLLER'),
              'BENEFICIAL_OWNER',
            ]),
          ],
          ...(wasOwner
            ? {}
            : { individualDetails: { natureOfOwnership: 'Direct' } }),
        },
      },
    ]);
  };
  const canManageSelectedOwnership = Boolean(
    canManageIndirectOwnership &&
      !selectedTask?.isUnreviewed &&
      !selectedTask?.change?.removesParty &&
      selectedTask?.proposedParty.roles?.includes('BENEFICIAL_OWNER')
  );
  const pendingReplacementController = currentProjection.partyChanges.find(
    (change) =>
      change.action === 'ADD' && change.proposal.roles?.includes('CONTROLLER')
  );
  const needsReplacementController = (task?: PartyMaintenanceEntityTask) =>
    Boolean(
      !task?.isUnreviewed &&
        task?.party.roles?.includes('CONTROLLER') &&
        task.proposedParty.roles?.includes('CONTROLLER') &&
        (controllerCount === 1 || pendingReplacementController) &&
        canMutateDraft &&
        allows('MANAGE_PROFILE') &&
        // Adding the owner role first is how an outgoing controller stays on as an owner.
        (!task.change ||
          (!task.change.removesParty &&
            task.change.fieldChanges.every((fieldChange) =>
              OWNERSHIP_FIELDS.has(fieldChange.field)
            )))
    );
  const selectedPartyNeedsReplacementController =
    needsReplacementController(selectedTask);
  const removalTask = currentEntityTasks.parties.find(
    (task) => task.partyId === removePartyId
  );
  const removalNeedsReplacementController =
    needsReplacementController(removalTask);
  const canCancel =
    !verificationMutation.data &&
    activeRequestStatus === 'NEW' &&
    Boolean(currentProjection.activeRequestId);
  const findRelatedPartyTask = (partyId: string) =>
    [
      ...currentEntityTasks.parties,
      ...currentEntityTasks.intermediaryOrganizations,
    ].find((task) => task.partyId === partyId);
  const isIntermediaryParty = (partyId: string) =>
    Boolean(
      findRelatedPartyTask(partyId)?.proposedParty.roles?.includes(
        'INTERMEDIARY_OWNER'
      )
    );
  // A pending business with parties under it asks what happens to them first.
  const discardPendingAddition = (
    partyId: string,
    returnTo: MaintenanceReturnView
  ) => {
    const hasDependents =
      isIntermediaryParty(partyId) &&
      getOwnershipDescendants(partyId, [
        currentProjection.proposedClient.parties ?? [],
      ]).length > 0;
    if (hasDependents) {
      setIntermediaryRemovalTarget({ partyId, returnTo });
      return;
    }
    setCancelTarget({ scope: 'pending-addition', partyId });
  };
  // Mirrors the Edit permission on each party's details page.
  const canEditReviewParty = (partyId: string) => {
    const task = findRelatedPartyTask(partyId);
    if (!task || task.change?.removesParty || task.isUnreviewed) return false;
    if (task.isPendingAddition) return canMutateDraft;
    return isIntermediaryParty(partyId) ? canEditIntermediary : canEdit;
  };
  const canDiscardPendingOwnershipParty = (partyId: string) => {
    const task = findRelatedPartyTask(partyId);
    return Boolean(
      task?.isPendingAddition &&
        task.change?.proposal.updateRequest?.status === 'NEW' &&
        canCancel
    );
  };
  const findPersonTask = (partyId: string) =>
    currentEntityTasks.parties.find((task) => task.partyId === partyId);
  const editRelatedParty = (partyId: string, returnTo: MaintenanceReturnView) =>
    setView(
      isIntermediaryParty(partyId)
        ? { id: 'edit-organization', partyId, returnTo }
        : { id: 'edit', partyId, returnTo }
    );
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
  const discardContent = cancelTarget
    ? buildMaintenanceDiscardContent(
        cancelTarget,
        currentProjection,
        currentEntityTasks
      )
    : undefined;

  const confirmCancellation = async () => {
    const requestId = currentProjection.activeRequestId;
    if (!cancelTarget || !requestId) return;
    const droppedPartyIds = new Set(
      discardContent?.kind === 'all'
        ? discardContent.added.map((entry) => entry.id)
        : discardContent?.kind === 'addition'
          ? [discardContent.entry.id]
          : discardContent?.kind === 'controller-replacement' &&
              discardContent.incomingIsAddition
            ? [discardContent.incoming.id]
            : []
    );
    const requestEmptied =
      discardContent?.kind === 'all' || !discardContent?.hasOtherChanges;
    // Leave a page only when the discard removes what it shows.
    const getSurvivingView = (current: MaintenanceView): MaintenanceView => {
      if (current.id === 'review' || current.id === 'submitted-review') {
        return requestEmptied ? { id: 'profile' } : current;
      }
      if (
        'partyId' in current &&
        current.partyId &&
        droppedPartyIds.has(current.partyId)
      ) {
        return getSurvivingView(
          ('returnTo' in current && current.returnTo) || { id: 'profile' }
        );
      }
      return current;
    };
    const nextView = getSurvivingView(view);
    if (discardContent?.kind === 'controller-replacement') {
      await applyPartySteps(
        buildControllerReplacementUndo({
          requestId,
          outgoing: discardContent.outgoing,
          incoming: discardContent.incoming,
          incomingIsAddition: discardContent.incomingIsAddition,
        })
      );
    } else {
      await cancelChanges(
        requestId,
        cancelTarget.scope === 'all' ? undefined : cancelTarget.partyId
      );
    }
    setUnsynchronizedName(undefined);
    setView(nextView);
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
          label: tString([
            `requestDetails.title.${updateScope}`,
          ] as unknown as TemplateStringsArray),
          onSelect: () => setView(returnView),
        };
      case 'organization':
        return {
          label: tString('organization'),
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
  const getDetailBackLabel = (returnView?: MaintenanceReturnView) =>
    returnView?.id === 'entity'
      ? tString('document.back', {
          name: getReturnViewBreadcrumb(returnView).label,
        })
      : returnView?.id === 'ownership'
        ? tString('ownership.backToStructure')
        : returnView?.id === 'review'
          ? tString('ownership.backToReview')
          : returnView?.id === 'submitted-review'
            ? tString('requestDetails.back')
            : tString('submission.backToProfile');
  const profileOverview = (
    <MaintenanceProfileOverview
      client={client}
      entityTasks={currentEntityTasks}
      ownershipParties={currentProjection.proposedClient.parties ?? []}
      hasActiveUpdate={Boolean(activeRequestStatus || displayedRequestId)}
      updateScope={updateScope}
      activeRequestStatus={activeRequestStatus}
      isDocumentDiscoveryPending={isDocumentDiscoveryPending}
      canOfferProductUpgrade={canRequestProduct}
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
      onManageOwnership={
        hasOwnershipStructure
          ? () => setView({ id: 'ownership', returnTo: { id: 'profile' } })
          : undefined
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
  );
  const isSplitLayout =
    layoutWidth >= 880 && view.id !== 'profile' && view.id !== 'receipt';
  // Deeper pages (edit, documents, add flows) highlight the section they belong to.
  const getNavigatorTarget = (
    currentView: MaintenanceView
  ): MaintenanceNavigatorTarget | undefined => {
    switch (currentView.id) {
      case 'organization':
        return { kind: 'organization' };
      case 'ownership':
        return { kind: 'ownership' };
      case 'review':
      case 'submitted-review':
        return { kind: 'request' };
      case 'entity':
      case 'edit':
        return { kind: 'party', partyId: currentView.partyId };
      case 'edit-organization':
      case 'document':
      case 'document-discovery':
        if (currentView.partyId && currentView.partyId !== client.partyId) {
          return { kind: 'party', partyId: currentView.partyId };
        }
        return currentView.id === 'edit-organization'
          ? { kind: 'organization' }
          : getNavigatorTarget(currentView.returnTo);
      default:
        return 'returnTo' in currentView && currentView.returnTo
          ? getNavigatorTarget(currentView.returnTo)
          : undefined;
    }
  };
  const activeNavigatorTarget = getNavigatorTarget(view);

  return (
    <div
      ref={layoutRef}
      className={cn('eb-component eb-w-full eb-@container', className)}
    >
      {currentProjection.hasConflicts ||
      currentProjection.unresolvedProposals.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{t('errors.projectionTitle')}</AlertTitle>
          <AlertDescription>
            {t('errors.projectionDescription')}
          </AlertDescription>
        </Alert>
      ) : (
        <div
          data-maintenance-layout={isSplitLayout ? 'split' : 'single'}
          className={cn(
            isSplitLayout &&
              'eb-grid eb-grid-cols-[minmax(0,17rem)_minmax(0,1fr)] eb-items-start eb-gap-4'
          )}
        >
          {isSplitLayout ? (
            <aside className="eb-sticky eb-top-4 eb-max-h-[calc(100vh-2rem)] eb-overflow-y-auto">
              <MaintenanceNavigatorSidebar
                clientName={clientOrganizationName}
                clientPartyId={client.partyId}
                entityTasks={currentEntityTasks}
                showsOwnershipStructure={hasOwnershipStructure}
                activeTarget={activeNavigatorTarget}
                hasActiveUpdate={Boolean(
                  activeRequestStatus || displayedRequestId
                )}
                updateScope={updateScope}
                isDocumentDiscoveryPending={isDocumentDiscoveryPending}
                summaryState={getMaintenanceRequestSummaryState({
                  activeRequestStatus,
                  entityTasks: currentEntityTasks,
                  isDocumentDiscoveryPending,
                })}
                onNavigate={(target) => {
                  if (target.kind === 'overview') {
                    setView({ id: 'profile' });
                    return;
                  }
                  if (target.kind === 'organization') {
                    setView({ id: 'organization' });
                    return;
                  }
                  if (target.kind === 'ownership') {
                    setView({ id: 'ownership', returnTo: { id: 'profile' } });
                    return;
                  }
                  if (target.kind === 'request') {
                    openRequest();
                    return;
                  }
                  openParty(target.partyId);
                }}
                onReviewAndSubmit={() => {
                  resetVerificationAttempt();
                  setView({ id: 'review' });
                }}
                onViewRequestDetails={() => {
                  if (activeRequestStatus === 'NEW') {
                    resetVerificationAttempt();
                  }
                  setView({
                    id:
                      activeRequestStatus === 'NEW'
                        ? 'review'
                        : 'submitted-review',
                  });
                }}
              />
            </aside>
          ) : null}
          <main
            data-maintenance-main=""
            className={cn(
              // Detail pages size to their own column, not the whole component beside the sidebar.
              'eb-min-w-0 eb-@container',
              isSplitLayout && 'eb-max-h-[calc(100vh-2rem)] eb-overflow-y-auto'
            )}
          >
            <MaintenanceNavigatorVisibleProvider value={isSplitLayout}>
              {view.id === 'receipt' && verificationMutation.data ? (
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
                profileOverview
              ) : view.id === 'review' ? (
                <MaintenanceReviewView
                  mode="draft"
                  updateScope={updateScope}
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
                  canEditParty={canEditReviewParty}
                  canEditOrganization={canEditOrganization}
                  canCancelChanges={canCancel}
                  onOpenParty={(partyId) =>
                    openParty(partyId, { id: 'review' })
                  }
                  onOpenOrganization={() =>
                    setView({ id: 'organization', returnTo: { id: 'review' } })
                  }
                  onEditParty={(partyId) =>
                    editRelatedParty(partyId, { id: 'review' })
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
                    currentProjection.partyChanges.find(
                      (change) => change.partyId === partyId
                    )?.action === 'ADD'
                      ? discardPendingAddition(partyId, { id: 'review' })
                      : setCancelTarget({ scope: 'party', partyId })
                  }
                  canCancelAll={canCancel}
                  onCancelAll={() => setCancelTarget({ scope: 'all' })}
                  onOpenOwnership={
                    hasOwnershipStructure
                      ? () =>
                          setView({
                            id: 'ownership',
                            returnTo: { id: 'review' },
                          })
                      : undefined
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
                      setView({
                        id: 'attestations',
                        returnTo: { id: 'review' },
                      });
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
                  updateScope={updateScope}
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
                    {
                      label: tString([
                        `requestDetails.title.${updateScope}`,
                      ] as unknown as TemplateStringsArray),
                    },
                  ]}
                  clientPartyId={client.partyId}
                  onOpenParty={(partyId) =>
                    openParty(partyId, { id: 'submitted-review' })
                  }
                  onOpenOrganization={() =>
                    setView({
                      id: 'organization',
                      returnTo: { id: 'submitted-review' },
                    })
                  }
                  onOpenOwnership={
                    hasOwnershipStructure
                      ? () =>
                          setView({
                            id: 'ownership',
                            returnTo: { id: 'submitted-review' },
                          })
                      : undefined
                  }
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
                    ...getReturnViewBreadcrumbs(
                      view.returnTo ?? { id: 'profile' }
                    ),
                    { label: tString('organization') },
                  ]}
                  canEdit={canEditOrganization}
                  canCancel={
                    canCancel && Boolean(currentEntityTasks.organization.change)
                  }
                  backLabel={getDetailBackLabel(view.returnTo)}
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
                      id:
                        activeRequestStatus === 'NEW'
                          ? 'review'
                          : 'submitted-review',
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
                      returnTo: view,
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
                  parties={ownershipDisplayParties}
                  nodeChanges={ownershipChanges.changes}
                  previousParentIds={ownershipChanges.previousParentIds}
                  getPartyStatus={(partyId) => {
                    const task = findRelatedPartyTask(partyId);
                    return task
                      ? getMaintenancePartyStatus(
                          task,
                          isDocumentDiscoveryPending
                        )
                      : undefined;
                  }}
                  canCancelPendingRemoval={canCancel}
                  onCancelPendingRemoval={(partyId) =>
                    setCancelTarget({ scope: 'party', partyId })
                  }
                  breadcrumbs={[
                    profileBreadcrumb(),
                    { label: tString('ownership.title') },
                  ]}
                  canAddOwner={canManageDirectOwnership}
                  ownerLimitReached={beneficialOwnerCount >= 4}
                  canManageIndirectOwnership={canManageIndirectOwnership}
                  onAddBeneficialOwner={(parentPartyId) => {
                    if (parentPartyId === client.partyId) {
                      // With only direct ownership allowed there is nothing to choose.
                      setView(
                        canManageIndirectOwnership
                          ? {
                              id: 'owner-relationship',
                              mode: 'add-owner',
                              returnTo: view,
                            }
                          : {
                              id: 'add-party',
                              parentPartyId,
                              natureOfOwnership: 'Direct',
                              allowedRoles: ['BENEFICIAL_OWNER'],
                              returnTo: view,
                            }
                      );
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
                  onSelectOwner={(partyId) => openParty(partyId, view)}
                  onMoveParty={setOwnershipMovePartyId}
                  onInsertIntermediary={(partyId) =>
                    setView({
                      id: 'owner-relationship',
                      mode: 'change-owner-path',
                      partyId,
                      returnTo: view,
                    })
                  }
                  canMoveParty={canMoveOwnershipParty}
                  canRemoveIntermediary={canRemoveIntermediary}
                  canDiscardPendingParty={canDiscardPendingOwnershipParty}
                  onRequestRemoveIntermediary={(partyId) =>
                    setIntermediaryRemovalTarget({ partyId, returnTo: view })
                  }
                  onDiscardPendingParty={(partyId) =>
                    discardPendingAddition(partyId, view)
                  }
                  canEditParty={canEditReviewParty}
                  onEditParty={(partyId) => editRelatedParty(partyId, view)}
                  canRemovePerson={(partyId) => {
                    const task = findPersonTask(partyId);
                    return (
                      canRemoveRelatedParty(task) ||
                      needsReplacementController(task)
                    );
                  }}
                  removeRequiresControllerReplacement={(partyId) =>
                    needsReplacementController(findPersonTask(partyId))
                  }
                  onRemovePerson={setRemovePartyId}
                  backLabel={getDetailBackLabel(view.returnTo)}
                  onBack={() => setView(view.returnTo)}
                />
              ) : view.id === 'controller-replacement' ? (
                <MaintenanceControllerReplacementView
                  candidates={controllerReplacementCandidates}
                  breadcrumbs={[
                    ...getReturnViewBreadcrumbs(view.returnTo),
                    { label: tString('controllerReplacement.title') },
                  ]}
                  onSelectCandidate={async (candidatePartyId) => {
                    const candidate =
                      currentProjection.proposedClient.parties?.find(
                        (party) => party.id === candidatePartyId
                      );
                    await applyPartySteps([
                      {
                        kind: 'update',
                        partyId: candidatePartyId,
                        requestBody: {
                          roles: [
                            ...new Set([
                              ...(candidate?.roles ?? []),
                              'CONTROLLER',
                            ]),
                          ],
                        },
                      },
                      {
                        kind: 'update',
                        partyId: view.outgoingPartyId,
                        requestBody: getRetiredPartyUpdate(
                          view.outgoingPartyId,
                          view.outgoingControllerRoles
                        ),
                      },
                    ]);
                    setView(view.returnTo);
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
                  allowsIndirectOwnership={canManageIndirectOwnership}
                  clientPartyId={client.partyId}
                  clientName={clientOrganizationName}
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
                      const party =
                        currentProjection.proposedClient.parties?.find(
                          (candidate) => candidate.id === view.partyId
                        );
                      await updateParty(view.partyId, {
                        roles: [
                          ...new Set([
                            ...(party?.roles ?? []),
                            'BENEFICIAL_OWNER',
                          ]),
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
                  onChooseIntermediary={async (parentPartyId) => {
                    if (view.mode === 'change-owner-path' && view.partyId) {
                      await moveOwner(view.partyId, parentPartyId);
                      setView(view.returnTo);
                      return;
                    }
                    setView({
                      id: 'add-party',
                      parentPartyId,
                      natureOfOwnership: 'Indirect',
                      allowedRoles: ['BENEFICIAL_OWNER'],
                      initialPartyId:
                        view.mode === 'controller-owner'
                          ? view.partyId
                          : undefined,
                      returnTo: view.returnTo,
                    });
                  }}
                  onAddIntermediary={() =>
                    setView({
                      id: 'add-intermediary',
                      parentPartyId: client.partyId!,
                      ownerToReplaceId:
                        view.mode === 'change-owner-path'
                          ? view.partyId
                          : undefined,
                      ownerToAddId:
                        view.mode === 'controller-owner'
                          ? view.partyId
                          : undefined,
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
                              party.id ===
                              (view.ownerToReplaceId ?? view.ownerToAddId)
                          ) ?? {},
                          undefined,
                          tString('notProvided')
                        ).displayName
                      : undefined
                  }
                  isSubmitting={
                    (createPartyMutation?.isPending ?? false) ||
                    ownershipOperationsMutation.isPending
                  }
                  error={
                    createPartyMutation?.error ??
                    (view.ownerToReplaceId
                      ? ownershipOperationsMutation.error
                      : undefined)
                  }
                  breadcrumbs={[
                    ...getReturnViewBreadcrumbs(view.returnTo),
                    { label: tString('ownership.addIntermediary') },
                  ]}
                  onBack={() => setView(view.returnTo)}
                  onSave={saveIntermediary}
                />
              ) : view.id === 'add-party' &&
                (view.parentPartyId ?? client.partyId) ? (
                <MaintenanceAddPartyView
                  parentPartyId={view.parentPartyId ?? client.partyId!}
                  natureOfOwnership={view.natureOfOwnership}
                  isControllerReplacement={Boolean(view.replacementPartyId)}
                  initialParty={
                    view.initialPartyId
                      ? currentProjection.proposedClient.parties?.find(
                          (party) => party.id === view.initialPartyId
                        )
                      : undefined
                  }
                  canAlsoBeBeneficialOwner={
                    hasOwnershipStructure && beneficialOwnerCount < 4
                  }
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
                      ? currentEntityTasks.organization.party
                          .organizationDetails.countryOfFormation
                      : undefined
                  }
                  breadcrumbs={[
                    ...getReturnViewBreadcrumbs(view.returnTo),
                    ...((view.parentPartyId ?? client.partyId) !==
                    client.partyId
                      ? [
                          {
                            label:
                              currentProjection.proposedClient.parties?.find(
                                (party) =>
                                  party.id ===
                                  (view.parentPartyId ?? client.partyId)
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
                  isPendingAddition={Boolean(
                    view.partyId &&
                      currentEntityTasks.intermediaryOrganizations.find(
                        (task) => task.partyId === view.partyId
                      )?.isPendingAddition
                  )}
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
                    ...getReturnViewBreadcrumbs(
                      view.returnTo ?? { id: 'profile' }
                    ),
                    {
                      label:
                        selectedIntermediaryTask.proposedParty
                          .organizationDetails?.organizationName ??
                        tString('notProvided'),
                    },
                  ]}
                  canEdit={
                    !selectedIntermediaryTask.isUnreviewed &&
                    (selectedIntermediaryTask.isPendingAddition
                      ? canMutateDraft
                      : canEditIntermediary)
                  }
                  canCancel={
                    canCancel && Boolean(selectedIntermediaryTask.change)
                  }
                  clientPartyId={client.partyId}
                  clientName={clientOrganizationName}
                  ownershipParties={ownershipDisplayParties}
                  ownershipPath={selectedOwnershipPath}
                  canRemoveIntermediary={canRemoveIntermediary(view.partyId)}
                  onChangeConnection={
                    canMoveOwnershipParty(view.partyId)
                      ? () => setOwnershipMovePartyId(view.partyId)
                      : undefined
                  }
                  backLabel={getDetailBackLabel(view.returnTo)}
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
                      id:
                        activeRequestStatus === 'NEW'
                          ? 'review'
                          : 'submitted-review',
                    });
                  }}
                  onCancelChanges={() =>
                    selectedIntermediaryTask.isPendingAddition
                      ? discardPendingAddition(
                          view.partyId,
                          view.returnTo ?? { id: 'profile' }
                        )
                      : setCancelTarget({
                          scope: 'party',
                          partyId: view.partyId,
                        })
                  }
                  onRemoveIntermediary={() =>
                    setIntermediaryRemovalTarget({
                      partyId: view.partyId,
                      returnTo: view.returnTo ?? { id: 'profile' },
                    })
                  }
                  onViewOwnership={
                    view.returnTo?.id === 'ownership'
                      ? undefined
                      : () =>
                          setView({
                            id: 'ownership',
                            // A lateral jump: Back keeps pointing where this page's Back did.
                            returnTo: view.returnTo ?? { id: 'profile' },
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
                  canEdit={
                    !selectedTask.isUnreviewed &&
                    (selectedTask.isPendingAddition ? canMutateDraft : canEdit)
                  }
                  canCancel={canCancel && Boolean(selectedTask.change)}
                  canRemove={
                    canRemoveSelectedParty ||
                    selectedPartyNeedsReplacementController
                  }
                  canAddBeneficialOwnerRole={canAddBeneficialOwnerRole}
                  canManageOwnership={canManageSelectedOwnership}
                  isLoadingDocuments={isDocumentDiscoveryPending}
                  documentError={documentRequestsQuery.error}
                  breadcrumbs={[
                    ...getReturnViewBreadcrumbs(
                      view.returnTo ?? { id: 'profile' }
                    ),
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
                      id:
                        activeRequestStatus === 'NEW'
                          ? 'review'
                          : 'submitted-review',
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
                  onChangeConnection={
                    canMoveOwnershipParty(view.partyId)
                      ? () => setOwnershipMovePartyId(view.partyId)
                      : undefined
                  }
                  onKeepAsBeneficialOwner={
                    canKeepReplacedControllerAsOwner
                      ? keepReplacedControllerAsOwner
                      : undefined
                  }
                  onAddBeneficialOwnerRole={() => {
                    setView({
                      id: 'owner-relationship',
                      mode: 'controller-owner',
                      partyId: view.partyId,
                      returnTo: view,
                    });
                  }}
                  onManageOwnership={
                    !hasOwnershipStructure || view.returnTo?.id === 'ownership'
                      ? undefined
                      : () =>
                          setView({
                            id: 'ownership',
                            // A lateral jump: Back keeps pointing where this page's Back did.
                            returnTo: view.returnTo ?? { id: 'profile' },
                          })
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
                  backLabel={getDetailBackLabel(view.returnTo)}
                  removeActionLabel={tString(
                    selectedPartyNeedsReplacementController
                      ? 'removeParty.replaceController'
                      : 'removeParty.action'
                  )}
                  requiresControllerReplacement={
                    selectedPartyNeedsReplacementController
                  }
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
                  isPendingAddition={selectedTask?.isPendingAddition}
                  lockedCountry={
                    currentEntityTasks.organization.party?.organizationDetails
                      ?.organizationType === 'SOLE_PROPRIETORSHIP'
                      ? currentEntityTasks.organization.party
                          .organizationDetails.countryOfFormation
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
            </MaintenanceNavigatorVisibleProvider>
          </main>
        </div>
      )}

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
        open={Boolean(cancelTarget && discardContent)}
        content={discardContent}
        updateScope={updateScope}
        clientPartyId={client.partyId}
        error={cancelMaintenanceMutation.error ?? partyStepsMutation.error}
        isPending={
          cancelMaintenanceMutation.isPending || partyStepsMutation.isPending
        }
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(undefined);
            cancelMaintenanceMutation.reset();
            partyStepsMutation.reset();
          }
        }}
        onConfirm={confirmCancellation}
      />
      <RemoveIntermediaryDialog
        open={Boolean(intermediaryRemovalTarget)}
        isPendingAddition={intermediaryRemovalTask?.isPendingAddition ?? false}
        name={intermediaryRemovalName}
        parentName={intermediaryRemovalParentName}
        directChildNames={intermediaryRemovalDirectChildNames}
        dependentNames={intermediaryRemovalDependentNames}
        isPending={ownershipOperationsMutation.isPending}
        error={ownershipOperationsMutation.error}
        onOpenChange={(open) => {
          if (!open) {
            setIntermediaryRemovalTarget(undefined);
            resetOwnershipOperations();
          }
        }}
        onConfirm={confirmIntermediaryRemoval}
      />
      <MoveOwnershipDialog
        open={Boolean(ownershipMoveParty)}
        partyName={
          ownershipMoveParty?.organizationDetails?.organizationName ??
          getMaintenancePartyIdentity(
            ownershipMoveParty ?? {},
            undefined,
            tString('notProvided')
          ).displayName
        }
        currentParentName={
          ownershipMoveParent?.organizationDetails?.organizationName ??
          clientOrganizationName
        }
        currentParentIsClient={!ownershipMoveParent}
        destinations={ownershipMoveDestinations}
        isPending={ownershipOperationsMutation.isPending}
        error={ownershipOperationsMutation.error}
        onOpenChange={(open) => {
          if (!open) {
            setOwnershipMovePartyId(undefined);
            resetOwnershipOperations();
          }
        }}
        onConfirm={async (destinationPartyId) => {
          if (!ownershipMovePartyId) return;
          await moveOwner(ownershipMovePartyId, destinationPartyId);
          setOwnershipMovePartyId(undefined);
        }}
      />
      <RemoveRelatedPartyDialog
        open={Boolean(removePartyId)}
        name={
          removalTask
            ? getMaintenancePartyIdentity(
                removalTask.party,
                undefined,
                tString('notProvided')
              ).displayName
            : ''
        }
        isPending={updatePartyMutation?.isPending ?? false}
        error={updatePartyMutation?.error}
        replacementRequired={removalNeedsReplacementController}
        controllerIsBeneficialOwner={Boolean(
          removalTask?.proposedParty.roles?.includes('BENEFICIAL_OWNER')
        )}
        replacementAlreadyAdded={Boolean(pendingReplacementController)}
        onOpenChange={(open) => {
          if (!open) {
            setRemovePartyId(undefined);
            updatePartyMutation.reset();
          }
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
            ? [
                ...new Set([
                  ...(outgoingController?.roles ?? []).filter(
                    (role) => role !== 'CONTROLLER'
                  ),
                  'BENEFICIAL_OWNER',
                ]),
              ]
            : undefined;
          if (pendingReplacementController) {
            await updateParty(
              partyId,
              getRetiredPartyUpdate(partyId, outgoingControllerRoles)
            );
            setRemovePartyId(undefined);
            return;
          }
          const returnTo: MaintenanceReturnView =
            view.id === 'entity' || view.id === 'ownership'
              ? view
              : { id: 'entity', partyId };
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
