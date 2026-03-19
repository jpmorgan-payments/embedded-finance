/**
 * OnboardingFlow - Interactive Workflows
 *
 * Automated demonstrations of complete user flows using Storybook play functions.
 * These stories automatically interact with the component to show key onboarding workflows.
 *
 * Each story demonstrates a specific user journey through the onboarding flow.
 * Stories use the global MSW handlers with db pattern and loaders to seed data.
 *
 * ## Stories:
 *
 * 1. **Gateway Screen** - Select organization type (LLC, Sole Proprietorship)
 * 1c. **Link account (recipient state machine)** - Approved LLC client, link bank account, MSW transitions aligned with the Linked Account state machine docs
 * 1d. **Link account (readonly prefill)** - Host-supplied details, review-only UI, one acknowledgement checkbox, confirm to POST /recipients
 * 1e. **Link account (readonly + multiple acknowledgements)** - Same as 1d with two checkbox rows before confirm
 * 2. **Personal Section** - Name, identity, contact details, check answers
 * 3. **Business Section** - Business identity, industry, contact info, check answers
 * 4. **Owners Section** - Add beneficial owners (NOT for Sole Proprietorship)
 * 5. **Operational Details** - Dynamic questions from API
 * 6. **Utility** - Navigation and validation demos
 *
 * ## Test Data (consistent across all stories):
 *
 * **Controller (Personal Section):**
 * - Name: Peiter Pan
 * - Job Title: CFO
 * - DOB: January 30, 1945
 * - SSN: 300-40-0004
 * - Email: Peiter@neverlandbooks.com
 * - Phone: +1 (760) 681-0558
 * - Address: 2029 Century Park E, Los Angeles, CA 90067
 *
 * **Business (Business Section):**
 * - Legal Name: Neverland Books
 * - DBA: FT Books
 * - Year of Formation: 1989
 * - EIN: 30-0030003
 * - Website: https://www.Neverlandbooks.com
 * - Business Description: Step into a world of stories and imagination
 * - Business Phone: +1 (760) 681-0558
 * - Business Email: info@Neverlandbooks.com
 * - Business Address: 2029 Century Park E, Los Angeles, CA 90067
 *
 * **Owner (Owners Section):**
 * - Name: Tinker Ball
 * - Title: CEO
 * - Nature of Ownership: Direct
 * - DOB: August 18, 1969
 * - SSN: 300-05-0005
 * - Email: Tinker@neverlandbook.com
 * - Phone: +1 (650) 353-2444
 * - Address: 3223 Hanover St, Palo Alto, CA 94304
 */

import { db, resetDb } from '@/msw/db';
import { handlers } from '@/msw/handlers';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  mockLinkAccountPrefillReadonly,
  mockLinkAccountReviewAcknowledgements,
  mockLinkAccountReviewAcknowledgementsMultiple,
  OnboardingFlowTemplate,
} from './story-utils';

// Client ID for stories that need empty personal details (no controller party)
const MINIMAL_CLIENT_ID = '0030000140';

/**
 * Seed a minimal client with organization type set but NO controller party.
 * This shows the Overview screen with empty Personal Details form.
 * Used for stories that demonstrate filling in forms from scratch.
 */
function seedMinimalClient(clientId: string) {
  const timestamp = new Date().toISOString();
  const orgPartyId = `org-${clientId}`;

  // Create organization party with organizationType set (required for Overview screen)
  // but NO personal data, NO controller party
  db.party.create({
    id: orgPartyId,
    partyType: 'ORGANIZATION',
    roles: ['CLIENT'],
    status: 'ACTIVE',
    active: true,
    createdAt: timestamp,
    profileStatus: 'NEW',
    organizationDetails: {
      organizationType: 'LIMITED_LIABILITY_COMPANY',
      organizationName: 'PLACEHOLDER_ORG_NAME',
      countryOfFormation: 'US',
      jurisdiction: 'US',
    },
  });

  // Create the client - parties is array of IDs (strings), not objects
  db.client.create({
    id: clientId,
    status: 'NEW',
    partyId: orgPartyId,
    parties: [orgPartyId], // Array of party IDs
    products: ['EMBEDDED_PAYMENTS'],
    createdAt: timestamp,
    outstanding: {
      documentRequestIds: [],
      questionIds: [
        '30005',
        '30026',
        '30027',
        '30088',
        '30089',
        '30090',
        '30095',
      ], // Questions from efClientQuestionsMock
      attestationDocumentIds: [],
      partyIds: [],
      partyRoles: [],
    },
  });
}

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

// ============================================================================
// Helper Functions
// ============================================================================

/** Delay between interactions for visibility */
const delay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** Pause between play steps (ms) — higher = easier to follow in Storybook. */
const STEP_DELAY = 450;
/** Keystroke delay for `userEvent.type` (ms). */
const TYPING_DELAY = 40;

/** Stable recipient id for onboarding link-account demos (MSW db + play fetch). */
const ONBOARDING_LINK_DEMO_RECIPIENT_ID = 'onboarding-link-demo-recipient';

/**
 * MSW handler: POST /recipients creates a linked account with a fixed id so the
 * play function can drive status transitions (Linked Account state machine).
 */
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

/** Get the main container */
const getContainer = () =>
  within(document.querySelector('#embedded-component-layout') as HTMLElement);

/** Wait for container to be ready */
const waitForContainer = async () => {
  await waitFor(
    () => {
      const container = document.querySelector('#embedded-component-layout');
      if (!container) throw new Error('Container not found');
    },
    { timeout: 5000 }
  );
};

