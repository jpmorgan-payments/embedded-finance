import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cloneDeep } from 'lodash';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, userEvent, waitFor, within } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  useFlowContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import type { SectionScreenConfig } from '@/core/OnboardingFlow/types/flow.types';

import {
  DeltaPendingFieldsPanel,
  useDeltaPendingFieldsForm,
} from './DeltaPendingFieldsPanel';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function buildDeltaClient(): ClientResponse {
  const client = cloneDeep(efClientCorpEBMock) as ClientResponse;
  client.status = 'NEW';
  client.parties = client.parties?.map((party) => {
    if (
      party.partyType === 'INDIVIDUAL' &&
      party.roles?.includes('BENEFICIAL_OWNER') &&
      !party.roles?.includes('CONTROLLER') &&
      party.individualDetails
    ) {
      return {
        ...party,
        individualDetails: { ...party.individualDetails, individualIds: [] },
      };
    }
    return party;
  });
  return client;
}

const clientData = buildDeltaClient();

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

function PanelHarness() {
  const { sections } = useFlowContext();
  const { form, stepSchemas, baselinePendingGroups } =
    useDeltaPendingFieldsForm(sections as SectionScreenConfig[]);
  return (
    <DeltaPendingFieldsPanel
      sections={sections as SectionScreenConfig[]}
      form={form}
      stepSchemas={stepSchemas}
      baselinePendingGroups={baselinePendingGroups}
    />
  );
}

function renderPanel() {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider value={onboardingContext}>
        <FlowProvider initialScreenId="overview" flowConfig={flowConfig}>
          <PanelHarness />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('delta panel — Tinker owner card completeness', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("flips Tinker's card to Complete once her SSN is entered", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderPanel();

    // Tinker's card (owner id 2000000113).
    const tinkerCard = document.getElementById(
      'delta-section-owners-section:2000000113'
    ) as HTMLElement | null;
    expect(tinkerCard, 'Tinker card should render').not.toBeNull();
    const card = tinkerCard as HTMLElement;

    // Starts as "Missing details".
    expect(within(card).getByText(/missing details/i)).toBeInTheDocument();

    // Fill Tinker's SSN.
    const ssnInput = within(card).getByLabelText(/social security number/i);
    await user.click(ssnInput);
    await user.type(ssnInput, '123456782');
    await user.tab();

    // The card should now read "Complete".
    await waitFor(() =>
      expect(within(card).getByText(/^complete$/i)).toBeInTheDocument()
    );
  });
});
