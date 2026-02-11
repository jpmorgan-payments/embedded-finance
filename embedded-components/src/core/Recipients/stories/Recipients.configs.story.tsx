import {
  createMockRecipient,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { Recipients } from '../Recipients';
import type { RecipientsProps } from '../Recipients.types';
import type { RecipientsConfig } from '../types/paymentConfig';

/**
 * Story args interface extending base provider args
 */
interface RecipientsConfigStoryArgs extends BaseStoryArgs, RecipientsProps {}

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

const meta: Meta<RecipientsConfigStoryArgs> = {
  title: 'Legacy/Recipients/Configuration',
  component: RecipientsStory,
  tags: ['@legacy', '@recipients'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Different configuration examples for the Recipients component showcasing various payment methods, validation rules, and UI customizations.',
      },
    },
  },
  argTypes: {
    clientId: {
      control: 'text',
      description: 'Optional client ID filter',
    },
    showCreateButton: {
      control: 'boolean',
      description: 'Show/hide create functionality',
    },
  },
  render: (args) => (
    <RecipientsStory
      clientId={args.clientId}
      showCreateButton={args.showCreateButton}
      config={args.config}
    />
  ),
};
export default meta;

type Story = StoryObj<RecipientsConfigStoryArgs>;

// Default Configuration (ACH, WIRE, RTP)
export const DefaultConfig: Story = {
  name: 'Default Configuration',
  args: {
    apiBaseUrl: 'https://api.example.com',
    showCreateButton: true,
    clientId: 'client-001',
  },
  parameters: {
    msw: {
      handlers: [
        http.get(/.*\/recipients.*/, () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.get('https://api.example.com/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.get('http://localhost:6006/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.post(/.*\/recipients$/, () => {
          return HttpResponse.json(createMockRecipient());
        }),
        http.post('https://api.example.com/recipients', () => {
          return HttpResponse.json(createMockRecipient());
        }),
        http.post('*/recipients/:id', () => {
          return HttpResponse.json(createMockRecipient());
        }),
        http.post('https://api.example.com/recipients/:id', () => {
          return HttpResponse.json(createMockRecipient());
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Default configuration with ACH, WIRE, and RTP payment methods enabled. Shows standard validation and all core features.',
      },
    },
  },
};

// Multiple Payment Methods with Advanced Features
const multiMethodConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'WIRE', 'RTP', 'EMAIL', 'ZELLE'],
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: false,
    requirePhoneContact: false,
    maxContactsPerRecipient: 5,
    enableDuplicateDetection: true,
    enableAddressValidation: true,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: true,
    defaultFormLayout: 'tabs',
    enableProgressIndicator: true,
  },
};

export const MultiplePaymentMethods: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    config: multiMethodConfig,
    showCreateButton: true,
    clientId: 'client-001',
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
      ],
    },
    docs: {
      description: {
        story:
          'Configuration supporting multiple payment methods including only allowed types.',
      },
    },
  },
};
