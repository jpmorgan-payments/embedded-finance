/**
 * OnboardingFlow — Linked Account API Error Scenarios
 *
 * Stories that simulate various API error responses when submitting
 * the link bank account form. Each story uses `flowEntry` to jump
 * directly to the link-account screen with prefilled data so users
 * can hit "Link Account" immediately and see the error state.
 *
 * The content token overrides for `screens.linkAccount.errors.*` are
 * shown in the "With support contact" variant — demonstrating how a
 * host can append a support escalation message to every error.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { ClientStatus } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  createOnboardingFlowHandlers,
  DEFAULT_CLIENT_ID,
  mockClientApproved,
  mockLinkAccountPrefillEditable,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from '../../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

// ============================================================================
// Error handler factories
// ============================================================================

/** Creates a POST /recipients handler that always returns a given HTTP error */
function createRecipientErrorHandler(
  statusCode: number,
  body?: Record<string, unknown>
) {
  return http.post('/recipients', async () => {
    await new Promise((r) => {
      setTimeout(r, 500);
    });
    return HttpResponse.json(
      body ?? {
        title: `Error ${statusCode}`,
        httpStatus: statusCode,
        message: getApiMessageForStatus(statusCode),
        context: getApiContextForStatus(statusCode),
      },
      { status: statusCode }
    );
  });
}

function getApiMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'ABA routing number 533100000 not found';
    case 409:
      return 'Recipient already exists for the given account details';
    case 422:
      return 'Account number format is invalid for the specified routing code type';
    case 500:
      return 'Internal server error';
    default:
      return 'Unexpected error';
  }
}

function getApiContextForStatus(
  status: number
): Array<{ field?: string; message: string }> {
  switch (status) {
    case 400:
      return [
        {
          field: 'account.routingInformation[0].routingNumber',
          message: 'ABA routing number 533100000 not found',
        },
      ];
    case 422:
      return [
        {
          field: 'account.number',
          message:
            'Account number must be between 4 and 17 digits for USABA routing',
        },
      ];
    default:
      return [];
  }
}

// ============================================================================
// Shared args for all error stories
// ============================================================================

