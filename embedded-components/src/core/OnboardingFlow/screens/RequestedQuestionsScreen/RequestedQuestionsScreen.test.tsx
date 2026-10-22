import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { render, screen, userEvent, waitFor } from '@test-utils';

import {
  ClientResponse,
  UpdateClientRequestSmbdo,
} from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import { OnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';

import { RequestedQuestionsScreen } from './RequestedQuestionsScreen';

const flowContextTestState = vi.hoisted(() => {
  const defaults = {
    currentScreenId: 'requested-questions-section',
    originScreenId: 'overview',
    goTo: vi.fn(),
    goBack: vi.fn(),
    editingPartyIds: {},
    sessionData: {},
    updateSessionData: vi.fn(),
    setIsFormSubmitting: vi.fn(),
    unsavedChangesRef: { current: false },
    setFlowUnsavedChanges: vi.fn(),
  };
  let overrides: Record<string, unknown> = {};

  return {
    reset() {
      overrides = {};
    },
    setOverrides(patch: Record<string, unknown>) {
      overrides = { ...patch };
    },
    getValue() {
      return { ...defaults, ...overrides };
    },
  };
});

async function createFlowContextMock(
  importOriginal: () => Promise<Record<string, unknown>>
) {
  const actual = (await importOriginal()) as {
    useFlowContext: () => unknown;
    [key: string]: unknown;
  };
  return {
    ...actual,
    useFlowContext: () =>
      flowContextTestState.getValue() as unknown as ReturnType<
        typeof actual.useFlowContext
      >,
  };
}

// The screen imports from the contexts barrel, which re-exports this file.
vi.mock(
  '@/core/OnboardingFlow/contexts/FlowContext/FlowContext',
  (importOriginal) => createFlowContextMock(importOriginal)
);

const CLIENT_ID = '3000005555';

const informationRequestedClient = {
  id: CLIENT_ID,
  status: 'INFORMATION_REQUESTED',
  partyId: '2000000555',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: ['30158', '30194'],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  // Answered during onboarding; not part of the information request.
  questionResponses: [{ questionId: '30005', values: ['500000'] }],
} as unknown as ClientResponse;

const clientAfter = (
  outstandingQuestionIds: string[],
  questionResponses: UpdateClientRequestSmbdo['questionResponses'] = []
) =>
  ({
    ...informationRequestedClient,
    status: outstandingQuestionIds.length
      ? 'INFORMATION_REQUESTED'
      : 'REVIEW_IN_PROGRESS',
    outstanding: {
      ...informationRequestedClient.outstanding,
      questionIds: outstandingQuestionIds,
    },
    questionResponses: [
      ...(informationRequestedClient.questionResponses ?? []),
      ...(questionResponses ?? []),
    ],
  }) as ClientResponse;

function mockQuestionsApi() {
  const requestedQuestionIds: string[] = [];
  server.use(
    http.get('/questions', ({ request }) => {
      const ids =
        new URL(request.url).searchParams.get('questionIds')?.split(',') ?? [];
      requestedQuestionIds.push(...ids);
      return HttpResponse.json({
        metadata: efClientQuestionsMock.metadata,
        questions: efClientQuestionsMock.questions.filter((q) =>
          ids.includes(q.id)
        ),
      });
    })
  );
  return requestedQuestionIds;
}

function mockUpdateClient(
  respond: (body: UpdateClientRequestSmbdo) => ReturnType<typeof clientAfter>
) {
  const bodies: UpdateClientRequestSmbdo[] = [];
  server.use(
    http.patch(`/clients/${CLIENT_ID}`, async ({ request }) => {
      const body = (await request.json()) as UpdateClientRequestSmbdo;
      bodies.push(body);
      return HttpResponse.json(respond(body));
    })
  );
  return bodies;
}

function renderScreen(
  options: {
    client?: ClientResponse;
    onboarding?: Partial<OnboardingContextType>;
  } = {}
) {
  const onboardingContext: OnboardingContextType = {
    setClientId: vi.fn(),
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    docUploadOnlyMode: false,
    clientGetStatus: 'success',
    clientData: options.client ?? informationRequestedClient,
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    ...options.onboarding,
  };

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{ queries: { retry: false } }}
    >
      <OnboardingContext.Provider value={onboardingContext}>
        <RequestedQuestionsScreen />
      </OnboardingContext.Provider>
    </EBComponentsProvider>
  );
}

const SANCTIONS = /comprehensive or targeted sanctions/i;
const MONTHLY_VOLUME = /total monthly processing volume/i;
const WHICH_COUNTRIES = /specify which countries/i;

