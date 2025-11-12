import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { SELLSENSE_THEME } from '@/core/themes';

import { IndirectOwnership } from '../IndirectOwnership';
import { efClientEmptyOwnership, efClientNeedsOwnershipInfo, efClientComplexOwnership } from '../mocks';

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