/** Wait for initial data fetch to complete by checking for content */
const waitForContentLoaded = async (container: ReturnType<typeof within>) => {
  // Wait for either Gateway screen or Overview screen to be visible
  await waitFor(
    () => {
      // Gateway screen has "Let's help you get started" title in h1
      const gatewayTitle = container.queryByRole('heading', {
        level: 1,
        name: /Let's help you get started/i,
      });
      // Overview screen has "Overview" title in h1
      const overviewTitle = container.queryByRole('heading', {
        level: 1,
        name: /overview/i,
      });
      // Loading state shows "Fetching client data..."
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

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Interactive Workflows',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
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
          'Interactive workflows that automatically demonstrate complete onboarding flows. Watch each story to see the user journey.',
      },
    },
  },
  loaders: [
    async () => {
      // Reset db to ensure clean state for each story
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

// ============================================================================
// 1. GATEWAY SCREEN - Organization Type Selection
// ============================================================================

/**
 * **1a. Select LLC Organization Type**
 *
 * Demonstrates the initial organization type selection flow for a registered business.
 *
 * Flow:
 * 1. View Gateway screen with "Let's help you get started" title
 * 2. Select "Registered business" radio option
 * 3. Select "Limited Liability Company" from dropdown
 * 4. Click "Get Started" button
 * 5. Verify navigation to Overview screen
 */
export const _1a_Gateway_SelectLLC: Story = {
  name: '1a. Gateway: Select LLC',
  args: {
    ...commonArgs,
    availableOrganizationTypes: [
      'SOLE_PROPRIETORSHIP',
      'LIMITED_LIABILITY_COMPANY',
      'C_CORPORATION',
    ],
  },
  play: async ({ step }) => {
    await waitForContainer();
    const container = getContainer();

    await step('Wait for Gateway screen to load', async () => {
      await waitForContentLoaded(container);
    });

    await step('Verify Gateway screen title', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          expect(
            container.getByRole('heading', {
              level: 1,
              name: /Let's help you get started/i,
            })
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await step('Select Registered business option', async () => {
      await delay(STEP_DELAY);
      const registeredBusinessRadio = container.getByRole('radio', {
        name: /Registered business/i,
      });
      await userEvent.click(registeredBusinessRadio);
    });

    await step('Select LLC from organization type dropdown', async () => {
      await delay(STEP_DELAY);
      const comboboxTrigger = container.getByRole('combobox');
      await userEvent.click(comboboxTrigger);
      await delay(300);
      const llcOption = await waitFor(
        () => {
          const item = document.querySelector(
            '[data-value*="LIMITED_LIABILITY_COMPANY"]'
          );
          if (!item) throw new Error('LLC option not found');
          return item as HTMLElement;
        },
        { timeout: 5000 }
      );
      await userEvent.click(llcOption);
      await delay(STEP_DELAY);
    });

    await step('Click Get Started button', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const getStartedButton = container.getByRole('button', {
            name: /Get Started/i,
          });
          expect(getStartedButton).not.toBeDisabled();
          return getStartedButton;
        },
        { timeout: 5000 }
      );
      const getStartedButton = container.getByRole('button', {
        name: /Get Started/i,
      });
      await userEvent.click(getStartedButton);
    });

    await step('Verify navigation to Overview screen', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const freshContainer = getContainer();
          const heading = freshContainer.getByRole('heading', { level: 1 });
          expect(heading).toHaveTextContent(/Overview/i);
        },
        { timeout: 10000 }
      );
    });
  },
};

/**
 * **1b. Select Sole Proprietorship**
 *
 * Demonstrates the simplified flow for sole proprietors (no dropdown needed).
 *
 * Flow:
 * 1. View Gateway screen
 * 2. Select "Sole proprietorship" radio option
 * 3. Click "Get Started" button
 * 4. Verify navigation to Overview screen
 */
export const _1b_Gateway_SelectSoleProprietorship: Story = {
  name: '1b. Gateway: Select Sole Proprietorship',
  args: {
    ...commonArgs,
    availableOrganizationTypes: [
      'SOLE_PROPRIETORSHIP',
      'LIMITED_LIABILITY_COMPANY',
    ],
  },
  play: async ({ step }) => {
    await waitForContainer();
    const container = getContainer();

    await step('Wait for Gateway screen to load', async () => {
      await waitForContentLoaded(container);
    });

    await step('Verify Gateway screen', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          expect(
            container.getByRole('heading', {
              level: 1,
              name: /Let's help you get started/i,
            })
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await step('Select Sole Proprietorship', async () => {
      await delay(STEP_DELAY);
      const soleProprietorRadio = container.getByRole('radio', {
        name: /Sole proprietorship/i,
      });
      await userEvent.click(soleProprietorRadio);
    });

    await step('Click Get Started button', async () => {
      await delay(STEP_DELAY);
      const getStartedButton = container.getByRole('button', {
        name: /Get Started/i,
      });
      await userEvent.click(getStartedButton);
    });

    await step('Verify navigation to Overview screen', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const freshContainer = getContainer();
          const heading = freshContainer.getByRole('heading', { level: 1 });
          expect(heading).toHaveTextContent(/Overview/i);
        },
        { timeout: 10000 }
      );
    });
  },
};

