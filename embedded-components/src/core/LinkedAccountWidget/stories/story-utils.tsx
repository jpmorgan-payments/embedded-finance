/**
 * Shared utilities for LinkedAccountWidget stories
 */

import {
  baseStoryArgTypes,
  baseStoryDefaults,
  BaseStoryProps,
} from '@/../.storybook/shared-story-types';
import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { ThemeName, THEMES } from '@/core/themes';

import { LinkedAccountWidget } from '../LinkedAccountWidget';

// ============================================================================
// Story Wrapper Component
// ============================================================================

/**
 * Props for LinkedAccountWidget stories.
 * Extends BaseStoryProps for common provider/theme configuration.
 */
export interface LinkedAccountWidgetStoryProps extends BaseStoryProps {
  /** Client ID for API requests */
  clientId?: string;
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
  platformId,
  headers,
  themePreset = 'DEFAULT',
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
  const selectedTheme =
    themePreset === 'custom' ? customTheme : THEMES[themePreset as ThemeName];

  const selectedContentTokens = contentTokens ?? { name: contentTokensPreset };

  return (
    <EBComponentsProvider
      apiBaseUrl={apiBaseUrl}
      headers={{ ...headers, ...(platformId && { platform_id: platformId }) }}
      theme={selectedTheme}
      contentTokens={selectedContentTokens}
    >
      <LinkedAccountWidget
        variant={variant}
        showCreateButton={showCreateButton}
        makePaymentComponent={makePaymentComponent}
        onLinkedAccountSettled={onLinkedAccountSettled}
        clientId={clientId ?? ''}
        className={className}
      />
    </EBComponentsProvider>
  );
};

// ============================================================================
// MSW Handler Utilities
// ============================================================================

export const createRecipientHandlers = (responseData: any) => [
  http.get('*/recipients', () => {
    return HttpResponse.json(responseData);
  }),
  http.post('*/recipients', async ({ request }) => {
    const body = (await request.json()) as any;
    const created = {
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
    };

    return HttpResponse.json(created, { status: 201 });
  }),
  http.post('*/recipients/:id/verify-microdeposit', ({ params }) => {
    const { id } = params;
    const firstRecipient = linkedAccountListMock.recipients?.[0];
    return HttpResponse.json({
      ...firstRecipient,
      id,
      status: 'ACTIVE',
      recipientId: id,
    });
  }),
];

// ============================================================================
// Common Story Configuration
// ============================================================================

export const commonArgs = {
  ...baseStoryDefaults,
  clientId: import.meta.env.VITE_API_CLIENT_ID ?? '',
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
  clientId: {
    control: { type: 'text' as const },
    description: 'Client ID for API requests',
    table: {
      category: 'Component',
    },
  },
};
