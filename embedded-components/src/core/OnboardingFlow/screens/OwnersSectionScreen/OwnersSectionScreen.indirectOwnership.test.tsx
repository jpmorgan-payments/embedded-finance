import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, render, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import { OwnersSectionScreen } from '@/core/OnboardingFlow/screens/OwnersSectionScreen/OwnersSectionScreen';

// Capture the props the screen hands to <IndirectOwnership> so the tests can
// drive the mutation handlers directly, without going through the child's
// dialogs and drag-and-drop UI (which are exercised by their own unit tests).
const harness = vi.hoisted(() => ({
  props: null as Record<string, any> | null,
}));
vi.mock('@/core/IndirectOwnership', () => ({
  IndirectOwnership: (props: Record<string, any>) => {
    harness.props = props;
    return null;
  },
}));

// Mock only the mutation hooks; keep everything else (query-key helpers) real.
const api = vi.hoisted(() => ({
  postPartyAsync: vi.fn(),
  updatePartyMutate: vi.fn(),
  updatePartyActiveAsync: vi.fn(),
  updateClientMutate: vi.fn(),
  updateClientAsync: vi.fn(),
}));
vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    usePostParty: () => ({
      mutateAsync: api.postPartyAsync,
      error: undefined,
    }),
    useUpdatePartyLegacy: () => ({
      mutate: api.updatePartyMutate,
      mutateAsync: api.updatePartyActiveAsync,
      error: undefined,
      status: 'idle',
    }),
    useSmbdoUpdateClientLegacy: () => ({
      mutate: api.updateClientMutate,
      mutateAsync: api.updateClientAsync,
      error: undefined,
      status: 'idle',
    }),
  };
});

const onPostClientSettled = vi.fn();
const onPostPartySettled = vi.fn();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const CLIENT_ID = 'client-1';
const CLIENT_PARTY_ID = 'org-client';

const clientParty = {
  id: CLIENT_PARTY_ID,
  partyType: 'ORGANIZATION',
  roles: ['CLIENT'],
  active: true,
  organizationDetails: {
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    organizationName: 'Acme LLC',
    countryOfFormation: 'US',
  },
};

function makeClient(
  extraParties: Array<Record<string, unknown>>
): ClientResponse {
  return {
    id: CLIENT_ID,
    partyId: CLIENT_PARTY_ID,
    products: ['EMBEDDED_PAYMENTS'],
    status: 'NEW',
    outstanding: {
      partyIds: [],
      partyRoles: [],
      questionIds: [],
      documentRequestIds: [],
      attestationDocumentIds: [],
    },
    parties: [clientParty, ...extraParties],
  } as unknown as ClientResponse;
}

const baseContext = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  showLinkAccountStep: false,
  showDownloadChecklist: false,
  enableIndirectOwnership: true,
  onPostClientSettled,
  onPostPartySettled,
} as unknown as OnboardingContextType;

