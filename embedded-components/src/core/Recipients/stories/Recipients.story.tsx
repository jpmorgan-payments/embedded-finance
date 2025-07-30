import {
  createMockRecipient,
  createMockRecipientsResponse,
  mockActiveRecipients,
  mockEmptyRecipientsResponse,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { userEvent, within } from '@test-utils';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import { MakePayment } from '../../MakePayment';
import { SELLSENSE_THEME } from '../../themes';
import { Recipients, RecipientsProps } from '../Recipients';

// Wrapper component that follows the same pattern as TransactionsDisplay
const RecipientsWithProvider = ({
  children,
  theme = {},
  contentTokens = { name: 'enUS' },
  ...recipientsProps
}: RecipientsProps & {
  children?: React.ReactNode;
  theme?: Record<string, any>;
  contentTokens?: Record<string, any>;
}) => {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://api.example.com"
      headers={{}}
      theme={theme}
      contentTokens={contentTokens}
    >
      <div className="eb-mx-auto eb-max-w-7xl eb-p-6">
        <Recipients {...recipientsProps} />
      </div>
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof Recipients> & {
  argTypes: {
    clientId: {
      control: 'text';
      description: string;
    };
    initialRecipientType: {
      control: { type: 'select' };
      options: string[];
      description: string;
    };
    showCreateButton: {
      control: 'boolean';
      description: string;
    };
    onRecipientCreated: {
      action: string;
      description: string;
    };
    onRecipientUpdated: {
      action: string;
      description: string;
    };
    userEventsHandler: {
      action: string;
      description: string;
    };
    theme: {
      control: 'object';
      description: string;
    };
    contentTokens: {
      control: 'object';
      description: string;
    };
  };
} = {
  title: 'Core/Recipients',
  component: Recipients,
  tags: ['@core', '@recipients'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive component for managing payment recipients with create, edit, view, and verification capabilities.',
      },
    },
  },
  argTypes: {
    clientId: {
      control: 'text',
      description: 'Optional client ID filter',
    },
    initialRecipientType: {
      control: { type: 'select' },
      options: ['RECIPIENT', 'LINKED_ACCOUNT', 'SETTLEMENT_ACCOUNT'],
      description: 'Default recipient type for new recipients',
    },
    showCreateButton: {
      control: 'boolean',
      description: 'Show/hide create functionality',
    },
    isWidget: {
      control: 'boolean',
      description: 'Force widget layout with minimal columns and no filters',
    },
    onRecipientCreated: {
      action: 'recipient-created',
      description: 'Callback when recipient is created',
    },
    onRecipientUpdated: {
      action: 'recipient-updated',
      description: 'Callback when recipient is updated',
    },
    userEventsHandler: {
      action: 'user-event',
      description: 'Handler for user events',
    },
    theme: {
      control: 'object',
      description: 'Theme configuration for the EBComponentsProvider',
    },
    contentTokens: {
      control: 'object',
      description: 'Content tokens configuration for the EBComponentsProvider',
    },
  },
};
export default meta;
type Story = StoryObj<typeof Recipients> & {
  args?: Partial<RecipientsProps> & {
    theme?: Record<string, any>;
    contentTokens?: Record<string, any>;
  };
};

// Default story with all recipients
export const Default: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
    theme: {},
    contentTokens: { name: 'enUS' },
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.post('*/recipients', () => {
          return HttpResponse.json(createMockRecipient());
        }),
        http.post('*/recipients/:id', () => {
          return HttpResponse.json(createMockRecipient());
        }),
      ],
    },
  },
};

// Story with only active recipients
export const ActiveRecipients: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(
            createMockRecipientsResponse(mockActiveRecipients)
          );
        }),
        http.post('*/recipients', () => {
          return HttpResponse.json(createMockRecipient());
        }),
        http.post('*/recipients/:id', () => {
          return HttpResponse.json(createMockRecipient());
        }),
      ],
    },
  },
};

// Story with inactive recipients
export const InactiveRecipients: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          const inactiveRecipients =
            mockRecipientsResponse.recipients?.filter(
              (r) => r.status === 'INACTIVE'
            ) || [];
          return HttpResponse.json(
            createMockRecipientsResponse(inactiveRecipients)
          );
        }),
      ],
    },
  },
};

// Story with empty state
export const EmptyState: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockEmptyRecipientsResponse);
        }),
      ],
    },
  },
};

// Story with loading state
export const Loading: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return new Promise(() => {}); // Never resolves to show loading state
        }),
      ],
    },
  },
};

// Story with error state
export const ErrorState: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        }),
      ],
    },
  },
};

// Story with create button hidden
export const ReadOnly: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: false,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
      ],
    },
  },
};

// Story with verification disabled
export const NoVerification: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
      ],
    },
  },
};

// Story with large dataset for pagination
export const LargeDataset: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') || '1', 10);
          const limit = parseInt(url.searchParams.get('limit') || '10', 10);

          // Generate 50 mock recipients
          const largeDataset = Array.from({ length: 50 }, (_, i) =>
            createMockRecipient({
              id: `recipient-${i + 1}`,
              partyDetails: {
                type: i % 2 === 0 ? 'INDIVIDUAL' : 'ORGANIZATION',
                firstName: i % 2 === 0 ? `John${i}` : undefined,
                lastName: i % 2 === 0 ? `Doe${i}` : undefined,
                businessName: i % 2 === 1 ? `Business ${i}` : undefined,
                address: {
                  addressLine1: `${i + 1} Main Street`,
                  city: 'Sample City',
                  state: 'SC',
                  postalCode: '12345',
                  countryCode: 'US',
                },
                contacts: [
                  {
                    contactType: 'EMAIL',
                    value: `contact${i}@example.com`,
                  },
                ],
              },
              status: ['ACTIVE', 'INACTIVE', 'REJECTED'][i % 3] as any,
            })
          );

          return HttpResponse.json(
            createMockRecipientsResponse(largeDataset, page, limit)
          );
        }),
      ],
    },
  },
};

