import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import { useRfiQuestionIds } from './useRfiQuestionIds';

const KYC_IDS = new Set(['30005', '30095']);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EBComponentsProvider apiBaseUrl="/" headers={{}}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </EBComponentsProvider>
);

const mockQuestions = (total?: number) =>
  server.use(
    http.get('*/questions', ({ request }) => {
      const url = new URL(request.url);
      const questions = (url.searchParams.get('questionIds') ?? '')
        .split(',')
        .filter(
          (id) => url.searchParams.get('category') !== 'KYC' || KYC_IDS.has(id)
        )
        .map((id) => ({ id }));
      return HttpResponse.json({
        metadata: { page: 0, total: total ?? questions.length },
        questions,
      });
    })
  );

const client = {
  outstanding: { questionIds: ['30095', '500096'] },
  questionResponses: [
    { questionId: '30005', values: ['1'] },
    { questionId: '500011', values: ['12'] },
  ],
} as unknown as ClientResponse;

describe('useRfiQuestionIds', () => {
  beforeEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  it('lists outstanding and answered questions the API does not file as KYC', async () => {
    mockQuestions();
    const { result } = renderHook(() => useRfiQuestionIds(client), {
      wrapper,
    });

    await waitFor(() => expect(result.current).toEqual(['500011', '500096']));
  });

  it('stays unknown when the filtered answer is cut off', async () => {
    mockQuestions(30);
    const { result } = renderHook(() => useRfiQuestionIds(client), {
      wrapper,
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryCache().findAll({ queryKey: ['/questions'] })[0]
          ?.state.status
      ).toBe('success')
    );
    expect(result.current).toBeUndefined();
  });

  it('keeps the last answer while a new question ID loads', async () => {
    mockQuestions();
    const { result, rerender } = renderHook(
      ({ clientData }) => useRfiQuestionIds(clientData),
      { wrapper, initialProps: { clientData: client } }
    );
    await waitFor(() => expect(result.current).toEqual(['500011', '500096']));

    rerender({
      clientData: {
        ...client,
        outstanding: { questionIds: ['30095', '500096', '500099'] },
      } as ClientResponse,
    });
    expect(result.current).toEqual(['500011', '500096']);

    await waitFor(() =>
      expect(result.current).toEqual(['500011', '500096', '500099'])
    );
  });

  it('is empty for a client without questions', () => {
    const { result } = renderHook(
      () => useRfiQuestionIds({} as ClientResponse),
      { wrapper }
    );
    expect(result.current).toEqual([]);
  });
});
