import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cloneDeep } from 'lodash';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor, within } from '@test-utils';

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

const TINKER_ID = '2000000113';

// Rich LLC where the ONLY pending field is Tinker's SSN.
function buildClient(): ClientResponse {
  const client = cloneDeep(efClientCorpEBMock) as ClientResponse;
  client.status = 'NEW';
  client.outstanding = {
    ...client.outstanding,
    questionIds: [],
    partyIds: [],
    partyRoles: [],
  };
  client.questionResponses = [];
  client.parties = client.parties?.map((party) =>
    party.id === TINKER_ID && party.individualDetails
      ? {
          ...party,
          individualDetails: { ...party.individualDetails, individualIds: [] },
        }
      : party
  );
  return client;
}

const clientData = buildClient();

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

describe('delta Save & continue — Tinker owner SSN is PATCHed', () => {
  const updatePartyAsync = vi.fn().mockResolvedValue({ id: TINKER_ID });

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

  test("Tinker's SSN reaches her party PATCH after Save & continue", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderDeltaOverview();

    // Fill Tinker's SSN in her card.
    const card = (await waitFor(() => {
      const el = document.getElementById(
        `delta-section-owners-section:${TINKER_ID}`
      );
      if (!el) throw new Error('Tinker card not found');
      return el;
    })) as HTMLElement;

    const ssnInput = within(card).getByLabelText(/social security number/i);
    await user.click(ssnInput);
    await user.type(ssnInput, '123456782');
    await user.tab();

    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    // Tinker's party PATCH must be sent with her SSN.
    await waitFor(() => expect(updatePartyAsync).toHaveBeenCalled());

    const tinkerCall = updatePartyAsync.mock.calls.find(
      ([args]) => args?.partyId === TINKER_ID
    );
    expect(tinkerCall, 'Tinker party PATCH should be sent').toBeDefined();
    expect(
      tinkerCall?.[0]?.data?.individualDetails?.individualIds?.[0]?.value
    ).toBe('123456782');
  });
});
