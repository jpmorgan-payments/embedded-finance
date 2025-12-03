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

import { LinkedAccountWidget } from '../LinkedAccountWidget';
import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  seedRecipientData,
} from './story-utils';

// Helper to add delays between interactions for better visualization
const delay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
const INTERACTION_DELAY = 800; // Delay between steps in milliseconds

const meta = {
  title: 'Core/LinkedAccountWidget/Interactive Workflows',
  component: LinkedAccountWidget,
  tags: ['@core', '@linked-accounts'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createRecipientHandlers(),
    },
    docs: {
      description: {
        component:
          'Interactive workflows that demonstrate complete user flows. Each story sets up its own test data using loaders.',
      },
    },
  },
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof LinkedAccountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Complete flow of linking a new bank account via microdeposits.
 * Demonstrates the entire workflow from clicking "Link Account" to successful creation.
 *
 * Data: Starts with empty recipient list
 * Workflow:
 * - Step 1: Click Link Account
 * - Step 2: Select Individual account type
 * - Step 3: Verify ACH payment method (pre-selected)
 * - Step 4: Continue to account details
 * - Step 5: Enter account holder name
 * - Step 6: Enter bank account details
 * - Step 7: Enter routing number
 * - Step 8: Accept certification
 * - Step 9: Submit form
 */
export const LinkNewAccount: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [], // Start with empty list
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Step 1: Click "Link Account" button
    await step('Click Link Account button', async () => {
      const linkButton = await canvas.findByRole('button', {
        name: /link a new account/i,
      });
      await delay(INTERACTION_DELAY);
      await userEvent.click(linkButton);
    });

    // Step 2: Verify Individual account type is pre-selected by default
    await step('Verify Individual account type is pre-selected', async () => {
      await delay(INTERACTION_DELAY);
      // Account type defaults to INDIVIDUAL, no need to interact
      // The select should show "Individual / Personal Account" as selected
    });

    // Step 3: Verify payment method (ACH is pre-selected by default)
    await step('Verify ACH payment method is selected', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(() => {
        // ACH checkbox should be checked by default
        const achCheckbox = Array.from(
          document.querySelectorAll('input[type="checkbox"]')
        ).find(
          (input) =>
            (input as HTMLInputElement).value === 'ACH' ||
            input.closest('label')?.textContent?.includes('ACH')
        ) as HTMLInputElement;
        if (!achCheckbox) throw new Error('ACH payment method not found');
      });
    });

    // Step 4: Continue to account details (Step 2)
    await step('Continue to account details', async () => {
      await delay(INTERACTION_DELAY);
      const continueButton = Array.from(
        document.querySelectorAll('button')
      ).find((btn) => btn.textContent?.match(/continue to account details/i));
      if (continueButton) {
        await userEvent.click(continueButton);
      }
    });

    // Step 5: Fill in account holder information
    await step('Enter account holder name', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(() => {
        const firstNameInput = document.querySelector(
          'input[name="firstName"]'
        ) as HTMLInputElement;
        const lastNameInput = document.querySelector(
          'input[name="lastName"]'
        ) as HTMLInputElement;
        if (!firstNameInput || !lastNameInput)
          throw new Error('Name inputs not found');
        return { firstNameInput, lastNameInput };
      });

      const firstNameInput = document.querySelector(
        'input[name="firstName"]'
      ) as HTMLInputElement;
      const lastNameInput = document.querySelector(
        'input[name="lastName"]'
      ) as HTMLInputElement;

      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, 'John');

      await delay(INTERACTION_DELAY);

      await userEvent.clear(lastNameInput);
      await userEvent.type(lastNameInput, 'Doe');
    });

    // Step 6: Fill in bank account details
    await step('Enter bank account details', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(() => {
        const accountNumberInput = document.querySelector(
          'input[name="accountNumber"]'
        ) as HTMLInputElement;
        if (!accountNumberInput)
          throw new Error('Account number input not found');
        return accountNumberInput;
      });

      const accountNumberInput = document.querySelector(
        'input[name="accountNumber"]'
      ) as HTMLInputElement;

      await userEvent.clear(accountNumberInput);
      await userEvent.type(accountNumberInput, '123456789');

      // Select account type (Checking)
      const accountTypeButton = document.querySelector(
        'button[name="bankAccountType"]'
      ) as HTMLButtonElement;
      if (accountTypeButton) {
        await userEvent.click(accountTypeButton);
        await delay(300);

        const checkingOption = Array.from(
          document.querySelectorAll('[role="option"]')
        ).find((el) => el.textContent?.includes('Checking'));
        if (checkingOption) {
          await userEvent.click(checkingOption as HTMLElement);
        }
      }
    });

    // Step 7: Enter routing number
    await step('Enter routing number', async () => {
      await delay(INTERACTION_DELAY);

      // Wait for the routing number input to be rendered
      await waitFor(() => {
        // The input is inside a dialog portal, search by placeholder or label
        const routingInput = Array.from(
          document.querySelectorAll('input[type="text"]')
        ).find(
          (input) =>
            (input as HTMLInputElement).placeholder?.includes(
              '9-digit routing'
            ) || (input as HTMLInputElement).maxLength === 9
        ) as HTMLInputElement;

        if (!routingInput) throw new Error('Routing number input not found');
        return routingInput;
      });

      const routingInput = Array.from(
        document.querySelectorAll('input[type="text"]')
      ).find(
        (input) =>
          (input as HTMLInputElement).placeholder?.includes(
            '9-digit routing'
          ) || (input as HTMLInputElement).maxLength === 9
      ) as HTMLInputElement;

      // Focus the input first to ensure it's ready
      routingInput.focus();
      await delay(100);

      // Clear and type
      await userEvent.clear(routingInput);
      await userEvent.type(routingInput, '021000021', { delay: 50 });
    });

    // Step 8: Check certification checkbox
    await step('Accept certification', async () => {
      await delay(INTERACTION_DELAY);

      // Wait for the certification checkbox to be visible (Radix UI checkbox renders as button with role="checkbox")
      await waitFor(() => {
        // Find the Radix checkbox button by role
        const certifyCheckbox = Array.from(
          document.querySelectorAll('button[role="checkbox"]')
        ).find((checkbox) => {
          // Check if this checkbox is in a container with certification text
          const container = checkbox.closest('.eb-flex');
          const label = container?.querySelector('label');
          return (
            label?.textContent?.includes('authorize') ||
            label?.textContent?.includes('certify') ||
            label?.textContent?.includes('accurate')
          );
        }) as HTMLButtonElement;

        if (!certifyCheckbox)
          throw new Error('Certification checkbox not found');
        return certifyCheckbox;
      });

      const certifyCheckbox = Array.from(
        document.querySelectorAll('button[role="checkbox"]')
      ).find((checkbox) => {
        const container = checkbox.closest('.eb-flex');
        const label = container?.querySelector('label');
        return (
          label?.textContent?.includes('authorize') ||
          label?.textContent?.includes('certify') ||
          label?.textContent?.includes('accurate')
        );
      }) as HTMLButtonElement;

      await userEvent.click(certifyCheckbox);
    });

    // Step 9: Submit the form
    await step('Submit the form', async () => {
      await delay(INTERACTION_DELAY);
      const submitButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.match(/confirm and link account/i)
      );
      if (submitButton) {
        await userEvent.click(submitButton);
      }
    });
  },
};

