import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';

import { MakePayment } from './MakePayment';

interface MakePaymentWithProviderProps extends EBConfig {
  triggerButton?: React.ReactNode;
  accounts?: Array<{ id: string; name: string }>;
  recipients?: Array<{
    id: string;
    name: string;
    accountNumber: string;
  }>;
  paymentMethods?: Array<{
    id: string;
    name: string;
    fee: number;
    description?: string;
  }>;
}

const meta: Meta<MakePaymentWithProviderProps> = {
  title: 'Payment / Make Payment',
  component: MakePayment,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.post('/payments', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const {
        apiBaseUrl,
        headers,
        theme,
        reactQueryDefaultOptions,
        contentTokens,
        accounts,
        recipients,
        paymentMethods,
      } = context.args;
      return (
        <div className="eb-light">
          <EBComponentsProvider
            apiBaseUrl={apiBaseUrl}
            headers={headers}
            theme={{
              colorScheme: 'light',
              ...theme,
            }}
            reactQueryDefaultOptions={{
              queries: {
                refetchOnWindowFocus: false,
                retry: false,
              },
              ...reactQueryDefaultOptions,
            }}
            contentTokens={contentTokens}
          >
            <div className="eb-p-4">
              <Story args={{ accounts, recipients, paymentMethods }} />
            </div>
          </EBComponentsProvider>
        </div>
      );
    },
  ],
};
export default meta;

type Story = StoryObj<MakePaymentWithProviderProps>;

// Common data for stories
const singleAccount = [{ id: 'account1', name: 'Main Account' }];
const multipleAccounts = [
  { id: 'account1', name: 'Main Account' },
  { id: 'account2', name: 'Savings Account' },
  { id: 'account3', name: 'Business Account' },
];

const singleRecipient = [
  {
    id: 'linkedAccount',
    name: 'Linked Account John Doe',
    accountNumber: '****1234',
  },
];

const multipleRecipients = [
  {
    id: 'linkedAccount1',
    name: 'Linked Account John Doe',
    accountNumber: '****1234',
  },
  {
    id: 'linkedAccount2',
    name: 'Linked Account Jane Smith',
    accountNumber: '****5678',
  },
  {
    id: 'linkedAccount3',
    name: 'Linked Account Company LLC',
    accountNumber: '****9012',
  },
];

const defaultPaymentMethods = [
  { id: 'ACH', name: 'ACH', fee: 2.5 },
  { id: 'RTP', name: 'RTP', fee: 1 },
  { id: 'WIRE', name: 'WIRE', fee: 25 },
];

const singlePaymentMethod = [{ id: 'ACH', name: 'ACH', fee: 2.5 }];

const customPaymentMethods = [
  {
    id: 'INSTANT',
    name: 'Instant Transfer',
    fee: 5,
    description: 'Instant transfer with a $5 fee',
  },
  {
    id: 'STANDARD',
    name: 'Standard Transfer',
    fee: 0,
    description: 'Free transfer that takes 2-3 business days',
  },
];

export const Default: Story = {
  args: {
    apiBaseUrl: '/api',
    headers: {
      api_gateway_client_id: 'test',
    },
    theme: {
      colorScheme: 'light',
    },
    contentTokens: {
      name: 'enUS',
    },
    accounts: multipleAccounts,
    recipients: multipleRecipients,
    paymentMethods: defaultPaymentMethods,
  },
};

export const WithSingleAccount: Story = {
  args: {
    ...Default.args,
    accounts: singleAccount,
    recipients: multipleRecipients,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When only one account is available, it is preselected automatically.',
      },
    },
  },
};

export const WithSingleRecipient: Story = {
  args: {
    ...Default.args,
    accounts: multipleAccounts,
    recipients: singleRecipient,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When only one recipient is available, it is preselected automatically.',
      },
    },
  },
};

export const WithSingleAccountAndRecipient: Story = {
  args: {
    ...Default.args,
    accounts: singleAccount,
    recipients: singleRecipient,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When only one account and one recipient are available, both are preselected automatically.',
      },
    },
  },
};

export const WithSinglePaymentMethod: Story = {
  args: {
    ...Default.args,
    paymentMethods: singlePaymentMethod,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When only one payment method is available, it is preselected automatically.',
      },
    },
  },
};

export const WithCustomPaymentMethods: Story = {
  args: {
    ...Default.args,
    paymentMethods: customPaymentMethods,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom payment methods can be provided with different names, fees, and descriptions.',
      },
    },
  },
};
