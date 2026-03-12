/**
 * Shared utilities for OnboardingFlow stories
 */

import React, { useEffect, useState } from 'react';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientCorpEBMockNoIndustry } from '@/mocks/efClientCorpEBNoIndustry.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import { http, HttpResponse } from 'msw';

import {
  ClientStatus,
  type ClientResponse,
} from '@/api/generated/smbdo.schemas';
import { OnboardingFlow } from '@/core/OnboardingFlow';

import { handlers } from '../../../msw/handlers';
import type { OnboardingFlowProps } from '../types/onboarding.types';

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_CLIENT_ID = '0030000132';
export const DOC_UPLOAD_CLIENT_ID = '0030000133';

// ============================================================================
// Mock Data
// ============================================================================

/** Mock client for stories (NEW status - fresh onboarding) */
export const mockClientNew: ClientResponse = {
  ...efClientCorpEBMock,
  id: DEFAULT_CLIENT_ID,
  status: ClientStatus.NEW,
};

/** Mock client with APPROVED status */
export const mockClientApproved: ClientResponse = {
  ...efClientCorpEBMock,
  id: DEFAULT_CLIENT_ID,
  status: ClientStatus.APPROVED,
  results: {
    customerIdentityStatus: 'APPROVED',
  },
};

/** Mock client with REVIEW_IN_PROGRESS status */
export const mockClientInReview: ClientResponse = {
  ...efClientCorpEBMock,
  id: DEFAULT_CLIENT_ID,
  status: ClientStatus.REVIEW_IN_PROGRESS,
  results: {
    customerIdentityStatus: 'REVIEW_IN_PROGRESS',
  },
};

/** Mock client with INFORMATION_REQUESTED status */
export const mockClientInfoRequested: ClientResponse = {
  ...efClientCorpEBMock,
  id: DEFAULT_CLIENT_ID,
  status: ClientStatus.INFORMATION_REQUESTED,
  results: {
    customerIdentityStatus: 'INFORMATION_REQUESTED',
  },
  outstanding: {
    documentRequestIds: ['doc-1', 'doc-2'],
    questionIds: ['q-1'],
    partyIds: [],
    partyRoles: [],
  },
};

/** Mock client with DECLINED status */
export const mockClientDeclined: ClientResponse = {
  ...efClientCorpEBMock,
  id: DEFAULT_CLIENT_ID,
  status: ClientStatus.DECLINED,
};

/** Mock client without industry (for NAICS recommendations) */
export const mockClientNoIndustry: ClientResponse = {
  ...efClientCorpEBMockNoIndustry,
  id: DEFAULT_CLIENT_ID,
};

// ============================================================================
// Document Request Mocks
// ============================================================================

export const mockDocRequestIndividual1 = {
  ...efDocumentRequestDetails,
  id: '68805',
  partyId: '2000000112',
  clientId: DOC_UPLOAD_CLIENT_ID,
};

export const mockDocRequestIndividual2 = {
  ...efDocumentRequestDetails,
  id: '68804',
  partyId: '2000000113',
  clientId: DOC_UPLOAD_CLIENT_ID,
};

export const mockDocRequestOrganization = {
  ...efOrganizationDocumentRequestDetails,
  clientId: DOC_UPLOAD_CLIENT_ID,
};

// ============================================================================
// Handler Options
// ============================================================================

export interface OnboardingFlowHandlerOptions {
  delayMs?: number;
  client?: ClientResponse;
  clientId?: string;
  status?: number;
  documentRequests?: object[];
  naicsRecommendations?: {
    resource: Array<{ naicsCode: string; naicsDescription: string }>;
    message?: string;
    error?: boolean;
    errorStatus?: number;
  };
}

// ============================================================================
// MSW Handlers
// ============================================================================

/**
 * Create MSW handlers for OnboardingFlow stories
 */
