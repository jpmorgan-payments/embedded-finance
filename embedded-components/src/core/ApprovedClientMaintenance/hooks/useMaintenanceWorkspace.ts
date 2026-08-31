import { useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
import { useEbInstance } from '@/api/use-axios-instance';

import {
  cancelMaintenanceRequest,
  getAllMaintenanceParties,
  getMaintenanceClient,
  getMaintenanceDocumentRequests,
  patchMaintenancePartyName,
  submitMaintenanceVerification,
} from '../clientMaintenanceApi';
import type { PartyNameUpdateRequest } from '../utils/buildPartyNameUpdate';
import { validateStableMaintenanceSubmission } from '../utils/maintenanceReview';

export const getMaintenanceClientQueryKey = (clientId: string) =>
  ['approved-client-maintenance', 'client', clientId] as const;

export const getMaintenancePartiesQueryKey = (clientId: string) =>
  ['approved-client-maintenance', 'parties', clientId] as const;

export function useMaintenanceWorkspace(clientId: string) {
  const request = useEbInstance<unknown>();
  const queryClient = useQueryClient();
  const verificationIdempotencyKeyRef = useRef<string>();
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
      requestBody: PartyNameUpdateRequest;
      idempotencyKey: string;
    }) =>
      patchMaintenancePartyName(request, partyId, requestBody, idempotencyKey),
    onSuccess: refreshMaintenanceWorkspace,
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
    (partyId: string, requestBody: PartyNameUpdateRequest) =>
      updatePartyNameMutation.mutateAsync({
        partyId,
        requestBody,
        idempotencyKey: crypto.randomUUID(),
      }),
    [updatePartyNameMutation]
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

  return {
    clientQuery,
    maintenanceQuery,
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
    cancelMaintenanceMutation,
    cancelChanges,
    verificationMutation,
    submitForReview,
    resetVerificationAttempt,
    refreshMaintenanceWorkspace,
  };
}

export type MaintenanceWorkspace = ReturnType<typeof useMaintenanceWorkspace>;
