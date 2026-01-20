/**
 * LinkedAccountWidget - Interactive Workflows
 *
 * Automated demonstrations of complete user flows using Storybook play functions.
 * These stories automatically interact with the component to show key workflows.
 * Each story sets up its own MSW handlers with specific test data.
 */

import { linkedAccountReadyForValidationMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, waitFor, within } from 'storybook/test';

import { LinkedAccountWidget } from '../LinkedAccountWidget';
import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  createRtpUnavailableHandlers,
  seedRecipientData,
} from './story-utils';

// Helper to add delays between interactions for better visualization
const delay = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
const INTERACTION_DELAY = 1000; // Delay between steps in milliseconds

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
 * Helper function to fill out the link account form
 * This is shared across multiple stories to avoid duplication
 */
const fillLinkAccountForm = async (
  canvas: ReturnType<typeof within>,
  step: any
) => {
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
  });

  // Step 3: Verify payment method (ACH is pre-selected by default)
  await step('Verify ACH payment method is selected', async () => {
    await delay(INTERACTION_DELAY);
    await waitFor(() => {
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
    const continueButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.match(/continue to account details/i)
    );
    if (continueButton) {
      await userEvent.click(continueButton);
    }
  });

  // Step 5: Select account holder from dropdown
  await step('Select account holder from dropdown', async () => {
    await delay(INTERACTION_DELAY);

    // Wait for the dropdown to appear
    await waitFor(() => {
      const dropdown = document.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      if (!dropdown) throw new Error('Account holder dropdown not found');
      return dropdown;
    });

    // Click the dropdown to open it
    const dropdown = document.querySelector(
      'button[role="combobox"]'
    ) as HTMLButtonElement;
    await userEvent.click(dropdown);

    await delay(INTERACTION_DELAY); // Brief delay for dropdown to open

    // Select the first option from the list
    await waitFor(() => {
      const firstOption = document.querySelector('[role="option"]');
      if (!firstOption) throw new Error('No options found in dropdown');
      return firstOption;
    });

    const firstOption = document.querySelector(
      '[role="option"]'
    ) as HTMLElement;
    await userEvent.click(firstOption);
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

    await waitFor(() => {
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
        (input as HTMLInputElement).placeholder?.includes('9-digit routing') ||
        (input as HTMLInputElement).maxLength === 9
    ) as HTMLInputElement;

    routingInput.focus();
    await delay(100);

    await userEvent.clear(routingInput);
    await userEvent.type(routingInput, '021000021', { delay: 50 });
  });

  // Step 8: Check certification checkbox
  await step('Accept certification', async () => {
    await delay(INTERACTION_DELAY);

    await waitFor(() => {
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

      if (!certifyCheckbox) throw new Error('Certification checkbox not found');
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
};

/**
 * Complete flow of linking a new bank account via microdeposits.
 * Demonstrates the entire workflow from clicking "Link Account" to successful creation.
 * Response status: MICRODEPOSITS_INITIATED (default)
 *
 * Data: Starts with empty recipient list
 * Expected Result: Shows "Verification Process Started" title
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
    await fillLinkAccountForm(canvas, step);

    // Verify the success state shows "Verification Process Started"
    await step(
      'Verify success dialog shows "Verification Process Started"',
      async () => {
        await waitFor(
          () => {
            const titleText = Array.from(document.querySelectorAll('*')).find(
              (el) => el.textContent?.match(/verification process started/i)
            );
            if (!titleText) throw new Error('Success title not found');
          },
          { timeout: 3000 }
        );
      }
    );
  },
};

/**
 * Link account workflow with ACTIVE status response.
 * This is a rare case where the account is immediately verified without microdeposits.
 *
 * Expected Result: Shows "Account Successfully Linked" title
 */
export const LinkNewAccountActive: Story = {
  parameters: {
    msw: {
      handlers: createRecipientHandlers({ overrideCreateStatus: 'ACTIVE' }),
    },
  },
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [],
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await fillLinkAccountForm(canvas, step);

    // Verify the success state shows "Account Successfully Linked"
    await step(
      'Verify success dialog shows "Account Successfully Linked"',
      async () => {
        await waitFor(
          () => {
            const titleText = Array.from(document.querySelectorAll('*')).find(
              (el) => el.textContent?.match(/account successfully linked/i)
            );
            if (!titleText) throw new Error('Success title not found');
          },
          { timeout: 3000 }
        );
      }
    );
  },
};

/**
 * Link account workflow with PENDING status response.
 * Account information is being processed by the system.
 *
 * Expected Result: Shows "Account Linking In Progress" title
 */
export const LinkNewAccountPending: Story = {
  parameters: {
    msw: {
      handlers: createRecipientHandlers({ overrideCreateStatus: 'PENDING' }),
    },
  },
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [],
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await fillLinkAccountForm(canvas, step);

    // Verify the success state shows "Account Linking In Progress"
    await step(
      'Verify success dialog shows "Account Linking In Progress"',
      async () => {
        await waitFor(
          () => {
            const titleText = Array.from(document.querySelectorAll('*')).find(
              (el) => el.textContent?.match(/account linking in progress/i)
            );
            if (!titleText) throw new Error('Success title not found');
          },
          { timeout: 3000 }
        );
      }
    );
  },
};

/**
 * Link account workflow with REJECTED status response.
 * Account verification was rejected by the system.
 *
 * Expected Result: Shows "Account Linking Failed" title
 */
export const LinkNewAccountRejected: Story = {
  parameters: {
    msw: {
      handlers: createRecipientHandlers({ overrideCreateStatus: 'REJECTED' }),
    },
  },
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [],
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await fillLinkAccountForm(canvas, step);

    // Verify the success state shows "Account Linking Failed"
    await step(
      'Verify success dialog shows "Account Linking Failed"',
      async () => {
        await waitFor(
          () => {
            const titleText = Array.from(document.querySelectorAll('*')).find(
              (el) => el.textContent?.match(/account linking failed/i)
            );
            if (!titleText) throw new Error('Success title not found');
          },
          { timeout: 3000 }
        );
      }
    );
  },
};

/**
 * Link account workflow with INACTIVE status response.
 * This is a very rare edge case where the account link is deactivated.
 *
 * Expected Result: Shows "Account Link Deactivated" title
 */
export const LinkNewAccountInactive: Story = {
  parameters: {
    msw: {
      handlers: createRecipientHandlers({ overrideCreateStatus: 'INACTIVE' }),
    },
  },
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [],
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await fillLinkAccountForm(canvas, step);

    // Verify the success state shows "Account Link Deactivated"
    await step(
      'Verify success dialog shows "Account Link Deactivated"',
      async () => {
        await waitFor(
          () => {
            const titleText = Array.from(document.querySelectorAll('*')).find(
              (el) => el.textContent?.match(/account link deactivated/i)
            );
            if (!titleText) throw new Error('Success title not found');
          },
          { timeout: 3000 }
        );
      }
    );
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

// =============================================================================
// RTP UNAVAILABILITY SCENARIOS
// =============================================================================

/**
 * Helper function to fill out the link account form with RTP payment method selected.
 * This is used to demonstrate the RTP unavailability error scenario.
 */
const fillLinkAccountFormWithRtp = async (
  canvas: ReturnType<typeof within>,
  step: any
) => {
  // Step 1: Click "Link Account" button
  await step('Click Link Account button', async () => {
    // Wait for the component to fully load before looking for the button
    await waitFor(
      async () => {
        const linkButton = await canvas.findByRole('button', {
          name: /link a new account/i,
        });
        if (!linkButton) throw new Error('Link Account button not found');
        return linkButton;
      },
      { timeout: 10000 }
    );

    const linkButton = await canvas.findByRole('button', {
      name: /link a new account/i,
    });
    await delay(INTERACTION_DELAY);
    await userEvent.click(linkButton);
  });

  // Step 2: Verify Individual account type is pre-selected by default
  await step('Verify Individual account type is pre-selected', async () => {
    await delay(INTERACTION_DELAY);
  });

  // Step 3: Select RTP payment method (in addition to the locked ACH)
  await step('Select RTP payment method', async () => {
    await delay(INTERACTION_DELAY);
    await waitFor(() => {
      // Find the RTP checkbox by looking for the label text
      const rtpLabel = Array.from(document.querySelectorAll('label')).find(
        (label) => label.textContent?.includes('Real-Time Payments')
      );
      if (!rtpLabel) throw new Error('RTP payment method label not found');
      return rtpLabel;
    });

    // Click the RTP checkbox label to select it
    const rtpLabel = Array.from(document.querySelectorAll('label')).find(
      (label) => label.textContent?.includes('Real-Time Payments')
    );
    if (rtpLabel) {
      await userEvent.click(rtpLabel);
    }
  });

  // Step 4: Continue to account details (Step 2)
  await step('Continue to account details', async () => {
    await delay(INTERACTION_DELAY);
    const continueButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.match(/continue to account details/i)
    );
    if (continueButton) {
      await userEvent.click(continueButton);
    }
  });

  // Step 5: Select account holder from dropdown
  await step('Select account holder from dropdown', async () => {
    await delay(INTERACTION_DELAY);

    // Wait for the dropdown to appear
    await waitFor(() => {
      const dropdown = document.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      if (!dropdown) throw new Error('Account holder dropdown not found');
      return dropdown;
    });

    // Click the dropdown to open it
    const dropdown = document.querySelector(
      'button[role="combobox"]'
    ) as HTMLButtonElement;
    await userEvent.click(dropdown);

    await delay(INTERACTION_DELAY);

    // Select the first option from the list
    await waitFor(() => {
      const firstOption = document.querySelector('[role="option"]');
      if (!firstOption) throw new Error('No options found in dropdown');
      return firstOption;
    });

    const firstOption = document.querySelector(
      '[role="option"]'
    ) as HTMLElement;
    await userEvent.click(firstOption);
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

  // Step 7: Handle routing number field (when multiple payment methods, need to check "use same" checkbox first)
  await step('Enter routing number (bank without RTP support)', async () => {
    await delay(INTERACTION_DELAY);

    // Wait for the routing number section to be fully rendered and stable
    await waitFor(
      () => {
        // Look for either the "use same" checkbox or a routing number input
        const useSameCheckbox = document.querySelector('#useSameRoutingNumber');
        const routingInput = document.querySelector(
          'input[name="routingNumbers.0.routingNumber"]'
        );
        if (!useSameCheckbox && !routingInput) {
          throw new Error('Routing number section not found');
        }
        return true;
      },
      { timeout: 5000 }
    );

    // Additional delay to ensure checkbox state is fully initialized
    await delay(500);

    // Check if there's a "Use same routing number" checkbox (appears when multiple payment methods)
    const useSameCheckbox = document.querySelector(
      '#useSameRoutingNumber'
    ) as HTMLButtonElement;

    if (useSameCheckbox) {
      // Wait for the checkbox to have a definitive state before checking
      await waitFor(
        () => {
          const state = useSameCheckbox.getAttribute('data-state');
          if (!state) throw new Error('Checkbox state not initialized');
          return state;
        },
        { timeout: 2000 }
      );

      // Check if it's NOT already checked, then click it
      const isChecked =
        useSameCheckbox.getAttribute('data-state') === 'checked' ||
        useSameCheckbox.getAttribute('aria-checked') === 'true';
      if (!isChecked) {
        await userEvent.click(useSameCheckbox);
        await delay(500); // Wait for form to update after checkbox change
      }
    }

    // Now find and fill the routing number input
    await waitFor(
      () => {
        const routingInput = document.querySelector(
          'input[name="routingNumbers.0.routingNumber"]'
        ) as HTMLInputElement;

        if (!routingInput) throw new Error('Routing number input not found');
        return routingInput;
      },
      { timeout: 3000 }
    );

    const routingInput = document.querySelector(
      'input[name="routingNumbers.0.routingNumber"]'
    ) as HTMLInputElement;

    routingInput.focus();
    await delay(100);

    // Use a routing number that will trigger the RTP unavailable error
    await userEvent.clear(routingInput);
    await userEvent.type(routingInput, '021000021', { delay: 50 });
  });

  // Step 8: Enter email (required for RTP)
  await step('Enter email address (required for RTP)', async () => {
    await delay(INTERACTION_DELAY);

    await waitFor(() => {
      const emailInput = document.querySelector(
        'input[type="email"]'
      ) as HTMLInputElement;
      if (!emailInput) throw new Error('Email input not found');
      return emailInput;
    });

    const emailInput = document.querySelector(
      'input[type="email"]'
    ) as HTMLInputElement;

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'test@example.com', { delay: 30 });
  });

  // Step 9: Check certification checkbox (required for linked accounts)
  await step('Accept certification', async () => {
    await delay(INTERACTION_DELAY);

    await waitFor(() => {
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

      if (!certifyCheckbox) throw new Error('Certification checkbox not found');
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

  // Step 10: Submit the form
  await step('Submit the form', async () => {
    await delay(INTERACTION_DELAY);
    // Find the submit button - could be "Confirm and Link Account" or similar
    const submitButton = Array.from(document.querySelectorAll('button')).find(
      (btn) =>
        btn.textContent?.match(/confirm and link account/i) ||
        btn.textContent?.match(/link account/i)
    );
    if (submitButton) {
      await userEvent.click(submitButton);
    }
  });
};

/**
 * Demonstrates error handling when RTP (Real-Time Payments) is not available
 * at the selected bank.
 *
 * **This story:**
 * 1. Opens the link account form
 * 2. Selects RTP as a payment method (in addition to ACH)
 * 3. Fills in bank details with a routing number that doesn't support RTP
 * 4. Submits and shows the error message
 *
 * This demonstrates how to gracefully handle cases where a bank doesn't support
 * certain payment methods. The user should be informed and can proceed without RTP.
 */
export const RtpUnavailableAtBank: Story = {
  parameters: {
    msw: {
      handlers: createRtpUnavailableHandlers({
        recipientType: 'LINKED_ACCOUNT',
      }),
    },
    docs: {
      description: {
        story: `
Shows how the component handles the case where RTP (Real-Time Payments) is not 
available at the user's bank. When a user selects RTP as a payment method but 
the bank associated with the routing number doesn't support RTP transactions, 
the API returns an error. This story demonstrates the error display and how 
users can understand what went wrong.

**Use Case:** User wants to link an account with RTP for instant payments, 
but their bank doesn't support RTP.

**Expected Behavior:** Form displays an error message explaining that RTP is 
not available at the selected financial institution.
        `,
      },
    },
  },
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [],
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await fillLinkAccountFormWithRtp(canvas, step);

    // Verify the error message appears
    await step('Verify RTP unavailable error message appears', async () => {
      await waitFor(
        () => {
          const errorAlert = Array.from(document.querySelectorAll('*')).find(
            (el) =>
              el.textContent?.match(/RTP.*not available/i) ||
              el.textContent?.match(/Payment Method Not Supported/i) ||
              el.textContent?.match(/does not support RTP/i)
          );
          if (!errorAlert) throw new Error('RTP unavailable error not found');
        },
        { timeout: 5000 }
      );
    });
  },
};
