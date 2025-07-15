import {
  createMockRecipient,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import { Recipients, RecipientsProps } from '../Recipients';
import type {
  PaymentMethodType,
  RecipientsConfig,
} from '../types/paymentConfig';
import { defaultPaymentMethodConfigs } from '../types/paymentConfig';

// Wrapper component that follows the same pattern as the original Recipients.story.tsx
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
  title: 'Core/Recipients/Configuration Examples',
  component: RecipientsWithProvider,
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
    apiBaseUrl: {
      control: 'text',
      description: 'API base URL',
    },
    clientId: {
      control: 'text',
      description: 'Optional client ID filter',
    },
    showCreateButton: {
      control: 'boolean',
      description: 'Show/hide create functionality',
    },
    enableVerification: {
      control: 'boolean',
      description: 'Enable microdeposit verification',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecipientsWithProvider>;

// Default Configuration (ACH, WIRE, RTP)
export const DefaultConfig: Story = {
  name: 'Default Configuration',
  args: {
    apiBaseUrl: 'https://api.example.com',
    showCreateButton: true,
    enableVerification: true,
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

// ACH Only Configuration
const achOnlyConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    ACH: {
      ...defaultPaymentMethodConfigs.ACH,
      enabled: true,
    },
  },
  globalSettings: {
    allowMultiplePaymentMethods: false,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: false,
    maxContactsPerRecipient: 2,
    enableDuplicateDetection: true,
    enableAddressValidation: false,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'single-page',
    enableProgressIndicator: false,
  },
};

export const ACHOnly: Story = {
  name: 'ACH Only',
  args: {
    apiBaseUrl: 'https://api.example.com',
    config: achOnlyConfig,
    showCreateButton: true,
    enableVerification: true,
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
          'Configuration limited to ACH payments only. Address is optional, email contact is required.',
      },
    },
  },
};

// Wire Transfer Only with Strict Address Requirements
const wireOnlyConfig: RecipientsConfig = {
  availablePaymentMethods: ['WIRE'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    WIRE: {
      ...defaultPaymentMethodConfigs.WIRE,
      enabled: true,
      requiredFields: [
        ...defaultPaymentMethodConfigs.WIRE.requiredFields,
        'partyDetails.contacts.EMAIL.value', // Make email required for wire
      ],
    },
  },
  globalSettings: {
    allowMultiplePaymentMethods: false,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: true,
    maxContactsPerRecipient: 3,
    enableDuplicateDetection: true,
    enableAddressValidation: true,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'accordion',
    enableProgressIndicator: true,
  },
};

export const WireOnly: Story = {
  name: 'Wire Transfers Only',
  args: {
    apiBaseUrl: 'https://api.example.com',
    config: wireOnlyConfig,
    showCreateButton: true,
    enableVerification: true,
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
          'Wire transfer configuration with strict address requirements, email and phone contacts required.',
      },
    },
  },
};

// Multiple Payment Methods with Advanced Features
const multiMethodConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'WIRE', 'RTP', 'EMAIL', 'CHECK'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    ACH: { ...defaultPaymentMethodConfigs.ACH, enabled: true },
    WIRE: { ...defaultPaymentMethodConfigs.WIRE, enabled: true },
    RTP: { ...defaultPaymentMethodConfigs.RTP, enabled: true },
    EMAIL: { ...defaultPaymentMethodConfigs.EMAIL, enabled: true },
    CHECK: { ...defaultPaymentMethodConfigs.CHECK, enabled: true },
  },
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
    apiBaseUrl: 'https://api.example.com',
    config: multiMethodConfig,
    showCreateButton: true,
    enableVerification: true,
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
          'Configuration supporting multiple payment methods including traditional (ACH, WIRE), modern (RTP), and alternative (EMAIL, CHECK) options.',
      },
    },
  },
};

// International Configuration
const internationalConfig: RecipientsConfig = {
  availablePaymentMethods: ['WIRE', 'INTERNATIONAL', 'SWIFT', 'SEPA'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    WIRE: { ...defaultPaymentMethodConfigs.WIRE, enabled: true },
    INTERNATIONAL: {
      ...defaultPaymentMethodConfigs.INTERNATIONAL,
      enabled: true,
    },
    SWIFT: { ...defaultPaymentMethodConfigs.SWIFT, enabled: true },
    SEPA: { ...defaultPaymentMethodConfigs.SEPA, enabled: true },
  },
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: false,
    maxContactsPerRecipient: 3,
    enableDuplicateDetection: true,
    enableAddressValidation: true,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: true,
    defaultFormLayout: 'accordion',
    enableProgressIndicator: true,
  },
};

export const InternationalPayments: Story = {
  name: 'International Payments',
  args: {
    config: internationalConfig,
    showCreateButton: true,
    enableVerification: true,
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration for international payments supporting WIRE, INTERNATIONAL, SWIFT, and SEPA payment methods.',
      },
    },
  },
};

