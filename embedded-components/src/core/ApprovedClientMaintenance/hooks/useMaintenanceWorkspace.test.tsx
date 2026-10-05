import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  cancelMaintenanceRequest,
  getAllMaintenanceParties,
  patchMaintenanceParty,
} from '../clientMaintenanceApi';
import type { MaintenanceParty } from '../models/maintenanceApi.types';
import {
  getMaintenancePartiesQueryKey,
  useMaintenanceWorkspace,
} from './useMaintenanceWorkspace';

vi.mock('@/api/use-axios-instance', () => ({
  useEbInstance: () => vi.fn(),
}));

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoListDocumentRequests: () => ({ data: undefined, error: null }),
}));

vi.mock('../clientMaintenanceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../clientMaintenanceApi')>()),
  cancelMaintenanceRequest: vi.fn(),
  getAllMaintenanceParties: vi.fn(),
  getMaintenanceClient: vi.fn().mockResolvedValue({}),
  patchMaintenanceParty: vi.fn(),
}));

const moveOperations = [
  { partyId: 'owner-1', request: { parentPartyId: 'business-1' } },
  {
    partyId: 'owner-1',
    request: { individualDetails: { natureOfOwnership: 'Indirect' as const } },
  },
];

const proposal = (overrides: Partial<MaintenanceParty> = {}) => ({
  id: 'owner-1',
  updateRequest: {
    status: 'NEW' as const,
    action: 'MODIFY' as const,
    requestId: 'request-1',
    submittedAt: '2026-10-01T17:00:00.000Z',
  },
  ...overrides,
});

const renderWorkspace = (cachedProposals: MaintenanceParty[] = []) => {
  // Seeded proposals stand in for what the workspace showed before the write.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(getMaintenancePartiesQueryKey('client-1'), {
    pages: [],
    parties: cachedProposals,
  });
  return renderHook(() => useMaintenanceWorkspace('client-1'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

describe('useMaintenanceWorkspace ownership operations', () => {
  beforeEach(() => {
    vi.mocked(patchMaintenanceParty).mockReset().mockResolvedValue();
    vi.mocked(cancelMaintenanceRequest).mockReset().mockResolvedValue();
    vi.mocked(getAllMaintenanceParties).mockReset();
  });

  test('continues once the API records the new parent', async () => {
    vi.mocked(getAllMaintenanceParties).mockResolvedValue({
      pages: [],
      parties: [proposal({ parentPartyId: 'business-1' })],
    });
    const { result } = renderWorkspace();

    await act(() => result.current.applyOwnershipOperations(moveOperations));

    expect(patchMaintenanceParty).toHaveBeenCalledTimes(2);
    expect(cancelMaintenanceRequest).not.toHaveBeenCalled();
  });

  test('withdraws the empty change a dropped move leaves and reports it', async () => {
    vi.mocked(getAllMaintenanceParties).mockResolvedValue({
      pages: [],
      parties: [proposal()],
    });
    const { result } = renderWorkspace();

    await expect(
      act(() => result.current.applyOwnershipOperations(moveOperations))
    ).rejects.toThrow("The connection wasn't updated.");

    expect(patchMaintenanceParty).toHaveBeenCalledTimes(1);
    expect(cancelMaintenanceRequest).toHaveBeenCalledWith(
      expect.anything(),
      'request-1',
      expect.any(String),
      'owner-1'
    );
  });

  test('keeps earlier changes to a party when its move is dropped', async () => {
    vi.mocked(getAllMaintenanceParties).mockResolvedValue({
      pages: [],
      parties: [proposal()],
    });
    const { result } = renderWorkspace([proposal()]);

    await expect(
      act(() => result.current.applyOwnershipOperations(moveOperations))
    ).rejects.toThrow("The connection wasn't updated.");

    expect(cancelMaintenanceRequest).not.toHaveBeenCalled();
  });

  test('withdraws a pending addition from its request', async () => {
    const { result } = renderWorkspace();

    await act(() =>
      result.current.applyOwnershipOperations([
        { partyId: 'pending-owner', withdrawFromRequestId: 'request-1' },
      ])
    );

    expect(cancelMaintenanceRequest).toHaveBeenCalledWith(
      expect.anything(),
      'request-1',
      expect.any(String),
      'pending-owner'
    );
    expect(patchMaintenanceParty).not.toHaveBeenCalled();
  });
});
