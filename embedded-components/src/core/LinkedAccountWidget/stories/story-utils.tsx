/**
 * Shared utilities for LinkedAccountWidget stories
 */

import { db, resetDb, verifyMicrodeposit } from '@/msw/db';
import { http, HttpResponse } from 'msw';
import {
  baseStoryArgTypes,
  baseStoryDefaults,
  BaseStoryProps,
  resolveTheme,
} from '@storybook/shared-story-types';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { LinkedAccountWidget } from '../LinkedAccountWidget';

// ============================================================================
// MSW Reset Utilities
// ============================================================================

/**
 * Seeds the MSW database with recipient data.
 *
 * @param responseData - Initial recipient data to seed the database
 * @param options - Configuration options
 */
export const seedRecipientDatabase = (
  responseData: any,
  options?: {
    initialVerificationAttempts?: Record<string, number>;
  }
) => {
  // Clear existing recipients first
  const existingRecipients = db.recipient.getAll();
  existingRecipients.forEach((r) => {
    db.recipient.delete({ where: { id: { equals: r.id } } });
  });

  // Add new recipients from responseData
  if (responseData.recipients && Array.isArray(responseData.recipients)) {
    responseData.recipients.forEach((recipient: any) => {
      db.recipient.create({
        ...recipient,
        verificationAttempts:
          options?.initialVerificationAttempts?.[recipient.id] || 0,
      });
    });
  }

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[MSW] Database seeded:', {
      recipientCount: responseData.recipients?.length || 0,
      recipients: responseData.recipients?.map((r: any) => ({
        id: r.id,
        status: r.status,
      })),
    });
  }
};

/**
 * Resets MSW database to a clean state and optionally re-seeds with data.
 * This uses the global MSW db to ensure proper state management.
 *
 * @param seedData - Optional data to seed the database after reset
 * @param options - Configuration options for seeding
 *
 * @example
 * ```tsx
 * play: async ({ step }) => {
 *   await resetMSWHandlers(mockLinkedAccountData);
 *   // ... rest of play function
 * }
 * ```
 */
export const resetMSWHandlers = async (
  seedData?: any,
  options?: {
    initialVerificationAttempts?: Record<string, number>;
  }
) => {
  // Wait a brief moment to ensure any pending requests from previous story are completed
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 100);
  });

  // Reset the global MSW database
  resetDb();

  // Re-seed with data if provided
  if (seedData) {
    seedRecipientDatabase(seedData, options);
  }
};

// ============================================================================
// Story Wrapper Component
// ============================================================================

/**
 * Props for LinkedAccountWidget stories.
 * Extends BaseStoryProps for common provider/theme configuration.
 */
export interface LinkedAccountWidgetStoryProps extends BaseStoryProps {
  /** Display variant for the widget */
  variant?: 'default' | 'singleAccount';
  /** Whether to show the "Link New Account" button */
  showCreateButton?: boolean;
  /** Custom component to render for making payments */
  makePaymentComponent?: React.ReactNode;
  /** Callback when a linked account is settled */
  onLinkedAccountSettled?: (recipient?: any, error?: any) => void;
  /** Additional CSS class names */
  className?: string;
}

export const LinkedAccountWidgetStory: React.FC<
  LinkedAccountWidgetStoryProps
> = ({
  apiBaseUrl,
  clientId,
  headers,
  themePreset = 'Default',
  theme: customTheme,
  contentTokensPreset = 'enUS',
  contentTokens,
  variant,
  showCreateButton,
  makePaymentComponent,
  onLinkedAccountSettled,
  className,
}) => {
  // Resolve theme: use custom theme if themePreset is 'custom', otherwise use preset
  const selectedTheme = resolveTheme(themePreset, customTheme);

  const selectedContentTokens = contentTokens ?? { name: contentTokensPreset };

  return (
    <EBComponentsProvider
      apiBaseUrl={apiBaseUrl}
      apiBaseUrls={{
        clients: `${apiBaseUrl.split('/v1')[0]}/do/v1`,
      }}
      headers={headers}
      theme={selectedTheme}
      contentTokens={selectedContentTokens}
      clientId={clientId ?? ''}
    >
      <LinkedAccountWidget
        variant={variant}
        showCreateButton={showCreateButton}
        makePaymentComponent={makePaymentComponent}
        onLinkedAccountSettled={onLinkedAccountSettled}
        className={className}
      />
    </EBComponentsProvider>
  );
};

