import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

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

// LLC whose controller is NOT (yet) a beneficial owner.
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

describe('OwnersSectionScreen — defaultControllerNotAnOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useUpdatePartyLegacy).mockReturnValue({
      mutate: vi.fn(),
      error: undefined,
      status: 'idle',
    } as unknown as ReturnType<typeof useUpdatePartyLegacy>);
  });

  test('leaves the controller-owner question unanswered by default', () => {
    renderOwners();
    expect(screen.getByRole('radio', { name: /^no$/i })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /^yes$/i })).not.toBeChecked();
  });

  test('requires an answer before continuing by default', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderOwners();

    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });

  test('pre-answers "No" and does not require an answer when opted in', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderOwners({ defaultControllerNotAnOwner: true });

    // "No" is pre-selected.
    expect(screen.getByRole('radio', { name: /^no$/i })).toBeChecked();

    // Continuing does not surface the "Required" validation error.
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });
});
