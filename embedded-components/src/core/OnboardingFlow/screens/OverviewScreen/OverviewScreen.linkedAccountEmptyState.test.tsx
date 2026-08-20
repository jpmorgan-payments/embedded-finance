/**
 * OverviewScreen — linked bank account empty-state routing.
 *
 * When no linked accounts exist yet, the bank section renders either:
 * - the inline link form ({@link LinkAccountFormPanel}) when linking is enabled
 *   for the client status, or
 * - a locked, non-interactive "Not started" card when linking is disabled.
 *
 * `LinkAccountFormPanel` is mocked to a sentinel so these tests assert the
 * branch decision without pulling in the full BankAccountForm (its behavior is
 * covered by BankAccountForm + the link-account integration tests).
 */
import { i18n } from '@/i18n/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@test-utils';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
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

vi.mock(
  '@/core/OnboardingFlow/screens/LinkAccountScreen/LinkAccountFormPanel',
  () => ({
    LinkAccountFormPanel: () => (
      <div data-testid="inline-link-account-form-panel" />
    ),
  })
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function buildClient(status: ClientResponse['status']): ClientResponse {
  return {
    id: 'client-1',
    partyId: 'party-1',
    products: ['EMBEDDED_PAYMENTS'],
    outstanding: {
      partyIds: [],
      partyRoles: [],
      questionIds: [],
      documentRequestIds: [],
      attestationDocumentIds: [],
    },
    status,
  };
}

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: buildClient('APPROVED'),
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  showLinkAccountStep: true,
  showDownloadChecklist: false,
};

function renderOverview(contextOverrides: Partial<OnboardingContextType> = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider
        value={{ ...baseOnboardingContext, ...contextOverrides }}
      >
        <FlowProvider initialScreenId="overview" flowConfig={flowConfig}>
          <OverviewScreen />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

const lockedTitle = i18n.t(
  'onboarding-overview:screens.overview.bankAccountSection.linkAccountTitle'
);

describe('OverviewScreen — linked account empty state', () => {
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
  });

  test('renders the inline link form when linking is enabled (no Start CTA)', async () => {
    renderOverview({ clientData: buildClient('APPROVED') });

    await waitFor(() => {
      expect(
        screen.getByTestId('inline-link-account-form-panel')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Link a bank account for payouts')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Linked bank account for payouts')
    ).not.toBeInTheDocument();

    // Legacy "Start" CTA and locked card must not appear.
    expect(
      screen.queryByRole('button', { name: /^Start$/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Not started')).not.toBeInTheDocument();
  });

  test('renders the locked empty state when linking is disabled (no form)', async () => {
    renderOverview({
      clientData: buildClient('NEW'),
      linkAccountEnabledStatuses: ['APPROVED'],
    });

    await waitFor(() => {
      expect(screen.getByText(lockedTitle)).toBeInTheDocument();
    });

    // Locked, non-interactive card — sentinel form is not rendered.
    const lockedCard = screen
      .getByText(lockedTitle)
      .closest('[class*="eb-rounded-md"]') as HTMLElement;
    expect(within(lockedCard).getByText('Not started')).toBeInTheDocument();
    expect(
      screen.queryByTestId('inline-link-account-form-panel')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Start$/i })
    ).not.toBeInTheDocument();
  });
});
