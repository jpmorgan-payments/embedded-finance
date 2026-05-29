import {
  mockTransactionComplete,
  mockTransactionFee,
  mockTransactionFeeReversal,
  mockTransactionMinimal,
  mockTransactionWithError,
} from '@/mocks/transactions.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { Button } from '@/components/ui/button';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { TransactionDetailsDialogTrigger } from './TransactionDetailsSheet';

/**
 * Story args interface extending base provider args
 */
interface TransactionDetailsStoryArgs extends BaseStoryArgs {
  transactionId: string;
}

/**
 * Wrapper component for stories - NO EBComponentsProvider here!
 * The global decorator in preview.tsx handles the provider wrapping.
 */
const TransactionDetailsStory = ({
  transactionId,
}: {
  transactionId: string;
}) => {
  return (
    <TransactionDetailsDialogTrigger transactionId={transactionId}>
      <Button>View Transaction Details</Button>
    </TransactionDetailsDialogTrigger>
  );
};

const meta: Meta<TransactionDetailsStoryArgs> = {
  title: 'Core/TransactionsDisplay/TransactionDetailsSheet',
  component: TransactionDetailsStory,
  tags: ['@core', '@transactions'],
  argTypes: {
    transactionId: {
      control: 'text',
      description: 'The transaction ID to fetch and display',
    },
  },
  render: (args) => (
    <TransactionDetailsStory transactionId={args.transactionId} />
  ),
};

export default meta;

type Story = StoryObj<TransactionDetailsStoryArgs>;

export const CompleteTransaction: Story = {
  args: {
    transactionId: 'txn-complete-001',
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(mockTransactionComplete);
        }),
      ],
    },
  },
};

export const MinimalTransaction: Story = {
  args: {
    transactionId: 'txn-minimal-001',
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(mockTransactionMinimal);
        }),
      ],
    },
  },
};

export const TransactionWithError: Story = {
  args: {
    transactionId: 'txn-error-001',
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(mockTransactionWithError);
        }),
      ],
    },
  },
};

export const FeeTransaction: Story = {
  args: {
    transactionId: 'txn-fee-001',
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(mockTransactionFee);
        }),
      ],
    },
  },
};

export const FeeReversalTransaction: Story = {
  args: {
    transactionId: 'txn-fee-reversal-001',
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(mockTransactionFeeReversal);
        }),
      ],
    },
  },
};

export const LoadingState: Story = {
  args: {
    transactionId: 'txn-loading-001',
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return new Promise(() => {
            // Never resolves, keeping loading state
          });
        }),
      ],
    },
  },
};

// Error stories are organized in stories/TransactionDetailsSheet.errors.story.tsx