export function createOnboardingFlowHandlers(
  options: OnboardingFlowHandlerOptions = {}
) {
  const {
    delayMs = 200,
    client = mockClientNew,
    clientId = DEFAULT_CLIENT_ID,
    status = 200,
    documentRequests,
    naicsRecommendations,
  } = options;

  const baseHandlers = [
    // Client endpoint
    http.get(`*/clients/${clientId}`, async () => {
      if (delayMs > 0) {
        await new Promise((r) => {
          setTimeout(r, delayMs);
        });
      }
      if (status !== 200) {
        return HttpResponse.json(
          { title: 'Not found', httpStatus: status },
          { status }
        );
      }
      return HttpResponse.json(client);
    }),

    // Questions endpoint
    http.get('/questions', (req) => {
      const url = new URL(req.request.url);
      const questionIdsParam = url.searchParams.get('questionIds');
      const ids = questionIdsParam?.split(',').filter(Boolean) ?? [];
      const fromMock = efClientQuestionsMock.questions.filter((q) =>
        ids.includes(q.id)
      );
      return HttpResponse.json({
        metadata: efClientQuestionsMock.metadata,
        questions: fromMock,
      });
    }),
  ];

  // Add document request handlers if specified
  if (documentRequests) {
    baseHandlers.push(
      http.get('/document-requests', (req) => {
        const url = new URL(req.request.url);
        const reqClientId = url.searchParams.get('clientId');
        if (!reqClientId) {
          return new HttpResponse(null, {
            status: 400,
            statusText: 'Bad Request: Missing clientId parameter',
          });
        }
        return HttpResponse.json({ documentRequests });
      })
    );
  }

  // Add NAICS recommendation handlers if specified
  if (naicsRecommendations) {
    if (naicsRecommendations.error) {
      baseHandlers.push(
        http.post('/recommendations', async () => {
          await new Promise((r) => {
            setTimeout(r, delayMs);
          });
          return HttpResponse.json(
            {
              title: 'Bad Request',
              httpStatus: naicsRecommendations.errorStatus || 400,
              context: [
                {
                  message:
                    'We could not process your request. Please try again or proceed with manual selection.',
                },
              ],
            },
            { status: naicsRecommendations.errorStatus || 400 }
          );
        })
      );
    } else {
      baseHandlers.push(
        http.post('/recommendations', async () => {
          await new Promise((r) => {
            setTimeout(r, delayMs);
          });
          return HttpResponse.json({
            resourceType: 'NAICS_CODE',
            message: naicsRecommendations.message || 'Recommended NAICS codes',
            resource: naicsRecommendations.resource,
          });
        })
      );
    }
  }

  return baseHandlers;
}

/**
 * Create document upload handlers for doc upload mode stories
 */
