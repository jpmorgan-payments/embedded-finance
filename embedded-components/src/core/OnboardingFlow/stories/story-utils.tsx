/**
 * Shared utilities for OnboardingFlow stories
 */

import React, { useEffect, useState } from 'react';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientCorpEBMockNoIndustry } from '@/mocks/efClientCorpEBNoIndustry.mock';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import { db, upsertDocumentRequest } from '@/msw/db';
import { http, HttpResponse } from 'msw';

import type {
  ListRecipientsResponse,
  Recipient,
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
    ...efClientCorpEBMock.outstanding,
    documentRequestIds: ['68803', '68804', '68805'],
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
 * Seed the MSW db with a ClientResponse mock.
 * Extracts inline party objects, creates them as db records, then creates
 * the client record with party ID references (matching the db schema).
 */
export function seedClientToDb(
  clientResponse: ClientResponse,
  clientId: string
) {
  const partyIds: string[] = [];

  // Seed parties from the inline party objects
  if (clientResponse.parties && Array.isArray(clientResponse.parties)) {
    for (const party of clientResponse.parties as Record<string, unknown>[]) {
      const partyId = party.id as string;
      if (partyId) {
        db.party.create(party);
        partyIds.push(partyId);
      }
    }
  }

  // Create the client with party IDs (not full objects)
  const { parties: _parties, ...clientWithoutParties } = clientResponse;
  db.client.create({
    ...clientWithoutParties,
    id: clientId,
    parties: partyIds,
  });
}

/**
 * Reset the MSW db and seed it with a ClientResponse mock.
 * Intended for use in Storybook `loaders` so each story starts clean.
 *
 * We wipe the db tables directly instead of using `resetDb()` because
 * `resetDb` re-seeds predefined clients whose party IDs may collide
 * with the story's mock data.
 */
/**
 * Seeds {@link db.documentRequest} rows aligned with {@link efClientCorpEBMock} parties
 * (org 68803, controller 68804, beneficial owner 68805) for Client States demos.
 */
export function seedInformationRequestedDocumentRequests(
  clientId: string
): void {
  const timestamp = new Date().toISOString();

  upsertDocumentRequest('68803', {
    ...efOrganizationDocumentRequestDetails,
    id: '68803',
    clientId,
    partyId: '2000000111',
    createdAt: timestamp,
  });

  upsertDocumentRequest('68804', {
    ...efDocumentRequestDetails,
    id: '68804',
    clientId,
    partyId: '2000000112',
    createdAt: timestamp,
  });

  upsertDocumentRequest('68805', {
    ...efDocumentRequestDetails,
    id: '68805',
    clientId,
    partyId: '2000000113',
    createdAt: timestamp,
  });
}

export function resetAndSeedClient(
  clientResponse: ClientResponse,
  clientId: string
) {
  // Wipe all tables without re-seeding predefined data
  db.client.deleteMany({ where: {} });
  db.party.deleteMany({ where: {} });
  db.documentRequest.deleteMany({ where: {} });
  db.recipient.deleteMany({ where: {} });

  seedClientToDb(clientResponse, clientId);

  if (clientResponse.status === ClientStatus.INFORMATION_REQUESTED) {
    seedInformationRequestedDocumentRequests(clientId);
  }
}

/**
 * Create MSW handlers for OnboardingFlow stories.
 *
 * Returns the global handlers (which use the MSW db for all CRUD) plus
 * any story-specific overrides (error states, document requests, etc.).
 *
 * **Important:** DB seeding must happen separately in a Storybook `loaders`
 * callback (not here) because `parameters.msw.handlers` is evaluated at
 * module load time — before any story renders.
 */
export function createOnboardingFlowHandlers(
  options: OnboardingFlowHandlerOptions = {}
) {
  const {
    delayMs = 200,
    clientId = DEFAULT_CLIENT_ID,
    status = 200,
    documentRequests,
    naicsRecommendations,
    existingLinkedAccounts: existingLinkedAccountsOption,
  } = options;
  const existingLinkedAccounts = existingLinkedAccountsOption ?? [];

  // Start with the global handlers (which use the db for all CRUD)
  const storyHandlers = [...handlers];

  // For error/loading stories, override the client GET endpoint
  if (status !== 200 || delayMs > 200) {
    storyHandlers.unshift(
      http.get(`/clients/${clientId}`, async () => {
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
        // Fall through to the global handler by not returning here
        // (but we seeded the db above, so the global handler will find it)
        const dbClient = db.client.findFirst({
          where: { id: { equals: clientId } },
        });
        if (!dbClient) {
          return new HttpResponse(null, { status: 404 });
        }
        const expandedClient = {
          ...dbClient,
          parties: (dbClient.parties as string[])
            .map((partyId) =>
              db.party.findFirst({ where: { id: { equals: partyId } } })
            )
            .filter(Boolean),
        };
        return HttpResponse.json(expandedClient);
      })
    );
  }

  // Add document request handlers if specified
  if (documentRequests) {
    storyHandlers.unshift(
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
      storyHandlers.unshift(
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
      storyHandlers.unshift(
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

  // Override recipient handlers when custom linked accounts are provided
  if (existingLinkedAccounts.length > 0) {
    storyHandlers.unshift(
      http.get('/recipients', async () => {
        await new Promise((r) => {
          setTimeout(r, delayMs);
        });
        const response: ListRecipientsResponse = {
          recipients: existingLinkedAccounts,
          metadata: { total_items: existingLinkedAccounts.length },
        };
        return HttpResponse.json(response);
      })
    );
  }

  return storyHandlers;
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
  const existingLinkedAccounts = handlerOptions?.existingLinkedAccounts ?? [];
  return {
    /**
     * Reset MSW db on story selection so linked-account rows from a previous story
     * don't carry over between stories.  Seed recipients into the db so the
     * global handlers (GET /recipients/:id, verify-microdeposit, etc.) find them.
     */
    loaders: [
      async () => {
        resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
        for (const recipient of existingLinkedAccounts) {
          db.recipient.create({
            id: recipient.id,
            type: recipient.type ?? 'LINKED_ACCOUNT',
            status: recipient.status ?? 'PENDING',
            clientId: recipient.clientId ?? DEFAULT_CLIENT_ID,
            partyDetails: recipient.partyDetails ?? {},
            account: recipient.account ?? {},
            createdAt: recipient.createdAt ?? new Date().toISOString(),
            updatedAt:
              recipient.updatedAt ??
              recipient.createdAt ??
              new Date().toISOString(),
            verificationAttempts: 0,
          });
        }
        return {};
      },
    ],
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
  alertOnPreviousStep: false,
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
      'S_CORPORATION',
      'PARTNERSHIP',
      'PUBLICLY_TRADED_COMPANY',
      'NON_PROFIT_CORPORATION',
      'GOVERNMENT_ENTITY',
      'UNINCORPORATED_ASSOCIATION',
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
    description:
      'Show the linked account section. Use alongside `linkAccountEnabledStatuses` to control which statuses allow linking.',
    table: {
      category: 'Display',
      defaultValue: { summary: 'false' },
    },
  },
  linkAccountEnabledStatuses: {
    control: { type: 'inline-check' as const },
    options: [
      'APPROVED',
      'REVIEW_IN_PROGRESS',
      'INFORMATION_REQUESTED',
      'NEW',
      'DECLINED',
      'SUSPENDED',
      'TERMINATED',
    ],
    description:
      'Array of ClientStatus values for which account linking is enabled (Start button unlocked). Section visibility is controlled by `showLinkAccountStep`.',
    table: {
      category: 'Display',
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
  alertOnPreviousStep: {
    control: { type: 'boolean' as const },
    description:
      'Confirm before Previous / Back: warns that data entered on the current step may be lost',
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
  flowEntry: { table: { disable: true } },
  reviewAttestTermsAcknowledgements: { table: { disable: true } },
  showReviewAttestTermsAcknowledgementsIntro: { table: { disable: true } },
};

/**
 * Default MSW handlers for OnboardingFlow stories
 */
export const defaultHandlers = handlers;
