import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, within } from '@test-utils';

import { useUpdatePartyLegacy } from '@/api/generated/smbdo';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import { OwnersSectionScreen } from '@/core/OnboardingFlow/screens/OwnersSectionScreen/OwnersSectionScreen';

// Legacy (non-indirect) owners list — rendered when the indirect-ownership
// feature is off. Covers the owner-card list, the remove-confirmation dialog
// and the empty state.
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

const controllerParty = {
  id: 'ctrl-1',
  partyType: 'INDIVIDUAL',
  roles: ['CONTROLLER'],
  active: true,
  individualDetails: { firstName: 'Ada', lastName: 'Byron' },
};

function makeClient(extra: Array<Record<string, unknown>>): ClientResponse {
  return {
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
      controllerParty,
      ...extra,
    ],
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

const ownerParty = {
  id: 'own-1',
  partyType: 'INDIVIDUAL',
  roles: ['BENEFICIAL_OWNER'],
  active: true,
  parentPartyId: 'org-1',
  individualDetails: { firstName: 'Jane', lastName: 'Owner' },
};

describe('OwnersSectionScreen — legacy owners list', () => {
  const updateMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useUpdatePartyLegacy).mockReturnValue({
      mutate: updateMutate,
      mutateAsync: vi.fn(),
      error: undefined,
      status: 'idle',
    } as unknown as ReturnType<typeof useUpdatePartyLegacy>);
  });

  test('shows the empty state when there are no owners', () => {
    renderOwners(makeClient([]));
    expect(screen.getByText(/No stakeholders added yet/i)).toBeInTheDocument();
  });

  test('renders an owner card with edit and remove actions', () => {
    renderOwners(makeClient([ownerParty]));
    expect(screen.getByText('Jane Owner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Remove$/i })
    ).toBeInTheDocument();
  });

  test('confirming removal deactivates the owner party', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderOwners(makeClient([ownerParty]));

    await user.click(screen.getByRole('button', { name: /^Remove$/i }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: /Yes, remove owner/i })
    );

    expect(updateMutate).toHaveBeenCalledWith(
      { partyId: 'own-1', data: { active: false } },
      expect.any(Object)
    );
  });

  test('advances to the next section once the controller question is answered', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderOwners(makeClient([ownerParty]));

    await user.click(screen.getByRole('radio', { name: /^no$/i }));
    await user.click(
      screen.getByRole('button', { name: /Save and continue/i })
    );

    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });
});
