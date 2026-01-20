/**
 * Shared utilities for LinkedAccountWidget stories
 *
 * This module provides:
 * - MSW database seeding and reset utilities
 * - MSW handler factories for recipient endpoints
 * - Common story configuration (args, argTypes)
 * - Type definitions for stories
 *
 * Stories can render the LinkedAccountWidget component directly:
 * @example
 * ```tsx
 * export const Default: Story = {
 *   args: { variant: 'default' }
 * };
 * ```
 *
 * The EBComponentsProvider is applied globally via a decorator in preview.tsx.
 */

import { db, resetDb, verifyMicrodeposit } from '@/msw/db';
import { http, HttpResponse } from 'msw';

import type {
  ApiError,
  ListRecipientsResponse,
  MicrodepositAmounts,
  MicrodepositVerificationResponse,
  Recipient,
  RecipientRequest,
  RecipientStatus,
  RecipientType,
  UpdateRecipientRequest,
} from '@/api/generated/ep-recipients.schemas';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration options for MSW handler creation and database seeding
 */
export interface RecipientHandlerOptions {
  /** Recipient type to use (default: 'LINKED_ACCOUNT') */
  recipientType?: RecipientType;
  /** Initial verification attempt counts per recipient ID */
  initialVerificationAttempts?: Record<string, number>;
  /** Network delay in milliseconds (default: 800ms) */
  delayMs?: number;
  /** Override the default status returned when creating a recipient */
  overrideCreateStatus?: RecipientStatus;
}

/**
 * Configuration options for client data seeding
 */
export interface ClientSeedOptions {
  /** Client ID for the seeded client */
  clientId?: string;
  /** Client data to seed. If not provided, a default client with parties will be created */
  clientData?: Partial<ClientResponse>;
} // ============================================================================
// Database Management
// ============================================================================

/**
 * Seeds client data with parties into the MSW database.
 * This ensures that when the form opens, it will have parties to select from.
 *
 * @param options - Configuration options for seeding client data
 *
 * @example
 * ```tsx
 * export const MyStory: Story = {
 *   loaders: [
 *     async () => {
 *       await seedClientData({ clientId: '3002024303' });
 *       await seedRecipientData(mockData);
 *     }
 *   ]
 * };
 * ```
 */
