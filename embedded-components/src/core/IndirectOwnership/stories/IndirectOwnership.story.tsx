import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { SELLSENSE_THEME } from '@/core/themes';

import { IndirectOwnership } from '../IndirectOwnership';
import { 
  efClientEmptyOwnership, 
  efClientNeedsOwnershipInfo, 
  efClientComplexOwnership,
  efClientIncompleteOwnership,
  efClientTooManyOwners,
  efClientMultipleValidationErrors 
} from '../mocks';

interface IndirectOwnershipWithProviderProps {
  apiBaseUrl: string;
  headers?: Record<string, string>;
  theme?: any;
  clientId?: string;
  showVisualization?: boolean;
  maxDepth?: number;
  readOnly?: boolean;
}



const IndirectOwnershipWithProvider = ({
  apiBaseUrl,
  headers,
  theme,
  clientId,
  showVisualization,
  maxDepth,
  readOnly,
}: IndirectOwnershipWithProviderProps) => {
  return (
    <EBComponentsProvider
      apiBaseUrl={apiBaseUrl}
      headers={headers || {}}
      theme={theme || SELLSENSE_THEME}
    >
      <IndirectOwnership
        clientId={clientId}
        showVisualization={showVisualization}
        maxDepth={maxDepth}
        readOnly={readOnly}
      />
    </EBComponentsProvider>
  );
};

const meta: Meta<typeof IndirectOwnershipWithProvider> = {
  title: 'Core/IndirectOwnership',
  component: IndirectOwnershipWithProvider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['@core', '@indirect-ownership', '@onboarding'],
  argTypes: {
    clientId: {
      control: 'text',
      description: 'Client ID for which to manage ownership structure',
    },
    showVisualization: {
      control: 'boolean',
      description: 'Show/hide the ownership tree visualization',
    },
    maxDepth: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Maximum depth of ownership hierarchy to display',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the component is in read-only mode',
    },
  },
};

export default meta;

type Story = StoryObj<typeof IndirectOwnershipWithProvider>;

export const Default: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'complex-ownership-client-001',
    showVisualization: true,
    maxDepth: 10,
    readOnly: false,
  },
  parameters: {
    msw: {
      handlers: [
        // Mock the SMBDO Get Client API to return a complex 3-layer ownership structure
        http.get('*/clients/complex-ownership-client-001', () => {
          return HttpResponse.json(efClientComplexOwnership);
        }),
        // Mock the SMBDO Update Client API
        http.put('*/clients/complex-ownership-client-001', () => {
          return HttpResponse.json(efClientComplexOwnership);
        }),
        // Mock the List Questions API with no outstanding questions
        http.get('*/questions', () => {
          return HttpResponse.json({
            questions: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
            },
          });
        }),
      ],
    },
  },
};

/**
 * Empty State story shows the component when a client exists but has no ownership
 * structure defined yet. This is the typical starting point for users who need to
 * add their first entities or individuals with ownership interest.
 * 
 * In this state, the component shows:
 * - Empty state messaging encouraging users to get started
 * - Action buttons to add entities or individuals
 * - Clear guidance on next steps
 */
export const EmptyState: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'empty-ownership-client-001',
    showVisualization: true,
    maxDepth: 10,
    readOnly: false,
  },
  parameters: {
    msw: {
      handlers: [
        // Mock the SMBDO Get Client API to return a client with no ownership structure
        http.get('*/clients/empty-ownership-client-001', () => {
          return HttpResponse.json(efClientEmptyOwnership);
        }),
        // Mock the SMBDO Update Client API (for potential future interactions)
        http.put('*/clients/empty-ownership-client-001', () => {
          return HttpResponse.json(efClientEmptyOwnership);
        }),
        // Mock the List Questions API to return empty questions
        http.get('*/questions', () => {
          return HttpResponse.json({
            questions: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
            },
          });
        }),
      ],
    },
  },
};

/**
 * Information Requested state shows the component when a client has been created
 * but is specifically flagged as needing additional ownership information for
 * compliance purposes. This represents a more urgent empty state where action
 * is required to proceed with onboarding.
 * 
 * In this state, the component shows:
 * - Clear indication that information is needed
 * - Specific validation requirements that must be addressed
 * - Urgent call-to-action messaging
 */
export const InformationRequested: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'needs-info-client-002',
    showVisualization: true,
    maxDepth: 10,
    readOnly: false,
  },
  parameters: {
    msw: {
      handlers: [
        // Mock the SMBDO Get Client API to return a client that needs ownership info
        http.get('*/clients/needs-info-client-002', () => {
          return HttpResponse.json(efClientNeedsOwnershipInfo);
        }),
        // Mock the SMBDO Update Client API
        http.put('*/clients/needs-info-client-002', () => {
          return HttpResponse.json(efClientNeedsOwnershipInfo);
        }),
        // Mock the List Questions API with ownership-specific questions
        http.get('*/questions', () => {
          return HttpResponse.json({
            questions: [
              {
                id: 'ownership-001',
                text: 'Please provide complete beneficial ownership information',
                type: 'BENEFICIAL_OWNERSHIP',
                required: true,
              },
              {
                id: 'ownership-002',
                text: 'Upload organizational structure documentation',
                type: 'DOCUMENT_UPLOAD',
                required: true,
              },
            ],
            metadata: {
              total: 2,
              page: 1,
              limit: 50,
            },
          });
        }),
      ],
    },
  },
};

/**
 * Read Only state shows the component when a client has ownership structure
 * but the component is in read-only mode, preventing modifications.
 */
