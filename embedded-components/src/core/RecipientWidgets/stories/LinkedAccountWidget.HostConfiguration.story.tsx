/**
 * Linked account widget — host-driven flags (unlink, etc.)
 */
import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LinkedAccountWidget } from '../LinkedAccountWidget/LinkedAccountWidget';
import {
  commonArgs,
  commonArgTypes,
  createRecipientHandlers,
  seedRecipientData,
} from './story-utils';

const meta = {
  title: 'Core/LinkedAccountWidget/Host configuration',
  component: LinkedAccountWidget,
  tags: ['@core', '@linked-accounts'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createRecipientHandlers(),
    },
  },
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof LinkedAccountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * **`hideRemoveRecipient`** — Remove is hidden in the card overflow menu and in **Table** row menus.
 * Onboarding Overview uses a separate flag: **`hideLinkedAccountRemoval`**.
 */
export const HideRemoveRecipient: Story = {
  name: 'hideRemoveRecipient — no unlink in UI',
  args: {
    mode: 'list',
    hideRemoveRecipient: true,
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};