export const seedClientData = async (
  options?: ClientSeedOptions
): Promise<void> => {
  const clientId = options?.clientId ?? 'mock-client-id';
  const timestamp = new Date().toISOString();

  // Create default parties if not provided
  const defaultParties = options?.clientData?.parties ?? [
    {
      id: '2200000111',
      partyType: 'ORGANIZATION',
      externalId: 'ORG-001',
      email: 'info@company.com',
      roles: ['CLIENT'],
      profileStatus: 'COMPLETE',
      active: true,
      createdAt: timestamp,
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Demo Company LLC',
        industry: {
          code: '541511',
          codeType: 'NAICS',
        },
        countryOfFormation: 'US',
        yearOfFormation: '2020',
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['123 Main St'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
      },
    },
    {
      id: '2200000112',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2200000111',
      externalId: 'IND-001',
      email: 'john.smith@company.com',
      profileStatus: 'COMPLETE',
      active: true,
      createdAt: timestamp,
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'John',
        lastName: 'Smith',
        countryOfResidence: 'US',
        jobTitle: 'CEO',
        birthDate: '1980-05-15',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['456 Park Ave'],
            city: 'New York',
            state: 'NY',
            postalCode: '10022',
            country: 'US',
          },
        ],
      },
    },
    {
      id: '2200000113',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2200000111',
      externalId: 'IND-002',
      email: 'jane.doe@company.com',
      profileStatus: 'COMPLETE',
      active: true,
      createdAt: timestamp,
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Doe',
        countryOfResidence: 'US',
        jobTitle: 'CFO',
        birthDate: '1985-08-20',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['789 Broadway'],
            city: 'New York',
            state: 'NY',
            postalCode: '10003',
            country: 'US',
          },
        ],
      },
    },
  ];

  // Create parties in database first
  const partyIds: string[] = [];
  defaultParties.forEach((party: any) => {
    const existingParty = db.party.findFirst({
      where: { id: { equals: party.id } },
    });

    if (existingParty) {
      // Update existing party
      db.party.update({
        where: { id: { equals: party.id } },
        data: {
          ...party,
          preferences: party.preferences || { defaultLanguage: 'en-US' },
          access: party.access || [],
          validationResponse: party.validationResponse || [],
        },
      });
    } else {
      // Create new party
      db.party.create({
        ...party,
        preferences: party.preferences || { defaultLanguage: 'en-US' },
        access: party.access || [],
        validationResponse: party.validationResponse || [],
      });
    }
    partyIds.push(party.id);
  });

  // Create or update client with party IDs (MSW handler will expand them)
  const existingClient = db.client.findFirst({
    where: { id: { equals: clientId } },
  });

  const clientData = {
    id: clientId,
    status: options?.clientData?.status ?? 'APPROVED',
    partyId: partyIds[0], // First party (organization) is the primary
    parties: partyIds, // Store party IDs - will be expanded by MSW handler
    products: options?.clientData?.products ?? ['EMBEDDED_PAYMENTS'],
    outstanding: {
      documentRequestIds: [],
      questionIds: [],
      attestationDocumentIds: [],
      partyIds: [],
      partyRoles: [],
    },
    questionResponses: [],
    attestations: [],
    results: {
      customerIdentityStatus: 'APPROVED',
    },
    createdAt: timestamp,
    ...options?.clientData,
  };

  if (existingClient) {
    db.client.update({
      where: { id: { equals: clientId } },
      data: clientData,
    });
  } else {
    db.client.create(clientData);
  }

  debugLog('Client data seeded', {
    clientId,
    partyCount: partyIds.length,
  });
};

/**
 * Resets MSW database to a clean state and seeds with recipient data.
 * Use this in Storybook loaders to ensure each story has isolated test data.
 *
 * Includes a brief delay to ensure pending requests from previous stories complete.
 *
 * @param seedData - Recipient data to seed after reset
 * @param options - Configuration options for seeding
 *
 * @example
 * ```tsx
 * export const MyStory: Story = {
 *   loaders: [async () => await seedRecipientData(mockData)]
 * };
 * ```
 */
export const seedRecipientData = async (
  seedData?: ListRecipientsResponse,
  options?: Pick<RecipientHandlerOptions, 'initialVerificationAttempts'>
): Promise<void> => {
  // Brief delay to ensure clean state between stories
  await sleep(100);

  // Reset global MSW database
  resetDb();

  // Seed client data with parties so the form has individuals to select from
  await seedClientData({ clientId: 'mock-client-id' });

  // Seed if data provided
  if (seedData) {
    const recipients = seedData.recipients ?? [];
    recipients.forEach((recipient) => {
      // Check if recipient already exists (safety check)
      const existing = db.recipient.findFirst({
        where: { id: { equals: recipient.id } },
      });

      if (!existing) {
        db.recipient.create({
          ...recipient,
          verificationAttempts:
            options?.initialVerificationAttempts?.[recipient.id] ?? 0,
        });
      } else {
        // Update existing recipient instead
        db.recipient.update({
          where: { id: { equals: recipient.id } },
          data: {
            ...recipient,
            verificationAttempts:
              options?.initialVerificationAttempts?.[recipient.id] ?? 0,
          },
        });
      }
    });

    debugLog('Database seeded', {
      count: recipients.length,
      recipients: recipients.map((r) => ({ id: r.id, status: r.status })),
    });
  }
};

