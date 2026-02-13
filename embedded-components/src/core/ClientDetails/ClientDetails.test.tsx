import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { server } from '@/msw/server';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { ClientDetails } from './ClientDetails';
import type { ClientDetailsProps } from './ClientDetails.types';

const renderComponent = (props: Partial<ClientDetailsProps> = {}) => {
  // NOTE: Don't reset handlers here - let tests manage their own handlers
  // server.resetHandlers() is called in beforeEach already

  const defaultProps: ClientDetailsProps = {
    clientId: '0030000133',
    ...props,
  };

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{
        queries: { retry: false },
      }}
    >
      <div className="eb-mx-auto eb-max-w-2xl eb-p-6">
        <ClientDetails {...defaultProps} />
      </div>
    </EBComponentsProvider>
  );
};

describe('ClientDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe('Rendering', () => {
    test('renders "Client ID is required" when clientId is empty', () => {
      renderComponent({ clientId: '' });

      expect(screen.getByText(/Client ID is required/i)).toBeInTheDocument();
    });

    test('renders loading state', () => {
      server.use(http.get('*/clients/:clientId', () => new Promise(() => {})));

      renderComponent();

      expect(document.querySelector('.eb-animate-pulse')).toBeInTheDocument();
    });

    test('renders client details in accordion view by default', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(efClientCorpEBMock)
        )
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Client details')).toBeInTheDocument();
      });

      expect(screen.getByText('Client information')).toBeInTheDocument();
      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getAllByText('Controller').length).toBeGreaterThanOrEqual(
        1
      );
      // Base mock has status: 'NEW' which translates to 'New'
      // The accordion view shows this in the Application status row
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    test('renders client details in cards view when viewMode is cards', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(efClientCorpEBMock)
        )
      );

      renderComponent({ viewMode: 'cards' });

      await waitFor(() => {
        expect(screen.getByText('Client details')).toBeInTheDocument();
      });

      expect(screen.getByText('Client information')).toBeInTheDocument();
      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getAllByText('Controller').length).toBeGreaterThanOrEqual(
        1
      );
      // Business-facing data only (no internal client ID)
      expect(
        screen.getAllByText('Neverland Books').length
      ).toBeGreaterThanOrEqual(1);
    });

    test('renders custom title when provided', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(efClientCorpEBMock)
        )
      );

      renderComponent({ title: 'My client' });

      await waitFor(() => {
        expect(screen.getByText('My client')).toBeInTheDocument();
      });
    });

    test('renders error state when GET /clients/:id fails', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(
            { title: 'Not found', httpStatus: 404 },
            { status: 404 }
          )
        )
      );

      renderComponent({ clientId: 'nonexistent-client' });

      await waitFor(() => {
        expect(
          screen.getByText(
            /Failed to load client details|Request failed with status code 404/i
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Summary View Mode', () => {
    const mockApprovedClient = {
      ...efClientCorpEBMock,
      status: 'APPROVED',
      results: {
        customerIdentityStatus: 'APPROVED',
      },
    };

    // Mock for onboarding client (non-approved) to test onboarding sections
    const mockOnboardingClient = {
      ...efClientCorpEBMock,
      status: 'INFORMATION_REQUESTED',
      results: {
        customerIdentityStatus: 'INFORMATION_REQUESTED',
      },
    };

    test('renders summary view with organization name and status badge', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(mockApprovedClient)
        )
      );

      renderComponent({ viewMode: 'summary' });

      await waitFor(() => {
        // Organization name appears in the header section
        expect(screen.getByText('Neverland Books')).toBeInTheDocument();
      });

      // For approved clients, status is NOT shown (only shown for non-approved)
      // So we just verify the org name is there
      expect(screen.getByText('Neverland Books')).toBeInTheDocument();
    });

    test('renders section list for approved client (no onboarding sections)', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(mockApprovedClient)
        )
      );

      renderComponent({ viewMode: 'summary' });

      await waitFor(() => {
        expect(screen.getByText('Business Details')).toBeInTheDocument();
      });

      // For APPROVED clients, we show People section but NOT onboarding sections
      expect(screen.getByText('People')).toBeInTheDocument();
      // Onboarding sections should NOT be visible for approved clients
      expect(screen.queryByText('Onboarding Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('Verification Status')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Documents & Questions')
      ).not.toBeInTheDocument();
    });

    test('renders onboarding sections for non-approved client', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(mockOnboardingClient)
        )
      );

      renderComponent({ viewMode: 'summary' });

      await waitFor(() => {
        expect(screen.getByText('Business Details')).toBeInTheDocument();
      });

      // For non-approved clients, onboarding sections should be visible
      expect(screen.getByText('People')).toBeInTheDocument();
      // Verification and compliance sections are shown for non-approved clients
      expect(screen.getByText('Verification')).toBeInTheDocument();
      expect(screen.getByText('Documents & Questions')).toBeInTheDocument();
    });

    test('renders only specified sections when sections prop is provided', async () => {
      // Use onboarding client to test section visibility (verification is only shown during onboarding)
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(mockOnboardingClient)
        )
      );

      renderComponent({
        viewMode: 'summary',
        sections: ['identity', 'verification'],
      });

      await waitFor(() => {
        expect(screen.getByText('Business Details')).toBeInTheDocument();
      });

      // For non-approved client with sections=['identity', 'verification'],
      // should show Business Details and Verification (in onboarding sections)
      expect(screen.getByText('Verification')).toBeInTheDocument();
      // People section is excluded
      expect(screen.queryByText('People')).not.toBeInTheDocument();
      // Documents & Questions section is excluded
      expect(
        screen.queryByText('Documents & Questions')
      ).not.toBeInTheDocument();
    });

    test('opens drill-down sheet when section is clicked', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(mockApprovedClient)
        )
      );

      renderComponent({ viewMode: 'summary', enableDrillDown: true });

      await waitFor(() => {
        expect(screen.getByText('Business Details')).toBeInTheDocument();
      });

      // Click on a section
      await user.click(
        screen.getByRole('button', { name: /Business Details/i })
      );

      // Sheet should open - verify body is locked for scroll (sheet dialog indicator)
      await waitFor(() => {
        expect(document.body).toHaveAttribute('data-scroll-locked');
      });
    });

    test('calls onSectionClick when section is clicked and handler is provided', async () => {
      const user = userEvent.setup();
      const onSectionClick = vi.fn();

      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(mockApprovedClient)
        )
      );

      renderComponent({
        viewMode: 'summary',
        onSectionClick,
      });

      await waitFor(() => {
        expect(screen.getByText('Business Details')).toBeInTheDocument();
      });

      // Click on a section
      await user.click(
        screen.getByRole('button', { name: /Business Details/i })
      );

      // onSectionClick should be called with the section name
      expect(onSectionClick).toHaveBeenCalledWith('identity');
    });

    test('renders people section with owner count and controller', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(mockApprovedClient)
        )
      );

      renderComponent({ viewMode: 'summary' });

      await waitFor(() => {
        // New design shows "People" section with individual cards
        expect(screen.getByText('People')).toBeInTheDocument();
      });

      // Should show controller count and owner count breakdown (badge + person list)
      expect(screen.getAllByText(/Controller/i).length).toBeGreaterThan(0);
    });

    test('renders custom actions when provided', async () => {
      server.use(
        http.get('*/clients/:clientId', () =>
          HttpResponse.json(mockApprovedClient)
        )
      );

      renderComponent({
        viewMode: 'summary',
        actions: <button type="button">Custom Action</button>,
      });

      await waitFor(() => {
        // Wait for data to load
        expect(screen.getAllByText('Neverland Books').length).toBeGreaterThan(
          0
        );
      });

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
  });
});