export const ReadOnly: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'readonly-client-003',
    showVisualization: true,
    maxDepth: 10,
    readOnly: true,
  },
  parameters: {
    msw: {
      handlers: [
        // Mock the SMBDO Get Client API to return a basic client
        http.get('*/clients/readonly-client-003', () => {
          return HttpResponse.json(efClientEmptyOwnership);
        }),
      ],
    },
  },
};

/**
 * Validation Error: Incomplete Beneficial Ownership
 * 
 * This story demonstrates the validation error that occurs when entities
 * in the ownership structure do not have identified beneficial owners (individuals).
 * 
 * The scenario shows:
 * - Red error alert at the top explaining the issue
 * - Orange warning badges on entities that need beneficial owners
 * - Orange borders around problematic entities
 * - Blocked form submission until issues are resolved
 * 
 * Error Type: INCOMPLETE_BENEFICIAL_OWNERSHIP
 * Trigger: Entities with partyType='ORGANIZATION' and roles=['BENEFICIAL_OWNER'] 
 *          that don't have any children with partyType='INDIVIDUAL'
 */
export const ValidationErrorIncompleteOwnership: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'incomplete-ownership-client-001',
    showVisualization: true,
    maxDepth: 10,
    readOnly: false,
  },
  parameters: {
    msw: {
      handlers: [
        // Mock the SMBDO Get Client API to return client with incomplete ownership
        http.get('*/clients/incomplete-ownership-client-001', () => {
          return HttpResponse.json(efClientIncompleteOwnership);
        }),
        // Mock the SMBDO Update Client API
        http.put('*/clients/incomplete-ownership-client-001', () => {
          return HttpResponse.json(efClientIncompleteOwnership);
        }),
        // Mock the List Questions API
        http.get('*/questions', () => {
          return HttpResponse.json({
            questions: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
            },
          });
        }),
      ],
    },
  },
};

/**
 * Validation Error: Too Many Beneficial Owners (Mixed Direct/Indirect)
 * 
 * This story demonstrates the validation error that occurs when there are
 * more than 4 individual beneficial owners across both direct and indirect ownership.
 * 
 * The scenario shows:
 * - Complex ownership structure with both direct individuals and entities with indirect owners
 * - Red error alert explaining the mathematical impossibility 
 * - Disabled "Add Individual Owner" buttons
 * - Warning text about reaching the 4-owner limit
 * - Clear explanation that each owner must have ≥25% ownership
 * - Demonstrates how indirect ownership still counts toward the 4-person limit
 * 
 * Error Type: TOO_MANY_BENEFICIAL_OWNERS  
 * Trigger: More than 4 parties with partyType='INDIVIDUAL' and roles=['BENEFICIAL_OWNER']
 * Mathematical Logic: 5 owners × 25% minimum = 125% > 100% (impossible)
 * Structure: 3 direct + 2 indirect = 5 total individuals (exceeds limit)
 */
export const ValidationErrorTooManyOwners: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'too-many-owners-client-001',
    showVisualization: true,
    maxDepth: 10,
    readOnly: false,
  },
  parameters: {
    msw: {
      handlers: [
        // Mock the SMBDO Get Client API to return client with too many owners
        http.get('*/clients/too-many-owners-client-001', () => {
          return HttpResponse.json(efClientTooManyOwners);
        }),
        // Mock the SMBDO Update Client API
        http.put('*/clients/too-many-owners-client-001', () => {
          return HttpResponse.json(efClientTooManyOwners);
        }),
        // Mock the List Questions API
        http.get('*/questions', () => {
          return HttpResponse.json({
            questions: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
            },
          });
        }),
      ],
    },
  },
};

/**
 * Validation Error: Multiple Issues Combined
 * 
 * This story demonstrates the "worst case" scenario where BOTH validation
 * errors occur simultaneously in the same ownership structure.
 * 
 * The scenario shows:
 * - Multiple error messages in the red alert box
 * - Both types of visual warnings (orange borders, badges, disabled buttons)
 * - Comprehensive error state with clear guidance for resolution
 * - Blocked functionality until all issues are resolved
 * 
 * Error Types: 
 * 1. TOO_MANY_BENEFICIAL_OWNERS (5 individuals > 4 limit)
 * 2. INCOMPLETE_BENEFICIAL_OWNERSHIP (entity without individuals)
 * 
 * This story is useful for testing how the component handles multiple
 * simultaneous validation failures and ensures all error states work together.
 */
export const ValidationErrorMultipleIssues: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'multiple-errors-client-001',
    showVisualization: true,
    maxDepth: 10,
    readOnly: false,
  },
  parameters: {
    msw: {
      handlers: [
        // Mock the SMBDO Get Client API to return client with multiple validation errors
        http.get('*/clients/multiple-errors-client-001', () => {
          return HttpResponse.json(efClientMultipleValidationErrors);
        }),
        // Mock the SMBDO Update Client API
        http.put('*/clients/multiple-errors-client-001', () => {
          return HttpResponse.json(efClientMultipleValidationErrors);
        }),
        // Mock the List Questions API
        http.get('*/questions', () => {
          return HttpResponse.json({
            questions: [
              {
                id: 'validation-001',
                text: 'Please resolve ownership structure validation errors',
                type: 'BENEFICIAL_OWNERSHIP',
                required: true,
              },
            ],
            metadata: {
              total: 1,
              page: 1,
              limit: 50,
            },
          });
        }),
      ],
    },
  },
};
