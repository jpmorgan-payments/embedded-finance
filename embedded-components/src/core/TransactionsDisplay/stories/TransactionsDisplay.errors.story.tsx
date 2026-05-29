import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { TransactionsDisplay } from '../TransactionsDisplay';

/**
 * Story args interface extending base provider args
 */
interface TransactionsDisplayErrorStoryArgs extends BaseStoryArgs {
  accountIds?: string[];
  apiBaseUrls?: Record<string, string>;
}

/**
 * Wrapper component for stories - NO EBComponentsProvider here!
 * The global decorator in preview.tsx handles the provider wrapping.
 */
const TransactionsDisplayStory = ({
  accountIds,
}: {
  accountIds?: string[];
}) => {
  return (
    <div className="eb-mx-auto eb-max-w-4xl eb-p-6">
      <TransactionsDisplay accountIds={accountIds} />
    </div>
  );
};

const meta: Meta<TransactionsDisplayErrorStoryArgs> = {
  title: 'Core/TransactionsDisplay/Errors',
  component: TransactionsDisplayStory,
  tags: ['@core', '@transactions'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Error state stories for TransactionsDisplay component.',
      },
    },
  },
  render: (args) => <TransactionsDisplayStory accountIds={args.accountIds} />,
};
export default meta;

type Story = StoryObj<TransactionsDisplayErrorStoryArgs>;

// Common args for error stories
const errorStoryArgs = {
  apiBaseUrl: '/',
  accountIds: ['account1'],
};

export const Error500: Story = {
  args: errorStoryArgs,
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(
            {
              title: 'INTERNAL_SERVER_ERROR',
              httpStatus: 500,
              traceId: 'trace-500-001',
            },
            { status: 500 }
          )
        ),
      ],
    },
  },
};

export const Error400: Story = {
  args: errorStoryArgs,
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(
            {
              title: 'BAD_REQUEST',
              httpStatus: 400,
              traceId: 'trace-400-001',
              context: [
                {
                  field: 'accountIds',
                  message: 'Invalid account ID format',
                },
              ],
            },
            { status: 400 }
          )
        ),
      ],
    },
  },
};

export const Error401: Story = {
  args: errorStoryArgs,
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(
            {
              title: 'UNAUTHORIZED',
              httpStatus: 401,
              traceId: 'trace-401-001',
            },
            { status: 401 }
          )
        ),
      ],
    },
  },
};

export const Error403: Story = {
  args: errorStoryArgs,
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(
            {
              title: 'FORBIDDEN',
              httpStatus: 403,
              traceId: 'trace-403-001',
            },
            { status: 403 }
          )
        ),
      ],
    },
  },
};

export const Error404: Story = {
  args: errorStoryArgs,
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(
            {
              title: 'NOT_FOUND',
              httpStatus: 404,
              traceId: 'trace-404-001',
            },
            { status: 404 }
          )
        ),
      ],
    },
  },
};

export const Error503: Story = {
  args: errorStoryArgs,
  parameters: {
    msw: {
      handlers: [
        http.get('*/transactions', () =>
          HttpResponse.json(
            {
              title: 'SERVICE_UNAVAILABLE',
              httpStatus: 503,
              traceId: 'trace-503-001',
            },
            { status: 503 }
          )
        ),
      ],
    },
  },
};
