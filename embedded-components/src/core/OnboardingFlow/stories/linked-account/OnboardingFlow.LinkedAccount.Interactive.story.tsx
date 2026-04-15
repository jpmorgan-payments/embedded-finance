/**
 * OnboardingFlow — Linked account (Interactive)
 *
 * Play-driven flows for linking a bank account inside onboarding (recipient state machine + prefill summary).
 *
 * ## Stories
 *
 * 1. **Link account (recipient state machine)** — Approved client, full link wizard, MSW transitions per
 *    [Linked Account state machine](?path=/docs/core-linkedaccountwidget-interactive-workflows-state-machine--docs)
 * 2. **Link account (prefill summary + three acknowledgements)** — Single-page summary, three checkboxes, POST /recipients
 * 2b. **Link account (editable + acknowledgements)** — Two-step wizard, agreements on step 2 (same `reviewAcknowledgements` config as prefill summary)
 * 3. **Microdeposit verification (overview)** — `READY_FOR_VALIDATION` on Overview; open dialog, enter **0.23** / **0.47**, submit → **ACTIVE**
 */

import { db, resetDb } from '@/msw/db';
import { handlers } from '@/msw/handlers';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  createOnboardingFlowHandlers,
  DEFAULT_CLIENT_ID,
  mockClientApproved,
  mockExistingLinkedAccountReadyForValidation,
  mockLinkAccountPrefillEditable,
  mockLinkAccountPrefillReadonly,
  mockLinkAccountPrefillSummaryAcknowledgementsThree,
  OnboardingFlowTemplate,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const delay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const STEP_DELAY = 450;
const TYPING_DELAY = 40;

/** Story 3 only — slower pacing so verification steps are easy to follow in Storybook. */
const MICRODEPOSIT_PLAY_STEP_MS = 1400;
const MICRODEPOSIT_PLAY_TYPING_MS = 120;

const ONBOARDING_LINK_DEMO_RECIPIENT_ID = 'onboarding-link-demo-recipient';

const onboardingLinkAccountPostHandler = http.post(
  '/recipients',
  async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const timestamp = new Date().toISOString();
    const newRecipient = {
      id: ONBOARDING_LINK_DEMO_RECIPIENT_ID,
      type: (body.type as string) || 'LINKED_ACCOUNT',
      status: 'MICRODEPOSITS_INITIATED',
      clientId: body.clientId as string | undefined,
      partyDetails: body.partyDetails || {},
      account: body.account || {},
      createdAt: timestamp,
      updatedAt: timestamp,
      verificationAttempts: 0,
    };
    db.recipient.create(newRecipient);
    return HttpResponse.json(newRecipient, { status: 201 });
  }
);

async function postRecipientUpdate(
  recipientId: string,
  data: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`/recipients/${recipientId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`POST /recipients/${recipientId} failed: ${res.status}`);
  }
}

async function postVerifyMicrodeposit(
  recipientId: string,
  amounts: [number, number]
): Promise<void> {
  const res = await fetch(`/recipients/${recipientId}/verify-microdeposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amounts }),
  });
  if (!res.ok) {
    throw new Error(`verify-microdeposit failed: ${res.status}`);
  }
}

const getContainer = () =>
  within(document.querySelector('#embedded-component-layout') as HTMLElement);

const waitForContainer = async () => {
  await waitFor(
    () => {
      const container = document.querySelector('#embedded-component-layout');
      if (!container) throw new Error('Container not found');
    },
    { timeout: 5000 }
  );
};

const waitForContentLoaded = async (container: ReturnType<typeof within>) => {
  await waitFor(
    () => {
      const gatewayTitle = container.queryByRole('heading', {
        level: 1,
        name: /Let's help you get started/i,
      });
      const overviewTitle = container.queryByRole('heading', {
        level: 1,
        name: /overview/i,
      });
      const loadingText = container.queryByText(/Fetching client data/i);

      if (loadingText) {
        throw new Error('Still fetching client data');
      }
      if (!gatewayTitle && !overviewTitle) {
        throw new Error('Neither Gateway nor Overview screen visible');
      }
    },
    { timeout: 15000 }
  );
};

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Linked account/Interactive',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@linked-accounts'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers,
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    docs: {
      description: {
        component:
          'Interactive linked-account journeys inside OnboardingFlow. MSW drives recipient status transitions where noted.',
      },
    },
  },
  loaders: [
    async () => {
      resetDb();
      return {};
    },
  ],
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
 * **1. Link account: recipient state machine (overview)**
 *
 * Uses the same LLC seed data as the main Gateway flow (`0030000132` / Neverland Books), but
 * starts on **Overview** with the client marked **APPROVED** so “Link a bank account” is unlocked.
 *
 * MSW matches the [Linked Account state machine](?path=/docs/core-linkedaccountwidget-interactive-workflows-state-machine--docs):
 *
 * 1. **POST /recipients** → `MICRODEPOSITS_INITIATED` (fixed id for deterministic transitions)
 * 2. **POST /recipients/:id** → `READY_FOR_VALIDATION` (simulates “MD Sent”)
 * 3. **POST /recipients/:id/verify-microdeposit** with `[0.23, 0.47]` → `ACTIVE`
 */