/** Answer the two requested questions: sanctions (yes/no) and monthly volume. */
async function answerQuestions(
  user: ReturnType<typeof userEvent.setup>,
  sanctions: 'yes' | 'no',
  monthlyVolume: string
) {
  await user.click(
    await screen.findByRole('radio', {
      name: sanctions === 'yes' ? /yes/i : /no/i,
    })
  );
  await user.type(screen.getByRole('spinbutton'), monthlyVolume);
  await user.click(screen.getByRole('button', { name: /submit answers/i }));
}

describe('RequestedQuestionsScreen', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ pointerEventsCheck: 0 });
    flowContextTestState.reset();
    vi.clearAllMocks();
    server.resetHandlers();
    const g = globalThis as {
      __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
    };
    g.__EB_QUERY_CLIENT__?.clear();
  });

  test('shows only the outstanding questions from the information request', async () => {
    const requestedQuestionIds = mockQuestionsApi();
    renderScreen();

    expect(
      await screen.findByRole('heading', { name: /additional information/i })
    ).toBeInTheDocument();
    expect(await screen.findByText(SANCTIONS)).toBeInTheDocument();
    expect(screen.getByText(MONTHLY_VOLUME)).toBeInTheDocument();
    // Follow-up is hidden until its parent is answered "Yes".
    expect(screen.queryByText(WHICH_COUNTRIES)).not.toBeInTheDocument();
    // Earlier onboarding answers are not refetched or re-sent.
    expect(requestedQuestionIds).not.toContain('30005');
  });

  test('reveals an outstanding follow-up inline when its parent is answered "Yes"', async () => {
    mockQuestionsApi();
    const bodies = mockUpdateClient((body) =>
      clientAfter([], body.questionResponses)
    );
    renderScreen({ client: clientAfter(['30158', '30162', '30194']) });

    await user.click(await screen.findByRole('radio', { name: /yes/i }));
    const countries = await screen.findByRole('textbox');
    expect(screen.getByText(WHICH_COUNTRIES)).toBeInTheDocument();
    expect(countries).toHaveProperty('tagName', 'TEXTAREA');

    await user.type(countries, 'Cuba');
    await user.type(screen.getByRole('spinbutton'), '25000');
    await user.click(screen.getByRole('button', { name: /submit answers/i }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].questionResponses).toEqual([
      { questionId: '30158', values: ['true'] },
      { questionId: '30162', values: ['Cuba'] },
      { questionId: '30194', values: ['25000'] },
    ]);
  });

  test('omits a hidden follow-up when its parent is answered "No"', async () => {
    mockQuestionsApi();
    const bodies = mockUpdateClient((body) =>
      clientAfter([], body.questionResponses)
    );
    renderScreen({ client: clientAfter(['30158', '30162', '30194']) });

    await answerQuestions(user, 'no', '25000');

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(screen.queryByText(WHICH_COUNTRIES)).not.toBeInTheDocument();
    expect(bodies[0].questionResponses).toEqual([
      { questionId: '30158', values: ['false'] },
      { questionId: '30194', values: ['25000'] },
    ]);
  });

  test('requires an answer to every question before submitting', async () => {
    mockQuestionsApi();
    const bodies = mockUpdateClient(() => clientAfter([]));
    renderScreen();

    await screen.findByText(SANCTIONS);
    await user.click(screen.getByRole('button', { name: /submit answers/i }));

    expect((await screen.findAllByText(/required/i)).length).toBeGreaterThan(0);
    expect(bodies).toHaveLength(0);
  });

  test('saves answers with PATCH /clients and returns to the overview', async () => {
    mockQuestionsApi();
    const bodies = mockUpdateClient((body) =>
      clientAfter([], body.questionResponses)
    );
    const goTo = vi.fn();
    const updateSessionData = vi.fn();
    flowContextTestState.setOverrides({ goTo, updateSessionData });
    renderScreen();

    await answerQuestions(user, 'no', '25000');

    await waitFor(() =>
      expect(goTo).toHaveBeenCalledWith('overview', { resetHistory: true })
    );
    expect(updateSessionData).toHaveBeenCalledWith({
      requestedQuestionsSubmitted: true,
    });
    expect(bodies).toEqual([
      {
        questionResponses: [
          { questionId: '30158', values: ['false'] },
          { questionId: '30194', values: ['25000'] },
        ],
      },
    ]);
  });

  test('continues to supporting documents when documents are still requested', async () => {
    mockQuestionsApi();
    const withDocuments = (client: ClientResponse) =>
      ({
        ...client,
        status: 'INFORMATION_REQUESTED',
        outstanding: { ...client.outstanding, documentRequestIds: ['68803'] },
      }) as ClientResponse;
    mockUpdateClient((body) =>
      withDocuments(clientAfter([], body.questionResponses))
    );
    const goTo = vi.fn();
    flowContextTestState.setOverrides({ goTo });
    renderScreen({ client: withDocuments(informationRequestedClient) });

    expect(
      await screen.findByRole('button', {
        name: /submit answers and continue to documents/i,
      })
    ).toBeInTheDocument();

    await user.click(await screen.findByRole('radio', { name: /no/i }));
    await user.type(screen.getByRole('spinbutton'), '25000');
    await user.click(
      screen.getByRole('button', { name: /submit answers and continue/i })
    );

    await waitFor(() =>
      expect(goTo).toHaveBeenCalledWith('upload-documents-section', {
        resetHistory: true,
      })
    );
  });

  test('returns to supporting documents in doc-upload-only mode', async () => {
    mockQuestionsApi();
    mockUpdateClient((body) => clientAfter([], body.questionResponses));
    const goTo = vi.fn();
    flowContextTestState.setOverrides({ goTo });
    renderScreen({ onboarding: { docUploadOnlyMode: true } });

    expect(
      await screen.findByRole('button', { name: /supporting documents/i })
    ).toBeInTheDocument();

    await answerQuestions(user, 'no', '25000');

    await waitFor(() =>
      expect(goTo).toHaveBeenCalledWith('upload-documents-section', {
        resetHistory: true,
      })
    );
  });

  test('stays on the screen when an answer raises a follow-up question', async () => {
    mockQuestionsApi();
    mockUpdateClient((body) => clientAfter(['30162'], body.questionResponses));
    const goTo = vi.fn();
    flowContextTestState.setOverrides({ goTo });

    const { rerender } = renderScreen();

    await answerQuestions(user, 'yes', '25000');

    expect(
      await screen.findByText(/we need a little more information/i)
    ).toBeInTheDocument();
    expect(goTo).not.toHaveBeenCalled();

    // The host refetches the client; the follow-up becomes outstanding.
    rerender(
      <EBComponentsProvider
        apiBaseUrl="/"
        headers={{}}
        contentTokens={{ name: 'enUS' }}
        reactQueryDefaultOptions={{ queries: { retry: false } }}
      >
        <OnboardingContext.Provider
          value={{
            setClientId: vi.fn(),
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            docUploadOnlyMode: false,
            clientGetStatus: 'success',
            clientData: clientAfter(
              ['30162'],
              [
                { questionId: '30158', values: ['true'] },
                { questionId: '30194', values: ['25000'] },
              ]
            ),
            availableJurisdictions: ['US'],
            availableProducts: ['EMBEDDED_PAYMENTS'],
          }}
        >
          <RequestedQuestionsScreen />
        </OnboardingContext.Provider>
      </EBComponentsProvider>
    );

    // The answered parent stays visible so the follow-up has context, and the
    // free-text follow-up uses a multi-line input.
    expect(await screen.findByText(WHICH_COUNTRIES)).toBeInTheDocument();
    expect(screen.getByText(SANCTIONS)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveProperty('tagName', 'TEXTAREA');
  });

  test('shows API validation errors on the matching question', async () => {
    mockQuestionsApi();
    server.use(
      http.patch(`/clients/${CLIENT_ID}`, () =>
        HttpResponse.json(
          {
            title: 'Bad Request',
            httpStatus: 400,
            context: [
              {
                message:
                  'Response for question with ID [30194] is invalid [Enter the volume in whole dollars.]',
              },
            ],
          },
          { status: 400 }
        )
      )
    );
    const goTo = vi.fn();
    flowContextTestState.setOverrides({ goTo });
    renderScreen();

    await answerQuestions(user, 'no', '25000');

    await waitFor(() =>
      expect(screen.getByRole('spinbutton')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(
      screen.getAllByText(/enter the volume in whole dollars/i).length
    ).toBeGreaterThan(0);
    expect(goTo).not.toHaveBeenCalled();
  });

  test('explains when there is nothing left to answer', async () => {
    mockQuestionsApi();
    renderScreen({ client: clientAfter([]) });

    expect(
      await screen.findByText(/no questions waiting for your answer/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /submit answers/i })
    ).not.toBeInTheDocument();
  });
});
