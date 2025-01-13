import { efClientSolPropWithMoreData } from '@/mocks/efClientSolPropWithMoreData.mock';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { userEvent } from '@test-utils';

import { ClientProduct } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { OnboardingContextProvider } from '../OnboardingContextProvider/OnboardingContextProvider';
import { Jurisdiction } from '../utils/types';
import { IndividualStepForm } from './IndividualStepForm';

// Mock the useStepper hook
vi.mock('@/components/ui/stepper', () => ({
  useStepper: () => ({ nextStep: vi.fn() }),
}));

// Mock the OnboardingContextProvider
const mockOnboardingContext = {
  initialClientId: '0030000129',
  onPostClientResponse: vi.fn(),
  availableJurisdictions: ['US' as Jurisdiction],
  availableProducts: ['EMBEDDED_PAYMENTS' as ClientProduct],
};

const queryClient = new QueryClient();

const renderComponent = () => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  // Setup explicit handlers
  server.use(
    http.get('/clients/:clientId', () => {
      return HttpResponse.json(efClientSolPropWithMoreData);
    })
  );

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{
        name: 'enUS',
      }}
    >
      <OnboardingContextProvider {...mockOnboardingContext}>
        <QueryClientProvider client={queryClient}>
          <IndividualStepForm />
        </QueryClientProvider>
      </OnboardingContextProvider>
    </EBComponentsProvider>
  );
};

describe.skip('IndividualStepForm', () => {
  test('renders the form with prefilled data and submits successfully', async () => {
    renderComponent();

    // Check if form is pre-filled with mock data
    expect(screen.getByLabelText(/address type/i)).toBeInTheDocument();
    expect(await screen.findByDisplayValue(/Monica/i)).toBeInTheDocument();
    // Submit form
    userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Verify submission
    await waitFor(() => {
      expect(mockOnboardingContext.onPostClientResponse).toHaveBeenCalled();
    });
  });
});
