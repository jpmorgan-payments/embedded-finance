import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import { Meta } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import defaultMeta, {
  OnboardingFlowWithProviderProps,
} from './OnboardingFlow.story';
import { SThemeWithMock } from './OnboardingFlowMocks.story';

const meta: Meta<OnboardingFlowWithProviderProps> = {
  ...defaultMeta,
  title: 'Core/OnboardingFlow/DocumentUpload',
  tags: ['@core', '@onboarding'],
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
    // eslint-disable-next-line no-console
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
export const DocsRequestedMultipleDocsInRequirement = SThemeWithMock.bind({});
DocsRequestedMultipleDocsInRequirement.storyName =
  'Multiple docs required in requirement';
DocsRequestedMultipleDocsInRequirement.args = {
  ...SThemeWithMock.args,
  initialClientId: CLIENT_ID,
  docUploadOnlyMode: true,
};
DocsRequestedMultipleDocsInRequirement.parameters = {
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
          documentRequests: [
            {
              clientId: CLIENT_ID,
              createdAt: '2025-06-24T15:01:55.713Z',
              id: '88916',
              description:
                'To verify your identity, please provide requested documents.\n1. Formation Document - listing the legal name and address of the company.\n The certificate or other record that proves the corporation’s existence must have been issued by a competent authority under the legislation of the jurisdiction in which the corporation was incorporated and it must be authentic, valid and current. Acceptable documents are: A partnership agreement [OR] Acceptable documents are: A partnership agreement [OR] [OR] Any other similar record that confirms the entity\u0027s existence.\n[AND] 2. Tax Document - FATCA/CRS or any documentation confirming tax filings.',
              outstanding: {
                documentTypes: [
                  'PARTNERSHIP_AGREEMENT',
                  'IDENTIFICATION_DOCUMENT',
                  'TRUST_AGREEMENT',
                  'TAX_DOCUMENT',
                  'ARTICLES_OF_ASSOCIATION',
                  'ANNUAL_FILINGS',
                ],
              },
              requirements: [
                {
                  documentTypes: [
                    'PARTNERSHIP_AGREEMENT',
                    'ARTICLES_OF_ASSOCIATION',
                    'TRUST_AGREEMENT',
                    'ANNUAL_FILINGS',
                    'IDENTIFICATION_DOCUMENT',
                    'TAX_DOCUMENT',
                  ],
                  level: 'PRIMARY',
                  minRequired: 2,
                },
              ],
              status: 'ACTIVE',
              validForDays: 120,
            },
          ],
          metadata: {
            page: 0,
            limit: 25,
            total: 1,
          },
        });
      }),

      http.get('/document-requests/88916', () => {
        return HttpResponse.json({
          clientId: CLIENT_ID,
          createdAt: '2025-06-24T15:01:55.713Z',
          id: '88916',
          description:
            'To verify your identity, please provide requested documents.\n1. Formation Document - listing the legal name and address of the company.\n The certificate or other record that proves the corporation’s existence must have been issued by a competent authority under the legislation of the jurisdiction in which the corporation was incorporated and it must be authentic, valid and current. Acceptable documents are: A partnership agreement [OR] Acceptable documents are: A partnership agreement [OR] [OR] Any other similar record that confirms the entity\u0027s existence.\n[AND] 2. Tax Document - FATCA/CRS or any documentation confirming tax filings.',
          outstanding: {
            documentTypes: [
              'PARTNERSHIP_AGREEMENT',
              'IDENTIFICATION_DOCUMENT',
              'TRUST_AGREEMENT',
              'TAX_DOCUMENT',
              'ARTICLES_OF_ASSOCIATION',
              'ANNUAL_FILINGS',
            ],
          },
          requirements: [
            {
              documentTypes: [
                'PARTNERSHIP_AGREEMENT',
                'ARTICLES_OF_ASSOCIATION',
                'TRUST_AGREEMENT',
                'ANNUAL_FILINGS',
                'IDENTIFICATION_DOCUMENT',
                'TAX_DOCUMENT',
              ],
              level: 'PRIMARY',
              minRequired: 2,
            },
          ],
          status: 'ACTIVE',
          validForDays: 120,
        });
      }),
      http.get('/document-requests/88877', () => {
        return HttpResponse.json({
          clientId: CLIENT_ID,
          createdAt: '2025-06-24T14:45:02.046Z',
          id: '88877',
          description:
            'Requirement validator created by using requirement list provided in the request.',
          outstanding: {
            documentTypes: [],
          },
          requirements: [
            {
              documentTypes: ['PARTNERSHIP_AGREEMENT'],
              minRequired: 1,
            },
          ],
          status: 'ACTIVE',
          validForDays: 120,
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