export const _1_LinkAccount_RecipientStateMachine: Story = {
  name: '1. Link account: recipient state machine (overview)',
  args: {
    ...commonArgs,
    clientId: '0030000132',
    showLinkAccountStep: true,
  },
  parameters: {
    msw: {
      handlers: [onboardingLinkAccountPostHandler, ...handlers],
    },
    docs: {
      description: {
        story:
          'Onboarding Overview → Link bank account with MSW-driven recipient statuses. See **Core → LinkedAccountWidget → Interactive Workflows → State Machine** for the full diagram.',
      },
    },
  },
  loaders: [
    async () => {
      resetDb();
      const client = db.client.findFirst({
        where: { id: { equals: '0030000132' } },
      });
      if (client) {
        db.client.update({
          where: { id: { equals: '0030000132' } },
          data: {
            ...client,
            status: 'APPROVED',
          },
        });
      }
      return {};
    },
  ],
  play: async ({ step }) => {
    await waitForContainer();
    const container = getContainer();

    await step('Wait for Overview (approved client)', async () => {
      await waitForContentLoaded(container);
      await waitFor(
        () => {
          expect(
            container.getByRole('heading', { level: 1, name: /overview/i })
          ).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
    });

    await step('Open Link bank account from overview card', async () => {
      await delay(STEP_DELAY);
      const linkHeading = await screen.findByRole('heading', {
        name: /Link an account/i,
      });
      const linkCard =
        linkHeading.closest('[class*="eb-rounded-md"]') ??
        linkHeading.parentElement?.parentElement;
      expect(linkCard).toBeTruthy();
      const startLink = within(linkCard as HTMLElement).getByRole('button', {
        name: /^Start$/i,
      });
      await userEvent.click(startLink);
    });

    await step('Continue to account details', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const btn = Array.from(document.querySelectorAll('button')).find(
            (b) => b.textContent?.match(/continue to account details/i)
          );
          if (!btn) throw new Error('Continue to account details not found');
          return btn;
        },
        { timeout: 15000 }
      );
      const continueBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.match(/continue to account details/i)
      ) as HTMLElement;
      await userEvent.click(continueBtn);
    });

    await step('Select account holder if multiple parties', async () => {
      await delay(STEP_DELAY);
      const combobox = document.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement | null;
      if (combobox) {
        await userEvent.click(combobox);
        await delay(200);
        const firstOption = document.querySelector(
          '[role="option"]'
        ) as HTMLElement | null;
        if (firstOption) {
          await userEvent.click(firstOption);
        }
      }
    });

    await step('Fill account number and ACH routing', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const el = document.querySelector(
            'input[name="accountNumber"]'
          ) as HTMLInputElement | null;
          if (!el) throw new Error('Account number input not found');
        },
        { timeout: 10000 }
      );
      const accountNumberInput = document.querySelector(
        'input[name="accountNumber"]'
      ) as HTMLInputElement;
      await userEvent.clear(accountNumberInput);
      await userEvent.type(accountNumberInput, '12345678901234567', {
        delay: TYPING_DELAY,
      });

      const routingInput = Array.from(
        document.querySelectorAll('input[type="text"]')
      ).find((input) =>
        (input as HTMLInputElement).placeholder
          ?.toLowerCase()
          .includes('routing')
      ) as HTMLInputElement | undefined;
      if (routingInput) {
        await userEvent.clear(routingInput);
        await userEvent.type(routingInput, '021000021', {
          delay: TYPING_DELAY,
        });
      }
    });

    await step('Accept account certification', async () => {
      await delay(STEP_DELAY);
      const certifyByLabel = screen.queryByRole('checkbox', {
        name: /authorize|certif/i,
      });
      if (certifyByLabel) {
        await userEvent.click(certifyByLabel);
        return;
      }
      const layout = document.querySelector('#embedded-component-layout');
      const boxes = layout
        ? Array.from(within(layout as HTMLElement).queryAllByRole('checkbox'))
        : [];
      const certify = boxes.find((el) =>
        (el.textContent || '').toLowerCase().includes('authorize')
      );
      if (certify) {
        await userEvent.click(certify);
      } else if (boxes.length > 0) {
        await userEvent.click(boxes[boxes.length - 1]);
      }
    });

    await step('Submit Link Account', async () => {
      await delay(STEP_DELAY);
      const submitBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.match(/^Link Account$/i)
      ) as HTMLElement | undefined;
      expect(submitBtn).toBeTruthy();
      await userEvent.click(submitBtn!);
    });

    await step('Confirm link success screen', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(
            screen.getByText(/Account linked successfully/i)
          ).toBeInTheDocument();
        },
        { timeout: 20000 }
      );
    });

    await step('Return to overview', async () => {
      await delay(STEP_DELAY);
      const back = screen.getByRole('button', {
        name: /Return to overview/i,
      });
      await userEvent.click(back);
    });

    await step('See microdeposit pending state on overview', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(
            screen.getByText(
              /Pending Verification|Microdeposit|verification pending/i
            )
          ).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
    });

    await step(
      'Transition recipient to READY_FOR_VALIDATION (MD sent)',
      async () => {
        await postRecipientUpdate(ONBOARDING_LINK_DEMO_RECIPIENT_ID, {
          status: 'READY_FOR_VALIDATION',
        });
      }
    );

    await step(
      'Open Link bank account from sidebar to refresh recipient',
      async () => {
        await delay(STEP_DELAY);
        const timelineLink = screen.getByRole('button', {
          name: /Link bank account/i,
        });
        await userEvent.click(timelineLink);
      }
    );

    await step('See action required (ready for validation)', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(screen.getByText(/Action Required/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
    });

    await step('Complete microdeposit verification → ACTIVE', async () => {
      await postVerifyMicrodeposit(
        ONBOARDING_LINK_DEMO_RECIPIENT_ID,
        [0.23, 0.47]
      );
    });

    await step('Re-open link account and see Active state', async () => {
      await delay(STEP_DELAY);
      await userEvent.click(
        screen.getByRole('button', { name: /Link bank account/i })
      );
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(screen.getByText(/^Active$/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
    });
  },
};

/**
 * **2. Link account: prefill summary (three acknowledgements)**
 *
 * `completionMode: 'prefillSummary'` with full `initialValues` and three `reviewAcknowledgements` rows.
 * POST /recipients on confirm.
 */
export const _2_LinkAccount_PrefillSummaryThreeAcknowledgements: Story = {
  name: '2. Link account: prefill summary (three acknowledgements)',
  args: {
    ...commonArgs,
    clientId: '0030000132',
    showLinkAccountStep: true,
    linkAccountStepOptions: {
      completionMode: 'prefillSummary',
      initialValues: mockLinkAccountPrefillReadonly,
      summaryDisplayedPaymentTypes: ['ACH'],
      reviewAcknowledgements:
        mockLinkAccountPrefillSummaryAcknowledgementsThree,
      showAcknowledgementsIntro: true,
    },
  },
  parameters: {
    msw: {
      handlers: [onboardingLinkAccountPostHandler, ...handlers],
    },
    docs: {
      description: {
        story:
          "Read-only link step: same MSW create behavior as story **1** (microdeposit pending after confirm). Compare with editable prefill via `completionMode: 'editable'` on `linkAccountStepOptions`.",
      },
    },
  },
  loaders: [
    async () => {
      resetDb();
      const client = db.client.findFirst({
        where: { id: { equals: '0030000132' } },
      });
      if (client) {
        db.client.update({
          where: { id: { equals: '0030000132' } },
          data: {
            ...client,
            status: 'APPROVED',
          },
        });
      }
      return {};
    },
  ],
  play: async ({ step }) => {
    await waitForContainer();
    const container = getContainer();

    await step('Wait for Overview (approved client)', async () => {
      await waitForContentLoaded(container);
      await waitFor(
        () => {
          expect(
            container.getByRole('heading', { level: 1, name: /overview/i })
          ).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
    });

    await step('Open Link bank account from overview card', async () => {
      await delay(STEP_DELAY);
      const linkHeading = await screen.findByRole('heading', {
        name: /Link an account/i,
      });
      const linkCard =
        linkHeading.closest('[class*="eb-rounded-md"]') ??
        linkHeading.parentElement?.parentElement;
      expect(linkCard).toBeTruthy();
      const startLink = within(linkCard as HTMLElement).getByRole('button', {
        name: /^Start$/i,
      });
      await userEvent.click(startLink);
    });

    await step('Prefill summary: disabled bank fields, no wizard', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(
            screen.getByRole('heading', {
              level: 1,
              name: /Link a bank account/i,
            })
          ).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
      expect(screen.getByText(/Taylor Morgan/i)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Continue to account details/i })
      ).not.toBeInTheDocument();
    });

    await step(
      'Accept three acknowledgements (required before confirm)',
      async () => {
        await delay(STEP_DELAY);
        expect(
          screen.getByText(/By electronically linking this account/i)
        ).toBeInTheDocument();
        const confirmBtn = screen.getByRole('button', {
          name: /Confirm and link account/i,
        });
        expect(confirmBtn).toBeDisabled();

        await userEvent.click(
          screen.getByRole('checkbox', {
            name: /primarily for business purposes/i,
          })
        );
        expect(confirmBtn).toBeDisabled();

        await userEvent.click(
          screen.getByRole('checkbox', {
            name: /authorize verification of this linked account/i,
          })
        );
        expect(confirmBtn).toBeDisabled();

        await userEvent.click(
          screen.getByRole('checkbox', {
            name: /JPMorgan Chase Bank/i,
          })
        );
        await waitFor(() => {
          expect(confirmBtn).not.toBeDisabled();
        });
      }
    );

    await step('Confirm and link account', async () => {
      await delay(STEP_DELAY);
      await userEvent.click(
        screen.getByRole('button', { name: /Confirm and link account/i })
      );
    });

    await step('Success: account linked', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(
            screen.getByText(/Account linked successfully/i)
          ).toBeInTheDocument();
        },
        { timeout: 20000 }
      );
    });

    await step(
      'Return to overview — pending verification on card',
      async () => {
        await delay(STEP_DELAY);
        await userEvent.click(
          screen.getByRole('button', { name: /Return to overview/i })
        );
        await delay(STEP_DELAY * 2);
        await waitFor(
          () => {
            expect(
              screen.getByText(
                /Pending Verification|Microdeposit|verification pending/i
              )
            ).toBeInTheDocument();
          },
          { timeout: 15000 }
        );
      }
    );
  },
};

