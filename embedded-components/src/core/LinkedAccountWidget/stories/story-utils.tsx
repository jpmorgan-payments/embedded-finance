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
  ListRecipientsResponseAllOf,
  MicrodepositAmounts,
  MicrodepositVerificationResponse,
  Recipient,
  RecipientRequest,
  RecipientStatus,
  UpdateRecipientRequest,
} from '@/api/generated/ep-recipients.schemas';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration options for MSW handler creation and database seeding
 */
export interface RecipientHandlerOptions {
  /** Initial verification attempt counts per recipient ID */
  initialVerificationAttempts?: Record<string, number>;
  /** Network delay in milliseconds (default: 800ms) */
  delayMs?: number;
  /** Override the default status returned when creating a recipient (default: 'MICRODEPOSITS_INITIATED') */
  overrideCreateStatus?: RecipientStatus;
} // ============================================================================
// Database Management
// ============================================================================

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
 * Logs debug information in development mode only
 * @param message - Log message
 * @param data - Optional data to log
 */
const debugLog = (message: string, data?: unknown): void => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[MSW LinkedAccount] ${message}`, data);
  }
};

// ============================================================================
// MSW Handler Factories
// ============================================================================

/**
 * Creates MSW handlers for recipient API endpoints.
 * Uses the global MSW database for state management and persistence.
 *
 * Note: Handlers do NOT seed the database. Use loaders to seed data before rendering:
 * ```tsx
 * loaders: [async () => await seedRecipientData(mockData)]
 * ```
 *
 * @param options - Configuration for delays (optional)
 * @returns Array of MSW request handlers
 *
 * @example
 * ```tsx
 * export const MyStory: Story = {
 *   loaders: [async () => await seedRecipientData(mockData)],
 *   parameters: {
 *     msw: { handlers: createRecipientHandlers({ delayMs: 500 }) }
 *   }
 * };
 * ```
 */
export const createRecipientHandlers = (
  options?: Pick<RecipientHandlerOptions, 'delayMs' | 'overrideCreateStatus'>
) => {
  const delay = options?.delayMs ?? 800;
  const createStatus =
    options?.overrideCreateStatus ?? 'MICRODEPOSITS_INITIATED';

  return [
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

      const response: ListRecipientsResponseAllOf = {
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
        clientId: body?.clientId ?? '3002024303',
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

// ============================================================================
// Common Story Configuration
// ============================================================================

/**
 * Default argument values for LinkedAccountWidget stories.
 * Component-specific defaults (global defaults are in preview.tsx)
 */
export const commonArgs = {
  variant: 'default' as const,
  showCreateButton: true,
};

/**
 * Storybook controls and documentation for LinkedAccountWidget stories.
 * Component-specific argTypes (global argTypes are in preview.tsx)
 */
export const commonArgTypes = {
  variant: {
    control: { type: 'select' as const },
    options: ['default', 'singleAccount'],
    description: 'Display variant for the widget',
    table: {
      category: 'Component',
      defaultValue: { summary: 'default' },
    },
  },
  showCreateButton: {
    control: { type: 'boolean' as const },
    description: 'Whether to show the "Link New Account" button',
    table: {
      category: 'Component',
      defaultValue: { summary: 'true' },
    },
  },
};
