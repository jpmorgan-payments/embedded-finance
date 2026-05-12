/**
 * OnboardingFlow — Linked account (Multi-Account & PartyId)
 *
 * Stories demonstrating the enhanced linked-account step:
 * 1. **partyId passthrough** — single account with partyId
 * 2. **presetAccounts** — multiple preset accounts with a select dropdown
 * 3. **allowMultipleAccounts** — sequential linking with "Link another" flow
 *
 * All stories use an APPROVED client and `flowEntry: { screenId: 'link-account' }`
 * to jump directly into the link step, similar to the Enabled Statuses stories.
 */

import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { db } from '@/msw/db';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { ListRecipientsResponse } from '@/api/generated/ep-recipients.schemas';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  createOnboardingFlowHandlers,
  DEFAULT_CLIENT_ID,
  mockClientApproved,
  mockExistingLinkedAccount,
  mockLinkAccountPrefillReadonly,
  mockPresetAccountsThree,
  mockPresetAccountsTwo,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

/**
 * Resolve partyDetails from client mock data when only partyId is provided.
 * Emulates real API behaviour: when the caller sends `partyId` the server
 * looks up the existing party and populates `partyDetails` on the response.
 */
function resolvePartyDetails(
  partyId: string | undefined,
  fallback: Record<string, unknown>
): Record<string, unknown> {
  if (!partyId) return fallback;
  const party = efClientCorpEBMock.parties?.find((p) => p.id === partyId);
  if (!party) return fallback;

  if (party.partyType === 'INDIVIDUAL' && party.individualDetails) {
    return {
      type: 'INDIVIDUAL',
      firstName: party.individualDetails.firstName,
      lastName: party.individualDetails.lastName,
    };
  }
  if (party.partyType === 'ORGANIZATION' && party.organizationDetails) {
    return {
      type: 'ORGANIZATION',
      businessName: party.organizationDetails.organizationName,
    };
  }
  return fallback;
}

/** POST /recipients handler that always succeeds (for submit demos). */
const onboardingLinkAccountPostHandler = http.post(
  '/recipients',
  async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const timestamp = new Date().toISOString();
    const newRecipient = {
      id: `la-multi-${Date.now()}`,
      type: (body.type as string) || 'LINKED_ACCOUNT',
      status: 'MICRODEPOSITS_INITIATED',
      clientId: body.clientId as string | undefined,
      partyDetails: resolvePartyDetails(
        body.partyId as string | undefined,
        (body.partyDetails as Record<string, unknown>) || {}
      ),
      account: body.account || {},
      createdAt: timestamp,
      updatedAt: timestamp,
      verificationAttempts: 0,
    };
    return HttpResponse.json(newRecipient, { status: 201 });
  }
);

/**
 * Stateful POST /recipients handler — persists to MSW db with ACTIVE status
 * so the new account appears immediately in the existing accounts list.
 */
const statefulLinkAccountPostHandler = http.post(
  '/recipients',
  async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const account = (body.account as Record<string, unknown>) || {};
    const partyDetails = resolvePartyDetails(
      body.partyId as string | undefined,
      (body.partyDetails as Record<string, unknown>) || {}
    );
    const timestamp = new Date().toISOString();

    const newRecipient = db.recipient.create({
      id: `la-multi-${Date.now()}`,
      type: (body.type as string) || 'LINKED_ACCOUNT',
      status: 'ACTIVE',
      clientId: (body.clientId as string) ?? DEFAULT_CLIENT_ID,
      partyDetails,
      account,
      createdAt: timestamp,
      updatedAt: timestamp,
      verificationAttempts: 0,
    });

    return HttpResponse.json(newRecipient, { status: 201 });
  }
);

/**
 * Stateful GET /recipients handler — reads from MSW db so newly created
 * accounts appear on refetch without a page reload.
 */
const statefulGetRecipientsHandler = http.get(
  '/recipients',
  async ({ request }) => {
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get('type');
    const statusFilter = url.searchParams.get('status');

    let recipients = db.recipient.getAll();

    if (statusFilter) {
      recipients = recipients.filter((r) => r.status === statusFilter);
    } else {
      recipients = recipients.filter(
        (r) => r.status !== 'INACTIVE' && r.status !== 'REJECTED'
      );
    }

    if (typeFilter) {
      recipients = recipients.filter((r) => r.type === typeFilter);
    }

    const response: ListRecipientsResponse = {
      recipients: recipients as ListRecipientsResponse['recipients'],
      metadata: { total_items: recipients.length },
    };
    return HttpResponse.json(response);
  }
);

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Linked account/Multi-Account',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@linked-accounts'],
  parameters: {
    layout: 'fullscreen',
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

/**
 * **1. PartyId passthrough (prefill summary)**
 *
 * Host provides a `partyId` alongside `initialValues`. The party is already known
 * server-side; form submits attach `partyId` to the payload instead of creating a new party.
 * Opens directly on the link-account step (approved client).
 */
export const WithPartyId: Story = {
  name: '1. With partyId (prefill summary)',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        onboardingLinkAccountPostHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Demonstrates passing an explicit `partyId` to the link-account step. The form shows prefilled read-only data; on submit, `partyId` is attached to the payload.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'prefillSummary',
      partyId: '2000000112',
      initialValues: mockLinkAccountPrefillReadonly,
    },
  },
};

