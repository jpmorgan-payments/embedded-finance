import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { INTERMEDIARY_OWNER_ROLE } from '@/core/IndirectOwnership/IndirectOwnership.types';
import { StepperRenderer } from '@/core/OnboardingFlow/components/StepperRenderer/StepperRenderer';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import { useFlowContext } from '@/core/OnboardingFlow/contexts/FlowContext/FlowContext';
import { createOrReuseIntermediaryChain } from '@/core/OnboardingFlow/screens/OwnersSectionScreen/OwnersSectionScreen';

/**
 * End-to-end coverage for the incremental intermediary lifecycle (SMBDO-15013):
 * an intermediary organization is created first as a draft (name + defaults
 * only), then its required fields are completed later through an update to the
 * same party — the draft-to-complete lifecycle the reviewer accepted as the
 * implementation approach. The second test renders the real intermediary
 * stepper so the completion goes through the actual form + submit + update path,
 * not a mocked handler.
 */

// Mock the party/client mutation hooks the stepper uses; capture updateParty.
const api = vi.hoisted(() => ({
  updatePartyMutate: vi.fn(),
  updatePartyActiveAsync: vi.fn(),
  updateClientMutate: vi.fn(),
  postPartyAsync: vi.fn(),
}));
vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    usePostParty: () => ({ mutateAsync: api.postPartyAsync, error: undefined }),
    useUpdatePartyLegacy: () => ({
      mutate: api.updatePartyMutate,
      mutateAsync: api.updatePartyActiveAsync,
      error: undefined,
      status: 'idle',
    }),
    useSmbdoUpdateClientLegacy: () => ({
      mutate: api.updateClientMutate,
      error: undefined,
      status: 'idle',
    }),
  };
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
} as unknown as PartyResponse;

// A draft intermediary: created earlier with only a name + defaults, still
// missing the required EIN and address (organizationIds/addresses absent).
const draftIntermediary = {
  id: 'int-draft-1',
  partyType: 'ORGANIZATION',
  roles: [INTERMEDIARY_OWNER_ROLE],
  active: true,
  parentPartyId: CLIENT_PARTY_ID,
  organizationDetails: {
    organizationName: 'MidCo LLC',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    countryOfFormation: 'US',
    natureOfOwnership: 'Direct',
  },
} as unknown as PartyResponse;

function makeClient(parties: PartyResponse[]): ClientResponse {
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
    parties: [clientParty, ...parties],
  } as unknown as ClientResponse;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const baseContext = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  onPostClientSettled: vi.fn(),
  onPostPartySettled: vi.fn(),
} as unknown as OnboardingContextType;

const intermediaryStepperConfig = flowConfig.screens.find(
  (screen) => screen.id === 'intermediary-stepper'
)?.stepperConfig as React.ComponentProps<typeof StepperRenderer>;

// The app navigates to the intermediary stepper via
// goTo('intermediary-stepper', { editingPartyId }); seed the same editing party
// so the stepper resumes that specific draft (mirrors OwnersSectionScreen /
// IndirectOwnerDetailsScreen navigation).
function IntermediaryStepperUnderTest({
  editingPartyId,
}: {
  editingPartyId: string;
}) {
  const { goTo } = useFlowContext();
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      goTo('intermediary-stepper', { editingPartyId });
    }
  }, [goTo, editingPartyId]);
  return <StepperRenderer {...intermediaryStepperConfig} />;
}

function renderIntermediaryStepper(
  clientData: ClientResponse,
  editingPartyId: string
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider value={{ ...baseContext, clientData }}>
        <FlowProvider
          initialScreenId="intermediary-stepper"
          flowConfig={flowConfig}
        >
          <IntermediaryStepperUnderTest editingPartyId={editingPartyId} />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('Intermediary incremental creation lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('creates the intermediary as a draft with only default org details (no EIN or address)', async () => {
    let n = 0;
    const post = vi.fn(
      async (_args: { data: unknown }) =>
        ({ id: `int-${(n += 1)}` }) as PartyResponse
    );

    await createOrReuseIntermediaryChain(
      [{ entityName: 'MidCo LLC' }],
      CLIENT_PARTY_ID,
      [],
      post
    );

    expect(post).toHaveBeenCalledTimes(1);
    const body = post.mock.calls[0][0].data as {
      organizationDetails: Record<string, unknown>;
    };
    expect(body.organizationDetails.organizationName).toBe('MidCo LLC');
    expect(body.organizationDetails.organizationType).toBe(
      'LIMITED_LIABILITY_COMPANY'
    );
    expect(body.organizationDetails.countryOfFormation).toBe('US');
    // Draft state: the required detail fields are not collected at creation.
    expect(body.organizationDetails.organizationIds).toBeUndefined();
    expect(body.organizationDetails.addresses).toBeUndefined();
  });

  test('completes the draft intermediary via update-in-place (not a recreate)', async () => {
    const user = userEvent.setup();
    renderIntermediaryStepper(makeClient([draftIntermediary]), 'int-draft-1');

    // The stepper resumes the previously-created draft: its name is prefilled.
    expect(await screen.findByDisplayValue('MidCo LLC')).toBeInTheDocument();

    // Complete the one missing required field (EIN — a masked input).
    const ein = screen.getByLabelText(/EIN/i);
    await user.type(ein, '123456789');

    const submit = screen
      .getAllByRole('button')
      .find((button) => (button as HTMLButtonElement).type === 'submit');
    await user.click(submit as HTMLElement);

    // Completion updates the existing draft party in place — same partyId,
    // carrying the newly-entered EIN — rather than creating a new party.
    await waitFor(() => expect(api.updatePartyMutate).toHaveBeenCalledTimes(1));
    const [vars] = api.updatePartyMutate.mock.calls[0];
    expect(vars.partyId).toBe('int-draft-1');
    expect(JSON.stringify(vars.data)).toContain('3456789');
    expect(api.postPartyAsync).not.toHaveBeenCalled();
  });
});