export function createDocUploadHandlers(
  options: {
    clientId?: string;
    documentRequests?: object[];
    uploadError?: boolean;
    submitError?: boolean;
    loadingDelay?: number;
  } = {}
) {
  const {
    clientId = DOC_UPLOAD_CLIENT_ID,
    documentRequests = [
      mockDocRequestIndividual1,
      mockDocRequestIndividual2,
      mockDocRequestOrganization,
    ],
    uploadError = false,
    submitError = false,
    loadingDelay,
  } = options;

  return [
    http.get(`/clients/${clientId}`, () => {
      return HttpResponse.json({
        ...efClientCorpEBMock,
        status: 'INFORMATION_REQUESTED',
      });
    }),
    http.get('/document-requests', async (req) => {
      if (loadingDelay) {
        await new Promise((r) => {
          setTimeout(r, loadingDelay);
        });
      }
      const url = new URL(req.request.url);
      const reqClientId = url.searchParams.get('clientId');
      if (!reqClientId) {
        return new HttpResponse(null, {
          status: 400,
          statusText: 'Bad Request: Missing clientId parameter',
        });
      }
      return HttpResponse.json({ documentRequests });
    }),
    http.get('/document-requests/:requestId', ({ params }) => {
      const found = documentRequests.find(
        (dr: any) => dr.id === params.requestId
      );
      if (found) {
        return HttpResponse.json(found);
      }
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }),
    http.post('/documents', () => {
      if (uploadError) {
        return new HttpResponse(null, {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }
      return HttpResponse.json({
        requestId: Math.random().toString(36).substring(7),
        traceId: `doc-${Math.random().toString(36).substring(7)}`,
      });
    }),
    http.post('/document-requests/:requestId/submit', ({ params }) => {
      if (submitError) {
        return new HttpResponse(null, {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }
      // eslint-disable-next-line no-console
      console.log(
        `Document request ${params.requestId} submitted successfully`
      );
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
}

// ============================================================================
// Render Utilities
// ============================================================================

/**
 * Full height container wrapper for OnboardingFlow
 */
export const FullHeightContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ height: containerHeight, overflow: 'auto' }}>{children}</div>
  );
};

/**
 * Template render function for OnboardingFlow stories
 */
export const OnboardingFlowTemplate: React.FC<OnboardingFlowProps> = (args) => {
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <OnboardingFlow height={`${containerHeight}px`} {...args} />;
};

// ============================================================================
// Common Story Configuration
// ============================================================================

/**
 * Common default args for OnboardingFlow stories
 */
export const commonArgs: Partial<OnboardingFlowProps> = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  availableOrganizationTypes: [
    'SOLE_PROPRIETORSHIP',
    'LIMITED_LIABILITY_COMPANY',
    'LIMITED_LIABILITY_PARTNERSHIP',
    'GENERAL_PARTNERSHIP',
    'LIMITED_PARTNERSHIP',
    'C_CORPORATION',
  ],
  alertOnExit: false,
  docUploadOnlyMode: false,
  enableSidebar: false,
};

/**
 * Common args with callbacks for development
 */
export const commonArgsWithCallbacks: Partial<OnboardingFlowProps> = {
  ...commonArgs,
  // eslint-disable-next-line no-console
  onPostClientSettled: (data, error) => {
    if (data) {
      // eslint-disable-next-line no-console
      console.log('@@POST client response data', data);
    } else if (error) {
      // eslint-disable-next-line no-console
      console.log('@@POST client response error', error);
    }
  },
  // eslint-disable-next-line no-console
  onPostPartySettled: (response, error) => {
    if (response) {
      // eslint-disable-next-line no-console
      console.log('@@POST party response data', response);
    } else if (error) {
      // eslint-disable-next-line no-console
      console.log('@@POST party response error', error);
    }
  },
  // eslint-disable-next-line no-console
  onPostClientVerificationsSettled: (data, error) => {
    if (data) {
      // eslint-disable-next-line no-console
      console.log('@@POST verifications response data', data);
    } else if (error) {
      // eslint-disable-next-line no-console
      console.log('@@POST verifications response error', error);
    }
  },
};

/**
 * Storybook controls and documentation for OnboardingFlow stories.
 */
export const commonArgTypes = {
  availableProducts: {
    control: { type: 'check' as const },
    options: ['MERCHANT_SERVICES', 'EMBEDDED_PAYMENTS'],
    description: 'Available product options for the client',
    table: {
      category: 'Configuration',
    },
  },
  availableJurisdictions: {
    control: { type: 'check' as const },
    options: ['US', 'CA'],
    description: 'Available jurisdiction options',
    table: {
      category: 'Configuration',
    },
  },
  availableOrganizationTypes: {
    control: { type: 'check' as const },
    options: [
      'SOLE_PROPRIETORSHIP',
      'LIMITED_LIABILITY_COMPANY',
      'LIMITED_LIABILITY_PARTNERSHIP',
      'GENERAL_PARTNERSHIP',
      'LIMITED_PARTNERSHIP',
      'C_CORPORATION',
    ],
    description: 'Available organization types for selection',
    table: {
      category: 'Configuration',
    },
  },
  enableSidebar: {
    control: { type: 'boolean' as const },
    description: 'Enable sidebar navigation with onboarding timeline',
    table: {
      category: 'Display',
      defaultValue: { summary: 'false' },
    },
  },
  showDownloadChecklist: {
    control: { type: 'boolean' as const },
    description:
      'Show the "Download checklist" button in the overview screen header',
    table: {
      category: 'Display',
      defaultValue: { summary: 'false' },
    },
  },
  docUploadOnlyMode: {
    control: { type: 'boolean' as const },
    description:
      'Show only document upload screens (for INFORMATION_REQUESTED clients)',
    table: {
      category: 'Display',
      defaultValue: { summary: 'false' },
    },
  },
  height: {
    control: { type: 'text' as const },
    description: 'Container height (e.g., "100vh", "600px")',
    table: {
      category: 'Display',
      defaultValue: { summary: 'auto' },
    },
  },
  hideLinkAccountSection: {
    control: { type: 'boolean' as const },
    description: 'Hide the link bank account section',
    table: {
      category: 'Display',
      defaultValue: { summary: 'false' },
    },
  },
  alertOnExit: {
    control: { type: 'boolean' as const },
    description: 'Show confirmation dialog when user tries to leave the page',
    table: {
      category: 'Behavior',
      defaultValue: { summary: 'false' },
    },
  },
  docUploadMaxFileSizeBytes: {
    control: { type: 'number' as const },
    description: 'Maximum file size for document uploads in bytes',
    table: {
      category: 'Behavior',
      defaultValue: { summary: '10485760' },
    },
  },
  // Hide callback props from controls
  onPostClientSettled: { table: { disable: true } },
  onPostPartySettled: { table: { disable: true } },
  onPostClientVerificationsSettled: { table: { disable: true } },
  onGetClientSettled: { table: { disable: true } },
  userEventsHandler: { table: { disable: true } },
  userEventsLifecycle: { table: { disable: true } },
};

/**
 * Default MSW handlers for OnboardingFlow stories
 */
export const defaultHandlers = handlers;
