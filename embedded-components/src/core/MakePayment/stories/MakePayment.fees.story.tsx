import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { MakePayment } from '../MakePayment';

/**
 * Story args interface extending base provider args
 */
interface MakePaymentFeesStoryArgs extends BaseStoryArgs {
  triggerButton?: React.ReactNode;
  triggerButtonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  paymentMethods?: Array<{
    id: string;
    name: string;
    fee?: number;
    description?: string;
  }>;
  recipientId?: string;
  icon?: React.ReactNode;
  showPreviewPanel?: boolean;
}

// Mock data for consistent stories
const mockRecipients = [
  {
    id: 'recipient1',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'Alice',
      lastName: 'Johnson',
      address: {
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        countryCode: 'US',
      },
    },
    account: {
      id: 'acc-1234',
      number: '1234567890',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '111000025',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'recipient2',
    type: 'RECIPIENT',
    status: 'ACTIVE',
    clientId: 'client-001',
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'Tech Corp Inc',
      address: {
        addressLine1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        countryCode: 'US',
      },
    },
    account: {
      id: 'acc-5678',
      number: '9876543210',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingCodeType: 'USABA',
          routingNumber: '222000046',
          transactionType: 'ACH',
        },
      ],
    },
    createdAt: '2024-01-16T10:30:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
  },
];

const mockAccountsResponse = {
  items: [
    {
      id: 'account1',
      clientId: '0085199987',
      label: 'Operating Account',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '20000057603919',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '028000024',
          },
        ],
      },
      createdAt: '2025-04-14T08:57:21.792272Z',
      category: 'LIMITED_DDA',
    },
    {
      id: 'account2',
      clientId: '1000012400',
      label: 'Savings Account',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '20000097603212',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '028000024',
          },
        ],
      },
      createdAt: '2025-04-14T08:57:21.913631Z',
      category: 'LIMITED_DDA_PAYMENTS',
    },
  ],
  metadata: {
    limit: 25,
    page: 1,
    total_items: 2,
  },
};

const mockBalanceResponse = {
  balanceTypes: [
    { typeCode: 'AVAILABLE', amount: 50000.0 },
    { typeCode: 'LEDGER', amount: 50000.0 },
  ],
  currency: 'USD',
};

/**
 * MakePayment Fee Configuration Stories
 *
 * These stories demonstrate how to configure payment method fees in the MakePayment component.
 * The `paymentMethods` prop accepts an array with optional `fee` properties that control:
 * - The fee amount charged for each payment method
 * - Whether fees are displayed in the UI
 *
 * When `fee` is undefined or 0, the fee UI is hidden entirely.
 */
const meta: Meta<MakePaymentFeesStoryArgs> = {
  title: 'Legacy/MakePayment/Fee Configurations',
  component: MakePayment as any,
  tags: ['@legacy', 'autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'These stories showcase different fee configurations for the MakePayment component. ' +
          'The component supports flexible fee handling where fees can be shown or hidden based on configuration. ' +
          'Use the `paymentMethods` prop to control fee amounts and display.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/v2/recipients', () => {
          return HttpResponse.json({
            items: mockRecipients,
            metadata: {
              limit: 25,
              page: 1,
              total_items: mockRecipients.length,
            },
          });
        }),
        http.get('/api/v2/accounts', () => {
          return HttpResponse.json(mockAccountsResponse);
        }),
        http.get('/api/v2/accounts/:accountId/balances', () => {
          return HttpResponse.json(mockBalanceResponse);
        }),
        http.post('/api/v2/transactions', async ({ request }) => {
          const body = (await request.json()) as Record<string, any>;
          return HttpResponse.json({
            id: `txn-${Math.random().toString(36).substring(7)}`,
            status: 'COMPLETED',
            ...body,
          });
        }),
      ],
    },
  },
  argTypes: {
    paymentMethods: {
      description:
        'Array of payment method configurations including optional fees',
      control: { type: 'object' },
    },
    showPreviewPanel: {
      control: 'boolean',
      description: 'Show/hide the preview panel',
    },
    icon: {
      control: 'text',
      description: 'Lucide icon name for the trigger button',
    },
  },
};

export default meta;

type Story = StoryObj<MakePaymentFeesStoryArgs>;

/**
 * Default: No Fees
 *
 * This is the default configuration with no fees applied to any payment method.
 * The fee UI elements are completely hidden from the user interface when fees are not configured.
 */
export const NoFees: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: [
      { id: 'ACH', name: 'ACH' },
      { id: 'RTP', name: 'RTP' },
      { id: 'WIRE', name: 'WIRE' },
    ],
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This is the default configuration where no fees are charged. ' +
          'Notice that fee amounts are not displayed in the payment method selection cards, ' +
          'and the fee breakdown section is completely hidden from the UI. ' +
          'The "Total" amount in the review panel equals the entered amount.',
      },
    },
  },
};