/**
 * **2b. Link account: editable wizard + review acknowledgements**
 *
 * Same `reviewAcknowledgements` (and optional intro) as prefill summary, but with `completionMode: 'editable'`
 * so the user completes the two-step `BankAccountForm`; agreements appear on step 2 above the certification checkbox.
 */
export const _2b_LinkAccount_EditableWithReviewAcknowledgements: Story = {
  name: '2b. Link account: editable + review acknowledgements',
  args: {
    ...commonArgs,
    clientId: '0030000132',
    showLinkAccountStep: true,
    linkAccountStepOptions: {
      completionMode: 'editable',
      initialValues: mockLinkAccountPrefillEditable,
      reviewAcknowledgements:
        mockLinkAccountPrefillSummaryAcknowledgementsThree,
      showAcknowledgementsIntro: true,
    },
  },
  parameters: {
    msw: {
      handlers: [onboardingLinkAccountPostHandler, ...handlers],
    },
    docs: {
      description: {
        story:
          "Demonstrates `reviewAcknowledgements` with `completionMode: 'editable'`: host configures the same checklist as prefill summary, but the user walks through payment methods (step 1) then account details + agreements (step 2).",
      },
    },
  },
  loaders: [
    async () => {
      resetDb();
      const client = db.client.findFirst({
        where: { id: { equals: '0030000132' } },
      });
      if (client) {
        db.client.update({
          where: { id: { equals: '0030000132' } },
          data: {
            ...client,
            status: 'APPROVED',
          },
        });
      }
      return {};
    },
  ],
  play: async ({ step }) => {
    await waitForContainer();
    const container = getContainer();

    await step('Wait for Overview (approved client)', async () => {
      await waitForContentLoaded(container);
      await waitFor(
        () => {
          expect(
            container.getByRole('heading', { level: 1, name: /overview/i })
          ).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
    });

    await step('Open Link bank account from overview card', async () => {
      await delay(STEP_DELAY);
      const linkHeading = await screen.findByRole('heading', {
        name: /Link an account/i,
      });
      const linkCard =
        linkHeading.closest('[class*="eb-rounded-md"]') ??
        linkHeading.parentElement?.parentElement;
      expect(linkCard).toBeTruthy();
      const startLink = within(linkCard as HTMLElement).getByRole('button', {
        name: /^Start$/i,
      });
      await userEvent.click(startLink);
    });

    await step('Step 1: continue to account details', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(
            screen.getByRole('heading', {
              level: 1,
              name: /Link a bank account/i,
            })
          ).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
      await userEvent.click(
        screen.getByRole('button', { name: /Continue to Account Details/i })
      );
    });

    await step(
      'Step 2: review acknowledgements gate submit (no duplicate certification checkbox)',
      async () => {
        await delay(STEP_DELAY * 2);
        expect(
          screen.getByText(/By electronically linking this account/i)
        ).toBeInTheDocument();

        const submitBtn = screen.getByRole('button', {
          name: /^Link Account$/i,
        });
        expect(submitBtn).toBeDisabled();

        await userEvent.click(
          screen.getByRole('checkbox', {
            name: /primarily for business purposes/i,
          })
        );
        expect(submitBtn).toBeDisabled();

        await userEvent.click(
          screen.getByRole('checkbox', {
            name: /authorize verification of this linked account/i,
          })
        );
        expect(submitBtn).toBeDisabled();

        await userEvent.click(
          screen.getByRole('checkbox', {
            name: /JPMorgan Chase Bank/i,
          })
        );

        await waitFor(() => {
          expect(submitBtn).not.toBeDisabled();
        });
      }
    );
  },
};

/**
 * **3. Microdeposit verification from Overview**
 *
 * Starts with an approved client and a linked account in **READY_FOR_VALIDATION** (MSW seeds the recipient into the db on first `GET /recipients`).
 * Play opens **Verify Account**, enters the mock-correct amounts **0.23** and **0.47**, submits, and expects the overview card to show an **Active** state after refetch.
 */
export const _3_MicrodepositVerificationFromOverview: Story = {
  name: '3. Microdeposit verification from Overview',
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
        existingLinkedAccounts: [mockExistingLinkedAccountReadyForValidation],
      }),
    },
    docs: {
      description: {
        story:
          'Demonstrates the same **Verify Account** microdeposit dialog as LinkedAccountWidget, launched from the onboarding **Overview** bank section. MSW accepts **0.23** and **0.47** (either order).',
      },
    },
  },
  loaders: [
    async () => {
      resetDb();
      return {};
    },
  ],
  play: async ({ step }) => {
    await waitForContainer();
    const container = getContainer();

    await step(
      'Wait for Overview (approved client + ready to verify)',
      async () => {
        await waitForContentLoaded(container);
        await waitFor(
          () => {
            expect(
              container.getByRole('heading', { level: 1, name: /overview/i })
            ).toBeInTheDocument();
          },
          { timeout: 15000 }
        );
      }
    );

    await step('Open Verify Account from bank section', async () => {
      await delay(MICRODEPOSIT_PLAY_STEP_MS);
      const verifyBtn = await screen.findByRole('button', {
        name: /Verify Account/i,
      });
      await userEvent.click(verifyBtn);
    });

    await step('Microdeposit dialog: enter amounts and submit', async () => {
      await delay(MICRODEPOSIT_PLAY_STEP_MS);
      const dialog = await screen.findByRole('dialog', {
        name: /Verify Account/i,
      });
      const inDialog = within(dialog);

      const first = await inDialog.findByLabelText(/First Deposit Amount/i);
      const second = await inDialog.findByLabelText(/Second Deposit Amount/i);

      await userEvent.clear(first);
      await userEvent.type(first, '0.23', {
        delay: MICRODEPOSIT_PLAY_TYPING_MS,
      });
      await delay(MICRODEPOSIT_PLAY_STEP_MS / 2);
      await userEvent.clear(second);
      await userEvent.type(second, '0.47', {
        delay: MICRODEPOSIT_PLAY_TYPING_MS,
      });
      await delay(MICRODEPOSIT_PLAY_STEP_MS);
      await userEvent.click(
        inDialog.getByRole('button', { name: /^Submit$/i })
      );
    });

    await step(
      'Dialog closes; overview shows Active linked account',
      async () => {
        await delay(MICRODEPOSIT_PLAY_STEP_MS * 2);
        await waitFor(
          () => {
            expect(
              screen.queryByRole('dialog', { name: /Verify Account/i })
            ).not.toBeInTheDocument();
          },
          { timeout: 15000 }
        );
        await waitFor(
          () => {
            expect(screen.getByText(/^Active$/i)).toBeInTheDocument();
          },
          { timeout: 20000 }
        );
      }
    );
  },
};
