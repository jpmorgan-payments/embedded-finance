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

// A US LLC where the org and controller are COMPLETE except the controller's
// residential address, which is absent. The only pending delta field should be
// the controller's personal address.
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
      email: 'biz@acme.com',
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Acme LLC',
        countryOfFormation: 'US',
        yearOfFormation: '2020',
        organizationDescription:
          'Sells widgets to consumers nationwide across many states.',
        industry: { codeType: 'NAICS', code: '541211' },
        organizationIds: [{ idType: 'EIN', issuer: 'US', value: '123456789' }],
        phone: {
          phoneType: 'BUSINESS_PHONE',
          countryCode: '+1',
          phoneNumber: '2015555678',
        },
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['1 Biz Ave'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
      },
    },
    {
      id: 'ctrl-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      email: 'ada@example.com',
      individualDetails: {
        countryOfResidence: 'US',
        firstName: 'Ada',
        lastName: 'Byron',
        jobTitle: 'CEO',
        birthDate: '1990-01-01',
        individualIds: [{ idType: 'SSN', issuer: 'US', value: '123456782' }],
        phone: {
          phoneType: 'MOBILE_PHONE',
          countryCode: '+1',
          phoneNumber: '2015551234',
        },
        // addresses intentionally omitted
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

describe('OverviewScreen delta — controller personal address', () => {
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

  test('renders the pending controller address and blocks Save while empty', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderDeltaOverview();

    // The delta panel should surface the controller's residential address for
    // completion (a country selector plus city/state/postal-code inputs).
    await waitFor(() => {
      expect(
        document.querySelectorAll('input[name$="individualAddress.city"]')
          .length
      ).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole('button', { name: /save & continue/i }));

    // The address is empty, so the gate must NOT save, and the address inputs
    // themselves must be flagged invalid (proving the ADDRESS is validated, not
    // just some other field).
    await waitFor(() => {
      const cityInput = document.querySelector(
        'input[name$="individualAddress.city"]'
      );
      expect(cityInput?.getAttribute('aria-invalid')).toBe('true');
    });
    expect(updatePartyAsync).not.toHaveBeenCalled();
  });
});
