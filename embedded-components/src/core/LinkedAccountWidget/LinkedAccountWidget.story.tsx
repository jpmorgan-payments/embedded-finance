import {
  linkedAccountBusinessMock,
  linkedAccountInactiveMock,
  linkedAccountListMock,
  linkedAccountMicrodepositListMock,
  linkedAccountReadyForValidationMock,
  linkedAccountRejectedMock,
} from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBTheme } from '@/core/EBComponentsProvider/config.types';
import { MakePayment } from '@/core/MakePayment';
import { SELLSENSE_THEME } from '@/core/themes';

import { LinkedAccountWidget } from './LinkedAccountWidget';

const LinkedAccountsWithProvider = ({
  apiBaseUrl,
  headers,
  theme,
  variant,
  makePaymentComponent,
}: {
  apiBaseUrl: string;
  headers: Record<string, string>;
  theme: EBTheme;
  variant?: 'default' | 'singleAccount';
  makePaymentComponent?: React.ReactNode;
}) => {
  return (
    <>
      <EBComponentsProvider
        apiBaseUrl={apiBaseUrl}
        headers={headers}
        theme={{ colorScheme: 'light', ...theme }}
      >
        <LinkedAccountWidget
          variant={variant}
          makePaymentComponent={makePaymentComponent}
        />
      </EBComponentsProvider>
    </>
  );
};

const meta: Meta<typeof LinkedAccountsWithProvider> = {
  title: 'Core/LinkedAccountWidget',
  component: LinkedAccountsWithProvider,
  tags: ['@core', '@linked-accounts'],
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

// Helper function to create handlers for both list and individual recipient requests
const createRecipientHandlers = (mockData: typeof linkedAccountListMock) => [
  http.get('/recipients', () => {
    return HttpResponse.json(mockData);
  }),
  http.get('/recipients/:id', ({ params }) => {
    const { id } = params;
    const recipient = mockData.recipients?.find((r) => r.id === id);

    if (!recipient) {
      return HttpResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(recipient);
  }),
  http.post('/recipients/:id/verify-microdeposit', ({ params }) => {
    const { id } = params;
    const recipient = mockData.recipients?.find((r) => r.id === id);

    if (!recipient) {
      return HttpResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Mock successful verification response
    return HttpResponse.json({
      status: 'SUCCESS',
      message: 'Microdeposits verified successfully',
      recipientId: id,
    });
  }),
];

export const Primary: Story = {
  name: 'LinkedAccountWidget with Multiple Accounts',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: createRecipientHandlers(linkedAccountListMock),
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
      handlers: createRecipientHandlers(linkedAccountListMock),
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
      handlers: createRecipientHandlers({
        ...linkedAccountListMock,
        recipients: [],
      }),
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
      handlers: createRecipientHandlers(linkedAccountBusinessMock),
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
      handlers: createRecipientHandlers(linkedAccountReadyForValidationMock),
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
      handlers: createRecipientHandlers(linkedAccountMicrodepositListMock),
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
      handlers: createRecipientHandlers(linkedAccountRejectedMock),
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
      handlers: createRecipientHandlers(linkedAccountInactiveMock),
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
      handlers: createRecipientHandlers({
        page: 0,
        limit: 10,
        total_items: 4,
        recipients: [
          linkedAccountListMock.recipients?.[0], // Active
          linkedAccountReadyForValidationMock.recipients?.[0], // Ready for validation
          linkedAccountRejectedMock.recipients?.[0], // Rejected
          linkedAccountInactiveMock.recipients?.[0], // Inactive
        ].filter((recipient): recipient is NonNullable<typeof recipient> =>
          Boolean(recipient)
        ),
      }),
    },
  },
};

export const WithMakePaymentComponent: Story = {
  name: 'With MakePayment Component',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
    makePaymentComponent: (
      <MakePayment triggerButtonVariant="ghost" icon={undefined} />
    ),
  },
  parameters: {
    docs: {
      story:
        'This story demonstrates the LinkedAccountWidget with a MakePayment component integrated into each linked account card. The MakePayment component appears as a ghost button within the actions section of each account card. When clicked, the recipient ID is automatically passed to the MakePayment component, pre-selecting that recipient in the payment form.',
    },
    msw: {
      handlers: [
        ...createRecipientHandlers(linkedAccountListMock),
        http.get('/accounts', () => {
          return HttpResponse.json({
            items: [
              {
                id: 'account1',
                clientId: '0005199987',
                label: 'MAIN_ACCOUNT',
                state: 'OPEN',
                paymentRoutingInformation: {
                  accountNumber: '10000000001035',
                  country: 'US',
                  routingInformation: [
                    {
                      type: 'ABA',
                      value: '028000024',
                    },
                  ],
                },
                createdAt: '2025-04-14T08:57:21.592681Z',
                category: 'LIMITED_DDA',
              },
            ],
          });
        }),
        http.get('/accounts/:accountId/balances', () => {
          return HttpResponse.json({
            balanceTypes: [
              {
                typeCode: 'ITAV',
                amount: 5000.0,
              },
              {
                typeCode: 'ITBD',
                amount: 5200.0,
              },
            ],
            currency: 'USD',
          });
        }),
        http.post('/transactions', () => {
          return HttpResponse.json({
            id: 'txn-12345',
            amount: 100.0,
            currency: 'USD',
            debtorAccountId: 'account1',
            creditorAccountId: 'acc-1234',
            recipientId: 'linkedAccount1',
            transactionReferenceId: 'PAY-1234567890',
            type: 'ACH',
            memo: 'Test payment',
            status: 'PENDING',
            paymentDate: '2024-01-15',
            createdAt: '2024-01-15T10:30:00Z',
            debtorName: 'John Doe',
            creditorName: 'Jane Smith',
            debtorAccountNumber: '****1234',
            creditorAccountNumber: '****5678',
          });
        }),
      ],
    },
  },
};

export const SellSenseTheme: Story = {
  name: 'SellSense Theme',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
    theme: SELLSENSE_THEME,
  },
  tags: ['@sellsense', '@theme'],
  parameters: {
    docs: {
      story:
        'This story demonstrates the LinkedAccountWidget with SellSense brand theming. The component uses the official SellSense color palette with orange primary colors, warm backgrounds, and brand-consistent typography.',
    },
    msw: {
      handlers: createRecipientHandlers(linkedAccountListMock),
    },
  },
};
