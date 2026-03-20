/**
 * Shared utilities for OnboardingFlow stories
 */

import React, { useEffect, useState } from 'react';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientCorpEBMockNoIndustry } from '@/mocks/efClientCorpEBNoIndustry.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import { db, verifyMicrodeposit } from '@/msw/db';
import { http, HttpResponse } from 'msw';

import type {
  ApiError,
  ListRecipientsResponse,
  MicrodepositAmounts,
  MicrodepositVerificationResponse,
  Recipient,
  RecipientRequest,
} from '@/api/generated/ep-recipients.schemas';
import {
  ClientStatus,
  type ClientResponse,
} from '@/api/generated/smbdo.schemas';
import { OnboardingFlow } from '@/core/OnboardingFlow';
import type { BankAccountFormData } from '@/core/RecipientWidgets/components/BankAccountForm';

import { handlers } from '../../../msw/handlers';
import type {
  LinkAccountInitialValues,
  LinkAccountReviewAcknowledgement,
  OnboardingFlowProps,
} from '../types/onboarding.types';

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
// Linked Account Mocks
// ============================================================================

/** Mock existing linked account (ACTIVE) */
export const mockExistingLinkedAccount: Recipient = {
  id: 'la-existing-001',
  type: 'LINKED_ACCOUNT',
  status: 'ACTIVE',
  clientId: DEFAULT_CLIENT_ID,
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Alex',
    lastName: 'James',
    address: {
      addressLine1: '451 Rose Garden',
      city: 'New York City',
      countryCode: 'US',
      state: 'NY',
      postalCode: '10007',
    },
    contacts: [
      { contactType: 'EMAIL', value: 'alex.james@example.com' },
      { contactType: 'PHONE', countryCode: '+1', value: '5551234567' },
    ],
  },
  account: {
    number: '12345678901234567',
    type: 'CHECKING',
    countryCode: 'US',
    routingInformation: [
      {
        routingCodeType: 'USABA',
        routingNumber: '154135115',
        transactionType: 'ACH',
      },
    ],
  },
  createdAt: '2024-01-15T10:30:00Z',
};

/** Same party/account as {@link mockExistingLinkedAccount} — **PENDING** (split-profile processing). */
export const mockExistingLinkedAccountPending: Recipient = {
  ...mockExistingLinkedAccount,
  id: 'la-lifecycle-pending',
  status: 'PENDING',
};

/** **MICRODEPOSITS_INITIATED** — waiting for deposits to land. */
export const mockExistingLinkedAccountMicrodepositsInitiated: Recipient = {
  ...mockExistingLinkedAccount,
  id: 'la-lifecycle-md-initiated',
  status: 'MICRODEPOSITS_INITIATED',
};

/** **READY_FOR_VALIDATION** — user should enter microdeposit amounts. */
export const mockExistingLinkedAccountReadyForValidation: Recipient = {
  ...mockExistingLinkedAccount,
  id: 'la-lifecycle-ready-validation',
  status: 'READY_FOR_VALIDATION',
};

/** Partial prefill for link-account step (`completionMode: 'editable'`). */
export const mockLinkAccountPrefillEditable: LinkAccountInitialValues = {
  accountNumber: '98765432109876543',
  routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
};

/** Full form-shaped payload for link-account `prefillSummary` (or tests). */
export const mockLinkAccountPrefillReadonly: BankAccountFormData = {
  accountType: 'INDIVIDUAL',
  firstName: 'Taylor',
  lastName: 'Morgan',
  businessName: '',
  routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
  useSameRoutingNumber: true,
  accountNumber: '12345678901234567',
  bankAccountType: 'CHECKING',
  paymentTypes: ['ACH'],
  certify: true,
};

/** Default three acknowledgements for `completionMode: 'prefillSummary'` demos. */
export const mockLinkAccountPrefillSummaryAcknowledgementsThree: readonly LinkAccountReviewAcknowledgement[] =
  [
    {
      id: 'businessPurpose',
      labelKey:
        'screens.linkAccount.prefillSummary.acknowledgements.businessPurpose',
    },
    {
      id: 'verifyAndAccuracy',
      labelKey:
        'screens.linkAccount.prefillSummary.acknowledgements.verifyAndAccuracy',
    },
    {
      id: 'debitAndTerms',
      labelKey:
        'screens.linkAccount.prefillSummary.acknowledgements.debitAndTerms',
      linkHrefs: {
        jpTermsLink: 'https://example.com/jpmorgan-terms',
        platformAgreementLink: 'https://example.com/platform-program-agreement',
      },
    },
  ];

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
  /** Existing linked accounts to return from GET /recipients */
  existingLinkedAccounts?: Recipient[];
}

// ============================================================================
// MSW Handlers
// ============================================================================

/**
 * Seeds {@link db.recipient} from story fixtures so GET /recipients/:id and
 * POST .../verify-microdeposit match list responses (microdeposit dialog in LinkAccountScreen).
 */