// ============================================================================
// MSW Handler Utilities
// ============================================================================

/**
 * Creates MSW handlers for recipient API endpoints using the global MSW db.
 * This ensures proper state management and persistence within stories.
 *
 * @param responseData - Initial recipient data to seed the database
 * @param options - Configuration options
 */
export const createRecipientHandlers = (
  responseData: any,
  options?: {
    initialVerificationAttempts?: Record<string, number>;
    delayMs?: number;
  }
) => {
  const delay = options?.delayMs ?? 800; // Default 800ms delay

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  // Seed the database immediately when handlers are created
  seedRecipientDatabase(responseData, options);

  return [
    http.get('/recipients', async () => {
      await sleep(delay);

      // Get all recipients from db, filtering out INACTIVE and REJECTED
      const allRecipients = db.recipient.getAll();
      const filteredRecipients = allRecipients.filter(
        (r: any) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
      );

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[MSW] GET /recipients:', {
          total: filteredRecipients.length,
          statuses: filteredRecipients.map((r: any) => ({
            id: r.id,
            status: r.status,
          })),
        });
      }

      return HttpResponse.json({
        recipients: filteredRecipients,
        total_items: filteredRecipients.length,
      });
    }),

    http.get('/recipients/:id', async ({ params }) => {
      await sleep(delay);

      const { id } = params;
      const recipient = db.recipient.findFirst({
        where: { id: { equals: id as string } },
      });

      // Debug logging
      if (process.env.NODE_ENV === 'development' && recipient) {
        // eslint-disable-next-line no-console
        console.log('[MSW] GET /recipients/:id:', {
          id,
          status: recipient.status,
        });
      }

      if (recipient) {
        return HttpResponse.json(recipient);
      }

      return HttpResponse.json(
        {
          httpStatus: 404,
          title: 'Recipient not found',
          context: [],
        },
        { status: 404 }
      );
    }),

    http.post('/recipients/:id', async ({ params, request }) => {
      await sleep(delay);

      const { id } = params;
      const body = (await request.json()) as any;

      const recipient = db.recipient.findFirst({
        where: { id: { equals: id as string } },
      });

      if (!recipient) {
        return HttpResponse.json(
          {
            httpStatus: 404,
            title: 'Recipient not found',
          },
          { status: 404 }
        );
      }

      // Update the recipient in the database
      const updatedRecipient = db.recipient.update({
        where: { id: { equals: id as string } },
        data: {
          ...body,
          updatedAt: new Date().toISOString(),
        },
      });

      return HttpResponse.json(updatedRecipient);
    }),

    http.post('/recipients', async ({ request }) => {
      await sleep(delay);

      const body = (await request.json()) as any;

      // Create new recipient in the database
      const created = db.recipient.create({
        id: `recipient-${Date.now()}`,
        type: 'LINKED_ACCOUNT',
        status: 'MICRODEPOSITS_INITIATED',
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

      return HttpResponse.json(created, { status: 201 });
    }),

    http.post(
      '/recipients/:id/verify-microdeposit',
      async ({ params, request }) => {
        await sleep(delay);

        const { id } = params;
        const body = (await request.json()) as any;
        const amounts = body.amounts || [];

        // Use the global db verifyMicrodeposit function
        const result = verifyMicrodeposit(id as string, amounts);

        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[MSW] Verification result:', {
            recipientId: id,
            status: result.status,
            amounts,
          });
        }

        if (result.error) {
          return HttpResponse.json(result.error, {
            status: result.error.httpStatus || 400,
          });
        }

        return HttpResponse.json({
          status: result.status,
        });
      }
    ),
  ];
};

// ============================================================================
// Common Story Configuration
// ============================================================================

export const commonArgs = {
  ...baseStoryDefaults,
  variant: 'default' as const,
  showCreateButton: true,
};

export const commonArgTypes = {
  ...baseStoryArgTypes,
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
