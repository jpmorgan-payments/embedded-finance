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
    }),

    http.post('/clients/:clientId', () => {
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

describe('IndividualStepForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the form with prefilled data and submits successfully', async () => {
    // Arrange
    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    // Act
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    await waitFor(() => {
      expect(mockOnboardingContext.onPostClientResponse).toHaveBeenCalledWith(
        efClientSolPropWithMoreData,
        undefined
      );
    });
  });

  test.skip('validates minimum length of first and last name', async () => {
    // Arrange
    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);

    // Act
    await userEvent.type(firstNameInput, 'J');
    await userEvent.type(lastNameInput, 'D');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/First name must be at least 2 characters/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Last name must be at least 2 characters/i)
    ).toBeInTheDocument();
  });

  test.skip('validates required fields on form submission', async () => {
    // Arrange
    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);

    // Act
    await userEvent.clear(firstNameInput);
    await userEvent.clear(lastNameInput);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/first name is required/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
  });

  test('validates phone number format', async () => {
    // Arrange
    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    const phoneInput = screen.getByLabelText(/phone number/i);

    // Act
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '123'); // Too short
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/Invalid phone number/i)
    ).toBeInTheDocument();
  });

  test.skip('handles adding and removing addresses', async () => {
    // Arrange
    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    const initialAddresses = screen.getAllByText(/individual address/i);
    const initialCount = initialAddresses.length;

    // Act - Add address
    await userEvent.click(screen.getByRole('button', { name: /add address/i }));

    // Assert - New address added
    await waitFor(() => {
      const newAddresses = screen.getAllByText(/individual address/i);
      expect(newAddresses).toHaveLength(initialCount + 1);
    });

    // Act - Remove address
    const removeButtons = screen.getAllByRole('button', {
      name: /remove address/i,
    });
    await userEvent.click(removeButtons[removeButtons.length - 1]);

    // Assert - Address removed
    await waitFor(() => {
      const finalAddresses = screen.getAllByText(/individual address/i);
      expect(finalAddresses).toHaveLength(initialCount);
    });
  });

  test('validates postal code format', async () => {
    // Arrange
    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    const postalCodeInput = screen.getByLabelText(/postal code/i);

    // Act
    await userEvent.clear(postalCodeInput);
    await userEvent.type(postalCodeInput, '123'); // Invalid postal code
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/Invalid US postal code format/i)
    ).toBeInTheDocument();
  });

  test('validates SSN format in individual IDs', async () => {
    // Arrange
    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    const ssnInput = screen.getByPlaceholderText(/enter id value/i);

    // Act
    await userEvent.clear(ssnInput);
    await userEvent.type(ssnInput, '123-45-678'); // Invalid SSN
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/SSN must be exactly 9 digits/i)
    ).toBeInTheDocument();
  });

  test.skip('handles server validation errors', async () => {
    // Arrange
    server.use(
      http.post('/clients/:clientId', () => {
        return HttpResponse.json(
          {
            message: 'Validation failed',
            context: [
              {
                field: 'firstName',
                message: 'First name contains invalid characters',
              },
            ],
          },
          { status: 400 }
        );
      })
    );

    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    // Act
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/first name contains invalid characters/i)
    ).toBeInTheDocument();
  });

  test.skip('handles adding and removing individual IDs', async () => {
    // Arrange
    renderComponent();
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    const initialIds = screen.getAllByText(/individual id/i);
    const initialCount = initialIds.length;

    // Act - Add ID
    await userEvent.click(
      screen.getByRole('button', { name: /add individual id/i })
    );

    // Assert - New ID added
    await waitFor(() => {
      const newIds = screen.getAllByText(/individual id/i);
      expect(newIds).toHaveLength(initialCount + 1);
    });

    // Act - Remove ID
    const removeButtons = screen.getAllByRole('button', {
      name: /remove individual id/i,
    });
    await userEvent.click(removeButtons[removeButtons.length - 1]);

    // Assert - ID removed
    await waitFor(() => {
      const finalIds = screen.getAllByText(/individual id/i);
      expect(finalIds).toHaveLength(initialCount);
    });
  });

  test('validates date fields', async () => {
    // Arrange
    renderComponent();
    const birthDateInput = await screen.findByLabelText(/Date of birth/i);
    expect(await screen.findByDisplayValue('Monica')).toBeInTheDocument();

    // Act
    await userEvent.clear(birthDateInput);
    await userEvent.type(birthDateInput, '2030-01-01'); // Future date
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/Date of birth cannot be in the future/i)
    ).toBeInTheDocument();
  });
});