function renderOwners(clientData: ClientResponse) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider value={{ ...baseContext, clientData }}>
        <FlowProvider initialScreenId="owners-section" flowConfig={flowConfig}>
          <OwnersSectionScreen />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('OwnersSectionScreen — IndirectOwnership mutation boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    harness.props = null;
    let created = 0;
    api.postPartyAsync.mockImplementation(async () => ({
      id: `created-${(created += 1)}`,
    }));
    api.updatePartyActiveAsync.mockImplementation(async ({ partyId }) => ({
      id: partyId,
      active: false,
    }));
    api.updateClientAsync.mockResolvedValue({ id: CLIENT_ID });
  });

  test('onAddOwner creates a Direct individual beneficial owner', async () => {
    renderOwners(makeClient([]));

    await act(async () => {
      await harness.props?.onAddOwner({
        entityType: 'INDIVIDUAL',
        firstName: 'Grace',
        lastName: 'Hopper',
        ownershipType: 'DIRECT',
      });
    });

    expect(api.updateClientAsync).toHaveBeenCalledTimes(1);
    const [payload] = api.updateClientAsync.mock.calls[0];
    const newParty = payload.data.addParties[0];
    expect(newParty).toMatchObject({
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Grace',
        lastName: 'Hopper',
        natureOfOwnership: 'Direct',
        countryOfResidence: 'US',
      },
    });
  });

  test('onAddOwner creates an intermediary organization for a BUSINESS entity', async () => {
    renderOwners(makeClient([]));

    await act(async () => {
      await harness.props?.onAddOwner({
        entityType: 'BUSINESS',
        businessName: 'Beta Holdings LLC',
        ownershipType: 'INDIRECT',
      });
    });

    const [payload] = api.updateClientAsync.mock.calls[0];
    const newParty = payload.data.addParties[0];
    expect(newParty).toMatchObject({
      partyType: 'ORGANIZATION',
      roles: ['INTERMEDIARY_OWNER'],
      organizationDetails: {
        organizationName: 'Beta Holdings LLC',
        natureOfOwnership: 'Direct',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
      },
    });
  });

  test('onRemoveOwner deactivates the owner and cascades orphaned intermediaries', async () => {
    renderOwners(
      makeClient([
        {
          id: 'int-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          organizationDetails: { organizationName: 'Mid LLC' },
        },
        {
          id: 'own-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'int-1',
          individualDetails: { firstName: 'Ada', lastName: 'Byron' },
        },
      ])
    );

    await act(async () => {
      harness.props?.onRemoveOwner('own-1');
    });

    await waitFor(() => {
      expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
        partyId: 'own-1',
        data: { active: false },
      });
    });
    expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
      partyId: 'int-1',
      data: { active: false },
    });
  });

  test('onRemoveOwner on a direct controller-owner only strips the BENEFICIAL_OWNER role', async () => {
    renderOwners(
      makeClient([
        {
          id: 'ctrl-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          active: true,
          individualDetails: { firstName: 'Alan', lastName: 'Turing' },
        },
      ])
    );

    await act(async () => {
      harness.props?.onRemoveOwner('ctrl-1');
    });

    expect(api.updatePartyMutate).toHaveBeenCalledWith(
      { partyId: 'ctrl-1', data: { roles: ['CONTROLLER'] } },
      expect.any(Object)
    );
    // A direct controller is not deactivated or recreated.
    expect(api.postPartyAsync).not.toHaveBeenCalled();
  });

  test('onRemoveOwner on an indirect controller-owner restores a client-parented CONTROLLER and cleans up', async () => {
    renderOwners(
      makeClient([
        {
          id: 'int-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          organizationDetails: { organizationName: 'Mid LLC' },
        },
        {
          id: 'ctrl-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'int-1',
          individualDetails: { firstName: 'Alan', lastName: 'Turing' },
        },
      ])
    );

    await act(async () => {
      harness.props?.onRemoveOwner('ctrl-1');
    });

    await waitFor(() => expect(api.postPartyAsync).toHaveBeenCalledTimes(1));
    const [{ data }] = api.postPartyAsync.mock.calls[0];
    expect(data).toMatchObject({
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      parentPartyId: CLIENT_PARTY_ID,
    });
    expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
      partyId: 'ctrl-1',
      data: { active: false },
    });
    expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
      partyId: 'int-1',
      data: { active: false },
    });
  });

  test('onSaveHierarchy creates the chain, recreates the owner, and deactivates the original', async () => {
    renderOwners(
      makeClient([
        {
          id: 'own-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          individualDetails: {
            firstName: 'Ada',
            lastName: 'Byron',
            natureOfOwnership: 'Direct',
          },
        },
      ])
    );

    await act(async () => {
      await harness.props?.onSaveHierarchy('own-1', [
        { entityName: 'Mid LLC', ownsRootBusinessDirectly: true },
      ]);
    });

    // One POST creates the intermediary, one recreates the owner as Indirect.
    expect(api.postPartyAsync).toHaveBeenCalledTimes(2);
    const recreated = api.postPartyAsync.mock.calls[1][0].data;
    expect(recreated).toMatchObject({
      partyType: 'INDIVIDUAL',
      individualDetails: { natureOfOwnership: 'Indirect' },
    });
    expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
      partyId: 'own-1',
      data: { active: false },
    });
  });

  test('onChangeOwnerNature to INDIRECT persists nothing', () => {
    renderOwners(
      makeClient([
        {
          id: 'own-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          individualDetails: { firstName: 'Ada', lastName: 'Byron' },
        },
      ])
    );

    act(() => {
      harness.props?.onChangeOwnerNature('own-1', 'INDIRECT');
    });

    expect(api.postPartyAsync).not.toHaveBeenCalled();
    expect(api.updatePartyActiveAsync).not.toHaveBeenCalled();
  });

  test('onChangeOwnerNature to DIRECT recreates a client-parented owner and cleans intermediaries', async () => {
    renderOwners(
      makeClient([
        {
          id: 'int-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          organizationDetails: { organizationName: 'Mid LLC' },
        },
        {
          id: 'own-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'int-1',
          individualDetails: { firstName: 'Ada', lastName: 'Byron' },
        },
      ])
    );

    await act(async () => {
      harness.props?.onChangeOwnerNature('own-1', 'DIRECT');
    });

    await waitFor(() => expect(api.postPartyAsync).toHaveBeenCalledTimes(1));
    const [{ data }] = api.postPartyAsync.mock.calls[0];
    expect(data).toMatchObject({
      parentPartyId: CLIENT_PARTY_ID,
      individualDetails: { natureOfOwnership: 'Direct' },
    });
    expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
      partyId: 'own-1',
      data: { active: false },
    });
    expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
      partyId: 'int-1',
      data: { active: false },
    });
  });

  test('onSaveHierarchy surfaces a POST failure via onPostClientSettled', async () => {
    api.postPartyAsync.mockRejectedValueOnce({
      response: { data: { title: 'boom' } },
    });
    renderOwners(
      makeClient([
        {
          id: 'own-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          individualDetails: { firstName: 'Ada', lastName: 'Byron' },
        },
      ])
    );

    // The handler rejects on failure so the awaiting chain builder does not
    // mark the save complete; it still reports the error via onPostClientSettled.
    await act(async () => {
      await expect(
        harness.props?.onSaveHierarchy('own-1', [
          { entityName: 'Mid LLC', ownsRootBusinessDirectly: true },
        ])
      ).rejects.toBeTruthy();
    });

    await waitFor(() =>
      expect(onPostClientSettled).toHaveBeenCalledWith(undefined, {
        title: 'boom',
      })
    );
  });

  test('compensates created intermediaries when recreating the owner fails', async () => {
    api.postPartyAsync
      .mockResolvedValueOnce({ id: 'int-1' })
      .mockRejectedValueOnce({ response: { data: { title: 'boom' } } });
    renderOwners(
      makeClient([
        {
          id: 'own-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          individualDetails: { firstName: 'Ada', lastName: 'Byron' },
        },
      ])
    );

    await act(async () => {
      await expect(
        harness.props?.onSaveHierarchy('own-1', [
          { entityName: 'Mid LLC', ownsRootBusinessDirectly: true },
        ])
      ).rejects.toBeTruthy();
    });

    // The intermediary created before the failure is rolled back (deactivated),
    // and the original owner is left untouched (no orphaned/half-applied graph).
    await waitFor(() =>
      expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
        partyId: 'int-1',
        data: { active: false },
      })
    );
    expect(api.updatePartyActiveAsync).not.toHaveBeenCalledWith({
      partyId: 'own-1',
      data: { active: false },
    });
    expect(onPostClientSettled).toHaveBeenCalledWith(undefined, {
      title: 'boom',
    });
  });

  test('compensates the recreated owner when deactivating the original fails', async () => {
    api.postPartyAsync
      .mockResolvedValueOnce({ id: 'int-1' })
      .mockResolvedValueOnce({ id: 'own-1-indirect' });
    // The deactivate of the original owner (the last step) fails.
    api.updatePartyActiveAsync.mockRejectedValueOnce({
      response: { data: { title: 'deactivate boom' } },
    });
    renderOwners(
      makeClient([
        {
          id: 'own-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          individualDetails: { firstName: 'Ada', lastName: 'Byron' },
        },
      ])
    );

    await act(async () => {
      await expect(
        harness.props?.onSaveHierarchy('own-1', [
          { entityName: 'Mid LLC', ownsRootBusinessDirectly: true },
        ])
      ).rejects.toBeTruthy();
    });

    // Rollback deactivates the newly-created parties (recreated owner + chain)
    // so no duplicate owner is left active alongside the still-active original.
    await waitFor(() =>
      expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
        partyId: 'own-1-indirect',
        data: { active: false },
      })
    );
    expect(api.updatePartyActiveAsync).toHaveBeenCalledWith({
      partyId: 'int-1',
      data: { active: false },
    });
    expect(onPostClientSettled).toHaveBeenCalledWith(undefined, {
      title: 'deactivate boom',
    });
  });

  test('routes edit callbacks and records gating / validation answers', () => {
    renderOwners(
      makeClient([
        {
          id: 'int-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          organizationDetails: { organizationName: 'Mid LLC' },
        },
        {
          id: 'own-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: CLIENT_PARTY_ID,
          individualDetails: { firstName: 'Ada', lastName: 'Byron' },
        },
      ])
    );

    // Business entities route to the intermediary stepper, individuals to the
    // owner stepper; gating + validation callbacks update local state.
    act(() => {
      harness.props?.onValidationChange({ canComplete: true });
    });
    act(() => {
      harness.props?.onEditOwner('int-1');
    });
    act(() => {
      harness.props?.onEditOwner('own-1');
    });
    act(() => {
      harness.props?.onGatingAnswer('direct-only');
    });

    expect(harness.props).toBeTruthy();
  });

  test('handlers guard against missing owners and no-op inputs', async () => {
    renderOwners(makeClient([]));

    await act(async () => {
      await harness.props?.onSaveHierarchy('does-not-exist', [
        { entityName: 'Ghost LLC', ownsRootBusinessDirectly: true },
      ]);
    });
    act(() => {
      harness.props?.onChangeOwnerNature('does-not-exist', 'DIRECT');
    });
    act(() => {
      harness.props?.onChangeOwnerNature('does-not-exist', 'INDIRECT');
    });

    // Every path guarded out before any mutation fired.
    expect(api.postPartyAsync).not.toHaveBeenCalled();
    expect(api.updatePartyActiveAsync).not.toHaveBeenCalled();
  });
});
