import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { userEvent } from '@test-utils';

import { ClientProduct } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { OnboardingContextProvider } from '../OnboardingContextProvider/OnboardingContextProvider';
import { Jurisdiction } from '../utils/types';
import { OrganizationStepForm } from './OrganizationStepForm';

// Mock the useStepper hook
vi.mock('@/components/ui/stepper', () => ({
  useStepper: () => ({ nextStep: vi.fn() }),
}));

// Mock the OnboardingContextProvider
const mockOnboardingContext = {
  initialClientId: '0030000133',
  onPostClientResponse: vi.fn(),
  availableJurisdictions: ['US' as Jurisdiction],
  availableProducts: ['EMBEDDED_PAYMENTS' as ClientProduct],
  usePartyResource: true,
};

const queryClient = new QueryClient();

const renderComponent = () => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  // Setup explicit handlers
  server.use(
    http.get('/clients/:clientId', () => {
      return HttpResponse.json(efClientCorpEBMock);
    }),

    http.post('/clients/:clientId', () => {
      return HttpResponse.json(efClientCorpEBMock);
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
          <OrganizationStepForm />
        </QueryClientProvider>
      </OnboardingContextProvider>
    </EBComponentsProvider>
  );
};

describe('OrganizationStepForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('validates organization name is required', async () => {
    // Arrange
    renderComponent();
    const organizationNameInput =
      await screen.findByDisplayValue('Neverland Books');

    // Act
    await userEvent.clear(organizationNameInput);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/Business name must be at least 2 characters/i)
    ).toBeInTheDocument();
  }, 15000);

  test('validates organization email format', async () => {
    // Arrange
    renderComponent();
    const emailInput = await screen.findByDisplayValue(
      'info@Neverlandbooks.com'
    );

    // Act
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/Invalid email address/i)
    ).toBeInTheDocument();
  });

  test('validates year of formation format', async () => {
    // Arrange
    renderComponent();
    const yearInput = await screen.findByDisplayValue('1989');

    // Act
    await userEvent.clear(yearInput);
    await userEvent.type(yearInput, '202'); // Invalid year
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/Invalid year of formation/i)
    ).toBeInTheDocument();
  });

  test('validates phone number format', async () => {
    // Arrange
    renderComponent();
    const phoneInput = await screen.findByDisplayValue('(760) 681-0558');

    // Act
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '123'); // Invalid phone
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/Invalid phone number/i)
    ).toBeInTheDocument();
  });

  test('validates postal code format', async () => {
    // Arrange
    renderComponent();
    const postalCodeInput = await screen.findByDisplayValue('90068');

    // Act
    await userEvent.clear(postalCodeInput);
    await userEvent.type(postalCodeInput, '1234'); // Invalid postal code
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(
      await screen.findByText(/Invalid US postal code format/i)
    ).toBeInTheDocument();
  });

  test('validates website URL format when website is available', async () => {
    // Arrange
    renderComponent();
    const websiteInput = await screen.findByDisplayValue(
      'https://www.Neverlandbooks.com'
    );

    // Act
    await userEvent.clear(websiteInput);
    await userEvent.type(websiteInput, 'invalid-url');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Assert
    expect(await screen.findByText(/Invalid URL/i)).toBeInTheDocument();
  });

  test('validates website URL must start with https://', async () => {
    renderComponent();
    const websiteInput = await screen.findByDisplayValue(
      'https://www.Neverlandbooks.com'
    );

    await userEvent.clear(websiteInput);
    await userEvent.type(websiteInput, 'http://example.com');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(
      await screen.findByText('ⓘ Website URL must start with https://')
    ).toBeInTheDocument();
  });

  test('validates website URL cannot be an IP address', async () => {
    renderComponent();
    const websiteInput = await screen.findByDisplayValue(
      'https://www.Neverlandbooks.com'
    );

    await userEvent.clear(websiteInput);
    await userEvent.type(websiteInput, 'https://192.168.1.1');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(
      await screen.findByText(/Website URL cannot be an IP address/i)
    ).toBeInTheDocument();
  });

  test('validates website URL cannot exceed 500 characters', async () => {
    renderComponent();
    const websiteInput = await screen.findByDisplayValue(
      'https://www.Neverlandbooks.com'
    );

    await userEvent.clear(websiteInput);
    await userEvent.type(websiteInput, `https://www.${'a'.repeat(500)}.com`);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(
      await screen.findByText(/Website URL must be 500 characters or less/i)
    ).toBeInTheDocument();
  }, 30000);

  test('accepts valid https website URL', async () => {
    renderComponent();
    const websiteInput = await screen.findByDisplayValue(
      'https://www.Neverlandbooks.com'
    );

    await userEvent.clear(websiteInput);
    await userEvent.type(websiteInput, 'https://www.validwebsite.com');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Should not show any validation errors for the website field
    expect(screen.queryByText(/Invalid URL/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Website must start with https:\/\//i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/IP addresses are not allowed/i)
    ).not.toBeInTheDocument();
  });
});
