import { http, HttpResponse } from 'msw';

import {
  accountBalanceMock,
  accountsMock,
  casesMock,
  debitCardsMock,
  industryCategoriesMock,
  jobTitlesMock,
  recipientsMock,
  transactionDetailsMock,
  transactionsMock,
  efClientQuestionsMock,
  efDocumentClientDetail,
  efDocumentRequestDetails,
} from 'mocks';

import { API_URL } from 'data/constants';
import {
  SoleProprietorExistingClient,
  LLCExistingClient,
  LLCExistingClientOutstandingDocuments,
} from 'mocks/clientDetails.mock';

const clientIdScenarioMap = {
  '0030000131': SoleProprietorExistingClient,
  '0030000132': LLCExistingClient,
  '0030000133': LLCExistingClientOutstandingDocuments,
};

export const createHandlers = (apiUrl) => [
  http.get(`${API_URL}/api/transactions`, () => {
    return HttpResponse.json(transactionsMock);
  }),
  http.get(`${API_URL}/api/transactions/:selectedTxnId`, () => {
    return HttpResponse.json(transactionDetailsMock);
  }),
  http.get(`${API_URL}/api/recipients`, () => {
    return HttpResponse.json(recipientsMock);
  }),
  http.get(`${API_URL}/api/accounts`, () => {
    return HttpResponse.json(accountsMock);
  }),
  http.get(`${API_URL}/api/accounts/:accountId/balances`, () => {
    return HttpResponse.json(accountBalanceMock);
  }),
  http.get(`${API_URL}/api/debit-cards`, () => {
    return HttpResponse.json(debitCardsMock);
  }),
  http.get(`${API_URL}/api/cases`, () => {
    return HttpResponse.json(casesMock);
  }),
  http.get(`${API_URL}/api/industry-categories`, () => {
    return HttpResponse.json(industryCategoriesMock);
  }),
  http.get(`${API_URL}/api/job-titles`, () => {
    return HttpResponse.json(jobTitlesMock);
  }),

  http.get(`/ef/do/v1/clients/:clientId`, (req) => {
    const { clientId } = req.params;
    return HttpResponse.json(clientIdScenarioMap[clientId] || LLCExistingClient, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),

  http.post(`/ef/do/v1/clients/:clientId`, (req) => {
    const { clientId } = req.params;
    return HttpResponse.json(clientIdScenarioMap[clientId] || LLCExistingClient, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),

  http.post('/ef/do/v1/parties/:partyId', (req) => {
    return HttpResponse.json(
      LLCExistingClient?.parties?.filter((p) => p.id === '2000000111')[0],
    );
  }),

  http.get('/ef/do/v1/questions', (req) => {
    const url = new URL(req.request.url);
    const questionIds = url.searchParams.get('questionIds');
    return HttpResponse.json({
      metadata: efClientQuestionsMock.metadata,
      questions: efClientQuestionsMock?.questions.filter((q) =>
        questionIds?.includes(q.id),
      ),
    });
  }),

  http.get('/ef/do/v1/documents/abcd1c1d-6635-43ff-a8e5-b252926bddef', () => {
    return HttpResponse.json(efDocumentClientDetail);
  }),

  http.get('/ef/do/v1/document-requests/:documentRequestId', () => {
    return HttpResponse.json(efDocumentRequestDetails);
  }),
];
