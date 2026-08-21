import isEqual from 'lodash/isEqual';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  clientMaintenanceApi,
  type AttestationInput,
} from '@/components/client-maintenance/client-maintenance-api';
import { MAINTENANCE_DEMO_CLIENT_ID } from '@/components/client-maintenance/mocks/client-maintenance-mock-data';
import type { PartyResponse } from '@/components/client-maintenance/models/maintenance-api';
import { buildMaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';

const clientQueryKey = ['client-maintenance', 'client'] as const;
const maintenanceQueryKey = ['client-maintenance', 'requests'] as const;

export function useClientMaintenanceWorkspace() {
  const queryClient = useQueryClient();
  const clientQuery = useQuery({
    queryKey: clientQueryKey,
    queryFn: () => clientMaintenanceApi.getClient(MAINTENANCE_DEMO_CLIENT_ID),
  });
  const maintenanceQuery = useQuery({
    queryKey: maintenanceQueryKey,
    queryFn: () =>
      clientMaintenanceApi.getMaintenanceRequests(MAINTENANCE_DEMO_CLIENT_ID),
  });

  const projection =
    clientQuery.data && maintenanceQuery.data
      ? buildMaintenanceProjection(
          clientQuery.data,
          maintenanceQuery.data.parties
        )
      : undefined;

  async function refreshWorkspace() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: clientQueryKey }),
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKey }),
    ]);
  }

  const updateParty = useMutation({
    mutationFn: ({
      partyId,
      update,
    }: {
      partyId: string;
      update: Partial<PartyResponse>;
    }) => clientMaintenanceApi.updateParty(partyId, update),
    onSuccess: refreshWorkspace,
  });

  const submitForVerification = useMutation({
    mutationFn: async (attestation: AttestationInput) => {
      const [latestClient, latestMaintenance] = await Promise.all([
        clientMaintenanceApi.getClient(MAINTENANCE_DEMO_CLIENT_ID),
        clientMaintenanceApi.getMaintenanceRequests(MAINTENANCE_DEMO_CLIENT_ID),
      ]);
      const latestProjection = buildMaintenanceProjection(
        latestClient,
        latestMaintenance.parties
      );
      if (
        !projection ||
        !isEqual(latestProjection.partyChanges, projection.partyChanges)
      ) {
        await refreshWorkspace();
        throw new Error(
          'The proposed changes were updated. Review the latest values before attesting.'
        );
      }

      await clientMaintenanceApi.addAttestation(
        MAINTENANCE_DEMO_CLIENT_ID,
        attestation
      );
      return clientMaintenanceApi.startVerification(MAINTENANCE_DEMO_CLIENT_ID);
    },
    onSuccess: refreshWorkspace,
  });

  const advanceReview = useMutation({
    mutationFn: clientMaintenanceApi.advanceReview,
    onSuccess: refreshWorkspace,
  });

  const approve = useMutation({
    mutationFn: clientMaintenanceApi.approve,
    onSuccess: refreshWorkspace,
  });

  const reset = useMutation({
    mutationFn: clientMaintenanceApi.reset,
    onSuccess: async () => {
      submitForVerification.reset();
      advanceReview.reset();
      approve.reset();
      updateParty.reset();
      await refreshWorkspace();
    },
  });

  return {
    clientQuery,
    maintenanceQuery,
    projection,
    updateParty,
    submitForVerification,
    advanceReview,
    approve,
    reset,
    refreshWorkspace,
  };
}