// ============================================================================
// MSW Handler Utilities
// ============================================================================

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simulates network delay for realistic MSW responses
 * @param ms - Delay duration in milliseconds
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Logs debug information for story debugging
 * Always logs in non-test environments to help debug Storybook issues
 * @param message - Log message
 * @param data - Optional data to log
 */
const debugLog = (message: string, data?: unknown): void => {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log(`[MSW LinkedAccount] ${message}`, data);
  }
};

// ============================================================================
// MSW Handler Factories
// ============================================================================

/**
 * Creates MSW handlers for recipient and client API endpoints.
 * Uses the global MSW database for state management and persistence.
 *
 * Note: Handlers do NOT seed the database. Use loaders to seed data before rendering:
 * ```tsx
 * loaders: [async () => await seedRecipientData(mockData)]
 * ```
 *
 * @param options - Configuration for delays and recipient type (optional)
 * @returns Array of MSW request handlers
 *
 * @example
 * ```tsx
 * export const MyStory: Story = {
 *   loaders: [async () => await seedRecipientData(mockData)],
 *   parameters: {
 *     msw: { handlers: createRecipientHandlers({ delayMs: 500, recipientType: 'RECIPIENT' }) }
 *   }
 * };
 * ```
 */
export const createRecipientHandlers = (
  options?: Pick<
    RecipientHandlerOptions,
    'delayMs' | 'overrideCreateStatus' | 'recipientType'
  >
) => {
  const delay = options?.delayMs ?? 800;
  const recipientType = options?.recipientType ?? 'LINKED_ACCOUNT';
  const createStatus =
    options?.overrideCreateStatus ??
    (recipientType === 'RECIPIENT' ? 'ACTIVE' : 'MICRODEPOSITS_INITIATED');

  return [
    // GET /clients/:clientId - Get client with expanded parties
    // Note: Uses wildcard to match different base URLs and any client ID
    http.get('/clients/:clientId', async ({ params }): Promise<Response> => {
      const { clientId } = params;

      // Try to find the specific client, or return the first available client
      let client = db.client.findFirst({
        where: { id: { equals: clientId as string } },
      });

      if (!client) {
        // If specific client not found, return any available client (for flexibility)
        const allClients = db.client.getAll();
        [client] = allClients;
      }

      if (!client) {
        return HttpResponse.json(
          { httpStatus: 404, title: 'Client not found' },
          { status: 404 }
        );
      }

      // Expand party IDs to full party objects
      const expandedClient = {
        ...client,
        parties: (client.parties as string[])
          .map((partyId) =>
            db.party.findFirst({ where: { id: { equals: partyId } } })
          )
          .filter(Boolean),
      };

      debugLog('GET /clients/:clientId', {
        requestedId: clientId,
        returnedId: client.id,
        partyCount: expandedClient.parties.length,
      });

      return HttpResponse.json(expandedClient);
    }),

    // GET /recipients - List all active recipients
    http.get('/recipients', async (): Promise<Response> => {
      await sleep(delay);

      const allRecipients = db.recipient.getAll();
      const activeRecipients = allRecipients.filter(
        (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
      );

      debugLog('GET /recipients', {
        total: activeRecipients.length,
        statuses: activeRecipients.map((r) => ({ id: r.id, status: r.status })),
      });

      const response: ListRecipientsResponse = {
        recipients: activeRecipients as Recipient[],
        metadata: {
          total_items: activeRecipients.length,
        },
      };

      return HttpResponse.json(response);
    }),

    // GET /recipients/:id - Get single recipient
    http.get('/recipients/:id', async ({ params }): Promise<Response> => {
      await sleep(delay);

      const { id } = params;
      const recipient = db.recipient.findFirst({
        where: { id: { equals: id as string } },
      });

      if (!recipient) {
        const error: ApiError = {
          httpStatus: 404,
          title: 'Recipient not found',
          context: [],
        };
        return HttpResponse.json(error, { status: 404 });
      }

      debugLog('GET /recipients/:id', { id, status: recipient.status });

      return HttpResponse.json(recipient as Recipient);
    }),

    // POST /recipients/:id - Update recipient
    http.post(
      '/recipients/:id',
      async ({ params, request }): Promise<Response> => {
        await sleep(delay);

        const { id } = params;
        const body = (await request.json()) as UpdateRecipientRequest;

        const recipient = db.recipient.findFirst({
          where: { id: { equals: id as string } },
        });

        if (!recipient) {
          const error: ApiError = {
            httpStatus: 404,
            title: 'Recipient not found',
          };
          return HttpResponse.json(error, { status: 404 });
        }

        const updatedRecipient = db.recipient.update({
          where: { id: { equals: id as string } },
          data: {
            ...body,
            updatedAt: new Date().toISOString(),
          },
        });

        return HttpResponse.json(updatedRecipient as Recipient);
      }
    ),

    // POST /recipients - Create new recipient
    http.post('/recipients', async ({ request }): Promise<Response> => {
      await sleep(delay);

      const body = (await request.json()) as RecipientRequest;

      const newRecipient = db.recipient.create({
        id: `recipient-${Date.now()}`,
        type: 'LINKED_ACCOUNT',
        status: createStatus,
        clientId: body?.clientId ?? 'mock-client-id',
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
                    transactionType:
                      body?.account?.routingInformation?.[0]?.transactionType ??
                      'ACH',
                  },
                ],
          countryCode: body?.account?.countryCode ?? 'US',
        },
        createdAt: new Date().toISOString(),
        verificationAttempts: 0,
      });

      return HttpResponse.json(newRecipient as Recipient, { status: 201 });
    }),

    // POST /recipients/:id/verify-microdeposit - Verify microdeposits
    http.post(
      '/recipients/:id/verify-microdeposit',
      async ({ params, request }): Promise<Response> => {
        await sleep(delay);

        const { id } = params;
        const body = (await request.json()) as MicrodepositAmounts;
        const amounts = body.amounts ?? [];

        const result = verifyMicrodeposit(id as string, amounts);

        debugLog('Verification attempt', {
          recipientId: id,
          status: result.status,
          amounts,
        });

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
    ),
  ];
};