/**
 * **2. Preset accounts with selector (editable)**
 *
 * Host supplies two preset accounts via `presetAccounts`. The user sees a dropdown
 * to pick which account to link, then proceeds through the editable form wizard.
 */
export const PresetAccountsEditable: Story = {
  name: '2. Preset accounts — editable (two accounts)',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        onboardingLinkAccountPostHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Two preset accounts with a select dropdown. User picks an account, then completes the two-step bank form wizard.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'editable',
      initialValues: {},
      presetAccounts: mockPresetAccountsTwo,
    },
  },
};

/**
 * **3. Preset accounts with selector (prefill summary)**
 *
 * Same dropdown but in `prefillSummary` mode — user selects a preset, sees the
 * read-only summary, and confirms.
 */
export const PresetAccountsPrefillSummary: Story = {
  name: '3. Preset accounts — prefill summary (two accounts)',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        onboardingLinkAccountPostHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Preset accounts in prefill summary mode. The selector dropdown appears above the read-only bank summary.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'prefillSummary',
      initialValues: {},
      presetAccounts: mockPresetAccountsTwo,
    },
  },
};

/**
 * **4. Three preset accounts (editable)**
 *
 * Three options in the selector to demonstrate scalability.
 */
export const PresetAccountsThree: Story = {
  name: '4. Preset accounts — three options',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        onboardingLinkAccountPostHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Three preset accounts showing the selector scales well with more options.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'editable',
      initialValues: {},
      presetAccounts: mockPresetAccountsThree,
    },
  },
};

/**
 * **5. Allow multiple accounts (sequential linking)**
 *
 * After successful linking, shows "Link another account" / "Done" buttons.
 * Host sets `allowMultipleAccounts: true`.
 */
export const AllowMultipleAccounts: Story = {
  name: '5. Allow multiple accounts (sequential)',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        onboardingLinkAccountPostHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Enables sequential linking. After confirming the first account, the UI shows "Link another account" instead of redirecting to Overview. Aligned with `LinkedAccountWidget` `mode: "list"` behavior.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'prefillSummary',
      allowMultipleAccounts: true,
      initialValues: mockLinkAccountPrefillReadonly,
    },
  },
};

/**
 * **6. Preset accounts + multiple accounts**
 *
 * Combines both features: selector dropdown + sequential linking flow.
 */
export const PresetAccountsWithMultiple: Story = {
  name: '6. Preset accounts + allow multiple',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        onboardingLinkAccountPostHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Full combination: three preset accounts in a selector, prefill summary mode, and sequential linking enabled. After linking one, user can pick the next preset.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'prefillSummary',
      allowMultipleAccounts: true,
      initialValues: {},
      presetAccounts: mockPresetAccountsThree,
    },
  },
};

/**
 * **7. Existing linked accounts + add more**
 *
 * Shows linked accounts that already exist (returned from GET /recipients)
 * as compact display cards, with the form below to link additional accounts.
 * Demonstrates the full "manage linked accounts" view when `allowMultipleAccounts: true`.
 */
export const ExistingAccountsWithAddMore: Story = {
  name: '7. Existing accounts + add more',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      // Seed one existing linked account into the MSW db
      db.recipient.create({
        id: mockExistingLinkedAccount.id,
        type: mockExistingLinkedAccount.type ?? 'LINKED_ACCOUNT',
        status: mockExistingLinkedAccount.status ?? 'ACTIVE',
        clientId: mockExistingLinkedAccount.clientId ?? DEFAULT_CLIENT_ID,
        partyDetails: mockExistingLinkedAccount.partyDetails ?? {},
        account: mockExistingLinkedAccount.account ?? {},
        createdAt:
          mockExistingLinkedAccount.createdAt ?? new Date().toISOString(),
        updatedAt:
          mockExistingLinkedAccount.updatedAt ??
          mockExistingLinkedAccount.createdAt ??
          new Date().toISOString(),
        verificationAttempts: 0,
      });
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        statefulLinkAccountPostHandler,
        statefulGetRecipientsHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Demonstrates managing linked accounts: one existing account is shown as a compact card with an "Add account" button. Clicking the button hides existing accounts and shows the link form. Uses `allowMultipleAccounts: true`.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'prefillSummary',
      allowMultipleAccounts: true,
      existingAccountsDisplay: 'compact',
      initialValues: mockLinkAccountPrefillReadonly,
    },
  },
};

/**
 * **8. Existing accounts — detailed view with actions**
 *
 * Same as story 7 but with the default `existingAccountsDisplay: 'detailed'`.
 * Each existing account shows the full card: status alerts with Verify action,
 * View Details dialog trigger, and Remove action (unless `hideLinkedAccountRemoval` is set).
 */
