import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { MakePayment } from './MakePayment';

// Mock dependencies
vi.mock('react-i18next', () => ({
  // Use actual values from make-payment.json
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        title: 'Send Money',
        description: 'Enter the payment details below.',
        'buttons.makePayment': 'Send Money',
        'buttons.confirmPayment': 'Confirm Payment',
        'buttons.makeAnotherPayment': 'Make Another Payment',
        'buttons.processing': 'Processing...',
        'success.title': 'Payment Successful!',
        'success.message': 'Your payment has been processed successfully.',
      };

      // Handle dynamic values with interpolation
      if (key === 'transferFee.label' && options?.amount) {
        return `Transfer fee: $${options.amount}`;
      }

      if (key === 'recipientGets' && options?.amount) {
        return `Recipient gets: $${options.amount}`;
      }

      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Create a mock for usePaymentForm
const mockSetValue = vi.fn();
const mockWatch = vi.fn();
const mockHandleSubmit = vi.fn();
const mockOnSubmit = vi.fn();
const mockResetForm = vi.fn();
const mockGetFieldState = vi.fn().mockImplementation(() => ({
  invalid: false,
  isDirty: false,
  isTouched: false,
  error: undefined,
}));

// Set up watch mock to return appropriate values
mockWatch.mockImplementation((field) => {
  if (field === 'amount') return '100';
  if (field === 'from') return 'account1';
  if (field === 'to') return 'linkedAccount';
  if (field === 'method') return 'ACH';
  return '';
});

// Mock the payment form hook
let mockIsSuccess = false;

vi.mock('./usePaymentForm', () => {
  return {
    usePaymentForm: () => ({
      form: {
        control: {
          // Add these fields to fix the "Cannot read properties of undefined (reading 'array')" error
          _formValues: {},
          _names: {
            array: new Set(),
            mount: new Set(),
            unMount: new Set(),
            watch: new Set(),
            focus: '',
            watchAll: false,
          },
          _defaultValues: {},
          _formState: {},
          _getWatch: () => ({}),
          _fields: {},
          register: vi.fn(),
          unregister: vi.fn(),
          getFieldState: mockGetFieldState,
          _subjects: {
            watch: { next: vi.fn() },
            array: { next: vi.fn() },
            state: { next: vi.fn() },
          },
          _proxyFormState: {},
          _removeUnmounted: vi.fn(),
          get _options() {
            return {
              shouldUnregister: false,
              shouldUseNativeValidation: false,
            };
          },
        },
        handleSubmit: mockHandleSubmit,
        watch: mockWatch,
        setValue: mockSetValue,
        getFieldState: mockGetFieldState,
        formState: {
          errors: {},
          dirtyFields: {},
          touchedFields: {},
          isSubmitting: false,
        },
      },
      onSubmit: mockOnSubmit,
      isLoading: false,
      isSuccess: mockIsSuccess,
      resetForm: mockResetForm,
    }),
  };
});

// Test data
const singleAccount = [{ id: 'account1', name: 'Main Account' }];
const singleRecipient = [
  {
    id: 'linkedAccount',
    name: 'Linked Account John Doe',
    accountNumber: '****1234',
  },
];
const singlePaymentMethod = [{ id: 'ACH', name: 'ACH', fee: 2.5 }];

describe('MakePayment Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSuccess = false;
  });

  test('renders the make payment button', () => {
    render(<MakePayment />);
    expect(
      screen.getByRole('button', { name: /send money/i })
    ).toBeInTheDocument();
  });

  test('preselects values when only one option is available', () => {
    render(
      <MakePayment
        accounts={singleAccount}
        recipients={singleRecipient}
        paymentMethods={singlePaymentMethod}
      />
    );

    // Check if setValue was called for each single option
    expect(mockSetValue).toHaveBeenCalledWith('from', 'account1');
    expect(mockSetValue).toHaveBeenCalledWith('to', 'linkedAccount');
    expect(mockSetValue).toHaveBeenCalledWith('method', 'ACH');
  });

  test.skip('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<MakePayment />);

    await user.click(screen.getByRole('button', { name: /send money/i }));

    // Dialog should be open and show the correct title
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Send Money')).toBeInTheDocument();
    expect(
      screen.getByText('Enter the payment details below.')
    ).toBeInTheDocument();
  });

  test('shows success state', async () => {
    // Set success state to true
    mockIsSuccess = true;

    const user = userEvent.setup();
    render(<MakePayment />);

    // Open the dialog
    await user.click(screen.getByRole('button', { name: /send money/i }));

    // Check for success elements with actual text from translations
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(
      screen.getByText('Your payment has been processed successfully.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /make another payment/i })
    ).toBeInTheDocument();
  });
});