// Modern Digital Payments
const modernDigitalConfig: RecipientsConfig = {
  availablePaymentMethods: ['RTP', 'INSTANT', 'ZELLE', 'VENMO', 'PAYPAL'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    RTP: { ...defaultPaymentMethodConfigs.RTP, enabled: true },
    INSTANT: { ...defaultPaymentMethodConfigs.INSTANT, enabled: true },
    ZELLE: { ...defaultPaymentMethodConfigs.ZELLE, enabled: true },
    VENMO: { ...defaultPaymentMethodConfigs.VENMO, enabled: true },
    PAYPAL: { ...defaultPaymentMethodConfigs.PAYPAL, enabled: true },
  },
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: false,
    maxContactsPerRecipient: 2,
    enableDuplicateDetection: true,
    enableAddressValidation: false,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: true,
    defaultFormLayout: 'single-page',
    enableProgressIndicator: false,
  },
};

export const ModernDigital: Story = {
  name: 'Modern Digital Payments',
  args: {
    config: modernDigitalConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration focused on modern digital payment methods like RTP, Instant transfers, Zelle, Venmo, and PayPal.',
      },
    },
  },
};

// Future Technologies
const futureConfig: RecipientsConfig = {
  availablePaymentMethods: ['CRYPTO', 'APPLE_PAY', 'GOOGLE_PAY', 'RTP'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    CRYPTO: { ...defaultPaymentMethodConfigs.CRYPTO, enabled: true },
    APPLE_PAY: { ...defaultPaymentMethodConfigs.APPLE_PAY, enabled: true },
    GOOGLE_PAY: { ...defaultPaymentMethodConfigs.GOOGLE_PAY, enabled: true },
    RTP: { ...defaultPaymentMethodConfigs.RTP, enabled: true },
  },
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: false,
    maxContactsPerRecipient: 2,
    enableDuplicateDetection: false,
    enableAddressValidation: false,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: true,
    defaultFormLayout: 'tabs',
    enableProgressIndicator: true,
  },
};

export const FutureTechnologies: Story = {
  name: 'Future Technologies',
  args: {
    config: futureConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration showcasing future payment technologies including cryptocurrency, mobile wallets, and digital payment platforms.',
      },
    },
  },
};

// Strict Compliance Configuration
const strictComplianceConfig: RecipientsConfig = {
  availablePaymentMethods: ['WIRE', 'FEDWIRE', 'ACH'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    WIRE: {
      ...defaultPaymentMethodConfigs.WIRE,
      enabled: true,
      requiredFields: [
        ...defaultPaymentMethodConfigs.WIRE.requiredFields,
        'partyDetails.contacts.EMAIL.value',
        'partyDetails.contacts.PHONE.value',
        'account.bankAddress',
      ],
    },
    FEDWIRE: { ...defaultPaymentMethodConfigs.FEDWIRE, enabled: true },
    ACH: {
      ...defaultPaymentMethodConfigs.ACH,
      enabled: true,
      requiredFields: [
        ...defaultPaymentMethodConfigs.ACH.requiredFields,
        'partyDetails.contacts.EMAIL.value',
        'partyDetails.address.addressLine1',
        'partyDetails.address.city',
        'partyDetails.address.state',
      ],
    },
  },
  globalSettings: {
    allowMultiplePaymentMethods: false,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: true,
    maxContactsPerRecipient: 3,
    enableDuplicateDetection: true,
    enableAddressValidation: true,
  },
  uiSettings: {
    showPaymentMethodIcons: false,
    showCharacteristics: false,
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'accordion',
    enableProgressIndicator: true,
  },
};

export const StrictCompliance: Story = {
  name: 'Strict Compliance',
  args: {
    config: strictComplianceConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'High-compliance configuration with strict validation requirements, mandatory contact information, and enhanced verification.',
      },
    },
  },
};

// Minimal Configuration
const minimalConfig: RecipientsConfig = {
  availablePaymentMethods: ['EMAIL'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    EMAIL: { ...defaultPaymentMethodConfigs.EMAIL, enabled: true },
  },
  globalSettings: {
    allowMultiplePaymentMethods: false,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: false,
    maxContactsPerRecipient: 1,
    enableDuplicateDetection: false,
    enableAddressValidation: false,
  },
  uiSettings: {
    showPaymentMethodIcons: false,
    showCharacteristics: false,
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'single-page',
    enableProgressIndicator: false,
  },
};

export const MinimalSetup: Story = {
  name: 'Minimal Setup',
  args: {
    config: minimalConfig,
    showCreateButton: true,
    enableVerification: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Minimal configuration with only email payments, simplified UI, and reduced validation requirements.',
      },
    },
  },
};

// Enterprise Configuration with All Features
const enterpriseConfig: RecipientsConfig = {
  availablePaymentMethods: [
    'ACH',
    'WIRE',
    'RTP',
    'FEDWIRE',
    'INTERNATIONAL',
    'SWIFT',
    'EMAIL',
    'CHECK',
    'INSTANT',
  ] as PaymentMethodType[],
  paymentMethodConfigs: Object.fromEntries(
    (
      [
        'ACH',
        'WIRE',
        'RTP',
        'FEDWIRE',
        'INTERNATIONAL',
        'SWIFT',
        'EMAIL',
        'CHECK',
        'INSTANT',
      ] as PaymentMethodType[]
    ).map((method) => [
      method,
      { ...defaultPaymentMethodConfigs[method], enabled: true },
    ])
  ) as any,
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
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

export const EnterpriseComplete: Story = {
  name: 'Enterprise Complete',
  args: {
    config: enterpriseConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete enterprise configuration with all available payment methods, full feature set, and comprehensive validation.',
      },
    },
  },
};
