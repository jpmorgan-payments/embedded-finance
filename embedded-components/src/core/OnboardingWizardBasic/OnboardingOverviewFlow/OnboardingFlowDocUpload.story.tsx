import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import { Meta } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import defaultMeta, {
  OnboardingFlowWithProviderProps,
} from './OnboardingFlow.story';
import { SThemeWithMock } from './OnboardingFlowMocks.story';

const meta: Meta<OnboardingFlowWithProviderProps> = {
  ...defaultMeta,
  title: 'Onboarding Flow / Document Upload Mode',
};
export default meta;

const CLIENT_ID = '0030000133';

const docRequestOne = {
  ...efDocumentRequestDetails,
  id: '68805',
  partyId: '2000000112',
  clientId: CLIENT_ID,
};
const docRequestTwo = {
  ...efDocumentRequestDetails,
  id: '68804',
  partyId: '2000000113',
  clientId: CLIENT_ID,
};
const docRequestThree = {
  ...efOrganizationDocumentRequestDetails,
  clientId: CLIENT_ID,
};

const defaultHandlers = [
  http.get(`/clients/${CLIENT_ID}`, () => {
    return HttpResponse.json({
      ...efClientCorpEBMock,
      status: 'INFORMATION_REQUESTED',
    });
  }),
  http.get('/document-requests/68805', () => {
    return HttpResponse.json(docRequestOne);
  }),
  http.get('/document-requests/68804', () => {
    return HttpResponse.json(docRequestTwo);
  }),
  http.get('/document-requests/68803', () => {
    return HttpResponse.json(docRequestThree);
  }),
  http.post('/document-requests/:requestId/submit', ({ params }) => {
    console.log(`Document request ${params.requestId} submitted successfully`);
    return new HttpResponse(
      JSON.stringify({
        acceptedAt: new Date().toISOString(),
      }),
      {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),
];

export const DocsRequested = SThemeWithMock.bind({});
DocsRequested.storyName = 'Documents requested';
DocsRequested.args = {
  ...SThemeWithMock.args,
  initialClientId: CLIENT_ID,
  docUploadOnlyMode: true,
};
DocsRequested.parameters = {
  msw: {
    handlers: [
      ...defaultHandlers,
      http.get('/document-requests', (req) => {
        const url = new URL(req.request.url);
        const clientId = url.searchParams.get('clientId');
        if (!clientId) {
          return new HttpResponse(null, {
            status: 400,
            statusText: 'Bad Request: Missing clientId parameter',
          });
        }
        return HttpResponse.json({
          documentRequests: [docRequestOne, docRequestTwo, docRequestThree],
        });
      }),
      http.post('/documents', () => {
        return HttpResponse.json({
          requestId: Math.random().toString(36).substring(7),
          traceId: `doc-${Math.random().toString(36).substring(7)}`,
        });
      }),
    ],
  },
};

export const NoDocsRequested = DocsRequested.bind({});
NoDocsRequested.storyName = 'No documents requested';
NoDocsRequested.args = {
  ...DocsRequested.args,
};
NoDocsRequested.parameters = {
  msw: {
    handlers: [
      ...defaultHandlers,
      http.get('/document-requests', (req) => {
        const url = new URL(req.request.url);
        const clientId = url.searchParams.get('clientId');
        if (!clientId) {
          return new HttpResponse(null, {
            status: 400,
            statusText: 'Bad Request: Missing clientId parameter',
          });
        }
        return HttpResponse.json({
          documentRequests: [],
        });
      }),
    ],
  },
};

export const LoadingState = DocsRequested.bind({});
LoadingState.storyName = 'Loading state on get';
LoadingState.args = {
  ...DocsRequested.args,
};
LoadingState.parameters = {
  msw: {
    handlers: [
      ...defaultHandlers,
      http.get('/document-requests', async () => {
        // Delay the response by 3 seconds (3000 milliseconds)
        await new Promise((resolve) => {
          setTimeout(resolve, 10000);
        });
        return HttpResponse.json({
          documentRequests: [docRequestOne, docRequestTwo, docRequestThree],
        });
      }),
    ],
  },
};

export const ErrorOnGet = DocsRequested.bind({});
ErrorOnGet.storyName = 'Error on get';
ErrorOnGet.args = {
  ...DocsRequested.args,
};
ErrorOnGet.parameters = {
  msw: {
    handlers: [
      ...defaultHandlers,
      http.get('/document-requests', () => {
        return new HttpResponse(null, {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }),
    ],
  },
};

export const NoClientFound = DocsRequested.bind({});
NoClientFound.storyName = 'No client found';
NoClientFound.args = {
  ...DocsRequested.args,
  initialClientId: '',
};
NoClientFound.parameters = DocsRequested.parameters;

export const ErrorOnUploadDocument = DocsRequested.bind({});
ErrorOnUploadDocument.storyName = 'Error on document upload';
ErrorOnUploadDocument.args = {
  ...DocsRequested.args,
};
ErrorOnUploadDocument.parameters = {
  msw: {
    handlers: [
      ...defaultHandlers,
      http.get('/document-requests', (req) => {
        const url = new URL(req.request.url);
        const clientId = url.searchParams.get('clientId');
        if (!clientId) {
          return new HttpResponse(null, {
            status: 400,
            statusText: 'Bad Request: Missing clientId parameter',
          });
        }
        return HttpResponse.json({
          documentRequests: [docRequestOne, docRequestTwo, docRequestThree],
        });
      }),
      http.post('/documents', () => {
        return new HttpResponse(null, {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }),
    ],
  },
};

export const ErrorOnSubmitDocument = DocsRequested.bind({});
ErrorOnSubmitDocument.storyName = 'Error on document submit';
ErrorOnSubmitDocument.args = {
  ...DocsRequested.args,
};
ErrorOnSubmitDocument.parameters = {
  msw: {
    handlers: [
      ...defaultHandlers,
      http.get('/document-requests', (req) => {
        const url = new URL(req.request.url);
        const clientId = url.searchParams.get('clientId');
        if (!clientId) {
          return new HttpResponse(null, {
            status: 400,
            statusText: 'Bad Request: Missing clientId parameter',
          });
        }
        return HttpResponse.json({
          documentRequests: [docRequestOne, docRequestTwo, docRequestThree],
        });
      }),
      http.post('/document-requests/:requestId/submit', () => {
        return new HttpResponse(null, {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }),
    ],
  },
};
