import { http, HttpResponse } from 'msw';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SELLSENSE_THEME } from '@storybook/themes';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import type { EBTheme } from '@/core/EBComponentsProvider/config.types';

import { IndirectOwnership } from '../IndirectOwnership';
import {
  efClientComplexOwnership,
  efClientEmptyOwnership,
  efClientIncompleteOwnership,
  efClientMultipleValidationErrors,
  efClientNeedsOwnershipInfo,
  efClientRemovalTest,
  efClientTooManyOwners,
} from '../mocks';

interface IndirectOwnershipWithProviderProps {
  apiBaseUrl: string;
  headers?: Record<string, string>;
  theme?: EBTheme;
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
        // Mock the SMBDO Get Client API to return Central Perk's 3-layer ownership structure
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
 * Empty State story shows Central Perk Coffee & Cookies when it has no ownership
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
        // Mock the SMBDO Get Client API to return Central Perk with no ownership structure
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
 * Information Requested state shows Central Perk Coffee & Cookies when it has been created
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
        // Mock the SMBDO Get Client API to return Central Perk that needs ownership info
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
 * Read Only state shows Central Perk Coffee & Cookies when it has ownership structure
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
        // Mock the SMBDO Get Client API to return Central Perk in read-only mode
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
 * This story demonstrates the validation error using Central Perk's structure when
 * entities do not have identified beneficial owners (individuals).
 *
 * The scenario shows:
 * - Central Perk Coffee & Central Perk Cookies without beneficial owners
 * - Red error alert at the top explaining the issue
 * - Orange warning badges on entities that need beneficial owners
 * - Orange borders around problematic entities
 * - Blocked form submission until issues are resolved
 *
 * Error Type: INCOMPLETE_BENEFICIAL_OWNERSHIP
 * Trigger: Central Perk Coffee and Central Perk Cookies entities without individual children
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
        // Mock the SMBDO Get Client API to return Central Perk with incomplete ownership
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
 * Validation Error: Too Many Beneficial Owners (Friends Characters)
 *
 * This story demonstrates the validation error using all main Friends characters
 * when there are more than 4 individual beneficial owners.
 *
 * The scenario shows:
 * - Central Perk structure with Monica, Ross, Rachel, Chandler, and Joey (5 total)
 * - Mixed direct and indirect ownership through Central Perk entities
 * - Red error alert explaining the mathematical impossibility
 * - Disabled "Add Individual Owner" buttons
 * - Warning text about reaching the 4-owner limit
 * - Clear explanation that each owner must have ≥25% ownership
 *
 * Error Type: TOO_MANY_BENEFICIAL_OWNERS
 * Trigger: 5 Friends characters as beneficial owners (exceeds 4-person limit)
 * Mathematical Logic: 5 owners × 25% minimum = 125% > 100% (impossible)
 * Structure: Monica, Ross direct + Rachel, Chandler indirect + Joey direct = 5 total
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
        // Mock the SMBDO Get Client API to return Central Perk with too many owners (Friends characters)
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
 * Validation Error: Multiple Issues Combined (Friends Chaos)
 *
 * This story demonstrates the "worst case" scenario using Friends characters where BOTH validation
 * errors occur simultaneously in Central Perk's ownership structure.
 *
 * The scenario shows:
 * - All Friends characters as beneficial owners (Monica, Ross, Rachel, Chandler, Joey)
 * - Central Perk Merchandise entity without beneficial owners
 * - Multiple error messages in the red alert box
 * - Both types of visual warnings (orange borders, badges, disabled buttons)
 * - Comprehensive error state with clear guidance for resolution
 * - Blocked functionality until all issues are resolved
 *
 * Error Types:
 * 1. TOO_MANY_BENEFICIAL_OWNERS (5 Friends characters > 4 limit)
 * 2. INCOMPLETE_BENEFICIAL_OWNERSHIP (Central Perk Merchandise without individuals)
 *
 * This story shows how the component handles multiple simultaneous validation failures.
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
        // Mock the SMBDO Get Client API to return Central Perk with multiple validation errors
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

/**
 * Node Removal Testing Story
 *
 * This story demonstrates the enhanced removal functionality using the Central Perk
 * structure from the documentation. It provides a comprehensive test environment
 * for validating removal scenarios with nested entities.
 *
 * Test Scenarios Available:
 * 1. **Remove Direct Individual**: Monica Gellar can be removed (direct owner)
 * 2. **Remove Individual from Entity**: Ross Gellar can be removed from Central Perk Coffee (will trigger orphan warning)
 * 3. **Remove Nested Individual**: Rachel Green can be removed from Cookie Co. (nested structure)
 * 4. **Remove Entire Entity**: Central Perk Coffee can be removed (removes Ross Gellar too)
 * 5. **Remove Nested Entity Chain**: Central Perk Cookies can be removed (removes Cookie Co. and Rachel Green)
 * 6. **Complex Nested Structure**: Cookie Co. demonstrates multi-level entity nesting
 *
 * Expected Behaviors:
 * - Delete buttons appear on removable parties with red styling
 * - Root client (Central Perk Coffee & Cookies) cannot be removed
 * - Confirmation dialogs show appropriate messaging for individuals vs entities
 * - Cascade warnings appear when removing entities with children
 * - Orphan warnings appear when removing last individual from entity
 * - Successful removal updates the tree structure immediately
 */
export const NodeRemovalTesting: Story = {
  args: {
    apiBaseUrl: 'https://api.example.com',
    headers: { Authorization: 'Bearer demo-token' },
    theme: SELLSENSE_THEME,
    clientId: 'removal-test-client-001',
    showVisualization: true,
    maxDepth: 10,
    readOnly: false,
  },
  parameters: {
    msw: {
      handlers: [
        // Mock the SMBDO Get Client API to return client designed for removal testing
        http.get('*/clients/removal-test-client-001', () => {
          return HttpResponse.json(efClientRemovalTest);
        }),
        // Mock the SMBDO Update Client API
        http.put('*/clients/removal-test-client-001', () => {
          return HttpResponse.json(efClientRemovalTest);
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
