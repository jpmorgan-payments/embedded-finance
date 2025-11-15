/**
 * LinkedAccountWidget - Interactive Workflows
 *
 * Automated demonstrations of complete user flows using Storybook play functions.
 * These stories automatically interact with the component to show key workflows.
 */

import {
  linkedAccountListMock,
  linkedAccountReadyForValidationMock,
} from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from '@storybook/testing-library';

import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  LinkedAccountWidgetStory,
} from './story-utils';

const meta = {
  title: 'Core/LinkedAccountWidget/Workflows',
  component: LinkedAccountWidgetStory,
  tags: ['@core', '@linked-accounts'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createRecipientHandlers(linkedAccountListMock),
    },
  },
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof LinkedAccountWidgetStory>;

export default meta;
type Story = StoryObj<typeof LinkedAccountWidgetStory>;

/**
 * Complete workflow: Link account → Wait for deposits → Verify → Ready
 * Watch as the "Link New Account" button is automatically clicked.
 */
export const LinkNewAccount: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers({
        ...linkedAccountListMock,
        recipients: [],
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click "Link New Account" button
    const linkButton = await canvas.findByRole('button', {
      name: /link.*account/i,
    });
    await userEvent.click(linkButton);
  },
};

/**
 * Verification flow demonstrating microdeposit entry.
 * Watch as the verify button is clicked and amounts are entered.
 */
export const VerifyMicrodeposits: Story = {
  args: {
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers(linkedAccountReadyForValidationMock),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click verify button
    const verifyButton = await canvas.findByRole('button', { name: /verify/i });
    await userEvent.click(verifyButton);

    // Fill in microdeposit amounts
    const amount1Input = await canvas.findByLabelText(/first.*amount/i);
    const amount2Input = await canvas.findByLabelText(/second.*amount/i);

    await userEvent.type(amount1Input, '0.23');
    await userEvent.type(amount2Input, '0.47');

    // Submit verification
    const submitButton = canvas.getByRole('button', { name: /submit|verify/i });
    await userEvent.click(submitButton);
  },
};
