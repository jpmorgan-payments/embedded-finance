import {
  createMockRecipient,
  createMockRecipientsResponse,
  mockActiveRecipients,
  mockEmptyRecipientsResponse,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from '@storybook/testing-library';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { MakePayment } from '../../MakePayment';
import { Recipients } from '../Recipients';
import type { RecipientsProps } from '../Recipients.types';

const DEFAULT_PAGE = 0;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 25;

const generateRecipients = (count: number) => {
  const firstNames = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Edward',
    'Fiona',
    'George',
    'Hannah',
    'Isaac',
    'Julia',
    'Kevin',
    'Laura',
    'Michael',
    'Nancy',
    'Oliver',
    'Patricia',
    'Quinn',
    'Rachel',
    'Samuel',
    'Tina',
  ];
  const lastNames = [
    'Anderson',
    'Brown',
    'Chen',
    'Davis',
    'Evans',
    'Foster',
    'Garcia',
    'Harris',
    'Ivanov',
    'Johnson',
    'Kim',
    'Lee',
    'Martinez',
    'Nguyen',
    "O'Connor",
    'Patel',
    'Quinn',
    'Rodriguez',
    'Smith',
    'Taylor',
  ];
  const businessNames = [
    'Acme Corp',
    'Beta Industries',
    'Gamma Solutions',
    'Delta Services',
    'Epsilon Group',
    'Zeta Enterprises',
    'Eta Technologies',
    'Theta Systems',
    'Iota Consulting',
    'Kappa Partners',
  ];
  const statuses: Array<
    | 'ACTIVE'
    | 'INACTIVE'
    | 'PENDING'
    | 'REJECTED'
    | 'READY_FOR_VALIDATION'
    | 'MICRODEPOSITS_INITIATED'
  > = [
    'ACTIVE',
    'ACTIVE',
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'REJECTED',
    'READY_FOR_VALIDATION',
    'MICRODEPOSITS_INITIATED',
  ];
  const states = ['NY', 'CA', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  const types: Array<'RECIPIENT' | 'LINKED_ACCOUNT' | 'SETTLEMENT_ACCOUNT'> = [
    'RECIPIENT',
    'LINKED_ACCOUNT',
    'SETTLEMENT_ACCOUNT',
  ];

  return Array.from({ length: count }, (_, i) => {
    const isIndividual = i % 3 !== 0;
    const firstNameIndex = i % firstNames.length;
    const lastNameIndex = Math.floor(i / firstNames.length) % lastNames.length;
    const businessIndex = Math.floor(i / 3) % businessNames.length;
    const statusIndex = i % statuses.length;
    const stateIndex = i % states.length;
    const typeIndex = i % types.length;

    const daysAgo = 180 - (i % 180);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    const updatedAt = new Date(createdAt);
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 30));

    return createMockRecipient({
      id: `recipient-${String(i + 1).padStart(3, '0')}`,
      type: types[typeIndex],
      status: statuses[statusIndex],
      clientId: 'client-001',
      partyDetails: {
        type: isIndividual ? 'INDIVIDUAL' : 'ORGANIZATION',
        firstName: isIndividual
          ? `${firstNames[firstNameIndex]}${i > 19 ? i : ''}`
          : undefined,
        lastName: isIndividual
          ? `${lastNames[lastNameIndex]}${i > 19 ? i : ''}`
          : undefined,
        businessName: !isIndividual
          ? `${businessNames[businessIndex]} ${
              i > 9 ? `#${Math.floor(i / 10)}` : ''
            }`
          : undefined,
        address: {
          addressLine1: `${(i % 9999) + 1} ${
            isIndividual ? 'Main' : 'Business'
          } Street`,
          city: `City ${String.fromCharCode(65 + (i % 26))}`,
          state: states[stateIndex],
          postalCode: String(10000 + (i % 90000)),
          countryCode: 'US',
        },
        contacts: [
          {
            contactType: 'EMAIL',
            value: isIndividual
              ? `${firstNames[firstNameIndex].toLowerCase()}${i}.${lastNames[
                  lastNameIndex
                ].toLowerCase()}@example.com`
              : `contact${i}@${businessNames[businessIndex]
                  .toLowerCase()
                  .replace(/\s+/g, '')}.com`,
          },
        ],
      },
      account: {
        number: String(1000000000 + i).padStart(10, '0'),
        type: 'CHECKING',
        countryCode: 'US',
        routingInformation: [
          {
            routingCodeType: 'USABA',
            routingNumber: String(100000000 + (i % 1000000)).padStart(9, '0'),
            transactionType: i % 2 === 0 ? 'ACH' : 'WIRE',
          },
        ],
      },
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });
};

const buildPaginatedRecipientsResponse = (
  baseResponse: typeof mockRecipientsResponse,
  request: Request
) => {
  const url = new URL(request.url);
  const page = Math.max(
    DEFAULT_PAGE,
    parseInt(url.searchParams.get('page') ?? `${DEFAULT_PAGE}`, 10)
  );
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      parseInt(url.searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10)
    )
  );
  const type = url.searchParams.get('type');

  let recipients = baseResponse.recipients ?? [];
  if (type) {
    recipients = recipients.filter((recipient) => recipient.type === type);
  }

  const startIndex = page * limit;
  const endIndex = startIndex + limit;
  const paginatedRecipients = recipients.slice(startIndex, endIndex);

  // OAS-aligned response: metadata contains page, limit, total_items
  // Remove any root-level pagination fields that might exist
  const {
    page: _,
    limit: __,
    total_items: ___,
    ...cleanBaseResponse
  } = baseResponse as any;

  return HttpResponse.json({
    ...cleanBaseResponse,
    recipients: paginatedRecipients,
    metadata: {
      page,
      limit,
      total_items: recipients.length,
    },
  });
};

/**
 * Story args interface extending base provider args
 */
interface RecipientsStoryArgs extends BaseStoryArgs, RecipientsProps {}

/**
 * Wrapper component for stories - NO EBComponentsProvider here!
 * The global decorator in preview.tsx handles the provider wrapping.
 */
const RecipientsStory = (props: RecipientsProps) => {
  return (
    <div className="eb-mx-auto eb-max-w-7xl eb-p-6">
      <Recipients {...props} />
    </div>
  );
};

const meta: Meta<RecipientsStoryArgs> = {
  title: 'Core/Recipients',
  component: RecipientsStory,
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
  },
  render: (args) => (
    <RecipientsStory
      clientId={args.clientId}
      initialRecipientType={args.initialRecipientType}
      showCreateButton={args.showCreateButton}
      isWidget={args.isWidget}
      onRecipientCreated={args.onRecipientCreated}
      onRecipientUpdated={args.onRecipientUpdated}
      userEventsHandler={args.userEventsHandler}
      makePaymentComponent={args.makePaymentComponent}
      config={args.config}
    />
  ),
};
export default meta;

type Story = StoryObj<RecipientsStoryArgs>;

// Default story with all recipients
export const Default: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          const recipients = generateRecipients(60);
          return buildPaginatedRecipientsResponse({ recipients }, request);
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          return buildPaginatedRecipientsResponse(
            createMockRecipientsResponse(mockActiveRecipients),
            request
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          const inactiveRecipients =
            mockRecipientsResponse.recipients?.filter(
              (r) => r.status === 'INACTIVE'
            ) || [];
          return buildPaginatedRecipientsResponse(
            createMockRecipientsResponse(inactiveRecipients),
            request
          );
        }),
      ],
    },
  },
};

// Story with empty state
export const EmptyState: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          return buildPaginatedRecipientsResponse(
            mockEmptyRecipientsResponse,
            request
          );
        }),
      ],
    },
  },
};

// Story with loading state
export const Loading: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: false,
  },
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
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

// Story with large dataset for pagination (merged with OneHundredRecipients)
// This story is kept for backward compatibility but now uses the same implementation
export const LargeDataset: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates server-side pagination with 120 recipients. Navigate through pages to see the pagination controls in action. The API follows OAS specification with proper metadata structure.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          const recipients = generateRecipients(120);
          return buildPaginatedRecipientsResponse({ recipients }, request);
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

// Story with 100+ recipients to showcase server-side pagination
export const OneHundredRecipients: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the Recipients table with 150 recipients to showcase server-side pagination capabilities. Features include:\n\n- **Server-side pagination**: Navigate through multiple pages (default: 25 per page, max: 25)\n- **OAS-aligned API**: Follows OpenAPI spec with page (0-based), limit (max 25), and metadata structure\n- **Sorting**: Click column headers to sort by Name, Status, Account Number, or Created Date\n- **Filtering**: Use search and status filters to narrow down results\n\nTry changing pages and page sizes to see server-side pagination in action. The API returns paginated results with proper metadata.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          const recipients = generateRecipients(150);
          return buildPaginatedRecipientsResponse({ recipients }, request);
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

// Story with specific recipient types
export const RecipientTypes: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          return buildPaginatedRecipientsResponse(
            mockRecipientsResponse,
            request
          );
        }),
      ],
    },
  },
};

// Story with rejected recipients
export const RejectedRecipients: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          const rejectedRecipients =
            mockRecipientsResponse.recipients?.filter(
              (r) => r.status === 'REJECTED'
            ) || [];
          return buildPaginatedRecipientsResponse(
            createMockRecipientsResponse(rejectedRecipients),
            request
          );
        }),
      ],
    },
  },
};

// Interactive story for testing user interactions
export const InteractiveDemo: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          return buildPaginatedRecipientsResponse(
            mockRecipientsResponse,
            request
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
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

/**
 * Story with SellSense theme preset.
 * Theme is applied via themePreset arg which is handled by the global decorator.
 */
export const SellSenseTheme: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
    themePreset: 'SellSense',
  },
  tags: ['@sellsense', '@theme'],
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

/**
 * Story with SellSense dark theme preset.
 */
export const DarkSellSenseTheme: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
    themePreset: 'SellSense',
  },
  tags: ['@sellsense', '@theme'],
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
    userEventsHandler: (event) => {
      // eslint-disable-next-line no-console
      console.log('User event:', event);
    },
  },
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
    contentTokensPreset: 'frCA',
  },
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
    makePaymentComponent: (
      <MakePayment triggerButtonVariant="link" icon={undefined} />
    ),
  },
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: false,
    isWidget: true,
    makePaymentComponent: (
      <MakePayment triggerButtonVariant="link" icon={undefined} />
    ),
  },
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
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: false,
    isWidget: true,
    makePaymentComponent: (
      <MakePayment triggerButtonVariant="link" icon={undefined} />
    ),
  },
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