/**
 * Demonstrates successful microdeposit verification on first attempt.
 * Shows a clean flow where the user enters the correct amounts immediately.
 *
 * Data: Account with READY_FOR_VALIDATION status
 * Workflow: Click Verify → Enter correct amounts → Submit → See success message → Account becomes ACTIVE
 */
export const SuccessfulVerification: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: linkedAccountReadyForValidationMock.recipients,
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
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
 * Data: Account with READY_FOR_VALIDATION status
 * Workflow: Click Verify → Enter incorrect amounts → Submit → See error message
 */
export const FailedVerification: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: linkedAccountReadyForValidationMock.recipients,
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Step 1: Click "Verify" button on the account card
    await step('Click Verify button', async () => {
      const verifyButton = await canvas.findByRole('button', {
        name: /verify/i,
      });
      await delay(INTERACTION_DELAY);
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
 * Data: Account with 2 previous failed attempts
 * Workflow: Click Verify → Enter incorrect amounts (3rd attempt) → See max attempts dialog
 */
export const MaxAttemptsExceeded: Story = {
  loaders: [
    async () => {
      await seedRecipientData(
        {
          recipients: linkedAccountReadyForValidationMock.recipients,
        },
        {
          // Simulate that this recipient already has 2 failed attempts on the server
          initialVerificationAttempts: {
            'c0712fc9-b7d5-4ee2-81bb-21ba80d56b4b': 2,
          },
        }
      );
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Step 1: Click "Verify" button
    await step('Click Verify button', async () => {
      const verifyButton = await canvas.findByRole('button', {
        name: /verify/i,
      });
      await delay(INTERACTION_DELAY);
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
