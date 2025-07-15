import {
  createMockRecipient,
  createMockRecipientsResponse,
  mockActiveRecipients,
  mockEmptyRecipientsResponse,
  mockMicrodepositRecipients,
  mockRecipientsResponse,
  mockVerificationFailure,
  mockVerificationSuccess,
} from '@/mocks/recipients.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { userEvent, within } from '@test-utils';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { Recipients, RecipientsProps } from './Recipients';

// Wrapper component that follows the same pattern as TransactionsDisplay
export const RecipientsWithProvider = ({
  apiBaseUrl,
  headers,
  theme,
  contentTokens,
  ...recipientsProps
}: {
  apiBaseUrl: string;
  headers?: Record<string, string>;
  theme?: Record<string, unknown>;
  contentTokens?: { name: 'enUS' | 'frCA' };
} & RecipientsProps) => {
  return (
    <EBComponentsProvider
      apiBaseUrl={apiBaseUrl}
      headers={headers || {}}
      theme={theme}
      contentTokens={contentTokens || { name: 'enUS' }}
    >
      <div className="eb-mx-auto eb-max-w-7xl eb-p-6">
        <Recipients {...recipientsProps} />
      </div>
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof RecipientsWithProvider> = {
  title: 'Core/Recipients',
  component: RecipientsWithProvider,
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
    apiBaseUrl: {
      control: 'text',
      description: 'API base URL',
    },
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
    enableVerification: {
      control: 'boolean',
      description: 'Enable microdeposit verification',
    },
    onRecipientCreated: {
      action: 'recipient-created',
      description: 'Callback when recipient is created',
    },
    onRecipientUpdated: {
      action: 'recipient-updated',
      description: 'Callback when recipient is updated',
    },
    onVerificationComplete: {
      action: 'verification-complete',
      description: 'Callback when verification is complete',
    },
    userEventsHandler: {
      action: 'user-event',
      description: 'Handler for user events',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecipientsWithProvider>;

// Default story with all recipients
export const Default: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
    enableVerification: true,
    userEventsToTrack: ['click', 'view', 'edit', 'create'],
  },
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
        http.post('*/recipients/:id/verify-microdeposit', () => {
          return HttpResponse.json(mockVerificationSuccess);
        }),
      ],
    },
  },
};

// Story with only active recipients
export const ActiveRecipients: Story = {
  args: {
    ...Default.args,
  },
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

// Story with recipients requiring microdeposit verification
export const MicrodepositVerification: Story = {
  args: {
    ...Default.args,
    enableVerification: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(
            createMockRecipientsResponse(mockMicrodepositRecipients)
          );
        }),
        http.post('*/recipients/:id/verify-microdeposit', () => {
          return HttpResponse.json(mockVerificationSuccess);
        }),
      ],
    },
  },
};

// Story with empty state
export const EmptyState: Story = {
  args: {
    ...Default.args,
  },
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
    ...Default.args,
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
    ...Default.args,
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
    ...Default.args,
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
    ...Default.args,
    enableVerification: false,
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

// Story with large dataset for pagination
export const LargeDataset: Story = {
  args: {
    ...Default.args,
  },
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
                individual: undefined,
                organization: undefined,
              },
              status: ['ACTIVE', 'INACTIVE', 'MICRODEPOSITS_INITIATED'][
                i % 3
              ] as any,
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
    ...Default.args,
    initialRecipientType: 'LINKED_ACCOUNT',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', ({ request }) => {
          const url = new URL(request.url);
          const type = url.searchParams.get('type');

          let filteredRecipients = mockRecipientsResponse.recipients || [];
          if (type) {
            filteredRecipients = filteredRecipients.filter(
              (r) => r.type === type
            );
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

// Story with verification failure
export const VerificationFailure: Story = {
  args: {
    ...Default.args,
    enableVerification: true,
  },
  parameters: {
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(
            createMockRecipientsResponse(mockMicrodepositRecipients)
          );
        }),
        http.post('*/recipients/:id/verify-microdeposit', () => {
          return HttpResponse.json(mockVerificationFailure);
        }),
      ],
    },
  },
};

// Interactive story for testing user interactions
export const InteractiveDemo: Story = {
  args: {
    ...Default.args,
  },
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
        http.post('*/recipients/:id/verify-microdeposit', () => {
          return HttpResponse.json(mockVerificationSuccess);
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
    ...Default.args,
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

// Story for dark theme
export const DarkTheme: Story = {
  args: {
    ...Default.args,
    theme: {
      colorScheme: 'dark',
      variables: {
        backgroundColor: '#1a1a1a',
        foregroundColor: '#ffffff',
        cardColor: '#2a2a2a',
      },
    },
  },
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
    ...Default.args,
    userEventsToTrack: ['click', 'view', 'edit', 'create', 'verify'],
    userEventsHandler: (event) => {
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
