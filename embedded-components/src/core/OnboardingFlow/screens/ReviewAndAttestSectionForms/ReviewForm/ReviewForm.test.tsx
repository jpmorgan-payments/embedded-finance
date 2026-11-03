import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  useFlowContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';

import { ReviewForm } from './ReviewForm';

vi.mock('@/lib/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/hooks')>();
  return {
    ...actual,
    useIPAddress: () => ({ data: '127.0.0.1', isLoading: false }),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const newClient = (questionIds: string[]) =>
  ({
    id: 'client-1',
    partyId: 'org-1',
    products: ['EMBEDDED_PAYMENTS'],
    status: 'NEW',
    outstanding: {
      partyIds: [],
      partyRoles: [],
      questionIds,
      documentRequestIds: [],
      attestationDocumentIds: [],
    },
    questionResponses: [],
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
    ],
  }) as unknown as ClientResponse;

// The flow fills this in from the GET /questions category lookup.
const WithRfiQuestions = ({
  ids,
  children,
}: {
  ids: string[];
  children: ReactNode;
}) => {
  const { sessionData, updateSessionData } = useFlowContext();
  useEffect(() => {
    updateSessionData({ rfiQuestionIds: ids });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once
  }, []);
  return sessionData.rfiQuestionIds ? children : null;
};

const CurrentScreen = () => (
  <output data-testid="current-screen">
    {useFlowContext().currentScreenId}
  </output>
);

function renderReview(clientData: ClientResponse, rfiQuestionIds: string[]) {
  const handleNext = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider
        value={
          {
            availableProducts: ['EMBEDDED_PAYMENTS'],
            availableJurisdictions: ['US'],
            clientData,
            clientGetStatus: 'success',
            setClientId: vi.fn(),
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            showLinkAccountStep: false,
            showDownloadChecklist: false,
          } as unknown as OnboardingContextType
        }
      >
        <FlowProvider
          initialScreenId="review-attest-section"
          flowConfig={flowConfig}
        >
          <WithRfiQuestions ids={rfiQuestionIds}>
            <CurrentScreen />
            <ReviewForm
              handlePrev={vi.fn()}
              handleNext={handleNext}
              getPrevButtonLabel={() => 'Back'}
              getNextButtonLabel={() => 'Continue'}
            />
          </WithRfiQuestions>
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
  return { handleNext };
}

const REQUESTED_QUESTIONS_ALERT =
  "Answer the review team's questions before finishing your application.";

describe('ReviewForm', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  test("won't continue while the review team's questions are unanswered", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { handleNext } = renderReview(newClient(['500096']), ['500096']);

    await user.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(screen.getByText(REQUESTED_QUESTIONS_ALERT)).toBeInTheDocument();
    expect(handleNext).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Answer questions' }));
    expect(screen.getByTestId('current-screen')).toHaveTextContent(
      'requested-questions-section'
    );
  });

  test('says nothing about requested questions when there are none', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderReview(newClient([]), []);

    await user.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(
      screen.queryByText(REQUESTED_QUESTIONS_ALERT)
    ).not.toBeInTheDocument();
  });
});
