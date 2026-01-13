/**
 * Accounts - Main Stories
 *
 * Basic configurations and layout options for the Accounts component.
 * This component displays account information including balances and routing details.
 *
 * Features:
 * - Multiple account categories support
 * - Balance display with currency formatting
 * - Account routing information (ACH, Wire/RTP)
 * - Status indicators (OPEN, PENDING_CLOSE, CLOSED)
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../.storybook/preview';
import { Accounts } from './Accounts';
import type { AccountsProps } from './Accounts.types';
import {
  commonArgs,
  commonArgTypes,
  createAccountsHandlers,
  createErrorHandlers,
  createLoadingHandlers,
  mockAccounts,
} from './stories/story-utils';

/**
 * Story args interface extending base provider args
 */
interface AccountsStoryArgs extends BaseStoryArgs, AccountsProps {}

const meta: Meta<AccountsStoryArgs> = {
  title: 'Core/Accounts',
  component: Accounts,
  tags: ['@core', '@accounts'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createAccountsHandlers(),
    },
  },
  args: {
    ...commonArgs,
  },
  argTypes: {
    ...commonArgTypes,
  },
};

export default meta;
type Story = StoryObj<AccountsStoryArgs>;

/**
 * Default view showing multiple accounts with different categories.
 * This is the standard configuration for most applications.
 *
 * **Try it:**
 * - View account balances and details
 * - Toggle account number visibility (eye icon)
 * - Copy routing numbers to clipboard
 */
export const Default: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
  },
};

/**
 * Single category filter showing only Limited DDA accounts.
 *
 * **Use this when:**
 * - You only want to show specific account types
 * - Users should see a focused view
 */
export const SingleCategory: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA'],
  },
  parameters: {
    msw: {
      handlers: createAccountsHandlers({
        accounts: mockAccounts.filter((a) => a.category === 'LIMITED_DDA'),
      }),
    },
  },
};

/**
 * First-time user experience with no accounts.
 * Shows helpful messaging when no accounts match the filter.
 *
 * **Use this to test:**
 * - Empty state messaging
 * - First-time user experience
 */
export const EmptyState: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
  },
  parameters: {
    msw: {
      handlers: createAccountsHandlers({ accounts: [] }),
    },
  },
};

/**
 * Loading state while fetching account data.
 * Shows skeleton placeholders for better UX.
 */
export const Loading: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
  },
  parameters: {
    msw: {
      handlers: createLoadingHandlers(),
    },
  },
};

/**
 * Error state when account data fails to load.
 * Shows error message with retry option.
 */
export const Error: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
  },
  parameters: {
    msw: {
      handlers: createErrorHandlers(500, 'Internal Server Error'),
    },
  },
};

/**
 * Accounts with custom title.
 * Override the default "Accounts" title.
 */
export const CustomTitle: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    title: 'My Business Accounts',
  },
};

/**
 * Single account display.
 * Shows only one account when filter returns single result.
 *
 * **Note:** Layout automatically adjusts for single vs multiple accounts.
 */
export const SingleAccount: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA_PAYMENTS'],
  },
  parameters: {
    msw: {
      handlers: createAccountsHandlers({
        accounts: [mockAccounts[1]],
      }),
    },
  },
};

/**
 * Payments DDA account type.
 * Shows LIMITED_DDA_PAYMENTS accounts with full routing details.
 *
 * **Features:**
 * - Available and current balance display
 * - Account number with show/hide toggle
 * - ACH and Wire/RTP routing numbers
 */
export const PaymentsDDA: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA_PAYMENTS'],
  },
  parameters: {
    msw: {
      handlers: createAccountsHandlers({
        accounts: mockAccounts.filter(
          (a) => a.category === 'LIMITED_DDA_PAYMENTS'
        ),
      }),
    },
  },
};

/**
 * Limited DDA account type.
 * Shows LIMITED_DDA accounts with simplified balance view.
 *
 * **Note:** LIMITED_DDA accounts show only balance, no routing details.
 */
export const LimitedDDA: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA'],
  },
  parameters: {
    msw: {
      handlers: createAccountsHandlers({
        accounts: mockAccounts.filter((a) => a.category === 'LIMITED_DDA'),
      }),
    },
  },
};

/**
 * Slow network simulation.
 * Shows loading behavior with realistic network delay.
 */
export const SlowNetwork: Story = {
  args: {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
  },
  parameters: {
    msw: {
      handlers: createAccountsHandlers({ delayMs: 3000 }),
    },
  },
};