/**
 * **1c. Link account: recipient state machine (overview)**
 *
 * Uses the same LLC seed data as the Gateway flow (`0030000132` / Neverland Books), but
 * starts on **Overview** with the client marked **APPROVED** so “Link a bank account” is unlocked.
 *
 * MSW matches the [Linked Account state machine](?path=/docs/core-linkedaccountwidget-interactive-workflows-state-machine--docs):
 *
 * 1. **POST /recipients** → `MICRODEPOSITS_INITIATED` (fixed id for deterministic transitions)
 * 2. **POST /recipients/:id** → `READY_FOR_VALIDATION` (simulates “MD Sent”)
 * 3. **POST /recipients/:id/verify-microdeposit** with `[0.23, 0.47]` → `ACTIVE`
 */
export const _1c_LinkAccount_RecipientStateMachine: Story = {
  name: '1c. Link account: recipient state machine (overview)',
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
 * **1d. Link account: readonly prefill (review + confirm)**
 *
 * Demonstrates {@link OnboardingFlowProps.linkAccountStepOptions} with `completionMode: 'readonly'`.
 * The host passes full `initialValues`; the user sees **Review your bank account** and
 * **Confirm and link account** (no `BankAccountForm` fields). POST /recipients runs on confirm.
 * Uses a single `reviewAcknowledgements` row (T&C-style). See **1e** for multiple rows.
 */
export const _1d_LinkAccount_ReadonlyPrefillReview: Story = {
  name: '1d. Link account: readonly prefill (review + confirm)',
  args: {
    ...commonArgs,
    clientId: '0030000132',
    showLinkAccountStep: true,
    linkAccountStepOptions: {
      completionMode: 'readonly',
      initialValues: mockLinkAccountPrefillReadonly,
      reviewAcknowledgements: mockLinkAccountReviewAcknowledgements,
    },
  },
  parameters: {
    msw: {
      handlers: [onboardingLinkAccountPostHandler, ...handlers],
    },
    docs: {
      description: {
        story:
          "Read-only link step: same MSW create behavior as **1c** (microdeposit pending after confirm). Compare with editable prefill via `completionMode: 'editable'` on `linkAccountStepOptions`.",
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

    await step('Review-only UI: no multi-step bank form', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          expect(
            screen.getByRole('heading', {
              level: 1,
              name: /Review your bank account/i,
            })
          ).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
      expect(screen.getByText(/Taylor/i)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Continue to account details/i })
      ).not.toBeInTheDocument();
    });

    await step(
      'Accept legal acknowledgement (required before confirm)',
      async () => {
        await delay(STEP_DELAY);
        const confirmBtn = screen.getByRole('button', {
          name: /Confirm and link account/i,
        });
        expect(confirmBtn).toBeDisabled();
        const ack = screen.getByRole('checkbox', {
          name: /By confirming, you agree/i,
        });
        await userEvent.click(ack);
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
 * **1e. Link account: readonly prefill + multiple acknowledgements**
 *
 * Same journey as **1d**, but `reviewAcknowledgements` lists two items — confirm stays disabled until both are checked.
 */
export const _1e_LinkAccount_ReadonlyPrefillMultipleAcknowledgements: Story = {
  name: '1e. Link account: readonly + multiple acknowledgements',
  args: {
    ...commonArgs,
    clientId: '0030000132',
    showLinkAccountStep: true,
    linkAccountStepOptions: {
      completionMode: 'readonly',
      initialValues: mockLinkAccountPrefillReadonly,
      reviewAcknowledgements: mockLinkAccountReviewAcknowledgementsMultiple,
    },
  },
  parameters: {
    msw: {
      handlers: [onboardingLinkAccountPostHandler, ...handlers],
    },
    docs: {
      description: {
        story:
          'Demonstrates `linkAccountStepOptions.reviewAcknowledgements` with **more than one** checkbox. See **Client States → Approved with link account — review-only + multiple acknowledgements** for the static story.',
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

    await step(
      'Review screen shows two acknowledgement checkboxes',
      async () => {
        await delay(STEP_DELAY * 2);
        await waitFor(
          () => {
            expect(
              screen.getByRole('heading', {
                level: 1,
                name: /Review your bank account/i,
              })
            ).toBeInTheDocument();
          },
          { timeout: 15000 }
        );
        expect(
          screen.getByRole('checkbox', { name: /By confirming, you agree/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('checkbox', {
            name: /I confirm this bank account is owned/i,
          })
        ).toBeInTheDocument();
      }
    );

    await step(
      'Accept both acknowledgements (confirm enables only after both)',
      async () => {
        await delay(STEP_DELAY);
        const confirmBtn = screen.getByRole('button', {
          name: /Confirm and link account/i,
        });
        expect(confirmBtn).toBeDisabled();

        await userEvent.click(
          screen.getByRole('checkbox', { name: /By confirming, you agree/i })
        );
        expect(confirmBtn).toBeDisabled();

        await userEvent.click(
          screen.getByRole('checkbox', {
            name: /I confirm this bank account is owned/i,
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

// ============================================================================
// 2. PERSONAL SECTION - Your Personal Details
// ============================================================================

/**
 * **2. Personal: Complete Section**
 *
 * Fill out all steps of the Personal Section in one continuous flow.
 *
 * Steps:
 * 1. Personal Details - Name and job title
 * 2. Identity Document - DOB and SSN
 * 3. Contact Details - Email, phone, and address
 * 4. Check Your Answers
 *
 * Test Data:
 * - Name: Peiter Pan, CFO
 * - DOB: January 30, 1945 | SSN: 300-40-0004
 * - Email: Peiter@neverlandbooks.com | Phone: +1 (760) 681-0558
 * - Address: 2029 Century Park E, Los Angeles, CA 90067
 */
export const _2_Personal_CompleteSection: Story = {
  name: '2. Personal: Complete Section',
  args: {
    ...commonArgs,
    clientId: MINIMAL_CLIENT_ID,
  },
  loaders: [
    async () => {
      resetDb();
      seedMinimalClient(MINIMAL_CLIENT_ID);
      return {};
    },
  ],
  play: async ({ step }) => {
    await waitForContainer();

    await step('Wait for Overview screen to load', async () => {
      const container = getContainer();
      await waitForContentLoaded(container);
    });

    await step('Navigate to Personal section', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const personalSectionButton = container.getByRole('button', {
        name: /Your personal details/i,
      });
      await userEvent.click(personalSectionButton);
    });

    await step('Wait for Personal Details form', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const container = getContainer();
          const firstNameInput = container.queryByLabelText(/First name/i);
          if (!firstNameInput) throw new Error('Form not loaded');
        },
        { timeout: 10000 }
      );
    });

    await step('Fill First Name: Peiter', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const firstNameInput = container.getByLabelText(/first name/i);
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, 'Peiter', { delay: TYPING_DELAY });
    });

    await step('Fill Last Name: Pan', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const lastNameInput = container.getByLabelText(/last name/i);
      await userEvent.clear(lastNameInput);
      await userEvent.type(lastNameInput, 'Pan', { delay: TYPING_DELAY });
    });

    await step('Select Job Title: CFO', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const jobTitleCombobox = container.queryByRole('combobox', {
        name: /job title/i,
      });
      if (jobTitleCombobox) {
        await userEvent.click(jobTitleCombobox);
        await delay(300);
        const cfoOption = await waitFor(
          () => {
            const item = document.querySelector('[data-value*="CFO"]');
            if (!item) throw new Error('CFO option not found');
            return item as HTMLElement;
          },
          { timeout: 5000 }
        );
        await userEvent.click(cfoOption);
        await delay(200);
      }
    });

    await step('Click Continue', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Step 2: Identity Document ----

    await step('Wait for Identity Document form', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const container = getContainer();
          const dayInput = container.queryByRole('textbox', { name: /^Day$/i });
          if (!dayInput) throw new Error('Identity form not loaded');
        },
        { timeout: 10000 }
      );
    });

    await step('Fill Date of Birth: 01/30/1945', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();

      const monthTrigger = container.getByRole('combobox', { name: /Month/i });
      await userEvent.click(monthTrigger);
      await delay(200);
      const januaryOption = await waitFor(
        () => {
          const options = document.querySelectorAll('[role="option"]');
          const january = Array.from(options).find((opt) =>
            opt.textContent?.includes('January')
          );
          if (!january) throw new Error('January option not found');
          return january as HTMLElement;
        },
        { timeout: 3000 }
      );
      await userEvent.click(januaryOption);
      await delay(100);

      const dayInput = container.getByRole('textbox', { name: /^Day$/i });
      await userEvent.clear(dayInput);
      await userEvent.type(dayInput, '30', { delay: TYPING_DELAY });

      const yearInput = container.getByRole('textbox', { name: /^Year$/i });
      await userEvent.clear(yearInput);
      await userEvent.type(yearInput, '1945', { delay: TYPING_DELAY });
    });

    await step('Fill SSN: 300-40-0004', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const ssnInput = container.queryByLabelText(/SSN|Social Security/i);
      if (ssnInput) {
        await userEvent.clear(ssnInput);
        await userEvent.type(ssnInput, '300400004', { delay: TYPING_DELAY });
      }
    });

    await step('Click Continue to Contact Details', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Step 3: Contact Details ----

    await step('Wait for Contact Details form', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const container = getContainer();
          const emailInput = container.queryByLabelText(/email/i);
          if (!emailInput) throw new Error('Contact form not loaded');
        },
        { timeout: 10000 }
      );
    });

    await step('Fill Email: Peiter@neverlandbooks.com', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const emailInput = container.getByLabelText(/email/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'Peiter@neverlandbooks.com', {
        delay: TYPING_DELAY,
      });
    });

    await step('Fill Phone: +1 (760) 681-0558', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const phoneInput = container.queryByLabelText(/phone/i);
      if (phoneInput) {
        await userEvent.clear(phoneInput);
        await userEvent.type(phoneInput, '7606810558', { delay: TYPING_DELAY });
      }
    });

    await step('Fill Address: 2029 Century Park E', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const addressInput = container.queryByLabelText(
        /address line 1|primary address/i
      );
      if (addressInput) {
        await userEvent.clear(addressInput);
        await userEvent.type(addressInput, '2029 Century Park E', {
          delay: TYPING_DELAY,
        });
      }
    });

    await step('Fill City: Los Angeles', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const cityInput = container.queryByLabelText(/city/i);
      if (cityInput) {
        await userEvent.clear(cityInput);
        await userEvent.type(cityInput, 'Los Angeles', { delay: TYPING_DELAY });
      }
    });

    await step('Select State: CA', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const stateCombobox = container.queryByRole('combobox', {
        name: /state/i,
      });
      if (stateCombobox) {
        await userEvent.click(stateCombobox);
        await delay(300);
        const caOption = await waitFor(
          () => {
            const item = document.querySelector('[data-value*="CA"]');
            if (!item) throw new Error('CA option not found');
            return item as HTMLElement;
          },
          { timeout: 5000 }
        );
        await userEvent.click(caOption);
        await delay(200);
      }
    });

    await step('Fill Postal Code: 90067', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const postalInput = container.queryByLabelText(/postal|zip/i);
      if (postalInput) {
        await userEvent.clear(postalInput);
        await userEvent.type(postalInput, '90067', { delay: TYPING_DELAY });
      }
    });

    await step('Click Continue to Check Your Answers', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Step 4: Check Your Answers ----

    await step('Verify Check Your Answers step', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const container = getContainer();
          const checkTitle = container.queryByText(/Check your answers/i);
          const confirmButton = container.queryByRole('button', {
            name: /Confirm|Submit/i,
          });
          if (!checkTitle && !confirmButton)
            throw new Error('Check answers step not loaded');
        },
        { timeout: 10000 }
      );
    });
  },
};

