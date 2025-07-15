import {
  createMockRecipient,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import { Recipients, RecipientsProps } from '../Recipients';
import type { RecipientsConfig } from '../types/paymentConfig';
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
  title: 'Core/Recipients/Validation Scenarios',
  component: RecipientsWithProvider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Different validation scenarios for the Recipients component showcasing various field requirements, conditional logic, and validation rules.',
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

// Conditional Field Requirements Based on Payment Method
const conditionalValidationConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'WIRE', 'RTP'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    ACH: {
      ...defaultPaymentMethodConfigs.ACH,
      enabled: true,
      requiredFields: [
        'account.type',
        'account.number',
        'account.routingInformation.ACH.routingNumber',
        'partyDetails.name',
      ],
      optionalFields: ['partyDetails.address'],
    },
    WIRE: {
      ...defaultPaymentMethodConfigs.WIRE,
      enabled: true,
      requiredFields: [
        'account.number',
        'account.routingInformation.WIRE.routingNumber',
        'partyDetails.name',
        'partyDetails.address',
      ],
    },
    RTP: {
      ...defaultPaymentMethodConfigs.RTP,
      enabled: true,
      requiredFields: [
        'account.number',
        'account.routingInformation.RTP.routingNumber',
        'partyDetails.name',
      ],
    },
  },
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: false,
    requirePhoneContact: false,
    maxContactsPerRecipient: 3,
    enableDuplicateDetection: true,
    enableAddressValidation: false,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'single-page',
    enableProgressIndicator: true,
  },
};

export const ConditionalFieldRequirements: Story = {
  name: 'Conditional Field Requirements',
  args: {
    apiBaseUrl: 'https://api.example.com',
    config: conditionalValidationConfig,
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
        http.post(/.*\/recipients$/, () => {
          return HttpResponse.json(createMockRecipient());
        }),
        http.post(/.*\/recipients\/.*/, () => {
          return HttpResponse.json(createMockRecipient());
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Shows how different payment methods can have different field requirements. ACH makes address optional, while WIRE requires it.',
      },
    },
  },
};

// Enhanced Address Validation
const addressValidationConfig: RecipientsConfig = {
  availablePaymentMethods: ['WIRE', 'CHECK'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    WIRE: {
      ...defaultPaymentMethodConfigs.WIRE,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.WIRE.validations,
        'partyDetails.address.addressLine1': {
          minLength: 5,
          maxLength: 50,
          pattern: /^[a-zA-Z0-9\s\\.,#\\-]+$/,
          errorMessage:
            'Address must be 5-50 characters with only letters, numbers, spaces, and basic punctuation',
        },
        'partyDetails.address.city': {
          minLength: 2,
          maxLength: 30,
          pattern: /^[a-zA-Z\s\\.-]+$/,
          errorMessage:
            'City must be 2-30 characters with only letters, spaces, periods, and hyphens',
        },
        'partyDetails.address.state': {
          pattern: /^[A-Z]{2}$/,
          errorMessage:
            'State must be a valid 2-letter state code (e.g., CA, NY, TX)',
        },
        'partyDetails.address.postalCode': {
          pattern: /^\d{5}(-\d{4})?$/,
          errorMessage: 'ZIP code must be in format 12345 or 12345-6789',
        },
      },
    },
    CHECK: {
      ...defaultPaymentMethodConfigs.CHECK,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.CHECK.validations,
        'partyDetails.address.addressLine1': {
          minLength: 10,
          maxLength: 40,
          errorMessage:
            'Physical address must be 10-40 characters for check delivery',
        },
      },
    },
  },
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: false,
    requirePhoneContact: false,
    maxContactsPerRecipient: 2,
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

export const AddressValidation: Story = {
  name: 'Enhanced Address Validation',
  args: {
    config: addressValidationConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates enhanced address validation with format checking, length requirements, and different rules for WIRE vs CHECK payments.',
      },
    },
  },
};

