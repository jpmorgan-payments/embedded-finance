import {
  createMockRecipient,
  mockRecipientsResponse,
} from '@/mocks/recipients.mock';
import { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { Recipients } from '../Recipients';
import type { RecipientsProps } from '../Recipients.types';

/**
 * Story args interface extending base provider args
 */
interface RecipientsValidationStoryArgs
  extends BaseStoryArgs,
    RecipientsProps {}

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

const meta: Meta<RecipientsValidationStoryArgs> = {
  title: 'Core/Recipients/Validation',
  component: RecipientsStory,
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
  render: (args) => (
    <RecipientsStory
      clientId={args.clientId}
      showCreateButton={args.showCreateButton}
      userEventsToTrack={args.userEventsToTrack}
    />
  ),
};
export default meta;

type Story = StoryObj<RecipientsValidationStoryArgs>;

// Allowed: 'ACH', 'WIRE', 'RTP', 'EMAIL', 'ZELLE', 'VENMO', 'PAYPAL'

// Remove getPaymentMethodConfigs function
// Only keep stories that use getPaymentMethodConfigs and are valid
// Remove any configs or stories that do not include all required RoutingInformationTransactionType keys

export const ConditionalFieldRequirements: Story = {
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
    apiBaseUrl: 'https://api.example.com',
    showCreateButton: true,
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
export const ContactValidation: Story = {
  name: 'Complex Contact Validation',
  args: {
    apiBaseUrl: 'https://api.example.com',
    showCreateButton: true,
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
export const BusinessVsIndividual: Story = {
  name: 'Business vs Individual Validation',
  args: {
    apiBaseUrl: 'https://api.example.com',
    showCreateButton: true,
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
export const InternationalValidation: Story = {
  name: 'International Payment Validation',
  args: {
    apiBaseUrl: 'https://api.example.com',
    showCreateButton: true,
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
export const ErrorHandling: Story = {
  name: 'Error Handling & Edge Cases',
  args: {
    apiBaseUrl: 'https://api.example.com',
    showCreateButton: true,
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