const sharedLinkAccountArgs: Partial<OnboardingFlowStoryArgs> = {
  ...commonArgs,
  clientId: DEFAULT_CLIENT_ID,
  showLinkAccountStep: true,
  linkAccountEnabledStatuses: [ClientStatus.APPROVED],
  linkAccountStepOptions: {
    completionMode: 'editable',
    initialValues: mockLinkAccountPrefillEditable,
  },
  flowEntry: {
    screenId: 'link-account',
  },
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Linked account/API Errors',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@linked-accounts', '@errors'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Simulates API error responses when linking a bank account. Each story prefills the form so you can submit immediately and observe the error alert. The "With support contact" stories show content token overrides that append escalation instructions.',
      },
    },
  },
  args: {
    ...commonArgsWithCallbacks,
  },
  argTypes: {
    ...commonArgTypes,
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// ============================================================================
// Error Stories — Raw API messages
// ============================================================================

/**
 * **400 — Invalid routing number**
 *
 * API returns a 400 with a specific message about the routing number.
 * Since the API provides a non-generic message, it is shown directly
 * (content token fallback is NOT used).
 */
export const Error400InvalidRouting: Story = {
  name: '400 — Invalid routing number (API message)',
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: [
        createRecipientErrorHandler(400),
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
  },
  args: sharedLinkAccountArgs,
};

/**
 * **409 — Duplicate account**
 *
 * API returns a 409 indicating the linked account already exists.
 */
export const Error409Duplicate: Story = {
  name: '409 — Duplicate account (API message)',
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: [
        createRecipientErrorHandler(409),
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
  },
  args: sharedLinkAccountArgs,
};

/**
 * **422 — Invalid account number**
 *
 * API returns a 422 with validation context about the account number.
 */
export const Error422InvalidAccount: Story = {
  name: '422 — Invalid account number (API message)',
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: [
        createRecipientErrorHandler(422),
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
  },
  args: sharedLinkAccountArgs,
};

/**
 * **500 — Server error (generic, uses content token fallback)**
 *
 * API returns a 500 with a generic "Internal server error" message.
 * The component detects this as generic and falls back to the
 * content token `screens.linkAccount.errors.500`.
 */
export const Error500ServerError: Story = {
  name: '500 — Server error (content token fallback)',
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: [
        createRecipientErrorHandler(500, {
          title: 'Internal Server Error',
          httpStatus: 500,
          message: 'Internal server error',
        }),
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
  },
  args: sharedLinkAccountArgs,
};

// ============================================================================
// Error Stories — With support contact (content token overrides)
// ============================================================================

const supportContactTokens = {
  name: 'enUS' as const,
  tokens: {
    'onboarding-overview': {
      screens: {
        linkAccount: {
          errors: {
            '400':
              'Please check the information you entered and try again. For additional support, please contact your company administrator at Acme Corp.',
            '409':
              'This account may already exist. Please check your linked accounts. For additional support, please contact your company administrator at Acme Corp.',
            '422':
              'The account information is invalid. Please verify and try again. For additional support, please contact your company administrator at Acme Corp.',
            '500':
              'An unexpected error occurred. Please try again later. For additional support, please contact your company administrator at Acme Corp.',
            default:
              'An unexpected error occurred. Please try again. For additional support, please contact your company administrator at Acme Corp.',
          },
        },
      },
    },
  },
};

/**
 * **500 with support contact**
 *
 * Same 500 error, but the content token is overridden to include a
 * support escalation message. Since the API message is generic, the
 * token fallback is used — and the host's override is visible.
 */
export const Error500WithSupportContact: Story = {
  name: '500 — With support contact (token override)',
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: [
        createRecipientErrorHandler(500, {
          title: 'Internal Server Error',
          httpStatus: 500,
          message: 'Internal server error',
        }),
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
  },
  args: {
    ...sharedLinkAccountArgs,
    contentTokensPreset: 'custom',
    contentTokens: supportContactTokens,
  },
};

/**
 * **400 with support contact (API message wins)**
 *
 * Demonstrates that when the API returns a specific, non-generic message
 * (e.g. "ABA routing number 533100000 not found"), it is shown
 * INSTEAD of the content token override. The token only applies as
 * a fallback when the API message is generic/empty.
 */
export const Error400WithSupportContactApiWins: Story = {
  name: '400 — API message wins over token override',
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: [
        createRecipientErrorHandler(400),
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
  },
  args: {
    ...sharedLinkAccountArgs,
    contentTokensPreset: 'custom',
    contentTokens: supportContactTokens,
  },
};

// ============================================================================
// Error Stories — With footnote (global errors.footnote content token)
// ============================================================================

const footnoteTokens = {
  name: 'enUS' as const,
  tokens: {
    common: {
      errors: {
        footnote:
          'If this issue persists, please contact your company administrator at Acme Corp. or call support at 1-800-555-0123.',
      },
    },
  },
};

/**
 * **400 with footnote**
 *
 * Demonstrates the global `common:errors.footnote` content token.
 * When set to a non-empty string, it renders below the error message
 * in every `ServerErrorAlert`. This allows hosts to append a support
 * escalation message without overriding individual error messages.
 */
export const Error400WithFootnote: Story = {
  name: '400 — With global footnote',
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: [
        createRecipientErrorHandler(400),
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
  },
  args: {
    ...sharedLinkAccountArgs,
    contentTokensPreset: 'custom',
    contentTokens: footnoteTokens,
  },
};

/**
 * **500 with footnote**
 *
 * Same global footnote with a 500 error — shows that the footnote
 * appears regardless of which HTTP status triggered the error.
 */
export const Error500WithFootnote: Story = {
  name: '500 — With global footnote',
  loaders: [() => resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID)],
  parameters: {
    msw: {
      handlers: [
        createRecipientErrorHandler(500, {
          title: 'Internal Server Error',
          httpStatus: 500,
          message: 'Internal server error',
        }),
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
  },
  args: {
    ...sharedLinkAccountArgs,
    contentTokensPreset: 'custom',
    contentTokens: footnoteTokens,
  },
};