// Complex Contact Validation
const contactValidationConfig: RecipientsConfig = {
  availablePaymentMethods: ['RTP', 'EMAIL', 'ZELLE'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    RTP: {
      ...defaultPaymentMethodConfigs.RTP,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.RTP.validations,
        'partyDetails.contacts.EMAIL.value': {
          pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          errorMessage: 'Please enter a valid business email address',
        },
        'partyDetails.contacts.PHONE.value': {
          pattern: /^\+1[2-9]\d{9}$/,
          errorMessage: 'US phone number must be in format +1XXXXXXXXXX',
        },
      },
      helperText: {
        'partyDetails.contacts.EMAIL.value':
          'Email will be used for payment notifications and confirmations',
        'partyDetails.contacts.PHONE.value':
          'Phone number for urgent payment-related communications',
      },
    },
    EMAIL: {
      ...defaultPaymentMethodConfigs.EMAIL,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.EMAIL.validations,
        'partyDetails.contacts.EMAIL.value': {
          pattern:
            /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.(com|org)$/,
          errorMessage:
            'Email payments only support major email providers (Gmail, Yahoo, Outlook, Hotmail, iCloud)',
        },
      },
    },
    ZELLE: {
      ...defaultPaymentMethodConfigs.ZELLE,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.ZELLE.validations,
        'partyDetails.contacts.EMAIL.value': {
          customValidator: (value) => {
            // Mock validation for Zelle enrollment
            const restrictedDomains = [
              'tempmail.com',
              '10minutemail.com',
              'guerrillamail.com',
            ];
            const domain = value?.split('@')[1];
            if (restrictedDomains.includes(domain)) {
              return 'Temporary email addresses are not allowed for Zelle payments';
            }
            return true;
          },
        },
      },
      helperText: {
        'partyDetails.contacts.EMAIL.value':
          'Must be an email address registered with Zelle',
      },
    },
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

export const ContactValidation: Story = {
  name: 'Complex Contact Validation',
  args: {
    config: contactValidationConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows advanced contact validation including email domain restrictions, phone number formatting, and custom validation logic.',
      },
    },
  },
};

// Business vs Individual Validation
const businessIndividualConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'WIRE'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    ACH: {
      ...defaultPaymentMethodConfigs.ACH,
      enabled: true,
      fieldDependencies: {
        'partyDetails.firstName': {
          dependsOn: 'partyDetails.type',
          condition: (value) => value === 'INDIVIDUAL',
          whenTrue: 'require',
          whenFalse: 'hide',
        },
        'partyDetails.lastName': {
          dependsOn: 'partyDetails.type',
          condition: (value) => value === 'INDIVIDUAL',
          whenTrue: 'require',
          whenFalse: 'hide',
        },
        'partyDetails.businessName': {
          dependsOn: 'partyDetails.type',
          condition: (value) => value === 'ORGANIZATION',
          whenTrue: 'require',
          whenFalse: 'hide',
        },
        'partyDetails.taxId': {
          dependsOn: 'partyDetails.type',
          condition: (value) => value === 'ORGANIZATION',
          whenTrue: 'show',
          whenFalse: 'hide',
        },
      },
      validations: {
        ...defaultPaymentMethodConfigs.ACH.validations,
        'partyDetails.firstName': {
          minLength: 2,
          maxLength: 50,
          pattern: /^[a-zA-Z\s\\.-]+$/,
          errorMessage:
            'First name must be 2-50 characters with only letters, spaces, periods, and hyphens',
        },
        'partyDetails.lastName': {
          minLength: 2,
          maxLength: 50,
          pattern: /^[a-zA-Z\s\\.-]+$/,
          errorMessage:
            'Last name must be 2-50 characters with only letters, spaces, periods, and hyphens',
        },
        'partyDetails.businessName': {
          minLength: 2,
          maxLength: 100,
          pattern: /^[a-zA-Z0-9\s\\.,&'-]+$/,
          errorMessage: 'Business name must be 2-100 characters',
        },
      },
    },
    WIRE: {
      ...defaultPaymentMethodConfigs.WIRE,
      enabled: true,
      fieldDependencies: {
        'partyDetails.businessLicense': {
          dependsOn: 'partyDetails.type',
          condition: (value) => value === 'ORGANIZATION',
          whenTrue: 'show',
          whenFalse: 'hide',
        },
      },
    },
  },
  globalSettings: {
    allowMultiplePaymentMethods: true,
    defaultCountryCode: 'US',
    defaultCurrency: 'USD',
    requireEmailContact: true,
    requirePhoneContact: false,
    maxContactsPerRecipient: 3,
    enableDuplicateDetection: true,
    enableAddressValidation: false,
  },
  uiSettings: {
    showPaymentMethodIcons: true,
    showCharacteristics: true,
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'accordion',
    enableProgressIndicator: true,
  },
};

