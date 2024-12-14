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
} from 'mocks';

import { API_URL } from 'data/constants';
import {
  clientDetailsScenario1,
  clientDetailsScenario2,
  clientDetailsScenario3,
} from 'mocks/clientDetails.mock';

export const handlers = [
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

  http.get(`${API_URL}/ef/do/v1/clients/:clientId`, (req) => {
    console.log('MSW intercepted request:', req.url);
    console.log('Client ID param:', req.params.clientId);

    const clientIdToMock = {
      '0030000132': clientDetailsScenario1,
      '0030000133': clientDetailsScenario2,
      '0030000134': clientDetailsScenario3,
    };
    const { clientId } = req.params;
    return HttpResponse.json(
      clientIdToMock[clientId] || clientDetailsScenario1,
    );
  }),

  http.post(`${API_URL}/ef/do/v1/clients/:clientId`, (req) => {
    const clientIdToMock = {
      '0030000132': clientDetailsScenario1,
      '0030000133': clientDetailsScenario2,
      '0030000134': clientDetailsScenario3,
    };
    const { clientId } = req.params;
    return HttpResponse.json(
      clientIdToMock[clientId] || clientDetailsScenario1,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-MSW-Handled': 'true', // Debug header
        },
      },
    );
  }),
];
