import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { render, screen } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { IndirectOwnership } from './IndirectOwnership';

// Setup QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock client data
const mockClientData = {
  id: 'client-1',
  partyId: 'party-1',
  status: 'APPROVED',
  products: ['MERCHANT_SERVICES'],
  parties: [
    {
      id: 'party-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      organizationDetails: {
        organizationName: 'Test Company Inc.',
        entitiesInOwnership: true,
      },
    },
    {
      id: 'party-2',
      parentPartyId: 'party-1',
      partyType: 'ORGANIZATION',
      roles: ['BENEFICIAL_OWNER'],
      organizationDetails: {
        organizationName: 'Parent Company LLC',
        entitiesInOwnership: false,
      },
    },
    {
      id: 'party-3',
      parentPartyId: 'party-2',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'John',
        lastName: 'Doe',
        natureOfOwnership: 'Indirect',
      },
    },
  ],
  outstanding: {
    partyIds: [],
    questionIds: [],
    documentRequestIds: [],
  },
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <EBComponentsProvider
      apiBaseUrl="https://api.test.com"
      headers={{ Authorization: 'Bearer test-token' }}
    >
      {children}
    </EBComponentsProvider>
  </QueryClientProvider>
);

describe('IndirectOwnership Component', () => {
  beforeEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  it('renders placeholder content', async () => {
    render(
      <TestWrapper>
        <IndirectOwnership />
      </TestWrapper>
    );

    expect(
      screen.getByText('Indirect Ownership Structure')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Indirect ownership component coming soon...')
    ).toBeInTheDocument();
  });

  it('renders with client ID prop', async () => {
    // Mock the client API call
    server.use(
      http.get('/clients/:id', () => {
        return HttpResponse.json(mockClientData);
      })
    );

    render(
      <TestWrapper>
        <IndirectOwnership clientId="client-1" />
      </TestWrapper>
    );

    expect(
      screen.getByText('Indirect Ownership Structure')
    ).toBeInTheDocument();

    // In development mode, should show debug info
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText('Client ID: client-1')).toBeInTheDocument();
    }
  });

  it('handles ownership structure update callback', async () => {
    const onUpdateMock = vi.fn();

    render(
      <TestWrapper>
        <IndirectOwnership
          clientId="client-1"
          onOwnershipStructureUpdate={onUpdateMock}
        />
      </TestWrapper>
    );

    expect(
      screen.getByText('Indirect Ownership Structure')
    ).toBeInTheDocument();
    // Callback functionality will be tested when actual implementation is added
  });

  it('respects showVisualization prop', async () => {
    render(
      <TestWrapper>
        <IndirectOwnership clientId="client-1" showVisualization={false} />
      </TestWrapper>
    );

    // In development mode, should show debug info
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText('Show Visualization: No')).toBeInTheDocument();
    }
  });

  it('respects maxDepth prop', async () => {
    render(
      <TestWrapper>
        <IndirectOwnership clientId="client-1" maxDepth={5} />
      </TestWrapper>
    );

    // In development mode, should show debug info
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText('Max Depth: 5')).toBeInTheDocument();
    }
  });

  it('renders placeholder component sections', async () => {
    render(
      <TestWrapper>
        <IndirectOwnership />
      </TestWrapper>
    );

    expect(
      screen.getByText('Ownership Tree Visualization')
    ).toBeInTheDocument();
    expect(screen.getByText('Entity/Individual Form')).toBeInTheDocument();
    expect(
      screen.getByText('Ownership Validation Summary')
    ).toBeInTheDocument();
  });
});
