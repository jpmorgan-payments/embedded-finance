import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { Accounts } from './Accounts';

const queryClient = new QueryClient();

const renderComponent = (
  props: Partial<React.ComponentProps<typeof Accounts>> = {}
) => {
  server.resetHandlers();

  const defaultProps: React.ComponentProps<typeof Accounts> = {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    ...props,
  };

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
    >
      <QueryClientProvider client={queryClient}>
        <div className="eb-mx-auto eb-max-w-2xl eb-p-6">
          <Accounts {...defaultProps} />
        </div>
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

describe('Accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Rendering', () => {
    test('renders loading state', () => {
      server.use(http.get('*/accounts', () => new Promise(() => {})));

      renderComponent();

      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });

    test('renders empty state when no accounts found', async () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json({ items: [] }))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No accounts found.')).toBeInTheDocument();
      });
    });

    test('renders with default title', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json({ items: [] }))
      );

      renderComponent();

      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });

    test('renders with custom title', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json({ items: [] }))
      );

      renderComponent({ title: 'My Accounts' });

      expect(screen.getByText('My Accounts')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('accepts LIMITED_DDA category', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json({ items: [] }))
      );

      renderComponent({ allowedCategories: ['LIMITED_DDA'] });

      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });

    test('accepts LIMITED_DDA_PAYMENTS category', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json({ items: [] }))
      );

      renderComponent({ allowedCategories: ['LIMITED_DDA_PAYMENTS'] });

      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });

    test('accepts both categories', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json({ items: [] }))
      );

      renderComponent({
        allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
      });

      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });
  });

  describe('With clientId filter', () => {
    test('renders when clientId is provided', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json({ items: [] }))
      );

      renderComponent({ clientId: 'client-001' });

      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });

    test('renders when clientId is not provided', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json({ items: [] }))
      );

      renderComponent();

      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });
  });
});
