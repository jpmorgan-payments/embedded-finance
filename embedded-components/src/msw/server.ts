import { efClientSolPropWithMoreData } from '@/mocks/efClientSolPropWithMoreData.mock';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.get('/clients/*', () => {
    return HttpResponse.json(efClientSolPropWithMoreData);
  }),
];

export const server = setupServer(...handlers);
