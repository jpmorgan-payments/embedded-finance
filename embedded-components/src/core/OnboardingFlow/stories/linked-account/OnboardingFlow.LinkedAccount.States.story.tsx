/**
 * OnboardingFlow — Linked account (Client States)
 *
 * Approved-client scenarios for the bank link step: lifecycle on the overview card,
 * prefill modes, and an existing **ACTIVE** recipient.
 *
 * Lifecycle on the overview bank card follows
 * [Linked Account state machine](?path=/docs/core-linkedaccountwidget-interactive-workflows-state-machine--docs)
 * (`PENDING` → `MICRODEPOSITS_INITIATED` → `READY_FOR_VALIDATION` → `ACTIVE`).
 * `REJECTED` and `INACTIVE` recipients are omitted from the overview card (user sees the empty “link” state).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  buildApprovedClientLinkAccountStory,
  commonArgsWithCallbacks,
  commonArgTypes,
  mockExistingLinkedAccount,
  mockExistingLinkedAccountMicrodepositsInitiated,
  mockExistingLinkedAccountPending,
  mockExistingLinkedAccountReadyForValidation,
  mockExistingLinkedAccountRejected,
  mockExistingLinkedAccountRejected2,
  mockLinkAccountPrefillEditable,
  mockLinkAccountPrefillReadonly,
  mockLinkAccountPrefillSummaryAcknowledgementsThree,
  OnboardingFlowTemplate,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Linked account/Client States',
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

const linkedAccountStateMachineDocs =
  '?path=/docs/core-linkedaccountwidget-interactive-workflows-state-machine--docs';

function approvedLinkAccountLifecycleStory(
  description: string,
  options: Parameters<typeof buildApprovedClientLinkAccountStory>[0]
): Story {
  const base = buildApprovedClientLinkAccountStory(options);
  return {
    ...base,
    parameters: {
      ...base.parameters,
      docs: {
        description: {
          story: `${description} See [Linked Account state machine](${linkedAccountStateMachineDocs}).`,
        },
      },
    },
  };
}

/**
 * **Approved — bank link not started (no linked account yet)**
 *
 * Overview shows the dashed “Link an account” card with **Start** (no `GET /recipients` row yet). Matches the pre–linked-account state before `POST /recipients`.
 */
export const ApprovedWithBankLinkNotStarted: Story =
  approvedLinkAccountLifecycleStory(
    '**No recipient yet** — user has not completed the link flow.',
    {}
  );

/**
 * **Approved — linked account PENDING**
 *
 * Split-profile / processing state: `StatusAlert` uses the pending (clock) treatment until verification settles.
 */
export const ApprovedWithLinkedAccountPending: Story =
  approvedLinkAccountLifecycleStory(
    '**PENDING** — automated verification returned a pending outcome (see state diagram: split profile).',
    {
      handlerOptions: {
        existingLinkedAccounts: [mockExistingLinkedAccountPending],
      },
    }
  );

/**
 * **Approved — linked account MICRODEPOSITS_INITIATED**
 *
 * Microdeposits requested; user waits for deposits to appear at their bank.
 */
export const ApprovedWithLinkedAccountMicrodepositsInitiated: Story =
  approvedLinkAccountLifecycleStory(
    '**MICRODEPOSITS_INITIATED** — deposits in flight (typical wait: a few business days).',
    {
      handlerOptions: {
        existingLinkedAccounts: [
          mockExistingLinkedAccountMicrodepositsInitiated,
        ],
      },
    }
  );

/**
 * **Approved — linked account READY_FOR_VALIDATION**
 *
 * On the link step, the account card shows **Verify Account** (same microdeposit dialog as LinkedAccountWidget). MSW accepts amounts **0.23** and **0.47** (order-independent). See **Linked account → Interactive** for the full automated transition demo.
 */
export const ApprovedWithLinkedAccountReadyForValidation: Story =
  approvedLinkAccountLifecycleStory(
    '**READY_FOR_VALIDATION** — action required: enter microdeposit amounts.',
    {
      handlerOptions: {
        existingLinkedAccounts: [mockExistingLinkedAccountReadyForValidation],
      },
    }
  );

/**
 * **Approved with link account — editable prefill**
 *
 * Host supplies partial bank fields; user completes the form and submits.
 */
export const ApprovedWithLinkAccountPrefillEditable: Story =
  buildApprovedClientLinkAccountStory({
    linkAccountStepOptions: {
      completionMode: 'editable',
      initialValues: mockLinkAccountPrefillEditable,
    },
  });

/**
 * **Approved with link account — prefill summary (three default agreements + intro)**
 *
 * Disabled ACH strip, holder line, routing/account numbers, lead-in copy, three checkboxes, confirm.
 */
export const ApprovedWithLinkAccountPrefillSummary: Story =
  buildApprovedClientLinkAccountStory({
    linkAccountStepOptions: {
      completionMode: 'prefillSummary',
      initialValues: mockLinkAccountPrefillReadonly,
      summaryDisplayedPaymentTypes: ['ACH'],
      reviewAcknowledgements:
        mockLinkAccountPrefillSummaryAcknowledgementsThree,
      showAcknowledgementsIntro: true,
    },
  });

/**
 * **Approved — linked account ACTIVE**
 *
 * End state from the state machine: verified linked account. Sidebar link step completes; opening it shows account details instead of the creation form.
 */
export const ApprovedWithExistingLinkedAccount: Story =
  approvedLinkAccountLifecycleStory(
    '**ACTIVE** — verified; no verification alert on the overview card.',
    {
      handlerOptions: { existingLinkedAccounts: [mockExistingLinkedAccount] },
    }
  );

// ============================================================================
// Rejected account scenarios
// ============================================================================

/**
 * **Approved — only rejected linked accounts (no active account)**
 *
 * The overview bank section shows the "Link an account" Start button
 * together with a collapsible **Recently Rejected Accounts** accordion
 * listing the rejected accounts from the last 30 days.
 */
export const ApprovedWithOnlyRejectedAccounts: Story =
  approvedLinkAccountLifecycleStory(
    '**REJECTED only** — no active/pending account. The rejected-accounts accordion is shown alongside the Start button.',
    {
      handlerOptions: {
        existingLinkedAccounts: [
          mockExistingLinkedAccountRejected,
          mockExistingLinkedAccountRejected2,
        ],
      },
    }
  );

/**
 * **Approved — active linked account + rejected accounts**
 *
 * The overview bank section displays the existing active account card.
 * The rejected accounts accordion is **not** shown because a non-rejected
 * linked account exists (the accordion only appears when there are zero
 * non-rejected accounts).
 */
export const ApprovedWithActiveAndRejectedAccounts: Story =
  approvedLinkAccountLifecycleStory(
    '**ACTIVE + REJECTED** — active account card shown; rejected accordion hidden because a valid account exists.',
    {
      handlerOptions: {
        existingLinkedAccounts: [
          mockExistingLinkedAccount,
          mockExistingLinkedAccountRejected,
        ],
      },
    }
  );

/**
 * **Approved — pending linked account + rejected accounts**
 *
 * Pending account card visible on the overview; rejected accounts hidden.
 */
export const ApprovedWithPendingAndRejectedAccounts: Story =
  approvedLinkAccountLifecycleStory(
    '**PENDING + REJECTED** — pending account card shown; rejected accordion hidden.',
    {
      handlerOptions: {
        existingLinkedAccounts: [
          mockExistingLinkedAccountPending,
          mockExistingLinkedAccountRejected,
        ],
      },
    }
  );
