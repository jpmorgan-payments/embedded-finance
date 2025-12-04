import {
  createMockRecipient,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import { Recipients } from '../Recipients';
import type { RecipientsProps } from '../Recipients.types';
import type { RecipientsConfig } from '../types/paymentConfig';

// Wrapper component that follows the same pattern as the original Recipients.story.tsx
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
  title: 'Core/Recipients/Configuration',
  component: Recipients,
  tags: ['@core', '@recipients'],
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
};
export default meta;

type Story = StoryObj<typeof Recipients>;

// Default Configuration (ACH, WIRE, RTP)
export const DefaultConfig: Story = {
  name: 'Default Configuration',
  args: {
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
  render: (args) => <RecipientsWithProvider {...args} />,
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
  name: 'Multiple Payment Methods',
  args: {
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
  render: (args) => <RecipientsWithProvider {...args} />,
};
