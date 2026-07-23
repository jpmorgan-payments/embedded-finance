import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import {
  useSmbdoListDocumentRequests,
  useSmbdoUpdateClientLegacy,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import { OverviewScreen } from '@/core/OnboardingFlow/screens/OverviewScreen/OverviewScreen';

vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoListDocumentRequests: vi.fn(),
    useUpdatePartyLegacy: vi.fn(),
    useSmbdoUpdateClientLegacy: vi.fn(),
  };
});

vi.mock('@/api/generated/ep-recipients', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/api/generated/ep-recipients')>();
  return {
    ...actual,
    useGetAllRecipients: vi.fn(),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// US LLC, controller missing only their tax id -> delta view shows the SSN field.
const clientData = {
  id: 'client-1',
  partyId: 'org-1',
  products: ['EMBEDDED_PAYMENTS'],
  status: 'NEW',
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  parties: [
    {
      id: 'org-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Acme LLC',
        countryOfFormation: 'US',
      },
    },
    {
      id: 'ctrl-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'Ada',
        lastName: 'Byron',
        birthDate: '1990-01-01',
        countryOfResidence: 'US',
        individualIds: [],
      },
    },
  ],
} as unknown as ClientResponse;

const onboardingContext = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  showLinkAccountStep: false,
  showDownloadChecklist: false,
} as unknown as OnboardingContextType;

function renderDeltaOverview() {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider value={onboardingContext}>
        <FlowProvider
          initialScreenId="overview"
          flowConfig={flowConfig}
          deltaModeActive
        >
          <OverviewScreen />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('OverviewScreen delta — Save & continue', () => {
  const updatePartyAsync = vi.fn().mockResolvedValue({ id: 'ctrl-1' });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    vi.mocked(useSmbdoListDocumentRequests).mockReturnValue({
      data: { documentRequests: [] },
    } as unknown as ReturnType<typeof useSmbdoListDocumentRequests>);

    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    vi.mocked(useUpdatePartyLegacy).mockReturnValue({
      mutateAsync: updatePartyAsync,
      error: undefined,
    } as unknown as ReturnType<typeof useUpdatePartyLegacy>);

    vi.mocked(useSmbdoUpdateClientLegacy).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      error: undefined,
    } as unknown as ReturnType<typeof useSmbdoUpdateClientLegacy>);
  });

  test('clicking Save & continue runs the gate without an invalid-hook crash', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderDeltaOverview();

    // The delta view renders the pending SSN field.
    const ssnInput = await screen.findByLabelText(/social security number/i);
    await user.click(ssnInput);
    await user.type(ssnInput, '123456782');

    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    // This client is intentionally missing several details, so the gate should
    // surface the "missing details" alert. The key regression this guards is
    // that the handler RUNS to that point at all — previously it called the
    // hook-based party schemas inside the click handler, threw "Invalid hook
    // call", and the .catch() swallowed it so nothing happened.
    await waitFor(() =>
      expect(screen.getByText(/provide missing details/i)).toBeInTheDocument()
    );

    // And because only a subset is missing, the party PATCH must NOT fire yet.
    expect(updatePartyAsync).not.toHaveBeenCalled();
  });
});