function ensureOnboardingLinkedRecipientInDb(recipient: Recipient): void {
  const existing = db.recipient.findFirst({
    where: { id: { equals: recipient.id } },
  });
  if (existing) return;

  const withAttempts = recipient as Recipient & {
    verificationAttempts?: number;
  };
  const attempts = withAttempts.verificationAttempts ?? 0;

  db.recipient.create({
    id: recipient.id,
    type: recipient.type ?? 'LINKED_ACCOUNT',
    status: recipient.status ?? 'PENDING',
    clientId: recipient.clientId ?? '',
    partyDetails: recipient.partyDetails ?? {},
    account: recipient.account ?? {},
    createdAt: recipient.createdAt ?? new Date().toISOString(),
    updatedAt:
      recipient.updatedAt ?? recipient.createdAt ?? new Date().toISOString(),
    verificationAttempts: attempts,
  });
}

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
    existingLinkedAccounts: existingLinkedAccountsOption,
  } = options;
  const existingLinkedAccounts = existingLinkedAccountsOption ?? [];

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

  // ---------------------------------------------------------------------------
  // Linked Account / Recipient handlers (for LinkAccountScreen)
  // ---------------------------------------------------------------------------

  // POST /recipients - Create new linked account
  baseHandlers.push(
    http.post('/recipients', async ({ request }) => {
      await new Promise((r) => {
        setTimeout(r, delayMs);
      });

      const body = (await request.json()) as RecipientRequest;

      const newRecipient: Recipient = {
        id: `recipient-${Date.now()}`,
        type: 'LINKED_ACCOUNT',
        status: 'MICRODEPOSITS_INITIATED',
        clientId: body?.clientId ?? clientId,
        partyDetails: {
          type: body?.partyDetails?.type ?? 'INDIVIDUAL',
          firstName: body?.partyDetails?.firstName,
          lastName: body?.partyDetails?.lastName,
          businessName: body?.partyDetails?.businessName,
          address: body?.partyDetails?.address,
          contacts: body?.partyDetails?.contacts,
        },
        account: {
          type: body?.account?.type ?? 'CHECKING',
          number: body?.account?.number ?? '1234567890',
          routingInformation:
            body?.account?.routingInformation &&
            Array.isArray(body.account.routingInformation) &&
            body.account.routingInformation.length > 0
              ? body.account.routingInformation
              : [
                  {
                    routingCodeType: 'USABA',
                    routingNumber:
                      body?.account?.routingInformation?.[0]?.routingNumber ??
                      '123456789',
                    transactionType: 'ACH',
                  },
                ],
          countryCode: body?.account?.countryCode ?? 'US',
        },
        createdAt: new Date().toISOString(),
      };

      return HttpResponse.json(newRecipient, { status: 201 });
    })
  );

  // GET /recipients - List linked accounts (db-backed when fixtures seed MSW db)
  baseHandlers.push(
    http.get('/recipients', async () => {
      await new Promise((r) => {
        setTimeout(r, delayMs);
      });

      for (const r of existingLinkedAccounts) {
        ensureOnboardingLinkedRecipientInDb(r);
      }

      const fromDb = db.recipient
        .getAll()
        .filter((row) => row.type === 'LINKED_ACCOUNT');

      const recipients: Recipient[] =
        fromDb.length > 0
          ? (fromDb as unknown as Recipient[])
          : existingLinkedAccounts;

      const response: ListRecipientsResponse = {
        recipients,
        metadata: { total_items: recipients.length },
      };
      return HttpResponse.json(response);
    })
  );

  // GET /recipients/:id - Single recipient (for microdeposit dialog)
  baseHandlers.push(
    http.get('/recipients/:id', async ({ params }) => {
      await new Promise((r) => {
        setTimeout(r, delayMs);
      });

      const id = params.id as string;

      for (const r of existingLinkedAccounts) {
        ensureOnboardingLinkedRecipientInDb(r);
      }

      const fromDb = db.recipient.findFirst({
        where: { id: { equals: id } },
      });

      if (fromDb) {
        return HttpResponse.json(fromDb as unknown as Recipient);
      }

      const error: ApiError = {
        httpStatus: 404,
        title: 'Recipient not found',
        context: [],
      };
      return HttpResponse.json(error, { status: 404 });
    })
  );

  // POST /recipients/:id/verify-microdeposit - Verify microdeposits
  baseHandlers.push(
    http.post(
      '/recipients/:id/verify-microdeposit',
      async ({ params, request }) => {
        await new Promise((r) => {
          setTimeout(r, delayMs);
        });

        const { id } = params;
        const body = (await request.json()) as MicrodepositAmounts;
        const amounts = body.amounts ?? [];

        const result = verifyMicrodeposit(id as string, amounts);

        if (result.error) {
          return HttpResponse.json(result.error as ApiError, {
            status: result.error.httpStatus ?? 400,
          });
        }

        const response: MicrodepositVerificationResponse = {
          status: result.status as MicrodepositVerificationResponse['status'],
        };

        return HttpResponse.json(response);
      }
    )
  );

  return baseHandlers;
}

/**
 * Shared {@link createOnboardingFlowHandlers} + args for approved-client link-account Client States stories.
 * Avoids repeating MSW setup across approved link-account Client States stories.
 */
export function buildApprovedClientLinkAccountStory(options?: {
  linkAccountStepOptions?: OnboardingFlowProps['linkAccountStepOptions'];
  /** Merged into {@link createOnboardingFlowHandlers} (e.g. `existingLinkedAccounts`). */
  handlerOptions?: Omit<OnboardingFlowHandlerOptions, 'client' | 'clientId'>;
}) {
  const { linkAccountStepOptions, handlerOptions } = options ?? {};
  return {
    parameters: {
      msw: {
        handlers: createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
          ...handlerOptions,
        }),
      },
    },
    args: {
      ...commonArgs,
      clientId: DEFAULT_CLIENT_ID,
      showLinkAccountStep: true as const,
      ...(linkAccountStepOptions !== undefined
        ? { linkAccountStepOptions }
        : {}),
    },
  };
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
  hideSidebar: false,
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
  hideSidebar: {
    control: { type: 'boolean' as const },
    description: 'Hide the sidebar timeline navigation (shown by default)',
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
  showLinkAccountStep: {
    control: { type: 'boolean' as const },
    description: 'Show the link bank account step in the onboarding flow',
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
