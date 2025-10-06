import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBTheme } from '@/core/EBComponentsProvider/config.types';

import { LinkedAccountWidget } from '../LinkedAccountWidget';

const LinkedAccountsForCreate = ({
  apiBaseUrl,
  headers,
  theme,
  variant,
}: {
  apiBaseUrl: string;
  headers?: Record<string, string>;
  theme?: EBTheme;
  variant?: 'default' | 'singleAccount';
}) => {
  return (
    <EBComponentsProvider
      apiBaseUrl={apiBaseUrl}
      headers={headers || {}}
      theme={theme}
    >
      <LinkedAccountWidget variant={variant} />
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof LinkedAccountsForCreate> = {
  title: 'Core/LinkedAccountWidget/Create Outcomes',
  component: LinkedAccountsForCreate,
  tags: ['@core', '@linked-accounts', '@create'],
};
export default meta;

type Story = StoryObj<typeof LinkedAccountsForCreate>;

// helper: list + get
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
];

// helper: post with desired status
const postRecipientWithStatus = (status: string) =>
  http.post('/recipients', async ({ request }) => {
    const body = (await request.json()) as any;
    const created = {
      id: `recp-${Math.random().toString(36).slice(2, 10)}`,
      type: body?.type ?? 'LINKED_ACCOUNT',
      status,
      clientId: body?.clientId,
      partyId: body?.partyId,
      partyDetails: {
        type: body?.partyDetails?.type ?? 'INDIVIDUAL',
        firstName: body?.partyDetails?.firstName,
        lastName: body?.partyDetails?.lastName,
        businessName: body?.partyDetails?.businessName,
        address: body?.partyDetails?.address,
        contacts: body?.partyDetails?.contacts,
      },
      account: {
        type: body?.account?.type ?? 'CHECKING',
        number: body?.account?.number ?? '1234567890',
        routingInformation:
          body?.account?.routingInformation &&
          Array.isArray(body.account.routingInformation) &&
          body.account.routingInformation.length > 0
            ? body.account.routingInformation
            : [
                {
                  routingCodeType: 'USABA',
                  routingNumber:
                    body?.account?.routingInformation?.[0]?.routingNumber ??
                    '123456789',
                  transactionType:
                    body?.account?.routingInformation?.[0]?.transactionType ??
                    'ACH',
                },
              ],
        countryCode: body?.account?.countryCode ?? 'US',
      },
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(created, { status: 201 });
  });

// utility: empty list baseline
const emptyList = {
  ...linkedAccountListMock,
  recipients: [],
  total_items: 0,
};

export const CreateActive: Story = {
  name: 'Create → ACTIVE',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        postRecipientWithStatus('ACTIVE'),
        ...createRecipientHandlers(emptyList),
      ],
    },
  },
};

export const CreateMicrodepositsInitiated: Story = {
  name: 'Create → MICRODEPOSITS_INITIATED',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        postRecipientWithStatus('MICRODEPOSITS_INITIATED'),
        ...createRecipientHandlers(emptyList),
      ],
    },
  },
};

export const CreateReadyForValidation: Story = {
  name: 'Create → READY_FOR_VALIDATION',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        postRecipientWithStatus('READY_FOR_VALIDATION'),
        ...createRecipientHandlers(emptyList),
      ],
    },
  },
};

export const CreateRejected: Story = {
  name: 'Create → REJECTED',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        postRecipientWithStatus('REJECTED'),
        ...createRecipientHandlers(emptyList),
      ],
    },
  },
};

export const CreateInactive: Story = {
  name: 'Create → INACTIVE',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        postRecipientWithStatus('INACTIVE'),
        ...createRecipientHandlers(emptyList),
      ],
    },
  },
};

export const CreatePending: Story = {
  name: 'Create → PENDING',
  args: {
    apiBaseUrl: '/',
    variant: 'default',
  },
  parameters: {
    msw: {
      handlers: [
        postRecipientWithStatus('PENDING'),
        ...createRecipientHandlers(emptyList),
      ],
    },
  },
};
