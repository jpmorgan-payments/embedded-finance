import { useCallback, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
import { useEbInstance } from '@/api/use-axios-instance';

import {
  addLimitedDdaPaymentsProduct,
  cancelLimitedDdaPaymentsAddition,
  cancelMaintenanceRequest,
  createMaintenanceParty,
  downloadMaintenanceAttestation,
  getAllMaintenanceParties,
  getMaintenanceClient,
  getMaintenanceDocumentRequests,
  getMaintenanceQuestions,
  patchMaintenanceParty,
  patchMaintenancePartyName,
  submitMaintenanceVerification,
  updateMaintenanceClientTasks,
  type CompleteMaintenanceRead,
} from '../clientMaintenanceApi';
import {
  isActiveMaintenanceStatus,
  type MaintenanceClientTaskUpdateRequest,
  type MaintenancePartyCreateRequest,
  type MaintenancePartyUpdateRequest,
} from '../models/maintenanceApi.types';
import { validateStableMaintenanceSubmission } from '../utils/maintenanceReview';
import {
  executeOwnershipOperations,
  type OwnershipOperation,
  type OwnershipOperationProgress,
} from '../utils/ownershipOperations';

export const getMaintenanceClientQueryKey = (clientId: string) =>
  ['approved-client-maintenance', 'client', clientId] as const;

export const getMaintenancePartiesQueryKey = (clientId: string) =>
  ['approved-client-maintenance', 'parties', clientId] as const;

export type MaintenancePartyStep =
  | {
      kind: 'update';
      partyId: string;
      requestBody: MaintenancePartyUpdateRequest;
    }
  | { kind: 'discard'; requestId: string; partyId: string };

export function useMaintenanceWorkspace(clientId: string) {
  const { tString } = useTranslationWithTokens('approved-client-maintenance');
  const request = useEbInstance<unknown>();
  const queryClient = useQueryClient();
  const verificationIdempotencyKeyRef = useRef<string>();
  const ownershipOperationProgressRef = useRef(
    new Map() as OwnershipOperationProgress
  );
  const clientQuery = useQuery({
    queryKey: getMaintenanceClientQueryKey(clientId),
    queryFn: () => getMaintenanceClient(request, clientId),
    enabled: Boolean(clientId),
  });
  const maintenanceQuery = useQuery({
    queryKey: getMaintenancePartiesQueryKey(clientId),
    queryFn: () => getAllMaintenanceParties(request, clientId),
    enabled: Boolean(clientId),
  });
  const questionIds = clientQuery.data?.outstanding?.questionIds ?? [];
  const questionsQuery = useQuery({
    queryKey: ['approved-client-maintenance', 'questions', ...questionIds],
    queryFn: () => getMaintenanceQuestions(request, questionIds),
    enabled: questionIds.length > 0,
  });
  const expectedDocumentRequestIds = [
    ...new Set([
      ...(clientQuery.data?.outstanding?.documentRequestIds ?? []),
      ...(clientQuery.data?.parties ?? []).flatMap((party) =>
        (party.validationResponse ?? []).flatMap(
          (validation) => validation.documentRequestIds ?? []
        )
      ),
    ]),
  ];
  const hasEveryExpectedDocumentRequest = (
    documentRequests: Array<{ id?: string }> | undefined
  ) => {
    const returnedIds = new Set(
      (documentRequests ?? []).map((request) => request.id).filter(Boolean)
    );
    return expectedDocumentRequestIds.every((requestId) =>
      returnedIds.has(requestId)
    );
  };
  const documentRequestsQuery = useSmbdoListDocumentRequests(
    {
      clientId,
      // @ts-expect-error The Commerce API supports related-party requests.
      includeRelatedParty: true,
    },
    {
      query: {
        enabled: Boolean(clientId) && expectedDocumentRequestIds.length > 0,
        staleTime: 0,
        refetchInterval: (query) =>
          hasEveryExpectedDocumentRequest(query.state.data?.documentRequests)
            ? false
            : 2000,
      },
    }
  );
  const refreshMaintenanceWorkspace = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getMaintenanceClientQueryKey(clientId),
      }),
      queryClient.invalidateQueries({
        queryKey: getMaintenancePartiesQueryKey(clientId),
      }),
    ]);
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        typeof queryKey[0] === 'string' &&
        queryKey[0].startsWith('/document-requests'),
    });
  }, [clientId, queryClient]);
  const updatePartyNameMutation = useMutation({
    mutationFn: ({
      partyId,
      requestBody,
      idempotencyKey,
    }: {
      partyId: string;
      requestBody: MaintenancePartyUpdateRequest;
      idempotencyKey: string;
    }) =>
      patchMaintenancePartyName(request, partyId, requestBody, idempotencyKey),
    // A rejected write can still be applied, so failures refresh too.
    onSettled: refreshMaintenanceWorkspace,
  });
  const updatePartyMutation = useMutation({
    mutationFn: ({
      partyId,
      requestBody,
    }: {
      partyId: string;
      requestBody: MaintenancePartyUpdateRequest;
    }) =>
      patchMaintenanceParty(request, partyId, requestBody, crypto.randomUUID()),
    onSettled: refreshMaintenanceWorkspace,
  });
  const createPartyMutation = useMutation({
    mutationFn: (requestBody: MaintenancePartyCreateRequest) =>
      createMaintenanceParty(request, requestBody, crypto.randomUUID()),
    onSettled: refreshMaintenanceWorkspace,
  });
  // The API can accept a move without recording the new parent. A dropped move
  // leaves an empty change, withdrawn here unless the party had other changes.
  const confirmOwnershipMove = async (
    partyId: string,
    parentPartyId: string,
    hadChanges: boolean
  ) => {
    const { parties } = await getAllMaintenanceParties(request, clientId);
    const proposals = parties.filter(
      (party) =>
        party.id === partyId &&
        isActiveMaintenanceStatus(party.updateRequest?.status)
    );
    if (proposals.some((party) => party.parentPartyId === parentPartyId)) {
      return;
    }
    const requestId = proposals[0]?.updateRequest?.requestId;
    if (requestId && !hadChanges) {
      await cancelMaintenanceRequest(
        request,
        requestId,
        crypto.randomUUID(),
        partyId
      );
    }
    throw new Error(tString('ownershipEditor.moveNotRecorded'));
  };
  const ownershipOperationsMutation = useMutation({
    mutationFn: async (operations: OwnershipOperation[]) => {
      const partyIdsWithChanges = new Set(
        (
          queryClient.getQueryData<CompleteMaintenanceRead>(
            getMaintenancePartiesQueryKey(clientId)
          )?.parties ?? []
        )
          .filter((party) =>
            isActiveMaintenanceStatus(party.updateRequest?.status)
          )
          .map((party) => party.id)
      );
      await executeOwnershipOperations({
        operations,
        progress: ownershipOperationProgressRef.current,
        createIdempotencyKey: () => crypto.randomUUID(),
        applyOperation: async (operation, idempotencyKey) => {
          if (!('request' in operation)) {
            await cancelMaintenanceRequest(
              request,
              operation.withdrawFromRequestId,
              idempotencyKey,
              operation.partyId
            );
            return;
          }
          await patchMaintenanceParty(
            request,
            operation.partyId,
            operation.request,
            idempotencyKey
          );
          if (operation.request.parentPartyId) {
            await confirmOwnershipMove(
              operation.partyId,
              operation.request.parentPartyId,
              partyIdsWithChanges.has(operation.partyId)
            );
          }
        },
      });
    },
    onSuccess: async () => {
      ownershipOperationProgressRef.current.clear();
      await refreshMaintenanceWorkspace();
    },
    onError: refreshMaintenanceWorkspace,
  });
  const resetOwnershipOperations = useCallback(() => {
    ownershipOperationProgressRef.current.clear();
    ownershipOperationsMutation.reset();
  }, [ownershipOperationsMutation]);
  const addProductMutation = useMutation({
    mutationFn: () =>
      addLimitedDdaPaymentsProduct(request, clientId, crypto.randomUUID()),
    onSettled: refreshMaintenanceWorkspace,
  });
  const cancelProductAdditionMutation = useMutation({
    mutationFn: () =>
      cancelLimitedDdaPaymentsAddition(request, clientId, crypto.randomUUID()),
    onSettled: refreshMaintenanceWorkspace,
  });
  const clientTaskMutation = useMutation({
    mutationFn: (requestBody: MaintenanceClientTaskUpdateRequest) =>
      updateMaintenanceClientTasks(
        request,
        clientId,
        requestBody,
        crypto.randomUUID()
      ),
    onSettled: refreshMaintenanceWorkspace,
  });
  const cancelMaintenanceMutation = useMutation({
    mutationFn: ({
      requestId,
      partyId,
      idempotencyKey,
    }: {
      requestId: string;
      partyId?: string;
      idempotencyKey: string;
    }) => cancelMaintenanceRequest(request, requestId, idempotencyKey, partyId),
    onSettled: refreshMaintenanceWorkspace,
  });
  // One refresh after every step, so a multi-party action lands as one UI update.
  const partyStepsMutation = useMutation({
    mutationFn: async (steps: MaintenancePartyStep[]) => {
      for (const step of steps) {
        if (step.kind === 'update') {
          await patchMaintenanceParty(
            request,
            step.partyId,
            step.requestBody,
            crypto.randomUUID()
          );
        } else {
          await cancelMaintenanceRequest(
            request,
            step.requestId,
            crypto.randomUUID(),
            step.partyId
          );
        }
      }
    },
    onSettled: refreshMaintenanceWorkspace,
  });
  const verificationMutation = useMutation({
    mutationFn: async ({
      reviewedFingerprint,
    }: {
      reviewedFingerprint: string;
    }) => {
      const idempotencyKey =
        verificationIdempotencyKeyRef.current ?? crypto.randomUUID();
      verificationIdempotencyKeyRef.current = idempotencyKey;
      await validateStableMaintenanceSubmission(async () => {
        const [client, maintenance, documentRequests] = await Promise.all([
          getMaintenanceClient(request, clientId),
          getAllMaintenanceParties(request, clientId),
          getMaintenanceDocumentRequests(request, clientId),
        ]);
        return {
          client,
          parties: maintenance.parties,
          documentRequests,
        };
      }, reviewedFingerprint);
      const verification = await submitMaintenanceVerification(
        request,
        clientId,
        idempotencyKey
      );
      return {
        acceptedAt: verification.acceptedAt,
        receivedAt: new Date().toISOString(),
      };
    },
    onSuccess: async () => {
      verificationIdempotencyKeyRef.current = undefined;
      await refreshMaintenanceWorkspace();
    },
  });

  const updatePartyName = useCallback(
    (partyId: string, requestBody: MaintenancePartyUpdateRequest) =>
      updatePartyNameMutation.mutateAsync({
        partyId,
        requestBody,
        idempotencyKey: crypto.randomUUID(),
      }),
    [updatePartyNameMutation]
  );
  const updateParty = useCallback(
    (partyId: string, requestBody: MaintenancePartyUpdateRequest) =>
      updatePartyMutation.mutateAsync({ partyId, requestBody }),
    [updatePartyMutation]
  );
  const cancelChanges = useCallback(
    (requestId: string, partyId?: string) =>
      cancelMaintenanceMutation.mutateAsync({
        requestId,
        partyId,
        idempotencyKey: crypto.randomUUID(),
      }),
    [cancelMaintenanceMutation]
  );
  const submitForReview = useCallback(
    (reviewedFingerprint: string) =>
      verificationMutation.mutateAsync({ reviewedFingerprint }),
    [verificationMutation]
  );
  const resetVerificationAttempt = useCallback(() => {
    verificationIdempotencyKeyRef.current = undefined;
    verificationMutation.reset();
  }, [verificationMutation]);
  const downloadAttestation = useCallback(
    (documentId: string) => downloadMaintenanceAttestation(request, documentId),
    [request]
  );

  return {
    clientQuery,
    maintenanceQuery,
    questionsQuery,
    documentRequestsQuery,
    expectedDocumentRequestIds,
    isDocumentDiscoveryPending:
      expectedDocumentRequestIds.length > 0 &&
      !documentRequestsQuery.error &&
      !hasEveryExpectedDocumentRequest(
        documentRequestsQuery.data?.documentRequests
      ),
    updatePartyNameMutation,
    updatePartyName,
    updatePartyMutation,
    updateParty,
    createPartyMutation,
    createParty: createPartyMutation.mutateAsync,
    ownershipOperationsMutation,
    applyOwnershipOperations: ownershipOperationsMutation.mutateAsync,
    resetOwnershipOperations,
    addProductMutation,
    addProduct: addProductMutation.mutateAsync,
    cancelProductAdditionMutation,
    cancelProductAddition: cancelProductAdditionMutation.mutateAsync,
    clientTaskMutation,
    updateClientTasks: clientTaskMutation.mutateAsync,
    downloadAttestation,
    cancelMaintenanceMutation,
    cancelChanges,
    partyStepsMutation,
    applyPartySteps: partyStepsMutation.mutateAsync,
    verificationMutation,
    submitForReview,
    resetVerificationAttempt,
    refreshMaintenanceWorkspace,
  };
}

export type MaintenanceWorkspace = ReturnType<typeof useMaintenanceWorkspace>;
