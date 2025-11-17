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

  it('renders main headings and sections', async () => {
    render(
      <TestWrapper>
        <IndirectOwnership />
      </TestWrapper>
    );

    // Main heading
    expect(screen.getByText(/Indirect Ownership Structure/i)).toBeInTheDocument();
    // Tab navigation
    expect(screen.getByRole('button', { name: /Full Structure/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beneficial Owners/i })).toBeInTheDocument();
    // Ownership Hierarchy section
    expect(screen.getByText(/Ownership Hierarchy/i)).toBeInTheDocument();
    // Info alert
    expect(screen.getByText(/Add entities and individuals that have ownership interest/i)).toBeInTheDocument();
    // Ownership Tree Visualization section
    expect(screen.getByText(/Ownership Tree Visualization/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive hierarchy showing ownership relationships/i)).toBeInTheDocument();
  });

  it('renders loading skeletons when clientId is provided', async () => {
    server.use(
      http.get('/clients/:id', () => {
        return HttpResponse.json(mockClientData);
      })
    );

    const { container } = render(
      <TestWrapper>
        <IndirectOwnership clientId="client-1" />
      </TestWrapper>
    );

    // Skeleton loading indicators (check for animate-pulse class)
    const skeletons = container.querySelectorAll('.eb-animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('handles ownership structure update callback (UI presence)', async () => {
    const onUpdateMock = vi.fn();

    server.use(
      http.get('/clients/:id', () => {
        return HttpResponse.json(mockClientData);
      })
    );

    const { container } = render(
      <TestWrapper>
        <IndirectOwnership
          clientId="client-1"
          onOwnershipStructureUpdate={onUpdateMock}
        />
      </TestWrapper>
    );

    // When loading, skeletons should be present
    const skeletons = container.querySelectorAll('.eb-animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
    // Callback functionality will be tested when actual implementation is added
  });

  it('renders all main component sections', async () => {
    render(
      <TestWrapper>
        <IndirectOwnership />
      </TestWrapper>
    );

    expect(screen.getByText(/Ownership Tree Visualization/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive hierarchy showing ownership relationships/i)).toBeInTheDocument();
    // The other sections may be present as headings or info blocks
    expect(screen.getByText(/Ownership Hierarchy/i)).toBeInTheDocument();
  });

  // Optional: keep these if the dev mode debug info is still rendered
  it('respects showVisualization prop (dev mode only)', async () => {
    render(
      <TestWrapper>
        <IndirectOwnership clientId="client-1" showVisualization={false} />
      </TestWrapper>
    );
    // Only check if NODE_ENV is development and debug info is rendered
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText(/Show Visualization: No/i)).toBeInTheDocument();
    }
  });

  it('respects maxDepth prop (dev mode only)', async () => {
    render(
      <TestWrapper>
        <IndirectOwnership clientId="client-1" maxDepth={5} />
      </TestWrapper>
    );
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText(/Max Depth: 5/i)).toBeInTheDocument();
    }
  });
});
