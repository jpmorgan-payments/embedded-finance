import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { INTERMEDIARY_OWNER_ROLE } from '@/core/IndirectOwnership/IndirectOwnership.types';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import { IndirectOwnerDetailsScreen } from '@/core/OnboardingFlow/screens/IndirectOwnerDetailsScreen/IndirectOwnerDetailsScreen';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const clientParty = {
  id: 'org-1',
  partyType: 'ORGANIZATION',
  roles: ['CLIENT'],
  active: true,
  organizationDetails: {
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    organizationName: 'Acme LLC',
    countryOfFormation: 'US',
  },
};

const completeIndividual = {
  id: 'ind-c',
  partyType: 'INDIVIDUAL',
  roles: ['BENEFICIAL_OWNER'],
  active: true,
  parentPartyId: 'int-c',
  individualDetails: {
    firstName: 'Cara',
    lastName: 'Complete',
    natureOfOwnership: 'Indirect',
    birthDate: '1980-01-01',
    countryOfResidence: 'US',
    addresses: [{ addressType: 'RESIDENTIAL_ADDRESS' }],
    individualIds: [{ idType: 'SSN', value: '111' }],
  },
};

const incompleteIndividual = {
  id: 'ind-i',
  partyType: 'INDIVIDUAL',
  roles: ['BENEFICIAL_OWNER'],
  active: true,
  parentPartyId: 'org-1',
  individualDetails: {
    firstName: 'Ivy',
    lastName: 'Incomplete',
    natureOfOwnership: 'Direct',
    birthDate: '1980-01-01',
  },
};

const notStartedIndividual = {
  id: 'ind-n',
  partyType: 'INDIVIDUAL',
  roles: ['BENEFICIAL_OWNER'],
  active: true,
  parentPartyId: 'org-1',
  individualDetails: { firstName: 'Nora', lastName: 'None' },
};

const completeOrg = {
  id: 'int-c',
  partyType: 'ORGANIZATION',
  roles: [INTERMEDIARY_OWNER_ROLE],
  active: true,
  parentPartyId: 'org-1',
  organizationDetails: {
    organizationName: 'MidCo Holdings',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    countryOfFormation: 'US',
    organizationIds: [{ idType: 'EIN', value: '99' }],
    addresses: [{ addressType: 'BUSINESS_ADDRESS' }],
  },
};

function makeClient(parties: Array<Record<string, unknown>>): ClientResponse {
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
    parties: [clientParty, ...parties],
  } as unknown as ClientResponse;
}

function renderScreen(clientData: ClientResponse) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider
        value={
          {
            clientData,
            organizationType: 'LIMITED_LIABILITY_COMPANY',
          } as unknown as OnboardingContextType
        }
      >
        <FlowProvider
          initialScreenId="indirect-owner-details"
          flowConfig={flowConfig}
        >
          <IndirectOwnerDetailsScreen />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('IndirectOwnerDetailsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('renders individual and intermediary cards with completion status', () => {
    renderScreen(
      makeClient([
        completeIndividual,
        incompleteIndividual,
        notStartedIndividual,
        completeOrg,
      ])
    );

    expect(screen.getByText('Cara Complete')).toBeInTheDocument();
    expect(screen.getByText('Ivy Incomplete')).toBeInTheDocument();
    expect(screen.getByText('Nora None')).toBeInTheDocument();
    expect(screen.getByText('MidCo Holdings')).toBeInTheDocument();

    expect(screen.getAllByText('Complete').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  test('deduplicates intermediary entities by organization name', () => {
    renderScreen(makeClient([completeOrg, { ...completeOrg, id: 'int-dup' }]));
    expect(screen.getAllByText('MidCo Holdings')).toHaveLength(1);
  });

  test('shows empty placeholders when there are no owners or entities', () => {
    renderScreen(makeClient([]));
    expect(screen.getByText(/No individual owners found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No intermediary entities found/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/No parties found/i)).toBeInTheDocument();
  });

  test('disables continue with a progress label until every party is complete', () => {
    renderScreen(makeClient([completeIndividual, incompleteIndividual]));
    const button = screen.getByRole('button', {
      name: /Complete all details to continue/i,
    });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('(1/2)');
  });

  test('enables Save and Continue once all parties are complete', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderScreen(makeClient([completeIndividual, completeOrg]));

    const button = screen.getByRole('button', { name: /Save and Continue/i });
    expect(button).toBeEnabled();
    await user.click(button);
  });

  test('edit actions are available on each card', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderScreen(makeClient([notStartedIndividual, completeOrg]));

    // Not-started party shows a "Start" action; others show "Edit".
    const startBtn = screen.getByRole('button', { name: /^Start$/i });
    await user.click(startBtn);

    const orgCard = screen.getByText('MidCo Holdings').closest('div');
    expect(orgCard).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /^Edit$/i }));
  });
});