export const BusinessVsIndividual: Story = {
  name: 'Business vs Individual Validation',
  args: {
    config: businessIndividualConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates conditional field requirements and validation based on whether the recipient is a business or individual.',
      },
    },
  },
};

// International Payment Validation
const internationalValidationConfig: RecipientsConfig = {
  availablePaymentMethods: ['INTERNATIONAL', 'SWIFT', 'SEPA'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    INTERNATIONAL: {
      ...defaultPaymentMethodConfigs.INTERNATIONAL,
      enabled: true,
      countryOverrides: {
        GB: {
          requiredFields: [
            'account.routingInformation.SORT_CODE.routingNumber',
            'account.number',
          ],
          optionalFields: [],
          validations: {
            'account.routingInformation.SORT_CODE.routingNumber': {
              pattern: /^\d{6}$/,
              errorMessage: 'UK Sort Code must be exactly 6 digits',
            },
            'account.number': {
              pattern: /^\d{8}$/,
              errorMessage: 'UK account number must be exactly 8 digits',
            },
          },
        },
        CA: {
          requiredFields: [
            'account.routingInformation.TRANSIT.routingNumber',
            'account.routingInformation.INSTITUTION.routingNumber',
            'account.number',
          ],
          optionalFields: [],
          validations: {
            'account.routingInformation.TRANSIT.routingNumber': {
              pattern: /^\d{5}$/,
              errorMessage: 'Canadian transit number must be exactly 5 digits',
            },
            'account.routingInformation.INSTITUTION.routingNumber': {
              pattern: /^\d{3}$/,
              errorMessage:
                'Canadian institution number must be exactly 3 digits',
            },
          },
        },
      },
    },
    SWIFT: {
      ...defaultPaymentMethodConfigs.SWIFT,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.SWIFT.validations,
        'account.routingInformation.SWIFT.swiftCode': {
          pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
          errorMessage:
            'SWIFT code must be 8 or 11 characters (e.g., CHASUS33 or CHASUS33XXX)',
        },
        'account.currencyCode': {
          pattern: /^[A-Z]{3}$/,
          errorMessage: 'Currency code must be 3 letters (e.g., USD, EUR, GBP)',
        },
      },
    },
    SEPA: {
      ...defaultPaymentMethodConfigs.SEPA,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.SEPA.validations,
        'account.routingInformation.SEPA.iban': {
          customValidator: (value) => {
            // Simplified IBAN validation
            const iban = value?.replace(/\s/g, '').toUpperCase();
            if (!iban) return 'IBAN is required';
            if (iban.length < 15 || iban.length > 34)
              return 'IBAN must be 15-34 characters';
            if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban))
              return 'Invalid IBAN format';
            return true;
          },
        },
      },
    },
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
    defaultFormLayout: 'tabs',
    enableProgressIndicator: true,
  },
};

export const InternationalValidation: Story = {
  name: 'International Payment Validation',
  args: {
    config: internationalValidationConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows country-specific validation rules for international payments including UK Sort Codes, Canadian routing, SWIFT codes, and IBAN validation.',
      },
    },
  },
};

