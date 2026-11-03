import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import {
  efClientQuestionsMock,
  matchesQuestionCategory,
  withoutCategory,
} from '@/mocks/efClientQuestions.mock';
import { server } from '@/msw/server';
import { cloneDeep } from 'lodash';
import { http, HttpResponse } from 'msw';
import type { UseFormReturn } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor, within } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
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

const COUNTRIES = [
  'Argentina',
  'Brazil',
  'Canada',
  'Chile',
  'Denmark',
  'Egypt',
  'France',
  'Germany',
  'India',
  'Japan',
  'Kenya',
  'Mexico',
];

function mockQuestionsApi() {
  server.use(
    http.get('/questions', ({ request }) => {
      const url = new URL(request.url);
      const ids = url.searchParams.get('questionIds')?.split(',') ?? [];
      const questions = efClientQuestionsMock.questions
        // Give "which countries" a list long enough to need searching.
        .map((q) =>
          q.id === '30162'
            ? {
                ...q,
                responseSchema: {
                  ...q.responseSchema,
                  items: { type: 'string', enum: COUNTRIES },
                },
              }
            : q
        )
        .filter((q) => ids.includes(q.id) && matchesQuestionCategory(q, url))
        .map(withoutCategory);
      return HttpResponse.json({
        metadata: { page: 0, limit: 25, total: questions.length },
        questions,
      });
    })
  );
}

function clientWithOutstandingQuestions(questionIds: string[]) {
  const client = cloneDeep(efClientCorpEBMock) as ClientResponse;
  client.status = 'NEW';
  client.outstanding = { ...client.outstanding, questionIds };
  client.questionResponses = [];
  return client;
}

let panelForm: UseFormReturn<Record<string, unknown>> | undefined;

function PanelHarness() {
  const { sections } = useFlowContext();
  const { form, stepSchemas, baselinePendingGroups } =
    useDeltaPendingFieldsForm(sections as SectionScreenConfig[]);
  panelForm = form;
  return (
    <DeltaPendingFieldsPanel
      sections={sections as SectionScreenConfig[]}
      form={form}
      stepSchemas={stepSchemas}
      baselinePendingGroups={baselinePendingGroups}
    />
  );
}

function renderPanel(outstandingQuestionIds: string[]) {
  const onboardingContext = {
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    clientData: clientWithOutstandingQuestions(outstandingQuestionIds),
    clientGetStatus: 'success',
    setClientId: vi.fn(),
    organizationType: 'LIMITED_LIABILITY_COMPANY',
  } as unknown as OnboardingContextType;

  render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{ queries: { retry: false } }}
    >
      <OnboardingContext.Provider value={onboardingContext}>
        <FlowProvider initialScreenId="overview" flowConfig={flowConfig}>
          <PanelHarness />
        </FlowProvider>
      </OnboardingContext.Provider>
    </EBComponentsProvider>
  );
}

const findQuestionsCard = () =>
  waitFor(() => {
    const card = document.getElementById(
      'delta-section-additional-questions-section'
    );
    expect(card).not.toBeNull();
    return card as HTMLElement;
  });

describe('delta panel — questions', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ pointerEventsCheck: 0 });
    panelForm = undefined;
    mockQuestionsApi();
  });

  it('takes several answers to a multiple-choice question and counts them at once', async () => {
    renderPanel(['30026', '30027']);
    const card = await findQuestionsCard();

    await user.click(await within(card).findByRole('radio', { name: 'Yes' }));
    await user.click(
      await within(card).findByRole('checkbox', { name: 'Cuba' })
    );
    await user.click(within(card).getByRole('checkbox', { name: 'Iran' }));

    expect(within(card).getByRole('checkbox', { name: 'Cuba' })).toBeChecked();
    expect(within(card).getByRole('checkbox', { name: 'Iran' })).toBeChecked();
    // Picked answers count without waiting for a blur.
    await waitFor(() =>
      expect(within(card).getByText(/^complete$/i)).toBeInTheDocument()
    );
    // Saving sends only changed answers; both are.
    expect(panelForm?.getFieldState('question_30026').isDirty).toBe(true);
    expect(panelForm?.getFieldState('question_30027').isDirty).toBe(true);
    expect(panelForm?.getValues('question_30027')).toEqual(['Cuba', 'Iran']);
  });

  it('searches a long list of options', async () => {
    renderPanel(['30158', '30162']);
    const card = await findQuestionsCard();

    await user.click(await within(card).findByRole('radio', { name: 'Yes' }));
    await user.click(await within(card).findByRole('combobox'));
    await user.type(screen.getByPlaceholderText(/search/i), 'Can');
    await user.click(screen.getByRole('option', { name: 'Canada' }));

    expect(within(card).getByRole('combobox')).toHaveTextContent('Canada');
    await waitFor(() =>
      expect(within(card).getByText(/^complete$/i)).toBeInTheDocument()
    );
  });
});
