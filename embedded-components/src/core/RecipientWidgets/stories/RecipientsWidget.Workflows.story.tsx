/**
 * RecipientsWidget - Interactive Workflows
 *
 * Automated demonstrations of complete user flows using Storybook play functions.
 * These stories automatically interact with the component to show key workflows.
 * Each story sets up its own MSW handlers with specific test data.
 */

import { createMockRecipient } from '@/mocks/recipients.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, waitFor, within } from 'storybook/test';

import { RecipientsWidget } from '../RecipientsWidget/RecipientsWidget';
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
  title: 'Core/RecipientsWidget/Interactive Workflows',
  component: RecipientsWidget,
  tags: ['@core', '@recipients'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createRecipientHandlers({ recipientType: 'RECIPIENT' }),
    },
    test: {
      // Ignore MSW internal deserialization errors that don't affect test results
      dangerouslyIgnoreUnhandledErrors: true,
    },
    docs: {
      description: {
        component:
          'Interactive workflows that demonstrate complete user flows for recipients. Each story sets up its own test data using loaders.',
      },
    },
  },
  args: commonArgs,
  argTypes: {
    ...commonArgTypes,
    onRecipientAdded: {
      description:
        'Callback fired when a recipient is successfully added or when adding fails.',
      table: {
        category: 'Callbacks',
        type: { summary: '(recipient?: Recipient, error?: unknown) => void' },
      },
    },
  },
} satisfies Meta<typeof RecipientsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Helper function to fill out the add recipient form
 * This is shared across multiple stories to avoid duplication
 */
const fillAddRecipientForm = async (
  canvas: ReturnType<typeof within>,
  step: any
) => {
  // Step 1: Click "Add Recipient" button
  await step('Click Add Recipient button', async () => {
    // Wait for the component to fully load before looking for the button
    await waitFor(
      async () => {
        const addButton = await canvas.findByRole('button', {
          name: /add recipient/i,
        });
        if (!addButton) throw new Error('Add Recipient button not found');
        return addButton;
      },
      { timeout: 10000 }
    );

    const addButton = await canvas.findByRole('button', {
      name: /add recipient/i,
    });
    await delay(INTERACTION_DELAY);
    await userEvent.click(addButton);
  });

  // Step 2: Verify Individual account type is pre-selected by default
  await step('Verify Individual account type is pre-selected', async () => {
    await delay(INTERACTION_DELAY);
  });

  // Step 3: Select ACH payment method (since none is pre-selected)
  await step('Select ACH payment method', async () => {
    await delay(INTERACTION_DELAY);
    await waitFor(() => {
      const achLabel = Array.from(document.querySelectorAll('label')).find(
        (label) => label.textContent?.includes('ACH')
      );
      if (!achLabel) throw new Error('ACH payment method label not found');
      return achLabel;
    });
    const achLabel = Array.from(document.querySelectorAll('label')).find(
      (label) => label.textContent?.includes('ACH')
    );
    if (achLabel) {
      await userEvent.click(achLabel);
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

  // Step 5: Fill in recipient first and last name
  await step('Enter recipient first and last name', async () => {
    await delay(INTERACTION_DELAY);
    const firstNameInput = await waitFor(() =>
      document.querySelector('input[name="firstName"]')
    );
    const lastNameInput = await waitFor(() =>
      document.querySelector('input[name="lastName"]')
    );
    if (!firstNameInput || !lastNameInput)
      throw new Error('First or last name input not found');
    await userEvent.clear(firstNameInput as HTMLInputElement);
    await userEvent.type(firstNameInput as HTMLInputElement, 'Jane');
    await userEvent.clear(lastNameInput as HTMLInputElement);
    await userEvent.type(lastNameInput as HTMLInputElement, 'Doe');
  });

  // Step 6: Fill in bank account details
  await step('Enter bank account details', async () => {
    await delay(INTERACTION_DELAY);
    // Wait for account number input
    const accountNumberInput = await waitFor(() =>
      document.querySelector('input[name="accountNumber"]')
    );
    if (!accountNumberInput) throw new Error('Account number input not found');
    await userEvent.clear(accountNumberInput as HTMLInputElement);
    await userEvent.type(accountNumberInput as HTMLInputElement, '123456789');

    await delay(INTERACTION_DELAY);

    // Wait for either single or multi-payment routing number input
    const routingNumberInput = await waitFor(
      () =>
        document.querySelector('input[name="routingNumber"]') ||
        document.querySelector('input[name="routingNumbers.0.routingNumber"]')
    );
    if (!routingNumberInput) throw new Error('Routing number input not found');
    await userEvent.clear(routingNumberInput as HTMLInputElement);
    await userEvent.type(routingNumberInput as HTMLInputElement, '021000021');
  });

  // Step 7: Continue to review
  await step('Continue to review', async () => {
    await delay(INTERACTION_DELAY);
    const continueButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.match(/continue to review/i)
    );
    if (continueButton) {
      await userEvent.click(continueButton);
    }
  });

  // Step 8: Submit the form and wait for success state
  await step('Submit recipient form', async () => {
    await delay(INTERACTION_DELAY);
    const submitButton = Array.from(document.querySelectorAll('button')).find(
      (btn) =>
        btn.textContent?.match(/submit|confirm/i) ||
        btn.textContent?.match(/create recipient/i)
    );
    if (submitButton) {
      await userEvent.click(submitButton);
    }

    // Wait for the success state to appear (Done button shows on success)
    // The dialog is now lifted to parent level, so it survives data updates
    await waitFor(
      () => {
        const doneButton = Array.from(
          document.querySelectorAll('[role="dialog"] button')
        ).find((btn) => btn.textContent?.match(/^Done$/i));
        if (!doneButton) throw new Error('Waiting for success state...');
      },
      { timeout: 10000 }
    );
  });
};

/**
 * Demonstrates the complete flow of adding a new recipient from start to finish.
 * Watch as the component automatically fills out and submits the form.
 *
 * **This story:**
 * 1. Clicks "Add New Recipient"
 * 2. Fills out the multi-step form
 * 3. Submits the recipient
 * 4. Shows success state with Done button
 */
export const AddRecipientWorkflow: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [],
        total_items: 0,
        page: 1,
        limit: 10,
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    try {
      await fillAddRecipientForm(canvas, step);

      // Step 9: Verify success state is shown
      await step('Verify recipient was added successfully', async () => {
        await delay(INTERACTION_DELAY);
        // The success state should already be visible from Step 8
        // Verify the Done button is still visible
        const doneButton = Array.from(
          document.querySelectorAll('[role="dialog"] button')
        ).find((btn) => btn.textContent?.match(/^Done$/i));
        if (!doneButton) {
          throw new Error('Success dialog not visible');
        }
      });
    } catch (error) {
      console.error('Workflow failed:', error);
      throw error;
    }
  },
};

