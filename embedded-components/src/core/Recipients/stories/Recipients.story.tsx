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
import { Recipients, RecipientsProps } from '../Recipients';

// Wrapper component that follows the same pattern as TransactionsDisplay
const RecipientsWithProvider = ({
  children,
  ...recipientsProps
}: RecipientsProps & { children?: React.ReactNode }) => {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://api.example.com"
      headers={{}}
      theme={{}}
      contentTokens={{ name: 'enUS' }}
    >
      <div className="eb-mx-auto eb-max-w-7xl eb-p-6">
        <Recipients {...recipientsProps} />
      </div>
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof Recipients> = {
  title: 'Recipients',
  component: Recipients,
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
};
export default meta;
type Story = StoryObj<typeof Recipients>;

// Default story with all recipients
export const Default: Story = {
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

// Story for dark theme
export const DarkTheme: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#1a1a1a' }],
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

// Story with custom event tracking
export const WithEventTracking: Story = {
  args: {
    clientId: 'client-001',
    showCreateButton: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
    userEventsHandler: (event) => {
      console.log('User event:', event);
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
