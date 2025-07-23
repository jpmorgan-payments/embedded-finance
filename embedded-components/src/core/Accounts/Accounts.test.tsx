import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { Accounts } from './Accounts';

describe.skip('Accounts', () => {
  const queryClient = new QueryClient();

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Accounts allowedCategories={['LIMITED_DDA']} />
      </QueryClientProvider>
    );

  test('renders loading state', () => {
    renderComponent();
    expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
  });

  // Add more tests for API, error, and data display
});