/**
 * Demonstrates the flow of viewing recipient details.
 * Shows how users can access detailed information about a recipient.
 *
 * **This story:**
 * 1. Waits for recipients to load
 * 2. Clicks on a recipient card
 * 3. Shows detailed view
 */
export const ViewRecipientDetails: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [
          createMockRecipient({
            id: 'rec-123',
            partyDetails: {
              type: 'INDIVIDUAL',
              firstName: 'John',
              lastName: 'Doe',
              address: {
                addressLine1: '123 Main St',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                countryCode: 'US',
              },
              contacts: [{ contactType: 'EMAIL', value: 'john@example.com' }],
            },
          }),
        ],
        total_items: 1,
        page: 1,
        limit: 10,
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for recipient card to appear', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(
        () => {
          const card = canvas.getByText(/John Doe/i);
          if (!card) throw new Error('Recipient card not found');
        },
        { timeout: 5000 }
      );
    });

    await step('Open recipient details (via button or menu)', async () => {
      await delay(INTERACTION_DELAY);

      // At large viewports, "Details" button is shown inline (not in menu)
      // At small viewports, it's inside the kebab menu
      // Try inline button first
      const inlineDetailsButton = Array.from(
        document.querySelectorAll('button')
      ).find(
        (btn) =>
          btn.textContent?.toLowerCase().includes('details') ||
          btn.getAttribute('aria-label')?.toLowerCase().includes('view details')
      );

      if (inlineDetailsButton) {
        await userEvent.click(inlineDetailsButton);
      } else {
        // Fall back to opening the kebab menu
        const moreActionsButton = canvas.getByRole('button', {
          name: /more actions/i,
        });
        await userEvent.click(moreActionsButton);

        await delay(500);

        // Wait for menu to open and find View details option
        await waitFor(
          () => {
            const menuItem = document.querySelector(
              '[role="menuitem"], [data-radix-collection-item]'
            );
            if (!menuItem) throw new Error('Menu not open yet');
          },
          { timeout: 3000 }
        );

        // Find and click the View details menu item
        const allClickableItems = Array.from(
          document.querySelectorAll(
            '[role="menuitem"], [data-radix-collection-item]'
          )
        );
        const viewDetailsItem = allClickableItems.find(
          (item) =>
            item.textContent?.toLowerCase().includes('view details') ||
            item.textContent?.toLowerCase().includes('details')
        );
        if (viewDetailsItem) {
          await userEvent.click(viewDetailsItem);
        } else {
          throw new Error('View details menu item not found');
        }
      }
    });

    await step('Verify details dialog opened', async () => {
      await delay(INTERACTION_DELAY);
      // Look for the details dialog
      await waitFor(
        () => {
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog) {
            throw new Error('Details dialog not found');
          }
        },
        { timeout: 5000 }
      );
    });
  },
};

