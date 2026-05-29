import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { Button } from '@/components/ui/button';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import { TransactionDetailsDialogTrigger } from '../TransactionDetailsSheet';

/**
 * Story args interface extending base provider args
 */
interface TransactionDetailsErrorStoryArgs extends BaseStoryArgs {
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

const meta: Meta<TransactionDetailsErrorStoryArgs> = {
  title: 'Core/TransactionsDisplay/TransactionDetailsSheet/Errors',
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

type Story = StoryObj<TransactionDetailsErrorStoryArgs>;

// Common args for error stories
const errorStoryArgs = {
  transactionId: 'txn-api-error-001',
  apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/ef/v2',
};

export const ErrorState500: Story = {
  args: errorStoryArgs,
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(
            {
              title: 'INTERNAL_SERVER_ERROR',
              httpStatus: 500,
              traceId: 'trace-500-001',
            },
            { status: 500 }
          );
        }),
      ],
    },
  },
};

export const ErrorState404: Story = {
  args: {
    ...errorStoryArgs,
    transactionId: 'txn-not-found-001',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(
            {
              title: 'NOT_FOUND',
              httpStatus: 404,
              traceId: 'trace-404-001',
            },
            { status: 404 }
          );
        }),
      ],
    },
  },
};

export const ErrorState403: Story = {
  args: {
    ...errorStoryArgs,
    transactionId: 'txn-forbidden-001',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions/:id', () => {
          return HttpResponse.json(
            {
              title: 'FORBIDDEN',
              httpStatus: 403,
              traceId: 'trace-403-001',
            },
            { status: 403 }
          );
        }),
      ],
    },
  },
};
