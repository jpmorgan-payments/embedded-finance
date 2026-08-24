import isEqual from 'lodash/isEqual';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  clientMaintenanceApi,
  type AttestationInput,
} from '@/components/client-maintenance/client-maintenance-api';
import { MAINTENANCE_DEMO_CLIENT_ID } from '@/components/client-maintenance/mocks/client-maintenance-mock-data';
import type {
  MaintenancePartyCreate,
  MaintenancePartyUpdate,
} from '@/components/client-maintenance/models/maintenance-api';
import { buildMaintenanceProjection } from '@/components/client-maintenance/utils/build-maintenance-projection';

const clientQueryKey = ['client-maintenance', 'client'] as const;
const maintenanceQueryKey = ['client-maintenance', 'requests'] as const;

const EXAMPLE_PARTY: Omit<MaintenancePartyCreate, 'parentPartyId'> = {
  partyType: 'INDIVIDUAL',
  roles: ['AUTHORIZED_USER'],
  email: 'sam.lee@marketplacevendor.example',
  individualDetails: {
    firstName: 'Sam',
    lastName: 'Lee',
    countryOfResidence: 'US',
  },
};

function requestLimitedDdaPayments() {
  return clientMaintenanceApi.requestProduct(MAINTENANCE_DEMO_CLIENT_ID, {
    productDetails: [
      {
        product: 'EMBEDDED_PAYMENTS',
        subProduct: 'LIMITED_DDA_PAYMENTS',
        action: 'ADD',
      },
    ],
  });
}

function createExampleParty(parentPartyId: string) {
  return clientMaintenanceApi.createParty({
    ...EXAMPLE_PARTY,
    parentPartyId,
  });
}

function updateExampleParty() {
  return clientMaintenanceApi.updateParty('2000000556', {
    individualDetails: { lastName: 'Diaz' },
  });
}

function removeExampleParty() {
  return clientMaintenanceApi.updateParty('2000000557', { active: false });
}

function hasLimitedDdaPayments(
  client: Parameters<typeof buildMaintenanceProjection>[0]
): boolean {
  return (
    client.productDetails?.some(
      (detail) => detail.subProduct === 'LIMITED_DDA_PAYMENTS'
    ) ?? false
  );
}

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
      update: MaintenancePartyUpdate;
    }) => clientMaintenanceApi.updateParty(partyId, update),
    onSuccess: refreshWorkspace,
  });

  const requestProduct = useMutation({
    mutationFn: requestLimitedDdaPayments,
    onSuccess: refreshWorkspace,
  });

  const addParty = useMutation({
    mutationFn: createExampleParty,
    onSuccess: refreshWorkspace,
  });

  const removeParty = useMutation({
    mutationFn: (partyId: string) =>
      clientMaintenanceApi.updateParty(partyId, { active: false }),
    onSuccess: refreshWorkspace,
  });

  const loadAllExamples = useMutation({
    mutationFn: async () => {
      const [latestClient, latestMaintenance] = await Promise.all([
        clientMaintenanceApi.getClient(MAINTENANCE_DEMO_CLIENT_ID),
        clientMaintenanceApi.getMaintenanceRequests(MAINTENANCE_DEMO_CLIENT_ID),
      ]);
      const latestProjection = buildMaintenanceProjection(
        latestClient,
        latestMaintenance.parties
      );
      if (
        latestProjection.productChanges.length === 0 &&
        !hasLimitedDdaPayments(latestProjection.approvedClient)
      ) {
        await requestLimitedDdaPayments();
      }
      if (
        !latestProjection.proposedClient.parties.some(
          (party) => party.email === EXAMPLE_PARTY.email
        )
      ) {
        await createExampleParty(latestClient.partyId);
      }
      if (
        latestProjection.proposedClient.parties.find(
          (party) => party.id === '2000000556'
        )?.individualDetails?.lastName !== 'Diaz'
      ) {
        await updateExampleParty();
      }
      if (
        latestProjection.proposedClient.parties.some(
          (party) => party.id === '2000000557'
        )
      ) {
        await removeExampleParty();
      }
    },
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
        !isEqual(
          {
            productChanges: latestProjection.productChanges,
            partyChanges: latestProjection.partyChanges,
          },
          {
            productChanges: projection.productChanges,
            partyChanges: projection.partyChanges,
          }
        )
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

  const approve = useMutation({
    mutationFn: clientMaintenanceApi.approve,
    onSuccess: refreshWorkspace,
  });

  const reset = useMutation({
    mutationFn: clientMaintenanceApi.reset,
    onSuccess: async () => {
      submitForVerification.reset();
      approve.reset();
      updateParty.reset();
      requestProduct.reset();
      addParty.reset();
      removeParty.reset();
      loadAllExamples.reset();
      await refreshWorkspace();
    },
  });

  return {
    clientQuery,
    maintenanceQuery,
    projection,
    updateParty,
    requestProduct,
    addParty,
    removeParty,
    loadAllExamples,
    submitForVerification,
    approve,
    reset,
    refreshWorkspace,
  };
}