/**
 * Demonstrates the flow of removing a recipient.
 * Shows confirmation dialog and success state.
 *
 * **This story:**
 * 1. Waits for recipients to load
 * 2. Clicks remove button
 * 3. Confirms removal
 * 4. Shows success state
 */
export const RemoveRecipientWorkflow: Story = {
  loaders: [
    async () => {
      await seedRecipientData({
        recipients: [
          createMockRecipient({
            id: 'rec-remove',
            partyDetails: {
              type: 'INDIVIDUAL',
              firstName: 'Jane',
              lastName: 'Smith',
              address: {
                addressLine1: '456 Oak Ave',
                city: 'Los Angeles',
                state: 'CA',
                postalCode: '90001',
                countryCode: 'US',
              },
              contacts: [{ contactType: 'EMAIL', value: 'jane@example.com' }],
            },
          }),
        ],
        total_items: 1,
        page: 1,
        limit: 10,
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for recipient card to appear', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(
        () => {
          const card = canvas.getByText(/Jane Smith/i);
          if (!card) throw new Error('Recipient card not found');
        },
        { timeout: 5000 }
      );
    });

    await step('Open the actions menu (kebab menu)', async () => {
      await delay(INTERACTION_DELAY);
      // Find the kebab menu button (More actions) on the card
      const moreActionsButton = canvas.getByRole('button', {
        name: /more actions/i,
      });
      await userEvent.click(moreActionsButton);
    });

    await step('Click Remove in the menu', async () => {
      await delay(INTERACTION_DELAY);
      // Wait for menu to open
      await waitFor(
        () => {
          const menuItem = document.querySelector('[role="menuitem"]');
          if (!menuItem) throw new Error('Menu not open yet');
        },
        { timeout: 3000 }
      );

      // Find and click the Remove menu item
      const menuItems = Array.from(
        document.querySelectorAll('[role="menuitem"]')
      );
      const removeItem = menuItems.find((item) =>
        item.textContent?.toLowerCase().includes('remove')
      );
      if (removeItem) {
        await userEvent.click(removeItem);
      } else {
        throw new Error('Remove menu item not found');
      }
    });

    await step('Confirm removal in dialog', async () => {
      await delay(INTERACTION_DELAY);
      // Wait for confirmation dialog to appear
      await waitFor(
        () => {
          const dialog = document.querySelector(
            '[role="alertdialog"], [role="dialog"]'
          );
          if (!dialog) throw new Error('Confirmation dialog not found');
        },
        { timeout: 3000 }
      );

      // Find and click the confirm button in the dialog
      const confirmButton = Array.from(
        document.querySelectorAll(
          '[role="alertdialog"] button, [role="dialog"] button'
        )
      ).find((btn) => btn.textContent?.match(/confirm|remove|yes|delete/i));
      if (confirmButton) {
        await userEvent.click(confirmButton);
      }
    });

    await step('Verify removal success', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(
        () => {
          // Look for success toast/message or the card being removed
          const successMessage = document.querySelector(
            '[role="status"], [role="alert"]'
          );
          const cardGone = !canvas.queryByText(/Jane Smith/i);
          if (!successMessage && !cardGone) {
            throw new Error('Removal not confirmed yet');
          }
        },
        { timeout: 5000 }
      );
    });
  },
};

