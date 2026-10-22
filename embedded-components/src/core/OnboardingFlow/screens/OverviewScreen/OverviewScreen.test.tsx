import type { ComponentProps } from 'react';
import { i18n } from '@/i18n/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@test-utils';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
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

function renderOverview(
  contextOverrides: Partial<OnboardingContextType> = {},
  contentTokens?: ComponentProps<typeof EBComponentsProvider>['contentTokens']
) {
  const overview = (
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

  return render(
    contentTokens ? (
      <EBComponentsProvider apiBaseUrl="" contentTokens={contentTokens}>
        {overview}
      </EBComponentsProvider>
    ) : (
      overview
    )
  );
}

const mockOverviewLinkedRecipient: Recipient = {
  id: 'linked-recipient-1',
  status: 'ACTIVE',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Jane',
    lastName: 'Linked',
  },
  account: {
    number: '12345678901234567',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '021000021',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

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

  test('keeps rich warning content inside one flex item', () => {
    renderOverview(
      { clientData: buildClient('NEW') },
      {
        tokens: {
          'onboarding-overview': {
            screens: {
              overview: {
                verifyBusinessSection: {
                  changeWarning: 'Contact <i>support@example.com</i> for help.',
                },
              },
            },
          },
        },
      }
    );

    const emphasized = screen.getByText('support@example.com');
    const richContent = emphasized.closest('.eb-inline');
    const warning = richContent?.parentElement;

    expect(warning).toHaveClass(
      'eb-flex',
      'eb-text-xs',
      'eb-italic',
      'eb-text-muted-foreground'
    );
    expect(richContent).toBeInTheDocument();
    expect(richContent?.parentElement).toBe(warning);
    expect(emphasized.tagName).toBe('EM');
    expect(emphasized.parentElement).toBe(richContent);
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

  describe('INFORMATION_REQUESTED information requests', () => {
    const buildInformationRequestedClient = (
      outstanding: Partial<ClientResponse['outstanding']>
    ): ClientResponse => {
      const client = buildClient('INFORMATION_REQUESTED');
      return {
        ...client,
        outstanding: { ...client.outstanding, ...outstanding },
      };
    };

    const t = (key: string) =>
      i18n.t(
        `onboarding-overview:screens.overview.verifyBusinessSection.informationRequested.${key}`
      );

    test('documents and questions: asks for both and shows both cards', () => {
      renderOverview({
        clientData: buildInformationRequestedClient({
          documentRequestIds: ['68803'],
          questionIds: ['30158'],
        }),
      });

      expect(screen.getByText(t('documentsAndQuestions'))).toBeInTheDocument();
      expect(
        screen.getByTestId('requested-questions-section-button')
      ).toBeEnabled();
      expect(
        screen.getByTestId('upload-documents-section-button')
      ).toBeEnabled();
      // Onboarding sections stay locked while the request is open.
      expect(
        screen.queryByTestId('additional-questions-section-button')
      ).not.toBeInTheDocument();
    });

    test('questions only: asks for answers and keeps documents on hold', () => {
      renderOverview({
        clientData: buildInformationRequestedClient({
          questionIds: ['30158'],
        }),
      });

      expect(screen.getByText(t('questions'))).toBeInTheDocument();
      expect(
        screen.getByTestId('requested-questions-section-button')
      ).toBeEnabled();
      expect(
        screen.getByTestId('upload-documents-section-button')
      ).toBeDisabled();
    });

    test('documents only: keeps the supporting documentation copy', () => {
      renderOverview({
        clientData: buildInformationRequestedClient({
          documentRequestIds: ['68803'],
        }),
      });

      expect(screen.getByText(t('description'))).toBeInTheDocument();
      expect(
        screen.queryByTestId('requested-questions-section-button')
      ).not.toBeInTheDocument();
    });

    test('nothing outstanding: confirms the response was received', () => {
      renderOverview({
        clientData: buildInformationRequestedClient({}),
      });

      expect(screen.getByText(t('responseReceived'))).toBeInTheDocument();
      expect(
        screen.queryByTestId('requested-questions-section-button')
      ).not.toBeInTheDocument();
    });

    test('APPROVED with an open request: one action-needed state, no approval banner', () => {
      const approved = buildClient('APPROVED');
      renderOverview({
        clientData: {
          ...approved,
          outstanding: {
            ...approved.outstanding,
            documentRequestIds: ['68803'],
            questionIds: ['30158'],
          },
        },
      });

      expect(
        getVerifyBusinessHeadingText('We need a few more details')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Business Verification Complete!')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          i18n.t(
            'onboarding-overview:screens.overview.verifyBusinessSection.approved.description'
          )
        )
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          i18n.t(
            'onboarding-overview:screens.overview.verifyBusinessSection.approved.informationRequested.documentsAndQuestions'
          )
        )
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('requested-questions-section-button')
      ).toBeEnabled();
      expect(
        screen.getByTestId('upload-documents-section-button')
      ).toBeEnabled();
    });

    test('APPROVED without an open request shows no request cards', () => {
      renderOverview({ clientData: buildClient('APPROVED') });

      expect(
        screen.queryByTestId('requested-questions-section-button')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('upload-documents-section-button')
      ).not.toBeInTheDocument();
    });
  });

  test('APPROVED client shows contextual heading once (no duplicate alert title)', () => {
    renderOverview({
      clientData: buildClient('APPROVED'),
    });

    const approvedTitle = 'Business Verification Complete!';
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

  test('linked account on overview shows Remove by default after recipients load', async () => {
    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [mockOverviewLinkedRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    const removeLabel = i18n.t('linked-accounts:actions.remove');
    renderOverview({
      showLinkAccountStep: true,
      clientData: buildClient('APPROVED'),
    });

    expect(
      screen.getByText('Linked bank account for payouts')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Link a bank account for payouts')
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: new RegExp(
            `${removeLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*Jane`,
            'i'
          ),
        })
      ).toBeInTheDocument();
    });
  });

  test('hideLinkedAccountRemoval hides Remove on overview linked account card', async () => {
    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [mockOverviewLinkedRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    const removeLabel = i18n.t('linked-accounts:actions.remove');
    renderOverview({
      showLinkAccountStep: true,
      hideLinkedAccountRemoval: true,
      clientData: buildClient('APPROVED'),
    });

    await waitFor(() => {
      expect(screen.getByText(/jane\s+linked/i)).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', {
        name: new RegExp(
          `${removeLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*Jane`,
          'i'
        ),
      })
    ).not.toBeInTheDocument();
  });

  test('allowMultipleAccounts shows linked accounts list and Add on overview', async () => {
    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: {
        recipients: [
          mockOverviewLinkedRecipient,
          { ...mockOverviewLinkedRecipient, id: 'linked-recipient-2' },
        ],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderOverview({
      showLinkAccountStep: true,
      clientData: buildClient('APPROVED'),
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: {},
        allowMultipleAccounts: true,
      },
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('existing-linked-accounts')
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId('add-another-account-btn')).toBeInTheDocument();
    expect(
      screen.queryByTestId('overview-manage-linked-accounts')
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Linked accounts \(2\)/i)).toBeInTheDocument();
  });

  test('allowMultipleAccounts shows singular count for one linked account', async () => {
    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [mockOverviewLinkedRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderOverview({
      showLinkAccountStep: true,
      clientData: buildClient('APPROVED'),
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: {},
        allowMultipleAccounts: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Linked accounts \(1\)/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('add-another-account-btn')).toBeInTheDocument();
  });
});
