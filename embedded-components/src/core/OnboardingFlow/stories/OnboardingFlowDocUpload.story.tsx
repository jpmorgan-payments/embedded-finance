/**
 * OnboardingFlow - Document Upload Scenarios
 *
 * Detailed document upload scenarios and edge cases.
 */

import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgTypes,
  defaultHandlers as dbBackedHandlers,
  DEFAULT_CLIENT_ID,
  mockClientApprovedWithOutstandingItems,
  mockClientInfoRequestedQuestionsOnly,
  mockClientInfoRequestedWithQuestions,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

// =============================================================================
// Constants & Mock Data
// =============================================================================

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

// =============================================================================
// Default Handlers
// =============================================================================

const defaultHandlers = [
  http.get(`/clients/${CLIENT_ID}`, () => {
    return HttpResponse.json({
      ...efClientCorpEBMock,
      status: 'INFORMATION_REQUESTED',
      outstanding: {
        ...efClientCorpEBMock.outstanding,
        attestationDocumentIds: [],
        questionIds: [],
      },
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

// =============================================================================
// Meta Configuration
// =============================================================================

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/DocumentUpload',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: defaultHandlers,
    },
  },
  args: {
    ...commonArgs,
    clientId: CLIENT_ID,
    docUploadOnlyMode: true,
  },
  argTypes: {
    ...commonArgTypes,
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};
export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// =============================================================================
// Document Upload Stories
// =============================================================================

/**
 * **Documents Requested**
 *
 * Standard document upload flow with multiple document requests.
 */
export const DocsRequested: Story = {
  name: 'Documents requested',
  parameters: {
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
  },
};

/**
 * **Multiple Docs Required in Requirement**
 *
 * Document request that requires multiple documents to be uploaded.
 */
export const DocsRequestedMultipleDocsInRequirement: Story = {
  name: 'Documents requested — multiple per requirement',
  parameters: {
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
                  "To verify your identity, please provide requested documents.\n1. Formation Document - listing the legal name and address of the company.\n The certificate or other record that proves the corporation's existence must have been issued by a competent authority under the legislation of the jurisdiction in which the corporation was incorporated and it must be authentic, valid and current. Acceptable documents are: A partnership agreement [OR] Acceptable documents are: A partnership agreement [OR] [OR] Any other similar record that confirms the entity's existence.\n[AND] 2. Tax Document - FATCA/CRS or any documentation confirming tax filings.",
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
              "To verify your identity, please provide requested documents.\n1. Formation Document - listing the legal name and address of the company.\n The certificate or other record that proves the corporation's existence must have been issued by a competent authority under the legislation of the jurisdiction in which the corporation was incorporated and it must be authentic, valid and current. Acceptable documents are: A partnership agreement [OR] Acceptable documents are: A partnership agreement [OR] [OR] Any other similar record that confirms the entity's existence.\n[AND] 2. Tax Document - FATCA/CRS or any documentation confirming tax filings.",
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
  },
};

/**
 * **No Documents Requested**
 *
 * Empty state when no documents are requested.
 */
export const NoDocsRequested: Story = {
  name: 'No documents requested',
  parameters: {
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
  },
};

// =============================================================================
// Information requests with questions (MSW db-backed)
// =============================================================================

/**
 * **Information requested — documents + questions**
 *
 * The information request asks for documents and answers to questions. A
 * "Questions for you" card links to the questions screen; the client returns
 * to review once every document is submitted and every question answered.
 */
export const DocsAndQuestionsRequested: Story = {
  name: 'Information requested — documents + questions',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientInfoRequestedWithQuestions,
        DEFAULT_CLIENT_ID
      ),
  ],
  parameters: {
    msw: {
      handlers: dbBackedHandlers,
    },
  },
  args: {
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **Information requested — questions only**
 *
 * The information request contains only questions, so there is nothing to
 * upload and no "no document requests" error is shown.
 */
export const QuestionsOnlyRequested: Story = {
  name: 'Information requested — questions only',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientInfoRequestedQuestionsOnly,
        DEFAULT_CLIENT_ID
      ),
  ],
  parameters: {
    msw: {
      handlers: dbBackedHandlers,
    },
  },
  args: {
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **Approved — outstanding items (documents + questions)**
 *
 * A request for information raised after approval. The status stays
 * `APPROVED`; the outstanding document and questions are still collected here.
 */
export const ApprovedWithOutstandingItems: Story = {
  name: 'Approved — outstanding items (documents + questions)',
  loaders: [
    () =>
      resetAndSeedClient(
        mockClientApprovedWithOutstandingItems,
        DEFAULT_CLIENT_ID
      ),
  ],
  parameters: {
    msw: {
      handlers: dbBackedHandlers,
    },
  },
  args: {
    clientId: DEFAULT_CLIENT_ID,
  },
};

// =============================================================================
// Loading & error states
// =============================================================================

/**
 * **Loading State**
 *
 * Loading state while fetching document requests (10 second delay).
 */
export const LoadingState: Story = {
  name: 'Loading',
  parameters: {
    msw: {
      handlers: [
        ...defaultHandlers,
        http.get('/document-requests', async () => {
          // Delay the response by 10 seconds
          await new Promise((resolve) => {
            setTimeout(resolve, 10000);
          });
          return HttpResponse.json({
            documentRequests: [docRequestOne, docRequestTwo, docRequestThree],
          });
        }),
      ],
    },
  },
};

/**
 * **Error on Get**
 *
 * Error state when fetching document requests fails.
 */
export const ErrorOnGet: Story = {
  name: 'Error — loading document requests',
  parameters: {
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
  },
};

/**
 * **No Client Found**
 *
 * State when no clientId is provided.
 */
export const NoClientFound: Story = {
  name: 'Error — no client ID',
  args: {
    clientId: '',
  },
};

/**
 * **Error on Document Upload**
 *
 * Error state when document upload fails.
 */
export const ErrorOnUploadDocument: Story = {
  name: 'Error — uploading a document',
  parameters: {
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
  },
};

/**
 * **Error on Document Submit**
 *
 * Error state when document submission fails.
 */
export const ErrorOnSubmitDocument: Story = {
  name: 'Error — submitting a document request',
  parameters: {
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
  },
};