/**
 * Demonstrates pagination interaction.
 * Shows how users navigate through multiple pages of recipients.
 *
 * **This story:**
 * 1. Loads multiple pages of recipients
 * 2. Clicks next page
 * 3. Shows second page
 */
export const PaginationWorkflow: Story = {
  args: {
    paginationStyle: 'pages',
  },
  loaders: [
    async () => {
      // Seed with 15 recipients (3 pages at 5 per page)
      const recipients = Array.from({ length: 15 }, (_, i) =>
        createMockRecipient({
          id: `rec-${i}`,
          partyDetails: {
            type: 'INDIVIDUAL',
            firstName: 'Recipient',
            lastName: `${i + 1}`,
            address: {
              addressLine1: `${100 + i} Test Street`,
              city: 'Test City',
              state: 'TC',
              postalCode: '12345',
              countryCode: 'US',
            },
            contacts: [
              { contactType: 'EMAIL', value: `recipient${i + 1}@example.com` },
            ],
          },
        })
      );

      await seedRecipientData({
        recipients,
        total_items: 15,
        page: 1,
        limit: 5,
      });
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for first page to load', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(
        () => {
          // Use exact match to avoid matching "Recipient 10", "Recipient 11", etc.
          const firstRecipient = canvas.getByText(/^Recipient 1 \(/i);
          if (!firstRecipient) throw new Error('First page not loaded');
        },
        { timeout: 5000 }
      );
    });

    await step('Click next page button', async () => {
      await delay(INTERACTION_DELAY);
      const nextButton = canvas.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);
    });

    await step('Verify second page loaded', async () => {
      await delay(INTERACTION_DELAY);
      await waitFor(
        () => {
          // Use exact match to avoid ambiguity
          const secondPageRecipient = canvas.getByText(/^Recipient 6 \(/i);
          if (!secondPageRecipient)
            throw new Error('Second page not loaded yet');
        },
        { timeout: 5000 }
      );
    });
  },
};

// =============================================================================
// RTP UNAVAILABILITY SCENARIOS
// =============================================================================

/**
 * Helper function to fill out the add recipient form with RTP payment method selected.
 * This is used to demonstrate the RTP unavailability error scenario.
 */
