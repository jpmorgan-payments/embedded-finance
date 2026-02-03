import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { server } from '@/msw/server';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { ClientDetails } from './ClientDetails';
import type { ClientDetailsProps } from './ClientDetails.types';

const renderComponent = (props: Partial<ClientDetailsProps> = {}) => {
  server.resetHandlers();

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
      // Business-facing data only (no internal client ID; org name may be in collapsed accordion)
      expect(screen.getByText('Information requested')).toBeInTheDocument();
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
});
