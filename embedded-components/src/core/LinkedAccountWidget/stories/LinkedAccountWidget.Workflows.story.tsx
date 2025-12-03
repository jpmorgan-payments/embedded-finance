/**
 * LinkedAccountWidget - Interactive Workflows
 *
 * Automated demonstrations of complete user flows using Storybook play functions.
 * These stories automatically interact with the component to show key workflows.
 * Each story sets up its own MSW handlers with specific test data.
 */

import { linkedAccountReadyForValidationMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, waitFor, within } from '@storybook/testing-library';

import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  LinkedAccountWidgetStory,
  resetMSWHandlers,
} from './story-utils';

// Helper to add delays between interactions for better visualization
const delay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
const INTERACTION_DELAY = 800; // Delay between steps in milliseconds

const meta = {
  title: 'Core/LinkedAccountWidget/Workflows',
  component: LinkedAccountWidgetStory,
  tags: ['@core', '@linked-accounts'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Interactive workflows that demonstrate complete user flows. Each story sets up its own test data using MSW handlers.',
      },
    },
  },
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof LinkedAccountWidgetStory>;

export default meta;
type Story = StoryObj<typeof LinkedAccountWidgetStory>;

/**
 * Complete flow of linking a new bank account via microdeposits.
 * Demonstrates the entire workflow from clicking "Link Account" to successful creation.
 *
 * MSW Handlers: Uses createRecipientHandlers with empty recipient list
 * Workflow: Click Link Account → Enter account details → Submit → See new account card
 */
export const LinkNewAccount: Story = {
  args: {
    ...commonArgs,
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers({
        recipients: [], // Start with empty list
      }),
    },
  },
  play: async ({ canvasElement, step }) => {
    // Reset MSW handlers to ensure clean state and seed with empty recipients
    await resetMSWHandlers({
      recipients: [], // Start with empty list
    });

    const canvas = within(canvasElement);

    // Step 1: Click "Link Account" button
    await step('Click Link Account button', async () => {
      await delay(INTERACTION_DELAY);
      const linkButton = await canvas.findByRole('button', {
        name: /link a new account/i,
      });
      await userEvent.click(linkButton);
    });

    // Step 2: Wait for dialog and fill in account details
    await step('Fill in account details', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(async () => {
        const accountNumberInput =
          await canvas.findByLabelText(/account number/i);
        const routingNumberInput =
          await canvas.findByLabelText(/routing number/i);

        await userEvent.type(accountNumberInput, '123456789');
        await userEvent.type(routingNumberInput, '021000021');
      });
    });

    // Step 3: Submit the form
    await step('Submit the form', async () => {
      await delay(INTERACTION_DELAY);
      const submitButton = await canvas.findByRole('button', {
        name: /continue/i,
      });
      await userEvent.click(submitButton);
    });

    // Step 4: Verify new account card appears
    await step('Verify new account card appears', async () => {
      await waitFor(async () => {
        await canvas.findByText(/•••• 6789/i);
      });
    });
  },
};

/**
 * Demonstrates successful microdeposit verification on first attempt.
 * Shows a clean flow where the user enters the correct amounts immediately.
 *
 * MSW Handlers: Uses createRecipientHandlers with account pending validation
 * Workflow: Click Verify → Enter correct amounts → Submit → See success message → Account becomes ACTIVE
 */
export const SuccessfulVerification: Story = {
  args: {
    ...commonArgs,
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers({
        recipients: linkedAccountReadyForValidationMock.recipients,
      }),
    },
  },
  play: async ({ canvasElement, step }) => {
    // Reset MSW handlers to ensure clean state and seed with pending validation account
    await resetMSWHandlers({
      recipients: linkedAccountReadyForValidationMock.recipients,
    });

    const canvas = within(canvasElement);

    // Step 1: Verify initial state shows "Action Required"
    await step('Verify initial state', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(async () => {
        await canvas.findByText(/action required/i);
      });
    });

    // Step 2: Click "Verify Account" button
    await step('Click Verify Account button', async () => {
      await delay(INTERACTION_DELAY);
      const verifyButton = await canvas.findByRole('button', {
        name: /verify account/i,
      });
      await userEvent.click(verifyButton);
    });

    // Step 3: Enter correct microdeposit amounts
    await step('Enter correct microdeposit amounts (0.23, 0.47)', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(() => {
        const amount1Input = document.querySelector('input[name="amount1"]');
        if (!amount1Input) throw new Error('Amount 1 input not found');
        return amount1Input;
      });

      const amount1Input = document.querySelector(
        'input[name="amount1"]'
      ) as HTMLInputElement;
      const amount2Input = document.querySelector(
        'input[name="amount2"]'
      ) as HTMLInputElement;

      await userEvent.clear(amount1Input);
      await userEvent.type(amount1Input, '0.23');
      await userEvent.clear(amount2Input);
      await userEvent.type(amount2Input, '0.47');
    });

    // Step 4: Submit the verification
    await step('Submit verification', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(() => {
        const submitButton = Array.from(
          document.querySelectorAll('button')
        ).find((btn) => btn.textContent?.match(/submit/i));
        if (!submitButton) throw new Error('Submit button not found');
        userEvent.click(submitButton);
      });
    });

    // Step 5: Verify success message appears
    await step('Verify success message appears', async () => {
      await waitFor(
        () => {
          const successText = Array.from(document.querySelectorAll('*')).find(
            (el) => el.textContent?.match(/account verified successfully/i)
          );
          if (!successText) throw new Error('Success message not found');
        },
        { timeout: 3000 }
      );
    });
  },
};