/**
 * Standard Fees
 *
 * A typical configuration with different fee amounts for each payment method.
 * Fees are displayed in the payment method selection and breakdown sections.
 */
export const StandardFees: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: [
      {
        id: 'ACH',
        name: 'ACH',
        fee: 2.5,
        description: 'Standard processing fee for ACH transfers',
      },
      {
        id: 'RTP',
        name: 'RTP',
        fee: 1.0,
        description: 'Real-time payment processing fee',
      },
      {
        id: 'WIRE',
        name: 'WIRE',
        fee: 25.0,
        description: 'Wire transfer processing fee',
      },
    ],
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard fee configuration with different amounts for each payment method. ' +
          'The fee is shown under each payment method option, and a detailed fee breakdown ' +
          'appears when a payment method is selected. The review panel shows the fee and total amount.',
      },
    },
  },
};

/**
 * Mixed Configuration
 *
 * Some payment methods have fees while others are free.
 * Only methods with fees will display fee information.
 */
export const MixedFees: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: [
      {
        id: 'ACH',
        name: 'ACH',
        fee: 0,
        description: 'No fee for ACH transfers',
      },
      {
        id: 'RTP',
        name: 'RTP',
        fee: 1.0,
        description: 'Expedited processing fee',
      },
      {
        id: 'WIRE',
        name: 'WIRE',
        fee: 25.0,
        description: 'Wire transfer processing fee',
      },
    ],
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mixed configuration where ACH is free (fee: 0) while RTP and WIRE have fees. ' +
          'When ACH is selected, the fee UI is hidden. When RTP or WIRE is selected, ' +
          'the fee breakdown is shown.',
      },
    },
  },
};

/**
 * Free Preferred Method
 *
 * Highlighting a free payment method alongside paid options.
 * This encourages users to use the cost-effective option.
 */
export const FreePreferredMethod: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: [
      {
        id: 'ACH',
        name: 'ACH',
        description: 'Free standard processing (2-3 business days)',
      },
      {
        id: 'RTP',
        name: 'RTP',
        fee: 5.0,
        description: 'Instant transfer - arrives in minutes',
      },
      {
        id: 'WIRE',
        name: 'WIRE',
        fee: 30.0,
        description: 'Same-day guaranteed delivery',
      },
    ],
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A common pattern where the standard method (ACH) is free, while expedited ' +
          'options (RTP and WIRE) incur fees. This encourages users to use the free option ' +
          'unless they need faster processing.',
      },
    },
  },
};

/**
 * High-Value Fees
 *
 * Configuration for scenarios with higher transaction fees.
 * Useful for testing fee display with larger amounts.
 */
export const HighValueFees: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: [
      {
        id: 'ACH',
        name: 'ACH',
        fee: 10.0,
        description: 'Standard processing with $10 flat fee',
      },
      {
        id: 'RTP',
        name: 'RTP',
        fee: 25.0,
        description: 'Real-time processing with $25 premium',
      },
      {
        id: 'WIRE',
        name: 'WIRE',
        fee: 50.0,
        description: 'Wire transfer with $50 processing fee',
      },
    ],
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration with higher fee amounts to test the UI display with larger numbers. ' +
          'Useful for enterprise scenarios or international transfers where fees may be substantial.',
      },
    },
  },
};

/**
 * Single Method with Fee
 *
 * When only one payment method is available with a fee.
 * Tests the UI when there are no alternative free options.
 */
export const SingleMethodWithFee: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: [
      {
        id: 'WIRE',
        name: 'WIRE',
        fee: 25.0,
        description: 'Wire transfer processing fee',
      },
    ],
    icon: 'CirclePlus',
    showPreviewPanel: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration with a single payment method that has a fee. ' +
          'The method is auto-selected, and the fee is prominently displayed.',
      },
    },
  },
};

/**
 * Without Preview Panel
 *
 * Fee configuration without the review panel enabled.
 * Demonstrates fee display in the compact form-only view.
 */
export const WithoutPreviewPanel: Story = {
  args: {
    apiBaseUrl: '/',
    paymentMethods: [
      { id: 'ACH', name: 'ACH', fee: 2.5 },
      { id: 'RTP', name: 'RTP', fee: 1.0 },
      { id: 'WIRE', name: 'WIRE', fee: 25.0 },
    ],
    icon: 'CirclePlus',
    showPreviewPanel: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fee configuration displayed without the preview panel. ' +
          'The fee information is still shown in the payment method selection and breakdown, ' +
          'but the review panel is hidden for a more compact interface.',
      },
    },
  },
};