export const ExistingAccountsDetailed: Story = {
  name: '8. Existing accounts — detailed with actions',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      // Seed one existing linked account into the MSW db
      db.recipient.create({
        id: mockExistingLinkedAccount.id,
        type: mockExistingLinkedAccount.type ?? 'LINKED_ACCOUNT',
        status: mockExistingLinkedAccount.status ?? 'ACTIVE',
        clientId: mockExistingLinkedAccount.clientId ?? DEFAULT_CLIENT_ID,
        partyDetails: mockExistingLinkedAccount.partyDetails ?? {},
        account: mockExistingLinkedAccount.account ?? {},
        createdAt:
          mockExistingLinkedAccount.createdAt ?? new Date().toISOString(),
        updatedAt:
          mockExistingLinkedAccount.updatedAt ??
          mockExistingLinkedAccount.createdAt ??
          new Date().toISOString(),
        verificationAttempts: 0,
      });
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        statefulLinkAccountPostHandler,
        statefulGetRecipientsHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Detailed view (default): one existing account with full card showing status alert, View Details, and Remove actions.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'prefillSummary',
      allowMultipleAccounts: true,
      existingAccountsDisplay: 'detailed',
      initialValues: mockLinkAccountPrefillReadonly,
    },
  },
};

/**
 * **9. Free-entry multi-account (editable, existing account)**
 *
 * `allowMultipleAccounts` with `completionMode: 'editable'` and empty `initialValues`.
 * One existing linked account is seeded. The user sees the existing account card,
 * clicks "Add account", then fills in all bank details from scratch.
 */
export const FreeEntryMultiAccount: Story = {
  name: '9. Free-entry multi-account (editable)',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      db.recipient.create({
        id: mockExistingLinkedAccount.id,
        type: mockExistingLinkedAccount.type ?? 'LINKED_ACCOUNT',
        status: mockExistingLinkedAccount.status ?? 'ACTIVE',
        clientId: mockExistingLinkedAccount.clientId ?? DEFAULT_CLIENT_ID,
        partyDetails: mockExistingLinkedAccount.partyDetails ?? {},
        account: mockExistingLinkedAccount.account ?? {},
        createdAt:
          mockExistingLinkedAccount.createdAt ?? new Date().toISOString(),
        updatedAt:
          mockExistingLinkedAccount.updatedAt ??
          mockExistingLinkedAccount.createdAt ??
          new Date().toISOString(),
        verificationAttempts: 0,
      });
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        statefulLinkAccountPostHandler,
        statefulGetRecipientsHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'One existing account shown as a detailed card. Click "Add account" to reveal a blank editable form. User enters all bank details manually and can link multiple accounts in sequence.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'editable',
      allowMultipleAccounts: true,
      initialValues: {},
    },
  },
};

/**
 * **10. Free-entry multi-account with multiple payment methods (existing account)**
 *
 * Same as story 9 but with `bankFormConfigOverride` enabling ACH + WIRE + RTP
 * multi-select. One existing account is seeded. Demonstrates expanded payment
 * method availability combined with `allowMultipleAccounts`.
 */
export const FreeEntryMultiAccountMultiPayment: Story = {
  name: '10. Free-entry multi-account + ACH/WIRE/RTP',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      db.recipient.create({
        id: mockExistingLinkedAccount.id,
        type: mockExistingLinkedAccount.type ?? 'LINKED_ACCOUNT',
        status: mockExistingLinkedAccount.status ?? 'ACTIVE',
        clientId: mockExistingLinkedAccount.clientId ?? DEFAULT_CLIENT_ID,
        partyDetails: mockExistingLinkedAccount.partyDetails ?? {},
        account: mockExistingLinkedAccount.account ?? {},
        createdAt:
          mockExistingLinkedAccount.createdAt ?? new Date().toISOString(),
        updatedAt:
          mockExistingLinkedAccount.updatedAt ??
          mockExistingLinkedAccount.createdAt ??
          new Date().toISOString(),
        verificationAttempts: 0,
      });
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: [
        statefulLinkAccountPostHandler,
        statefulGetRecipientsHandler,
        ...createOnboardingFlowHandlers({
          client: mockClientApproved,
          clientId: DEFAULT_CLIENT_ID,
        }),
      ],
    },
    docs: {
      description: {
        story:
          'One existing account shown as a detailed card. Click "Add account" to reveal a blank editable form with ACH + WIRE + RTP multi-select enabled via `bankFormConfigOverride`.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
    flowEntry: { screenId: 'link-account' },
    linkAccountStepOptions: {
      completionMode: 'editable',
      allowMultipleAccounts: true,
      initialValues: {},
      bankFormConfigOverride: {
        paymentMethods: {
          available: ['ACH', 'WIRE', 'RTP'],
          allowMultiple: true,
          defaultSelected: ['ACH'],
        },
      },
    },
  },
};