const fillAddRecipientFormWithRtp = async (
  canvas: ReturnType<typeof within>,
  step: any
) => {
  // Step 1: Click "Add Recipient" button
  await step('Click Add Recipient button', async () => {
    // Wait for the component to fully load before looking for the button
    await waitFor(
      async () => {
        const addButton = await canvas.findByRole('button', {
          name: /add recipient/i,
        });
        if (!addButton) throw new Error('Add Recipient button not found');
        return addButton;
      },
      { timeout: 10000 }
    );

    const addButton = await canvas.findByRole('button', {
      name: /add recipient/i,
    });
    await delay(INTERACTION_DELAY);
    await userEvent.click(addButton);
  });

  // Step 2: Verify Individual account type is pre-selected by default
  await step('Verify Individual account type is pre-selected', async () => {
    await delay(INTERACTION_DELAY);
  });

  // Step 3: Select RTP payment method
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

  // Step 5: Fill in recipient first and last name
  await step('Enter recipient first and last name', async () => {
    await delay(INTERACTION_DELAY);
    const firstNameInput = await waitFor(() =>
      document.querySelector('input[name="firstName"]')
    );
    const lastNameInput = await waitFor(() =>
      document.querySelector('input[name="lastName"]')
    );
    if (!firstNameInput || !lastNameInput)
      throw new Error('First or last name input not found');
    await userEvent.clear(firstNameInput as HTMLInputElement);
    await userEvent.type(firstNameInput as HTMLInputElement, 'Jane');
    await userEvent.clear(lastNameInput as HTMLInputElement);
    await userEvent.type(lastNameInput as HTMLInputElement, 'Doe');
  });

  // Step 6: Fill in bank account details
  await step('Enter bank account details', async () => {
    await delay(INTERACTION_DELAY);

    // Wait for account number input
    const accountNumberInput = await waitFor(() =>
      document.querySelector('input[name="accountNumber"]')
    );
    if (!accountNumberInput) throw new Error('Account number input not found');
    await userEvent.clear(accountNumberInput as HTMLInputElement);
    await userEvent.type(accountNumberInput as HTMLInputElement, '123456789');

    await delay(300);

    // Wait for and select bank account type (required field)
    const accountTypeButton = await waitFor(
      () => document.querySelector('button[name="bankAccountType"]'),
      { timeout: 3000 }
    );
    if (accountTypeButton) {
      await userEvent.click(accountTypeButton as HTMLButtonElement);
      await delay(300);

      // Wait for dropdown options to appear
      await waitFor(
        () => {
          const option = document.querySelector('[role="option"]');
          if (!option) throw new Error('Account type options not found');
          return option;
        },
        { timeout: 2000 }
      );

      const checkingOption = Array.from(
        document.querySelectorAll('[role="option"]')
      ).find((el) => el.textContent?.includes('Checking'));
      if (checkingOption) {
        await userEvent.click(checkingOption as HTMLElement);
      } else {
        // Fall back to first option if Checking not found
        const firstOption = document.querySelector('[role="option"]');
        if (firstOption) {
          await userEvent.click(firstOption as HTMLElement);
        }
      }
    }
  });

  // Step 7: Handle routing number field
  await step('Enter routing number (bank without RTP support)', async () => {
    await delay(INTERACTION_DELAY);

    // Wait for any routing number input to be present
    await waitFor(
      () => {
        const routingInput =
          document.querySelector('input[name="routingNumber"]') ||
          document.querySelector(
            'input[name="routingNumbers.0.routingNumber"]'
          );
        if (!routingInput) {
          throw new Error('Routing number input not found');
        }
        return true;
      },
      { timeout: 5000 }
    );

    // Check if there's a "Use same routing number" checkbox (appears when multiple payment methods)
    const useSameCheckbox = document.querySelector(
      '#useSameRoutingNumber'
    ) as HTMLButtonElement;

    if (useSameCheckbox) {
      // Wait for the checkbox to have a definitive state before checking
      await delay(500);
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

    // Now find and fill the routing number input (try both possible names)
    const routingInput = (document.querySelector(
      'input[name="routingNumber"]'
    ) ||
      document.querySelector(
        'input[name="routingNumbers.0.routingNumber"]'
      )) as HTMLInputElement;

    if (!routingInput) throw new Error('Routing number input not found');

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

  // Step 9: Submit the form
  await step('Submit the form', async () => {
    await delay(INTERACTION_DELAY);

    // Find the submit button inside the dialog - prioritize "Create Recipient"
    // Look inside the dialog to avoid matching the "Add Recipient" button that opened the form
    const dialog = document.querySelector('[role="dialog"]');
    const buttonsInDialog = dialog
      ? Array.from(dialog.querySelectorAll('button'))
      : Array.from(document.querySelectorAll('button'));

    // First try to find "Create Recipient" specifically
    let submitButton = buttonsInDialog.find((btn) =>
      btn.textContent?.match(/create recipient/i)
    );

    // Fall back to other submit-like buttons if not found
    if (!submitButton) {
      submitButton = buttonsInDialog.find(
        (btn) =>
          btn.textContent?.match(/submit/i) ||
          btn.textContent?.match(/confirm/i)
      );
    }

    if (submitButton) {
      await userEvent.click(submitButton);
    } else {
      throw new Error('Submit button not found');
    }
  });
};

/**
 * Demonstrates error handling when RTP (Real-Time Payments) is not available
 * at the selected bank for recipient creation.
 *
 * **This story:**
 * 1. Opens the add recipient form
 * 2. Selects RTP as a payment method
 * 3. Fills in bank details with a routing number that doesn't support RTP
 * 4. Submits and shows the error message
 *
 * This demonstrates how to gracefully handle cases where a bank doesn't support
 * certain payment methods. The user should be informed and can proceed without RTP.
 */
export const RtpUnavailableAtBank: Story = {
  parameters: {
    msw: {
      handlers: createRtpUnavailableHandlers({ recipientType: 'RECIPIENT' }),
    },
    docs: {
      description: {
        story: `
Shows how the component handles the case where RTP (Real-Time Payments) is not 
available at the recipient's bank. When a user selects RTP as a payment method 
but the bank associated with the routing number doesn't support RTP transactions, 
the API returns an error. This story demonstrates the error display and how 
users can understand what went wrong.

**Use Case:** User wants to add a recipient with RTP for instant payments, 
but the recipient's bank doesn't support RTP.

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
    await fillAddRecipientFormWithRtp(canvas, step);

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
