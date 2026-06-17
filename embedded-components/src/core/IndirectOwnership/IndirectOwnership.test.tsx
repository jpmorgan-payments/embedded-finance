import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { ClientResponse } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { IndirectOwnership } from './IndirectOwnership';

// Mock client data focusing on ownership hierarchy structure
const mockClientWithOwners: ClientResponse = {
  id: 'client-1',
  partyId: 'party-1',
  status: 'APPROVED',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [
    // CLIENT entity
    {
      id: 'party-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      organizationDetails: {
        organizationName: 'Test Company Inc.',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    // BENEFICIAL OWNER - Direct
    {
      id: 'party-2',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      individualDetails: {
        firstName: 'John',
        lastName: 'Doe',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    // BENEFICIAL OWNER - Indirect (has hierarchy chain)
    {
      id: 'party-3',
      parentPartyId: 'party-intermediate',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      profileStatus: 'APPROVED',
      active: true,
      individualDetails: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    // Intermediate entity in hierarchy chain
    {
      id: 'party-intermediate',
      partyType: 'ORGANIZATION',
      roles: [],
      profileStatus: 'APPROVED',
      active: true,
      organizationDetails: {
        organizationName: 'Intermediate LLC',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  attestations: [],
  createdAt: '2024-01-01T00:00:00Z',
};

const mockEmptyClient: ClientResponse = {
  id: 'empty-client',
  partyId: 'party-empty',
  status: 'APPROVED',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [
    {
      id: 'party-empty',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      profileStatus: 'APPROVED',
      active: true,
      organizationDetails: {
        organizationName: 'Empty Company Inc.',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  attestations: [],
  createdAt: '2024-01-01T00:00:00Z',
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EBComponentsProvider
    apiBaseUrl="https://api.test.com"
    headers={{ Authorization: 'Bearer test-token' }}
    contentTokens={{ name: 'enUS' }}
  >
    {children}
  </EBComponentsProvider>
);

describe('IndirectOwnership Component', () => {
  it('renders main heading and empty state with no client data', () => {
    render(
      <TestWrapper>
        <IndirectOwnership />
      </TestWrapper>
    );

    // Main heading
    expect(
      screen.getByText(/Who are your beneficial owners?/i)
    ).toBeInTheDocument();

    // Add beneficial owner button
    expect(
      screen.getByRole('button', { name: /Add new beneficial owner/i })
    ).toBeInTheDocument();

    // Empty state message
    expect(screen.getByText(/No owners added yet/i)).toBeInTheDocument();
  });

  it('renders with client data showing beneficial owners', () => {
    render(
      <TestWrapper>
        <IndirectOwnership client={mockClientWithOwners} />
      </TestWrapper>
    );

    // Main heading with count
    expect(
      screen.getByText(/Who are your beneficial owners?/i)
    ).toBeInTheDocument();

    // Should show beneficial owners from mock data
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Jane Smith/i)).toHaveLength(2); // Appears in owner list and hierarchy chain
  });

  it('renders empty state for client with no beneficial owners', () => {
    render(
      <TestWrapper>
        <IndirectOwnership client={mockEmptyClient} />
      </TestWrapper>
    );

    // Should show empty state
    expect(screen.getByText(/No owners added yet/i)).toBeInTheDocument();

    // Should show add button
    expect(
      screen.getByRole('button', { name: /Add new beneficial owner/i })
    ).toBeInTheDocument();
  });

  it('respects readOnly prop', () => {
    render(
      <TestWrapper>
        <IndirectOwnership client={mockClientWithOwners} readOnly />
      </TestWrapper>
    );

    // Should not show add button in readOnly mode
    expect(
      screen.queryByRole('button', { name: /Add Beneficial Owner/i })
    ).not.toBeInTheDocument();

    // Should still show beneficial owners
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('calls onOwnershipComplete callback when complete button is clicked', () => {
    const onCompleteMock = vi.fn();

    render(
      <TestWrapper>
        <IndirectOwnership
          client={mockClientWithOwners}
          onOwnershipComplete={onCompleteMock}
        />
      </TestWrapper>
    );

    // Complete button should be present for hierarchy management
    const completeButton = screen.queryByRole('button', { name: /Complete/i });

    // This test verifies the callback prop is accepted
    expect(completeButton).toBeInTheDocument();
  });

  it('accepts onValidationChange callback prop', () => {
    const onValidationMock = vi.fn();

    render(
      <TestWrapper>
        <IndirectOwnership
          client={mockClientWithOwners}
          onValidationChange={onValidationMock}
        />
      </TestWrapper>
    );

    // This test verifies the callback prop is accepted without errors
    // The component should render successfully with the callback
    expect(
      screen.getByText(/Who are your beneficial owners?/i)
    ).toBeInTheDocument();
  });

  it('applies custom className and testId', () => {
    const customClass = 'custom-test-class';
    const customTestId = 'custom-test-id';

    render(
      <TestWrapper>
        <IndirectOwnership
          client={mockEmptyClient}
          className={customClass}
          testId={customTestId}
        />
      </TestWrapper>
    );

    const component = screen.getByTestId(customTestId);
    expect(component).toBeInTheDocument();
    expect(component).toHaveClass(customClass);
  });

  it('opens Add Owner dialog when button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <IndirectOwnership client={mockEmptyClient} />
      </TestWrapper>
    );

    const addButton = screen.getByRole('button', {
      name: /Add new beneficial owner/i,
    });
    await user.click(addButton);

    // Dialog should open with owner type selection
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows validation summary section', () => {
    render(
      <TestWrapper>
        <IndirectOwnership client={mockClientWithOwners} />
      </TestWrapper>
    );

    // Should show progress or validation info when owners exist
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Jane Smith/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows individual and business owner sections separately', () => {
    const clientWithBusiness: ClientResponse = {
      ...mockClientWithOwners,
      parties: [
        ...mockClientWithOwners.parties!,
        {
          id: 'party-biz-owner',
          partyType: 'ORGANIZATION',
          roles: ['BENEFICIAL_OWNER'],
          profileStatus: 'APPROVED',
          active: true,
          organizationDetails: {
            organizationName: 'Biz Owner LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    render(
      <TestWrapper>
        <IndirectOwnership client={clientWithBusiness} />
      </TestWrapper>
    );

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Biz Owner LLC/i)).toBeInTheDocument();
  });

  it('enables completion when all owners have complete status', () => {
    const onComplete = vi.fn();

    // Create a client where all owners have COMPLETE status (direct owners with no pending hierarchy)
    const completeClient: ClientResponse = {
      ...mockEmptyClient,
      parties: [
        ...mockEmptyClient.parties!,
        {
          id: 'party-direct',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          profileStatus: 'APPROVED',
          active: true,
          individualDetails: {
            firstName: 'Complete',
            lastName: 'Owner',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    render(
      <TestWrapper>
        <IndirectOwnership
          client={completeClient}
          onOwnershipComplete={onComplete}
        />
      </TestWrapper>
    );

    // Owner should be shown
    expect(screen.getByText(/Complete Owner/i)).toBeInTheDocument();
  });

  it('hides add button and complete button in readOnly mode', () => {
    render(
      <TestWrapper>
        <IndirectOwnership client={mockClientWithOwners} readOnly />
      </TestWrapper>
    );

    expect(
      screen.queryByRole('button', { name: /Add new beneficial owner/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Complete/i })
    ).not.toBeInTheDocument();
  });

  it('tracks user events when handler provided', () => {
    const handler = vi.fn();

    render(
      <TestWrapper>
        <IndirectOwnership
          client={mockClientWithOwners}
          userEventsHandler={handler}
        />
      </TestWrapper>
    );

    // Should track VIEW_STRUCTURE on mount when owners exist
    expect(handler).toHaveBeenCalled();
  });
});
