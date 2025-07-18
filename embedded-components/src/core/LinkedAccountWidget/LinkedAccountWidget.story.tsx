import {
  linkedAccountBusinessMock,
  linkedAccountInactiveMock,
  linkedAccountListMock,
  linkedAccountMicrodepositListMock,
  linkedAccountReadyForValidationMock,
  linkedAccountRejectedMock,
} from '@/mocks/efLinkedAccounts.mock';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { LinkedAccountWidget } from './LinkedAccountWidget';

const LinkedAccountsWithProvider = ({
  apiBaseUrl,
  headers,
  theme,
  variant,
}: {
  apiBaseUrl: string;
  headers: Record<string, string>;
  theme: Record<string, unknown>;
  variant?: 'default' | 'singleAccount';
}) => {
  return (
    <>
      <EBComponentsProvider
        apiBaseUrl={apiBaseUrl}
        headers={headers}
        theme={theme}
      >
        <LinkedAccountWidget variant={variant} />
      </EBComponentsProvider>
    </>
  );
};

const meta: Meta<typeof LinkedAccountsWithProvider> = {
  title: 'LinkedAccounts with EBComponentsProvider',
  component: LinkedAccountsWithProvider,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'singleAccount'],
      description: 'Widget variant to display',
    },
  },
};
export default meta;

type Story = StoryObj<typeof LinkedAccountsWithProvider>;

export const Primary: Story = {
  name: 'LinkedAccountWidget with Multiple Accounts',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountListMock);
        }),
      ],
    },
  },
};

export const SingleAccount: Story = {
  name: 'Single Account View',
  args: {
    apiBaseUrl: '/',
    variant: 'singleAccount',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountListMock);
        }),
      ],
    },
  },
};

export const WithNoRecipients: Story = {
  name: 'With no recipients',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json({
            ...linkedAccountListMock,
            recipients: [],
          });
        }),
      ],
    },
  },
};

export const BusinessAccounts: Story = {
  name: 'Business Accounts',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountBusinessMock);
        }),
      ],
    },
  },
};

export const ReadyForValidation: Story = {
  name: 'Ready for Validation',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountReadyForValidationMock);
        }),
      ],
    },
  },
};

export const MicrodepositsInitiated: Story = {
  name: 'Microdeposits Initiated',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountMicrodepositListMock);
        }),
      ],
    },
  },
};

export const RejectedAccounts: Story = {
  name: 'Rejected Accounts',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountRejectedMock);
        }),
      ],
    },
  },
};

export const InactiveAccounts: Story = {
  name: 'Inactive Accounts',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json(linkedAccountInactiveMock);
        }),
      ],
    },
  },
};

export const WithTheme: Story = {
  name: 'With Custom Theme',
  ...Primary,
  args: {
    ...Primary.args,
    theme: {
      variables: {
        primaryColor: 'red',
        borderRadius: '15px',
      },
    },
  },
};

export const MixedStatuses: Story = {
  name: 'Mixed Account Statuses',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/recipients', () => {
          return HttpResponse.json({
            page: 0,
            limit: 10,
            total_items: 4,
            recipients: [
              linkedAccountListMock.recipients[0], // Active
              linkedAccountReadyForValidationMock.recipients[0], // Ready for validation
              linkedAccountRejectedMock.recipients[0], // Rejected
              linkedAccountInactiveMock.recipients[0], // Inactive
            ],
          });
        }),
      ],
    },
  },
};