// ============================================================================
// 3. BUSINESS SECTION - Business Details
// ============================================================================

/**
 * **3. Business: Complete Section**
 *
 * Complete all Business Section steps in one flow:
 * - Step 1: Business Identity (legal name, DBA, year, EIN, website)
 * - Step 2: Industry (business description, NAICS category)
 * - Step 3: Contact Info (email, phone, address)
 * - Step 4: Check Your Answers
 *
 * Test Data:
 * - Legal Name: Neverland Books
 * - DBA: FT Books
 * - Year of Formation: 1989
 * - EIN: 30-0030003
 * - Website: https://www.Neverlandbooks.com
 * - Business Description: Step into a world of stories and imagination
 * - Business Phone: +1 (760) 681-0558
 * - Business Email: info@Neverlandbooks.com
 * - Business Address: 2029 Century Park E, Los Angeles, CA 90067
 */
export const _3_Business_CompleteSection: Story = {
  name: '3. Business: Complete Section',
  args: {
    ...commonArgs,
    clientId: MINIMAL_CLIENT_ID,
  },
  loaders: [
    async () => {
      resetDb();
      seedMinimalClient(MINIMAL_CLIENT_ID);
      return {};
    },
  ],
  play: async ({ step }) => {
    await waitForContainer();

    await step('Wait for Overview screen', async () => {
      const container = getContainer();
      await waitForContentLoaded(container);
    });

    await step('Navigate to Business section', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const businessSectionButton = container.getByRole('button', {
        name: /Business details/i,
      });
      await userEvent.click(businessSectionButton);
    });

    // ---- Step 1: Business Identity ----

    await step('Wait for Business Identity form', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const legalNameInput = document.querySelector(
            'input[name="organizationName"]'
          );
          if (!legalNameInput)
            throw new Error('Business Identity form not loaded');
        },
        { timeout: 10000 }
      );
    });

    await step('Fill Legal Name: Neverland Books', async () => {
      await delay(STEP_DELAY / 2);
      const legalNameInput = document.querySelector(
        'input[name="organizationName"]'
      ) as HTMLInputElement;
      if (legalNameInput) {
        await userEvent.clear(legalNameInput);
        await userEvent.type(legalNameInput, 'Neverland Books', {
          delay: TYPING_DELAY,
        });
      }
    });

    await step('Fill DBA Name: FT Books', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const dbaInput = container.queryByLabelText(/DBA|doing business as/i);
      if (dbaInput) {
        await userEvent.clear(dbaInput);
        await userEvent.type(dbaInput, 'FT Books', { delay: TYPING_DELAY });
      }
    });

    await step('Fill Year of Formation: 1989', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const yearInput = container.queryByLabelText(/year of formation/i);
      if (yearInput) {
        await userEvent.clear(yearInput);
        await userEvent.type(yearInput, '1989', { delay: TYPING_DELAY });
      }
    });

    await step('Fill EIN: 30-0030003', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const einInput = container.queryByLabelText(
        /EIN|employer identification/i
      );
      if (einInput) {
        await userEvent.clear(einInput);
        await userEvent.type(einInput, '300030003', { delay: TYPING_DELAY });
      }
    });

    await step('Fill Website: https://www.Neverlandbooks.com', async () => {
      await delay(STEP_DELAY / 4);
      const websiteInput = document.querySelector(
        'input[name="website"]'
      ) as HTMLInputElement;
      if (websiteInput) {
        await userEvent.clear(websiteInput);
        await userEvent.type(websiteInput, 'https://www.Neverlandbooks.com', {
          delay: TYPING_DELAY,
        });
      }
    });

    await step('Click Continue to Industry', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Step 2: Industry ----

    await step('Wait for Industry form', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const container = getContainer();
          const descriptionInput =
            container.queryByLabelText(/business description/i);
          if (!descriptionInput) throw new Error('Industry form not loaded');
        },
        { timeout: 10000 }
      );
    });

    await step(
      'Fill Business Description: Step into a world of stories and imagination',
      async () => {
        await delay(STEP_DELAY / 2);
        const container = getContainer();
        const descriptionInput =
          container.getByLabelText(/business description/i);
        await userEvent.clear(descriptionInput);
        await userEvent.type(
          descriptionInput,
          'Step into a world of stories and imagination',
          { delay: TYPING_DELAY }
        );
      }
    );

    await step('Select Industry Category', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const industryCombobox = container.queryByRole('combobox');
      if (industryCombobox) {
        await userEvent.click(industryCombobox);
        await delay(300);
        const industryOption = await waitFor(
          () => {
            const items = document.querySelectorAll('[data-value]');
            if (items.length === 0)
              throw new Error('No industry options found');
            return items[0] as HTMLElement;
          },
          { timeout: 5000 }
        );
        await userEvent.click(industryOption);
        await delay(200);
      }
    });

    await step('Click Continue to Contact Info', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Step 3: Business Contact Info ----

    await step('Wait for Business Contact Info form', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const container = getContainer();
          const emailInput = container.queryByLabelText(/email/i);
          const phoneInput = container.queryByLabelText(/phone/i);
          if (!emailInput && !phoneInput)
            throw new Error('Contact Info form not loaded');
        },
        { timeout: 10000 }
      );
    });

    await step('Fill Business Email: info@Neverlandbooks.com', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const emailInput = container.queryByLabelText(/email/i);
      if (emailInput) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, 'info@Neverlandbooks.com', {
          delay: TYPING_DELAY,
        });
      }
    });

    await step('Fill Business Phone: +1 (760) 681-0558', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const phoneInput = container.queryByLabelText(/phone/i);
      if (phoneInput) {
        await userEvent.clear(phoneInput);
        await userEvent.type(phoneInput, '7606810558', { delay: TYPING_DELAY });
      }
    });

    // Address Country US is already selected by default

    await step('Fill Business Address: 2029 Century Park E', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const addressInput = container.queryByLabelText(
        /address line 1|primary address/i
      );
      if (addressInput) {
        await userEvent.clear(addressInput);
        await userEvent.type(addressInput, '2029 Century Park E', {
          delay: TYPING_DELAY,
        });
      }
    });

    await step('Fill City: Los Angeles', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const cityInput = container.queryByLabelText(/city/i);
      if (cityInput) {
        await userEvent.clear(cityInput);
        await userEvent.type(cityInput, 'Los Angeles', {
          delay: TYPING_DELAY,
        });
      }
    });

    await step('Select State: CA', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const stateCombobox = container.queryByRole('combobox', {
        name: /state/i,
      });
      if (stateCombobox) {
        await userEvent.click(stateCombobox);
        await delay(300);
        const caOption = await waitFor(
          () => {
            const item = document.querySelector('[data-value*="CA"]');
            if (!item) throw new Error('CA option not found');
            return item as HTMLElement;
          },
          { timeout: 5000 }
        );
        await userEvent.click(caOption);
        await delay(200);
      }
    });

    await step('Fill Postal Code: 90067', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const postalInput = container.queryByLabelText(/postal|zip/i);
      if (postalInput) {
        await userEvent.clear(postalInput);
        await userEvent.type(postalInput, '90067', { delay: TYPING_DELAY });
      }
    });

    await step('Click Continue to Check Your Answers', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Step 4: Check Your Answers ----

    await step('Verify Check Your Answers step', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const container = getContainer();
          const checkTitle = container.queryByText(/Check your answers/i);
          const confirmButton = container.queryByRole('button', {
            name: /Confirm|Submit/i,
          });
          if (!checkTitle && !confirmButton)
            throw new Error('Check answers step not loaded');
        },
        { timeout: 10000 }
      );
    });
  },
};

