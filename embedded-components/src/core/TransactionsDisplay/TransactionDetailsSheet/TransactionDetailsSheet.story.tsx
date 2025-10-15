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
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { TransactionDetailsDialogTrigger } from './TransactionDetailsSheet';

const TransactionDetailsWithProvider = ({
  transactionId,
  apiBaseUrl,
  headers,
}: {
  transactionId: string;
  apiBaseUrl: string;
  headers: Record<string, string>;
}) => {
  return (
    <EBComponentsProvider apiBaseUrl={apiBaseUrl} headers={headers}>
      <TransactionDetailsDialogTrigger transactionId={transactionId}>
        <Button>View Transaction Details</Button>
      </TransactionDetailsDialogTrigger>
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof TransactionDetailsWithProvider> = {
  title: 'Core/TransactionsDisplay/TransactionDetailsSheet',
  component: TransactionDetailsWithProvider,
  tags: ['@core', '@transactions'],
  argTypes: {
    transactionId: {
      control: 'text',
      description: 'The transaction ID to fetch and display',
    },
  },
};

export default meta;

type Story = StoryObj<typeof TransactionDetailsWithProvider>;

export const CompleteTransaction: Story = {
  args: {
    transactionId: 'txn-complete-001',
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
    headers: {},
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
    headers: {},
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
    headers: {},
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
    headers: {},
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
    headers: {},
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
    headers: {},
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

export const ErrorState: Story = {
  args: {
    transactionId: 'txn-api-error-001',
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
    headers: {},
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        }),
      ],
    },
  },
};