// Story with specific recipient types
export const RecipientTypes: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          const url = new URL(request.url);
          const type = url.searchParams.get('type');

          let filteredRecipients =
            mockRecipientsResponse.recipients?.filter((r) => r.type === type) ||
            [];
          if (!type) {
            filteredRecipients = mockRecipientsResponse.recipients || [];
          }

          return HttpResponse.json({
            ...mockRecipientsResponse,
            recipients: filteredRecipients,
            total_items: filteredRecipients.length,
          });
        }),
      ],
    },
  },
};

// Story with rejected recipients
export const RejectedRecipients: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          const rejectedRecipients =
            mockRecipientsResponse.recipients?.filter(
              (r) => r.status === 'REJECTED'
            ) || [];
          return HttpResponse.json(
            createMockRecipientsResponse(rejectedRecipients)
          );
        }),
      ],
    },
  },
};

// Interactive story for testing user interactions
export const InteractiveDemo: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.post('*/recipients', () => {
          return HttpResponse.json(createMockRecipient());
        }),
        http.post('*/recipients/:id', () => {
          return HttpResponse.json(createMockRecipient());
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test search functionality
    const searchInput = canvas.getByPlaceholderText('Search recipients...');
    await userEvent.type(searchInput, 'John');

    // Test filter functionality
    const typeFilter = canvas.getByRole('combobox', { name: /type/i });
    await userEvent.click(typeFilter);

    // Test viewing recipient details
    const viewButton = canvas.getAllByRole('button', { name: /eye/i })[0];
    await userEvent.click(viewButton);
  },
};

// Story for mobile responsiveness
export const MobileView: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
      ],
    },
  },
};

// Story for SellSense theme
export const SellSenseTheme: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
    theme: SELLSENSE_THEME,
    contentTokens: { name: 'enUS' },
  },
  tags: ['@sellsense', '@theme'],
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
      ],
    },
  },
};

// Story with custom event tracking
export const WithEventTracking: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
    userEventsHandler: (event) => {
      console.log('User event:', event);
    },
    theme: {},
    contentTokens: { name: 'enUS' },
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
      ],
    },
  },
};

// Story with custom content tokens
export const CustomContentTokens: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
    theme: {},
    contentTokens: {
      name: 'esES',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    },
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
      ],
    },
  },
};

// Story demonstrating MakePayment component integration
export const WithMakePaymentComponent: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    makePaymentComponent: (
      <MakePayment triggerButtonVariant="link" icon={undefined} />
    ),
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the Recipients component with a MakePayment component integrated into each recipient row/card. The MakePayment component appears as a link-styled button within the actions section of each recipient, and the recipient ID is automatically passed to pre-select the recipient in the payment form.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.get('*/accounts', () => {
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
                createdAt: '2025-04-14T08:58:21.592681Z',
                category: 'LIMITED_DDA_PAYMENTS',
              },
            ],
          });
        }),
        http.get('*/accounts/:accountId/balances', () => {
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
        http.post('*/transactions', () => {
          return HttpResponse.json({
            id: 'txn-12345',
            amount: 100.0,
            currency: 'USD',
            debtorAccountId: 'account1',
            creditorAccountId: 'acc-1234',
            recipientId: 'recipient1',
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

// Story demonstrating widget layout
export const WidgetLayout: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: false,
    isWidget: true,
    makePaymentComponent: (
      <MakePayment triggerButtonVariant="link" icon={undefined} />
    ),
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the Recipients component in widget mode. The widget layout features:\n\n- Minimal columns (Name, Status, Account, Actions)\n- No filters (only search functionality)\n- Clickable recipient names that open details dialog\n- Only send payment action (no edit/deactivate buttons)\n- Compact table layout regardless of screen size\n\nThis layout is ideal for embedding in smaller containers or when you need a simplified interface focused on quick recipient selection and payment actions.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.get('*/accounts', () => {
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
                createdAt: '2025-04-14T08:58:21.592681Z',
                category: 'LIMITED_DDA_PAYMENTS',
              },
            ],
          });
        }),
        http.get('*/accounts/:accountId/balances', () => {
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
        http.post('*/transactions', () => {
          return HttpResponse.json({
            id: 'txn-12345',
            amount: 100.0,
            currency: 'USD',
            debtorAccountId: 'account1',
            creditorAccountId: 'acc-1234',
            recipientId: 'recipient1',
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

// Story demonstrating widget layout with mobile viewport
export const WidgetLayoutMobile: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: false,
    isWidget: true,
    makePaymentComponent: (
      <MakePayment triggerButtonVariant="link" icon={undefined} />
    ),
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'This story demonstrates the widget layout on mobile devices. Even in widget mode, the component maintains a table layout on mobile for consistency, with clickable recipient names and minimal actions.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.get('*/accounts', () => {
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
                createdAt: '2025-04-14T08:58:21.592681Z',
                category: 'LIMITED_DDA_PAYMENTS',
              },
            ],
          });
        }),
        http.get('*/accounts/:accountId/balances', () => {
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
        http.post('*/transactions', () => {
          return HttpResponse.json({
            id: 'txn-12345',
            amount: 100.0,
            currency: 'USD',
            debtorAccountId: 'account1',
            creditorAccountId: 'acc-1234',
            recipientId: 'recipient1',
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