// ============================================================================
// 4. OWNERS SECTION - Owners and Key Roles (NOT for Sole Proprietorship)
// ============================================================================

/**
 * **4. Owners: Complete Section**
 *
 * Complete all Owners Section steps in one flow:
 * - Navigate to Owners section
 * - Verify section loads
 * - Answer controller ownership question: No
 * - Click Add Owner button
 * - Step 1: Personal Details (name, job title, nature of ownership)
 * - Step 2: Identity Document (DOB, SSN)
 * - Step 3: Contact Details (email, phone, address)
 * - Step 4: Check Your Answers
 *
 * Test Data:
 * - Name: Tinker Ball
 * - Title: CEO
 * - Nature of Ownership: Direct
 * - DOB: August 18, 1969
 * - SSN: 300-05-0005
 * - Email: Tinker@neverlandbook.com
 * - Phone: +1 (650) 353-2444
 * - Address: 3223 Hanover St, Palo Alto, CA 94304
 */
export const _4_Owners_CompleteSection: Story = {
  name: '4. Owners: Complete Section',
  args: {
    ...commonArgs,
    clientId: MINIMAL_CLIENT_ID,
  },
  loaders: [
    async () => {
      resetDb();
      seedMinimalClient(MINIMAL_CLIENT_ID);
      return {};
    },
  ],
  play: async ({ step }) => {
    await waitForContainer();

    await step('Wait for Overview screen', async () => {
      const container = getContainer();
      await waitForContentLoaded(container);
    });

    await step(
      'Verify Owners section is visible (LLC has owners section)',
      async () => {
        await delay(STEP_DELAY);
        const container = getContainer();
        await waitFor(
          () => {
            const ownersSectionButton = container.queryByRole('button', {
              name: /Owners and key roles/i,
            });
            expect(ownersSectionButton).toBeInTheDocument();
          },
          { timeout: 5000 }
        );
      }
    );

    await step('Click on Owners section', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const ownersSectionButton = container.getByRole('button', {
        name: /Owners and key roles/i,
      });
      await userEvent.click(ownersSectionButton);
    });

    await step('Verify Owners section loads', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const container = getContainer();
          const ownersTitle = container.queryByText(/Owners and key roles/i);
          const addOwnerButton = container.queryByRole('button', {
            name: /Add.*owner|Add.*person/i,
          });
          expect(ownersTitle || addOwnerButton).toBeTruthy();
        },
        { timeout: 10000 }
      );
    });

    await step('Answer controller ownership question: No', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const noRadio = container.queryByRole('radio', { name: /No/i });
      if (noRadio) {
        await userEvent.click(noRadio);
        await delay(300);
      }
    });

    await step('Click Add Owner button', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const addOwnerButton = container.queryByRole('button', {
        name: /Add.*owner|Add.*person|\+/i,
      });
      if (addOwnerButton) {
        await userEvent.click(addOwnerButton);
      }
    });

    await step('Verify owner form appears', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const container = getContainer();
          const firstNameInput = container.queryByLabelText(/first name/i);
          expect(firstNameInput).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    // ---- Owner Step 1: Personal Details ----

    await step('Fill Owner First Name: Tinker', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const firstNameInput = container.getByLabelText(/first name/i);
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, 'Tinker', { delay: TYPING_DELAY });
    });

    await step('Fill Owner Last Name: Ball', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const lastNameInput = container.getByLabelText(/last name/i);
      await userEvent.clear(lastNameInput);
      await userEvent.type(lastNameInput, 'Ball', { delay: TYPING_DELAY });
    });

    await step('Select Owner Job Title: CEO', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const jobTitleCombobox = container.queryByRole('combobox', {
        name: /job title/i,
      });
      if (jobTitleCombobox) {
        await userEvent.click(jobTitleCombobox);
        await delay(300);
        const ceoOption = await waitFor(
          () => {
            const item = document.querySelector('[data-value*="CEO"]');
            if (!item) throw new Error('CEO option not found');
            return item as HTMLElement;
          },
          { timeout: 5000 }
        );
        await userEvent.click(ceoOption);
        await delay(200);
      }
    });

    await step('Select Nature of Ownership: Direct', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const ownershipSelect = container.getByLabelText(/nature of ownership/i);
      await userEvent.click(ownershipSelect);
      await delay(200);
      const directOption = await waitFor(
        () => {
          const options = document.querySelectorAll('[role="option"]');
          const direct = Array.from(options).find((opt) =>
            opt.textContent?.includes('Direct')
          );
          if (!direct) throw new Error('Direct option not found');
          return direct as HTMLElement;
        },
        { timeout: 5000 }
      );
      await userEvent.click(directOption);
      await delay(200);
    });

    await step('Click Continue to Identity Document', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Owner Step 2: Identity Document ----

    await step('Wait for Owner Identity Document form', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const container = getContainer();
          const dayInput = container.queryByRole('textbox', { name: /^Day$/i });
          if (!dayInput) throw new Error('Identity form not loaded');
        },
        { timeout: 10000 }
      );
    });

    await step('Fill Owner Date of Birth: 08/18/1969', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();

      const monthTrigger = container.getByRole('combobox', { name: /Month/i });
      await userEvent.click(monthTrigger);
      await delay(200);
      const augustOption = await waitFor(
        () => {
          const options = document.querySelectorAll('[role="option"]');
          const august = Array.from(options).find((opt) =>
            opt.textContent?.includes('August')
          );
          if (!august) throw new Error('August option not found');
          return august as HTMLElement;
        },
        { timeout: 3000 }
      );
      await userEvent.click(augustOption);
      await delay(100);

      const dayInput = container.getByRole('textbox', { name: /^Day$/i });
      await userEvent.clear(dayInput);
      await userEvent.type(dayInput, '18', { delay: TYPING_DELAY });

      const yearInput = container.getByRole('textbox', { name: /^Year$/i });
      await userEvent.clear(yearInput);
      await userEvent.type(yearInput, '1969', { delay: TYPING_DELAY });
    });

    await step('Fill Owner SSN: 300-05-0005', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const ssnInput = container.queryByLabelText(/SSN|Social Security/i);
      if (ssnInput) {
        await userEvent.clear(ssnInput);
        await userEvent.type(ssnInput, '300050005', { delay: TYPING_DELAY });
      }
    });

    await step('Click Continue to Owner Contact Details', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Owner Step 3: Contact Details ----

    await step('Wait for Owner Contact Details form', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const container = getContainer();
          const emailInput = container.queryByLabelText(/email/i);
          if (!emailInput) throw new Error('Contact form not loaded');
        },
        { timeout: 10000 }
      );
    });

    await step('Fill Owner Email: Tinker@neverlandbook.com', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const emailInput = container.getByLabelText(/email/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'Tinker@neverlandbook.com', {
        delay: TYPING_DELAY,
      });
    });

    await step('Fill Owner Phone: +1 (650) 353-2444', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const phoneInput = container.queryByLabelText(/phone/i);
      if (phoneInput) {
        await userEvent.clear(phoneInput);
        await userEvent.type(phoneInput, '6503532444', { delay: TYPING_DELAY });
      }
    });

    await step('Fill Owner Address: 3223 Hanover St', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const addressInput = container.queryByLabelText(
        /address line 1|primary address/i
      );
      if (addressInput) {
        await userEvent.clear(addressInput);
        await userEvent.type(addressInput, '3223 Hanover St', {
          delay: TYPING_DELAY,
        });
      }
    });

    await step('Fill Owner City: Palo Alto', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const cityInput = container.queryByLabelText(/city/i);
      if (cityInput) {
        await userEvent.clear(cityInput);
        await userEvent.type(cityInput, 'Palo Alto', { delay: TYPING_DELAY });
      }
    });

    await step('Select Owner State: CA', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const stateCombobox = container.queryByRole('combobox', {
        name: /state/i,
      });
      if (stateCombobox) {
        await userEvent.click(stateCombobox);
        await delay(300);
        const caOption = await waitFor(
          () => {
            const item = document.querySelector('[data-value*="CA"]');
            if (!item) throw new Error('CA option not found');
            return item as HTMLElement;
          },
          { timeout: 5000 }
        );
        await userEvent.click(caOption);
        await delay(200);
      }
    });

    await step('Fill Owner Postal Code: 94304', async () => {
      await delay(STEP_DELAY / 4);
      const container = getContainer();
      const postalInput = container.queryByLabelText(/postal|zip/i);
      if (postalInput) {
        await userEvent.clear(postalInput);
        await userEvent.type(postalInput, '94304', { delay: TYPING_DELAY });
      }
    });

    await step('Click Continue to Check Your Answers', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const continueButton = container.getByRole('button', {
        name: /Continue/i,
      });
      await userEvent.click(continueButton);
    });

    // ---- Owner Step 4: Check Your Answers ----

    await step('Verify Owner Check Your Answers step', async () => {
      await delay(STEP_DELAY);
      await waitFor(
        () => {
          const container = getContainer();
          const checkTitle = container.queryByText(/Check your answers/i);
          const confirmButton = container.queryByRole('button', {
            name: /Confirm|Submit/i,
          });
          if (!checkTitle && !confirmButton)
            throw new Error('Check answers step not loaded');
        },
        { timeout: 10000 }
      );
    });
  },
};