// Error Handling and Edge Cases
const errorHandlingConfig: RecipientsConfig = {
  availablePaymentMethods: ['ACH', 'RTP'],
  paymentMethodConfigs: {
    ...defaultPaymentMethodConfigs,
    ACH: {
      ...defaultPaymentMethodConfigs.ACH,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.ACH.validations,
        'account.routingInformation.ACH.routingNumber': {
          pattern: /^\d{9}$/,
          customValidator: (value) => {
            // Mock routing number validation with checksum
            if (!value || value.length !== 9)
              return 'Routing number must be exactly 9 digits';

            // Simple checksum validation (simplified example)
            const digits = value.split('').map((d: string) => Number(d));
            const checksum =
              (3 * (digits[0] + digits[3] + digits[6]) +
                7 * (digits[1] + digits[4] + digits[7]) +
                1 * (digits[2] + digits[5] + digits[8])) %
              10;

            if (checksum !== 0)
              return 'Invalid routing number checksum. Please verify the routing number.';

            // Mock list of known invalid routing numbers
            const invalidRoutingNumbers = [
              '123456789',
              '000000000',
              '111111111',
            ];
            if (invalidRoutingNumbers.includes(value)) {
              return 'This routing number is not valid. Please check with your bank.';
            }

            return true;
          },
          errorMessage: 'Please enter a valid 9-digit routing number',
        },
        'account.number': {
          customValidator: (value) => {
            if (!value) return 'Account number is required';

            // Check for sequential numbers
            if (/^(\d)\1+$/.test(value))
              return 'Account number cannot be all the same digit';

            // Check for sequential ascending/descending
            const isSequential = value
              .split('')
              .every(
                (digit: string, i: number, arr: string[]) =>
                  i === 0 ||
                  parseInt(digit, 10) === parseInt(arr[i - 1], 10) + 1 ||
                  parseInt(digit, 10) === parseInt(arr[i - 1], 10) - 1
              );
            if (isSequential && value.length > 3)
              return 'Account number appears to be invalid';

            return true;
          },
        },
      },
      helperText: {
        'account.routingInformation.ACH.routingNumber':
          'The 9-digit number found at the bottom left of your check',
        'account.number': 'Your bank account number (usually 10-12 digits)',
      },
    },
    RTP: {
      ...defaultPaymentMethodConfigs.RTP,
      enabled: true,
      validations: {
        ...defaultPaymentMethodConfigs.RTP.validations,
        'partyDetails.contacts.EMAIL.value': {
          customValidator: (value) => {
            if (!value) return 'Email is required for RTP notifications';

            // Check for disposable email domains
            const disposableDomains = [
              'tempmail.com',
              '10minutemail.com',
              'guerrillamail.com',
              'mailinator.com',
              'throwaway.email',
            ];
            const domain = value.split('@')[1]?.toLowerCase();
            if (disposableDomains.includes(domain)) {
              return 'Disposable email addresses are not allowed for payments';
            }

            // Check for typos in common domains

            const suggestions: Record<string, string> = {
              'gmial.com': 'gmail.com',
              'gmai.com': 'gmail.com',
              'yahooo.com': 'yahoo.com',
              'outloo.com': 'outlook.com',
            };

            if (suggestions[domain]) {
              return `Did you mean ${value.replace(domain, suggestions[domain])}?`;
            }

            return true;
          },
        },
      },
    },
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
    groupPaymentMethodsByCategory: false,
    defaultFormLayout: 'single-page',
    enableProgressIndicator: true,
  },
};

export const ErrorHandling: Story = {
  name: 'Error Handling & Edge Cases',
  args: {
    config: errorHandlingConfig,
    showCreateButton: true,
    enableVerification: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates comprehensive error handling including routing number validation, checksum verification, disposable email detection, and common typo suggestions.',
      },
    },
  },
};