/**
 * Creates MSW handlers that simulate RTP being unavailable at the bank.
 * Use this to demonstrate error handling when a user tries to create a recipient
 * or link an account with RTP payment method and the bank doesn't support it.
 *
 * @param options - Configuration for delays and recipient type (optional)
 * @returns Array of MSW request handlers
 *
 * @example
 * ```tsx
 * export const RtpUnavailable: Story = {
 *   parameters: {
 *     msw: { handlers: createRtpUnavailableHandlers({ recipientType: 'RECIPIENT' }) }
 *   }
 * };
 * ```
 */
export const createRtpUnavailableHandlers = (
  options?: Pick<RecipientHandlerOptions, 'delayMs' | 'recipientType'>
) => {
  const delayMs = options?.delayMs ?? 800;
  const recipientType = options?.recipientType ?? 'LINKED_ACCOUNT';

  return [
    // GET /clients/:clientId - Get client with expanded parties
    http.get('/clients/:clientId', async ({ params }): Promise<Response> => {
      const { clientId } = params;

      let client = db.client.findFirst({
        where: { id: { equals: clientId as string } },
      });

      if (!client) {
        const allClients = db.client.getAll();
        [client] = allClients;
      }

      if (!client) {
        return HttpResponse.json(
          { httpStatus: 404, title: 'Client not found' },
          { status: 404 }
        );
      }

      const expandedClient = {
        ...client,
        parties: (client.parties as string[])
          .map((partyId) =>
            db.party.findFirst({ where: { id: { equals: partyId } } })
          )
          .filter(Boolean),
      };

      return HttpResponse.json(expandedClient);
    }),

    // GET /recipients - List all active recipients
    http.get('/recipients', async (): Promise<Response> => {
      await sleep(delayMs);

      const allRecipients = db.recipient.getAll();
      const activeRecipients = allRecipients.filter(
        (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
      );

      const response: ListRecipientsResponse = {
        recipients: activeRecipients as Recipient[],
        metadata: {
          total_items: activeRecipients.length,
        },
      };

      return HttpResponse.json(response);
    }),

    // GET /recipients/:id - Get single recipient
    http.get('/recipients/:id', async ({ params }): Promise<Response> => {
      await sleep(delayMs);

      const { id } = params;
      const recipient = db.recipient.findFirst({
        where: { id: { equals: id as string } },
      });

      if (!recipient) {
        const error: ApiError = {
          httpStatus: 404,
          title: 'Recipient not found',
          context: [],
        };
        return HttpResponse.json(error, { status: 404 });
      }

      return HttpResponse.json(recipient as Recipient);
    }),

    // POST /recipients/:id - Update recipient
    http.post(
      '/recipients/:id',
      async ({ params, request }): Promise<Response> => {
        await sleep(delayMs);

        const { id } = params;
        const body = (await request.json()) as UpdateRecipientRequest;

        const recipient = db.recipient.findFirst({
          where: { id: { equals: id as string } },
        });

        if (!recipient) {
          const error: ApiError = {
            httpStatus: 404,
            title: 'Recipient not found',
          };
          return HttpResponse.json(error, { status: 404 });
        }

        const updatedRecipient = db.recipient.update({
          where: { id: { equals: id as string } },
          data: {
            ...body,
            updatedAt: new Date().toISOString(),
          },
        });

        return HttpResponse.json(updatedRecipient as Recipient);
      }
    ),

    // POST /recipients - Create new recipient (WITH RTP CHECK)
    http.post('/recipients', async ({ request }): Promise<Response> => {
      await sleep(delayMs);

      const body = (await request.json()) as RecipientRequest;

      // Check if RTP is in the routing information
      const hasRtp = body?.account?.routingInformation?.some(
        (ri) => ri.transactionType === 'RTP'
      );

      debugLog('POST /recipients - Checking for RTP', {
        hasRtp,
        routingInfo: body?.account?.routingInformation,
      });

      if (hasRtp) {
        // Return error indicating RTP is not available at this bank
        const error: ApiError = {
          httpStatus: 400,
          title: 'Payment Method Not Supported',
          context: [
            {
              code: 'RTP_UNAVAILABLE',
              field: 'account.routingInformation[].transactionType',
              message:
                'RTP (Real-Time Payments) is not available at this financial institution. The bank associated with the provided routing number does not support RTP transactions.',
            },
          ],
        };

        debugLog('POST /recipients - RTP unavailable error returned', {
          routingNumber: body?.account?.routingInformation?.[0]?.routingNumber,
          requestedPaymentMethods: body?.account?.routingInformation?.map(
            (ri) => ri.transactionType
          ),
        });

        return HttpResponse.json(error, { status: 400 });
      }

      // If no RTP, proceed with normal creation
      const createStatus =
        recipientType === 'RECIPIENT' ? 'ACTIVE' : 'MICRODEPOSITS_INITIATED';

      const newRecipient = db.recipient.create({
        id: `recipient-${Date.now()}`,
        type: recipientType,
        status: createStatus,
        clientId: body?.clientId ?? 'mock-client-id',
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
                    transactionType:
                      body?.account?.routingInformation?.[0]?.transactionType ??
                      'ACH',
                  },
                ],
          countryCode: body?.account?.countryCode ?? 'US',
        },
        createdAt: new Date().toISOString(),
        verificationAttempts: 0,
      });

      return HttpResponse.json(newRecipient as Recipient, { status: 201 });
    }),

    // POST /recipients/:id/verify-microdeposit - Verify microdeposits
    http.post(
      '/recipients/:id/verify-microdeposit',
      async ({ params, request }): Promise<Response> => {
        await sleep(delayMs);

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
    ),
  ];
};