// ============================================================================
// 5. OPERATIONAL DETAILS - Dynamic Questions
// ============================================================================

/**
 * **5. Operational Details**
 *
 * Navigate to the Operational Details section and answer dynamic questions.
 * Questions come from the mock API based on outstanding questionIds.
 *
 * Questions answered:
 * - 30005: Total Annual Revenue: $10,000 (money input with $ prefix)
 * - 30026: Sanctions countries: No (boolean radio)
 * - 30088: Covered goods >$50k: No (boolean radio)
 * - 30095: Are you a FinTech?: No (boolean radio)
 */
export const _5_OperationalDetails: Story = {
  name: '5. Operational Details',
  args: {
    ...commonArgs,
    clientId: MINIMAL_CLIENT_ID,
  },
  loaders: [
    async () => {
      resetDb();
      seedMinimalClient(MINIMAL_CLIENT_ID);
      return {};
    },
  ],
  play: async ({ step }) => {
    await waitForContainer();

    await step('Wait for Overview screen', async () => {
      const container = getContainer();
      await waitForContentLoaded(container);
    });

    await step('Verify Operational details section exists', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      await waitFor(
        () => {
          const operationalButton = container.queryByRole('button', {
            name: /Operational details/i,
          });
          expect(operationalButton).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    await step('Click on Operational details section', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      const operationalButton = container.getByRole('button', {
        name: /Operational details/i,
      });
      await userEvent.click(operationalButton);
    });

    await step('Wait for questions to load', async () => {
      await delay(STEP_DELAY * 2);
      await waitFor(
        () => {
          const container = getContainer();
          // Wait for the revenue question label to appear
          const revenueLabel = container.queryByText(/Total annual revenue/i);
          if (!revenueLabel) throw new Error('Questions not loaded yet');
        },
        { timeout: 15000 }
      );
    });

    // ---- Question 30005: Total Annual Revenue (money input) ----

    await step('Fill Total Annual Revenue: $10,000', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      // The money input is a number input inside the form
      const revenueInput = container.getByRole('spinbutton');
      await userEvent.clear(revenueInput);
      await userEvent.type(revenueInput, '10000', {
        delay: TYPING_DELAY,
      });
    });

    // ---- Question 30026: Sanctions (boolean radio) ----

    await step('Select No for sanctions question', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      // There will be multiple "No" radios, get all radio groups
      const noRadios = container.getAllByRole('radio', { name: /^No$/i });
      // First "No" radio corresponds to the sanctions question (30026)
      await userEvent.click(noRadios[0]);
    });

    // ---- Question 30088: Covered goods >$50k (boolean radio) ----

    await step('Select No for covered goods question', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const noRadios = container.getAllByRole('radio', { name: /^No$/i });
      // Second "No" radio corresponds to covered goods question (30088)
      await userEvent.click(noRadios[1]);
    });

    // ---- Question 30095: Are you a FinTech? (boolean radio) ----

    await step('Select No for FinTech question', async () => {
      await delay(STEP_DELAY / 2);
      const container = getContainer();
      const noRadios = container.getAllByRole('radio', { name: /^No$/i });
      // Third "No" radio corresponds to FinTech question (30095)
      await userEvent.click(noRadios[2]);
    });

    await step('Verify answers are filled', async () => {
      await delay(STEP_DELAY);
      const container = getContainer();
      // Verify revenue input has value
      const revenueInput = container.getByRole('spinbutton');
      expect(revenueInput).toHaveValue(10000);
      // Verify all three No radios are checked
      const noRadios = container.getAllByRole('radio', { name: /^No$/i });
      expect(noRadios[0]).toBeChecked();
      expect(noRadios[1]).toBeChecked();
      expect(noRadios[2]).toBeChecked();
    });
  },
};
