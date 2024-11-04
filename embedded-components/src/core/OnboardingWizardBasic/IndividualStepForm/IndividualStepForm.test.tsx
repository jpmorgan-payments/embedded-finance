import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

// import userEvent from '@testing-library/user-event';

import { OnboardingContextProvider } from '../OnboardingContextProvider/OnboardingContextProvider';
import { IndividualStepForm } from './IndividualStepForm';

// Mock the useStepper hook
vi.mock('@/components/ui/stepper', () => ({
  useStepper: () => ({ nextStep: vi.fn() }),
}));

// Mock the OnboardingContextProvider
const mockOnboardingContext = {
  clientId: '123',
  onPostClientResponse: vi.fn(),
};

const queryClient = new QueryClient(); // Declare and initialize queryClient

const renderComponent = () =>
  render(
    <OnboardingContextProvider
      useCase="CanadaMS"
      {...mockOnboardingContext}
      availableJurisdictions={['US']}
      availableProducts={['EMBEDDED_PAYMENTS']}
    >
      <QueryClientProvider client={queryClient}>
        <IndividualStepForm />
      </QueryClientProvider>
    </OnboardingContextProvider>
  );

describe('IndividualStepForm', () => {
  test('renders the form', () => {
    renderComponent();
    expect(screen.getByLabelText(/address type/i)).toBeInTheDocument();
  });

  // test('submits the form successfully', async () => {
  //   renderComponent();

  //   userEvent.type(await screen.findByLabelText(/ID Value/i), '123456789');

  //   userEvent.click(screen.getByRole('button', { name: /next/i }));

  //   //TODO: Fix this test

  //   /* await waitFor(() => {
  //     expect(mockOnboardingContext.onPostClientResponse).toHaveBeenCalled();
  //   }); */
  // });
});
