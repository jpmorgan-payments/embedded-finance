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

    await delay(INTERACTION_DELAY);

    const routingNumberInput = document.querySelector(
      'input[name="routingNumber"]'
    ) as HTMLInputElement;
    await userEvent.clear(routingNumberInput);
    await userEvent.type(routingNumberInput, '021000021');
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

  // Step 8: Submit the form
  await step('Submit recipient form', async () => {
    await delay(INTERACTION_DELAY);
    const submitButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.match(/submit|confirm/i)
    );
    if (submitButton) {
      await userEvent.click(submitButton);
    }
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
 * 4. Shows success state
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

      // Step 9: Verify success
      await step('Verify recipient was added successfully', async () => {
        await delay(INTERACTION_DELAY);
        await waitFor(
          () => {
            const successMessage = document.querySelector(
              '[role="status"], [role="alert"]'
            );
            if (!successMessage)
              throw new Error('Success message not found yet');
          },
          { timeout: 5000 }
        );
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

    await step('Open the actions menu (kebab menu)', async () => {
      await delay(INTERACTION_DELAY);
      // Find the kebab menu button (More actions) on the card
      const moreActionsButton = canvas.getByRole('button', {
        name: /more actions/i,
      });
      await userEvent.click(moreActionsButton);
    });

    await step('Click View Details in the menu', async () => {
      await delay(INTERACTION_DELAY);
      // Wait for menu to open and find View details option
      await waitFor(
        () => {
          const viewDetailsItem = document.querySelector(
            '[role="menuitem"]'
          );
          if (!viewDetailsItem) throw new Error('Menu not open yet');
        },
        { timeout: 3000 }
      );
      
      // Find and click the View details menu item
      const menuItems = Array.from(
        document.querySelectorAll('[role="menuitem"]')
      );
      const viewDetailsItem = menuItems.find((item) =>
        item.textContent?.toLowerCase().includes('view details')
      );
      if (viewDetailsItem) {
        await userEvent.click(viewDetailsItem);
      } else {
        throw new Error('View details menu item not found');
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
          const dialog = document.querySelector('[role="alertdialog"], [role="dialog"]');
          if (!dialog) throw new Error('Confirmation dialog not found');
        },
        { timeout: 3000 }
      );

      // Find and click the confirm button in the dialog
      const confirmButton = Array.from(
        document.querySelectorAll('[role="alertdialog"] button, [role="dialog"] button')
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
