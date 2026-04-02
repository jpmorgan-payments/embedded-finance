import { i18n } from '@/i18n/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';

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
  clientData: buildClient('NEW'),
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  showLinkAccountStep: false,
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

/** CardTitle renders an outer h2; verify section uses an inner h2 with `eb-font-header`. */
function getVerifyBusinessHeadingText(text: string) {
  return screen.getByText(text, { selector: 'h2.eb-font-header' });
}

describe('OverviewScreen', () => {
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

  test('verify-business card heading uses default copy for NEW clients', () => {
    renderOverview({
      clientData: buildClient('NEW'),
    });

    const expected = i18n.t(
      'onboarding-overview:screens.overview.verifyBusinessSection.title'
    );
    expect(getVerifyBusinessHeadingText(expected)).toBeInTheDocument();
  });

  test('verify-business card heading uses default copy for INFORMATION_REQUESTED', () => {
    renderOverview({
      clientData: buildClient('INFORMATION_REQUESTED'),
    });

    const expected = i18n.t(
      'onboarding-overview:screens.overview.verifyBusinessSection.title'
    );
    expect(getVerifyBusinessHeadingText(expected)).toBeInTheDocument();
  });

  test('APPROVED client shows contextual heading once (no duplicate alert title)', () => {
    renderOverview({
      clientData: buildClient('APPROVED'),
    });

    const approvedTitle = i18n.t(
      'onboarding-overview:screens.overview.verifyBusinessSection.approved.title'
    );
    expect(getVerifyBusinessHeadingText(approvedTitle)).toBeInTheDocument();
    expect(
      screen.getAllByText(approvedTitle, { selector: 'h2.eb-font-header' })
    ).toHaveLength(1);
    expect(
      screen.getByText(
        i18n.t(
          'onboarding-overview:screens.overview.verifyBusinessSection.approved.description'
        )
      )
    ).toBeInTheDocument();
  });

  test('DECLINED client shows contextual heading once', () => {
    renderOverview({
      clientData: buildClient('DECLINED'),
    });

    const declinedTitle = i18n.t(
      'onboarding-overview:screens.overview.verifyBusinessSection.declined.title'
    );
    expect(getVerifyBusinessHeadingText(declinedTitle)).toBeInTheDocument();
    expect(
      screen.getAllByText(declinedTitle, { selector: 'h2.eb-font-header' })
    ).toHaveLength(1);
  });

  test('REVIEW_IN_PROGRESS with outstanding document requests uses review-in-progress title', () => {
    vi.mocked(useSmbdoListDocumentRequests).mockReturnValue({
      data: {
        documentRequests: [
          {
            id: 'dr-1',
            clientId: 'client-1',
            status: 'ACTIVE',
            requirements: [],
          },
        ],
      },
    } as unknown as ReturnType<typeof useSmbdoListDocumentRequests>);

    renderOverview({ clientData: buildClient('REVIEW_IN_PROGRESS') });

    const expected = i18n.t(
      'onboarding-overview:screens.overview.verifyBusinessSection.reviewInProgress.title'
    );
    expect(getVerifyBusinessHeadingText(expected)).toBeInTheDocument();
  });

  test('REVIEW_IN_PROGRESS with closed document requests uses documents-received title', () => {
    vi.mocked(useSmbdoListDocumentRequests).mockReturnValue({
      data: {
        documentRequests: [
          {
            id: 'dr-1',
            clientId: 'client-1',
            status: 'CLOSED',
            requirements: [],
          },
        ],
      },
    } as unknown as ReturnType<typeof useSmbdoListDocumentRequests>);

    renderOverview({ clientData: buildClient('REVIEW_IN_PROGRESS') });

    const expected = i18n.t(
      'onboarding-overview:screens.overview.verifyBusinessSection.documentsReceived.title'
    );
    expect(getVerifyBusinessHeadingText(expected)).toBeInTheDocument();
  });

  test('REVIEW_IN_PROGRESS with no document requests uses application-submitted title', () => {
    renderOverview({
      clientData: buildClient('REVIEW_IN_PROGRESS'),
    });

    const expected = i18n.t(
      'onboarding-overview:screens.overview.verifyBusinessSection.applicationSubmitted.title'
    );
    expect(getVerifyBusinessHeadingText(expected)).toBeInTheDocument();
  });
});
