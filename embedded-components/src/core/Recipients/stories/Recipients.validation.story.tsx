import {
  createMockRecipient,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../../EBComponentsProvider';
import { Recipients, RecipientsProps } from '../Recipients';

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
  title: 'Core/Recipients/Validation',
  component: Recipients,
  tags: ['@core', '@recipients'],
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

// Allowed: 'ACH', 'WIRE', 'RTP', 'EMAIL', 'ZELLE', 'VENMO', 'PAYPAL'

// Remove getPaymentMethodConfigs function
// Only keep stories that use getPaymentMethodConfigs and are valid
// Remove any configs or stories that do not include all required RoutingInformationTransactionType keys

export const ConditionalFieldRequirements: Story = {
  name: 'Conditional Field Requirements',
  args: {
    showCreateButton: true,
    clientId: 'client-001',
  },
  render: (args) => <RecipientsWithProvider {...args} />,
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
export const AddressValidation: Story = {
  name: 'Enhanced Address Validation',
  args: {
    showCreateButton: true,
  },
  render: (args) => <RecipientsWithProvider {...args} />,
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
export const ContactValidation: Story = {
  name: 'Complex Contact Validation',
  args: {
    showCreateButton: true,
  },
  render: (args) => <RecipientsWithProvider {...args} />,
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
export const BusinessVsIndividual: Story = {
  name: 'Business vs Individual Validation',
  args: {
    showCreateButton: true,
  },
  render: (args) => <RecipientsWithProvider {...args} />,
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
export const InternationalValidation: Story = {
  name: 'International Payment Validation',
  args: {
    showCreateButton: true,
  },
  render: (args) => <RecipientsWithProvider {...args} />,
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
export const ErrorHandling: Story = {
  name: 'Error Handling & Edge Cases',
  args: {
    showCreateButton: true,
  },
  render: (args) => <RecipientsWithProvider {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates comprehensive error handling including routing number validation, checksum verification, disposable email detection, and common typo suggestions.',
      },
    },
  },
};
