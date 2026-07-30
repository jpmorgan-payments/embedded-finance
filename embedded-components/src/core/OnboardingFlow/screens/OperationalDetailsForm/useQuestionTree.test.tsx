import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClientQuestionResponse } from '@/api/generated/smbdo.schemas';

import { EBComponentsProvider } from '../../../EBComponentsProvider';
import { useQuestionTree } from './useQuestionTree';

/**
 * Minimal question tree:
 *  - 30005: standalone (no children)
 *  - 30158 -> 30162        (revealed when "true")
 *  - 30088 -> 30089 -> 30090 (nested chain, each revealed when "true")
 */
const QUESTION_DEFS: Record<string, Record<string, unknown>> = {
  '30005': { id: '30005', subQuestions: [] },
  '30158': {
    id: '30158',
    subQuestions: [{ anyValuesMatch: 'true', questionIds: ['30162'] }],
  },
  '30162': { id: '30162', parentQuestionId: '30158', subQuestions: [] },
  '30088': {
    id: '30088',
    subQuestions: [{ anyValuesMatch: 'true', questionIds: ['30089'] }],
  },
  '30089': {
    id: '30089',
    parentQuestionId: '30088',
    subQuestions: [{ anyValuesMatch: 'true', questionIds: ['30090'] }],
  },
  '30090': { id: '30090', parentQuestionId: '30089', subQuestions: [] },
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EBComponentsProvider
    apiBaseUrl="/"
    headers={{}}
    contentTokens={{ name: 'enUS' }}
  >
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </EBComponentsProvider>
);

/** Every question ID requested across all `GET /questions` calls this render. */
let requestedIds: string[] = [];

function mockQuestionsEndpoint() {
  server.use(
    http.get('*/questions', ({ request }) => {
      const url = new URL(request.url);
      const ids = (url.searchParams.get('questionIds') ?? '')
        .split(',')
        .filter(Boolean);
      requestedIds.push(...ids);
      const questions = ids
        .map((id) => QUESTION_DEFS[id])
        .filter((q): q is Record<string, unknown> => Boolean(q));
      return HttpResponse.json({
        metadata: { page: 0, total: questions.length },
        questions,
      });
    })
  );
}

const response = (questionId: string): ClientQuestionResponse =>
  ({ questionId, values: ['x'] }) as unknown as ClientQuestionResponse;

describe('useQuestionTree — outstanding-gated sub-question fetching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
    requestedIds = [];
    mockQuestionsEndpoint();
  });

  it('does NOT fetch a referenced sub-question that is not outstanding', async () => {
    const { result } = renderHook(
      () =>
        useQuestionTree({
          outstandingQuestionIds: ['30158'],
          existingQuestionResponses: [],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 30158's subQuestion references 30162, but 30162 is not outstanding, so it
    // must never be requested nor surfaced as a form question.
    expect(requestedIds).toContain('30158');
    expect(requestedIds).not.toContain('30162');
    expect(result.current.allFormQuestionIds).toEqual(['30158']);
    expect(result.current.allQuestions.map((q) => q.id)).not.toContain('30162');
  });

  it('fetches a sub-question when it is itself outstanding', async () => {
    const { result } = renderHook(
      () =>
        useQuestionTree({
          outstandingQuestionIds: ['30158', '30162'],
          existingQuestionResponses: [],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(requestedIds).toContain('30158');
    expect(requestedIds).toContain('30162');
    expect(result.current.allFormQuestionIds).toEqual(['30158', '30162']);
    expect(result.current.allQuestions.map((q) => q.id)).toContain('30162');
  });

  it('does not descend a nested chain past the outstanding boundary', async () => {
    // 30088 is outstanding; its child 30089 (and grandchild 30090) are not.
    const { result } = renderHook(
      () =>
        useQuestionTree({
          outstandingQuestionIds: ['30088'],
          existingQuestionResponses: [],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(requestedIds).toContain('30088');
    expect(requestedIds).not.toContain('30089');
    expect(requestedIds).not.toContain('30090');
    expect(result.current.allFormQuestionIds).toEqual(['30088']);
  });

  it('fetches an entire outstanding nested chain', async () => {
    const { result } = renderHook(
      () =>
        useQuestionTree({
          outstandingQuestionIds: ['30088', '30089', '30090'],
          existingQuestionResponses: [],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.allFormQuestionIds).toEqual([
      '30088',
      '30089',
      '30090',
    ]);
    const fetchedIds = result.current.allQuestions.map((q) => q.id);
    expect(fetchedIds).toEqual(
      expect.arrayContaining(['30088', '30089', '30090'])
    );
  });

  it('includes existing (already-answered) responses as roots', async () => {
    const { result } = renderHook(
      () =>
        useQuestionTree({
          outstandingQuestionIds: [],
          existingQuestionResponses: [response('30005')],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(requestedIds).toContain('30005');
    expect(result.current.allFormQuestionIds).toContain('30005');
  });

  it('fires no requests and is not loading when disabled', async () => {
    const { result } = renderHook(
      () =>
        useQuestionTree({
          outstandingQuestionIds: ['30158'],
          existingQuestionResponses: [],
          enabled: false,
        }),
      { wrapper }
    );

    // Give any (incorrectly enabled) query a chance to fire.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.isLoading).toBe(false);
    expect(requestedIds).toHaveLength(0);
    expect(result.current.allQuestions).toHaveLength(0);
  });
});
