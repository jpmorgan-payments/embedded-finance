import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';

import { useUpdatePartyLegacy } from '@/api/generated/smbdo';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import { OwnersSectionScreen } from '@/core/OnboardingFlow/screens/OwnersSectionScreen/OwnersSectionScreen';

vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useUpdatePartyLegacy: vi.fn(),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

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
      },
    },
  ],
} as unknown as ClientResponse;

const baseContext = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  showLinkAccountStep: false,
  showDownloadChecklist: false,
} as unknown as OnboardingContextType;

function renderOwners(overrides: Partial<OnboardingContextType> = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider value={{ ...baseContext, ...overrides }}>
        <FlowProvider initialScreenId="owners-section" flowConfig={flowConfig}>
          <OwnersSectionScreen />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('OwnersSectionScreen — enableIndirectOwnership feature flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useUpdatePartyLegacy).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      error: undefined,
      status: 'idle',
    } as unknown as ReturnType<typeof useUpdatePartyLegacy>);
  });

  test('flag off: renders the legacy Add owner button and no indirect gating', () => {
    renderOwners({ enableIndirectOwnership: false });

    expect(
      screen.getByRole('button', { name: /add owner/i })
    ).toBeInTheDocument();
    // The indirect gating question ("does anyone own 25% ... indirectly")
    // must not appear when the feature is disabled.
    expect(screen.queryByText(/indirectly/i)).not.toBeInTheDocument();
  });

  test('flag omitted: behaves the same as disabled (legacy flow)', () => {
    renderOwners();

    expect(
      screen.getByRole('button', { name: /add owner/i })
    ).toBeInTheDocument();
  });

  test('flag on: renders the indirect ownership experience instead of the legacy button', () => {
    renderOwners({ enableIndirectOwnership: true });

    // The legacy secondary "Add owner" button is replaced by the indirect
    // ownership component (which owns its own add-owner flow).
    expect(
      screen.queryByRole('button', { name: /^add owner$/i })
    ).not.toBeInTheDocument();
  });
});