// ============================================================================
// Common Story Configuration
// ============================================================================

/**
 * Default argument values for LinkedAccountWidget stories.
 * Component-specific defaults (global defaults are in preview.tsx)
 */
export const commonArgs = {
  mode: 'list' as const,
  hideCreateButton: false,
  clientId: 'mock-client-id',
};

/**
 * Storybook controls and documentation for LinkedAccountWidget stories.
 * Component-specific argTypes (global argTypes are in preview.tsx)
 */
export const commonArgTypes = {
  mode: {
    control: { type: 'select' as const },
    options: ['list', 'single'],
    description:
      'Layout mode: "list" shows all accounts with expand/collapse, "single" shows only one account',
    table: {
      category: 'Display Mode',
      defaultValue: { summary: 'list' },
    },
  },
  viewMode: {
    control: { type: 'select' as const },
    options: ['cards', 'compact-cards', 'table'],
    description:
      'View mode: "cards" for full cards, "compact-cards" for row-based compact cards, "table" for sortable table',
    table: {
      category: 'Display Mode',
      defaultValue: { summary: 'compact-cards' },
    },
  },
  scrollable: {
    control: { type: 'boolean' as const },
    description:
      'Enable scrollable container with virtualization and infinite scroll',
    table: {
      category: 'Scrolling',
      defaultValue: { summary: 'false' },
    },
  },
  scrollableMaxHeight: {
    control: { type: 'text' as const },
    description:
      'Maximum height of the scrollable container (only applies when scrollable=true). Accepts CSS values like 400, "50vh", "100%"',
    table: {
      category: 'Scrolling',
      defaultValue: { summary: '400px' },
    },
  },
  pageSize: {
    control: { type: 'number' as const },
    description: 'Number of accounts to fetch per API request',
    table: {
      category: 'Pagination',
      defaultValue: { summary: '10' },
    },
  },
  paginationStyle: {
    control: { type: 'select' as const },
    options: ['loadMore', 'pages'],
    description:
      'Pagination style for cards/compact-cards views: "loadMore" shows a button to load more, "pages" shows page navigation',
    table: {
      category: 'Pagination',
      defaultValue: { summary: 'pages' },
    },
  },
  hideCreateButton: {
    control: { type: 'boolean' as const },
    description: 'Hide the "Link New Account" button',
    table: {
      category: 'Actions',
      defaultValue: { summary: 'false' },
    },
  },
  clientId: {
    control: { type: 'text' as const },
    description: 'Client ID for API requests',
    table: {
      category: 'Provider',
      defaultValue: { summary: 'mock-client-id' },
    },
  },

  // === Callbacks ===
  onAccountLinked: {
    control: { disable: true },
    description:
      'Called when a linked account operation completes (success or failure)',
    table: {
      category: 'Callbacks',
    },
  },
  onVerificationComplete: {
    control: { disable: true },
    description: 'Called when microdeposit verification completes',
    table: {
      category: 'Callbacks',
    },
  },

  // === Customization ===
  renderPaymentAction: {
    control: { disable: true },
    description:
      'Render a custom payment/action component for each account card. Receives recipient as argument.',
    table: {
      category: 'Customization',
    },
  },

  // === Styling ===
  className: {
    control: { type: 'text' as const },
    description: 'Additional CSS class name(s) for the root Card element',
    table: {
      category: 'Styling',
    },
  },

  // === Analytics ===
  userEventsHandler: {
    control: { disable: true },
    description:
      'Handler for user events with rich context. Used for analytics/RUM integration.',
    table: {
      category: 'Analytics',
    },
  },
  userEventsLifecycle: {
    control: { disable: true },
    description:
      'Optional lifecycle handlers for RUM libraries that need enter/leave action pairs',
    table: {
      category: 'Analytics',
    },
  },
};