/**
 * Demonstrates a failed microdeposit verification attempt.
 * Shows how the system responds when incorrect amounts are entered.
 *
 * MSW Handlers: Uses createRecipientHandlers with account pending validation
 * Workflow: Click Verify → Enter incorrect amounts → Submit → See error message
 */
export const FailedVerification: Story = {
  args: {
    ...commonArgs,
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers({
        recipients: linkedAccountReadyForValidationMock.recipients,
      }),
    },
  },
  play: async ({ canvasElement, step }) => {
    // Reset MSW handlers to ensure clean state and seed with pending validation account
    await resetMSWHandlers({
      recipients: linkedAccountReadyForValidationMock.recipients,
    });

    const canvas = within(canvasElement);

    // Step 1: Click "Verify" button on the account card
    await step('Click Verify button', async () => {
      await delay(INTERACTION_DELAY);
      const verifyButton = await canvas.findByRole('button', {
        name: /verify/i,
      });
      await userEvent.click(verifyButton);
    });

    // Step 2: Wait for microdeposits dialog and fill in incorrect amounts
    await step('Enter incorrect microdeposit amounts', async () => {
      await delay(INTERACTION_DELAY);
      // Dialog content is rendered in a portal, so search in document
      await waitFor(() => {
        const amount1Input = document.querySelector('input[name="amount1"]');
        if (!amount1Input) throw new Error('Amount 1 input not found');
        return amount1Input;
      });

      const amount1Input = document.querySelector(
        'input[name="amount1"]'
      ) as HTMLInputElement;
      const amount2Input = document.querySelector(
        'input[name="amount2"]'
      ) as HTMLInputElement;

      await userEvent.clear(amount1Input);
      await userEvent.type(amount1Input, '0.15');
      await userEvent.clear(amount2Input);
      await userEvent.type(amount2Input, '0.32');
    });

    // Step 3: Submit verification
    await step('Submit verification', async () => {
      await delay(INTERACTION_DELAY);
      // Button is in dialog portal
      await waitFor(() => {
        const submitButton = Array.from(
          document.querySelectorAll('button')
        ).find((btn) => btn.textContent?.match(/submit/i));
        if (submitButton) {
          userEvent.click(submitButton);
        }
      });
    });

    // Step 4: Wait for error message
    await step('Wait for verification error', async () => {
      await waitFor(() => {
        const errorText = Array.from(document.querySelectorAll('*')).find(
          (el) => el.textContent?.match(/incorrect/i)
        );
        if (!errorText) {
          throw new Error('Error message not found');
        }
      });
    });
  },
};

/**
 * Demonstrates the max attempts exceeded error scenario.
 * Shows what happens when a user exhausts their microdeposit verification attempts.
 *
 * MSW Handlers: Uses createRecipientHandlers with initial verification attempts
 * Workflow: Click Verify → Enter incorrect amounts (3rd attempt) → See max attempts dialog
 */
export const MaxAttemptsExceeded: Story = {
  args: {
    ...commonArgs,
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers(
        {
          recipients: linkedAccountReadyForValidationMock.recipients,
        },
        {
          // Simulate that this recipient already has 2 failed attempts on the server
          initialVerificationAttempts: {
            'c0712fc9-b7d5-4ee2-81bb-21ba80d56b4b': 2,
          },
        }
      ),
    },
  },
  play: async ({ canvasElement, step }) => {
    // Reset MSW handlers and seed with 2 previous failed attempts
    await resetMSWHandlers(
      {
        recipients: linkedAccountReadyForValidationMock.recipients,
      },
      {
        initialVerificationAttempts: {
          'c0712fc9-b7d5-4ee2-81bb-21ba80d56b4b': 2,
        },
      }
    );

    const canvas = within(canvasElement);

    // Step 1: Click "Verify" button
    await step('Click Verify button', async () => {
      await delay(INTERACTION_DELAY);
      const verifyButton = await canvas.findByRole('button', {
        name: /verify/i,
      });
      await userEvent.click(verifyButton);
    });

    // Step 2: Enter incorrect amounts
    await step('Enter incorrect microdeposit amounts', async () => {
      await delay(INTERACTION_DELAY);
      // Dialog content is rendered in a portal, so search in document
      await waitFor(() => {
        const amount1Input = document.querySelector('input[name="amount1"]');
        if (!amount1Input) throw new Error('Amount 1 input not found');
        return amount1Input;
      });

      const amount1Input = document.querySelector(
        'input[name="amount1"]'
      ) as HTMLInputElement;
      const amount2Input = document.querySelector(
        'input[name="amount2"]'
      ) as HTMLInputElement;

      await userEvent.clear(amount1Input);
      await userEvent.type(amount1Input, '0.99');
      await userEvent.clear(amount2Input);
      await userEvent.type(amount2Input, '0.99');
    });

    // Step 3: Submit (this will be the 3rd attempt)
    await step('Submit verification (max attempts)', async () => {
      await delay(INTERACTION_DELAY);
      // Button is in dialog portal
      await waitFor(() => {
        const submitButton = Array.from(
          document.querySelectorAll('button')
        ).find((btn) => btn.textContent?.match(/submit/i));
        if (submitButton) {
          userEvent.click(submitButton);
        }
      });
    });

    // Step 4: Verify max attempts dialog appears
    await step('Verify max attempts exceeded dialog appears', async () => {
      // Dialog is rendered in portal
      await waitFor(() => {
        const dialogText = Array.from(document.querySelectorAll('*')).find(
          (el) =>
            el.textContent?.match(/maximum verification attempts exceeded/i)
        );
        if (!dialogText) {
          throw new Error('Max attempts dialog not found');
        }
      });
    });
  },
};
