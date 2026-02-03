/**
 * Shared utilities for ClientDetails stories
 */

import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { http, HttpResponse } from 'msw';

import {
  ClientStatus,
  type ClientResponse,
} from '@/api/generated/smbdo.schemas';

/** Mock client for stories (APPROVED for "fully onboarded" demo) */
export const mockClientDetails: ClientResponse = {
  ...efClientCorpEBMock,
  status: ClientStatus.APPROVED,
  results: {
    customerIdentityStatus: 'APPROVED',
  },
  questionResponses: [
    { questionId: '30005', values: ['5000'] },
    { questionId: '300001', values: ['US'] },
    { questionId: '300002', values: ['true'] },
    { questionId: '300003', values: ['true'] },
    { questionId: '300004', values: ['Retail', 'E-commerce'] },
  ],
};

export interface ClientDetailsHandlerOptions {
  delayMs?: number;
  client?: ClientResponse;
  status?: number;
}

/**
 * Create MSW handlers for ClientDetails: GET /clients/:clientId and GET /questions
 * so question responses display full question sentences.
 */
export function createClientDetailsHandlers(
  options: ClientDetailsHandlerOptions = {}
) {
  const { delayMs = 200, client = mockClientDetails, status = 200 } = options;

  return [
    http.get('*/clients/:clientId', async () => {
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      if (status !== 200) {
        return HttpResponse.json(
          { title: 'Not found', httpStatus: 404 },
          { status }
        );
      }
      return HttpResponse.json(client);
    }),
    http.get('*/questions', (req) => {
      const url = new URL(req.request.url);
      const questionIdsParam = url.searchParams.get('questionIds');
      const ids = questionIdsParam?.split(',').filter(Boolean) ?? [];
      const fromMock = efClientQuestionsMock.questions.filter((q) =>
        ids.includes(q.id)
      );
      const stubDescriptions: Record<string, string> = {
        '300001': 'In which country is your business primarily located?',
        '300002': 'Do you have a registered business address?',
        '300003': 'Is your business publicly traded?',
        '300004': 'Which industry segments does your business operate in?',
      };
      const stubs = ids
        .filter((id) => !fromMock.some((q) => q.id === id))
        .map((id) => ({
          id,
          description: stubDescriptions[id] ?? `Question ${id}`,
          defaultLocale: 'en-US',
          content: [],
          responseSchema: { type: 'array', items: {} },
          subQuestions: [],
        }));
      return HttpResponse.json({
        metadata: efClientQuestionsMock.metadata,
        questions: [...fromMock, ...stubs],
      });
    }),
  ];
}

export const commonArgs = {
  clientId: '0030000133',
  viewMode: 'accordion' as const,
  title: 'Client details',
};
