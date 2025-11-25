import React from 'react';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { RecipientForm } from './RecipientForm';
import type { RecipientFormProps } from './RecipientForm.types';

// Mock the EBComponentsProvider to avoid complex setup
const MockEBComponentsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <EBComponentsProvider
    apiBaseUrl="/"
    headers={{}}
    contentTokens={{
      name: 'enUS',
    }}
  >
    {children}
  </EBComponentsProvider>
);

// Setup QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MockEBComponentsProvider>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </MockEBComponentsProvider>
);

// Mock props
const defaultProps: RecipientFormProps = {
  mode: 'create',
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  isLoading: false,
  showCardWrapper: false, // Easier to test without card wrapper
};

// Helper function to render component
const renderRecipientForm = (props: Partial<RecipientFormProps> = {}) => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  return render(
    <TestWrapper>
      <RecipientForm {...defaultProps} {...props} />
    </TestWrapper>
  );
};

describe('RecipientForm Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Validation Behavior', () => {
    test('shows all required field errors when submitting empty form', async () => {
      const user = userEvent.setup();
      renderRecipientForm();

      // Click Create Recipient button
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText(/form errors:/i)).toBeInTheDocument();
      });

      // Check that error summary shows multiple errors (not just one)
      const errorSummary = screen.getByText(/form errors:/i).closest('div');
      expect(errorSummary).toBeInTheDocument();

      // Verify we have multiple error list items
      const errorListItems = screen.getAllByRole('listitem');
      expect(errorListItems.length).toBeGreaterThan(1);
    });

    test('shows visual error highlighting on required fields', async () => {
      const user = userEvent.setup();
      renderRecipientForm();

      // Click Create Recipient button
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText(/form errors:/i)).toBeInTheDocument();
      });

      // Check that input fields have error styling (red border)
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const accountNumberInput = screen.getByLabelText(/account number/i);

      expect(firstNameInput).toHaveClass('eb-border-red-500');
      expect(lastNameInput).toHaveClass('eb-border-red-500');
      expect(accountNumberInput).toHaveClass('eb-border-red-500');
    });
  });

  describe('Payment Method Changes', () => {
    test('maintains validation state when payment methods change', async () => {
      const user = userEvent.setup();
      renderRecipientForm();

      // First, submit empty form to trigger validation state
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/form errors:/i)).toBeInTheDocument();
      });

      // Change payment method from ACH to WIRE by clicking the checkbox
      const wireCheckbox = screen.getByRole('checkbox', {
        name: /wire transfer/i,
      });
      await user.click(wireCheckbox);

      // Submit again
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      // Should still show validation errors (not just one field)
      await waitFor(() => {
        expect(screen.getByText(/form errors:/i)).toBeInTheDocument();
      });

      // Verify we still have multiple errors
      const errorListItems = screen.getAllByRole('listitem');
      expect(errorListItems.length).toBeGreaterThan(1);
    });

    test('creates routing number fields for selected payment methods', async () => {
      const user = userEvent.setup();
      renderRecipientForm();

      // Add WIRE payment method
      const wireCheckbox = screen.getByRole('checkbox', {
        name: /wire transfer/i,
      });
      await user.click(wireCheckbox);

      // Should have multiple routing number inputs now
      const routingInputs =
        screen.getAllByPlaceholderText(/enter routing number/i);
      expect(routingInputs.length).toBeGreaterThan(1);

      // All routing inputs should be empty strings (not undefined)
      routingInputs.forEach((input) => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Multiple Payment Methods', () => {
    test('shows validation errors for all selected payment methods', async () => {
      const user = userEvent.setup();
      renderRecipientForm();

      // Add RTP to the selected payment methods
      const rtpCheckbox = screen.getByRole('checkbox', {
        name: /real-time payments/i,
      });
      await user.click(rtpCheckbox);

      // Submit empty form
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      // Should show multiple validation errors
      await waitFor(() => {
        expect(screen.getByText(/form errors:/i)).toBeInTheDocument();
      });

      // Verify we have multiple error list items
      const errorListItems = screen.getAllByRole('listitem');
      expect(errorListItems.length).toBeGreaterThan(2);
    });
  });

  describe('Form Interaction', () => {
    test('clears errors when fields are filled correctly', async () => {
      const user = userEvent.setup();
      renderRecipientForm();

      // Submit empty form to show errors
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/form errors:/i)).toBeInTheDocument();
      });

      // Fill in first name
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'John');

      // Error should disappear for first name (check that error count decreases)
      await waitFor(() => {
        const errorListItems = screen.getAllByRole('listitem');
        // Should have fewer errors now
        expect(errorListItems.length).toBeLessThan(4);
      });
    });

    test('validates routing number format', async () => {
      const user = userEvent.setup();
      renderRecipientForm();

      // Fill required fields first
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/account number/i), '123456789');

      // Enter invalid routing number (too short) - use the first routing input
      const routingInputs =
        screen.getAllByPlaceholderText(/enter routing number/i);
      await user.type(routingInputs[0], '123');

      // Submit form
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      // Should show routing number format error (appears in both error summary and field)
      await waitFor(() => {
        expect(
          screen.getAllByText(/invalid ach routing number for ach/i)
        ).toHaveLength(2); // One in error summary, one next to field
      });
    });
  });

  describe('Form Submission', () => {
    test('calls onSubmit with correct data when form is valid', async () => {
      const mockOnSubmit = vi.fn();
      const user = userEvent.setup();
      renderRecipientForm({ onSubmit: mockOnSubmit });

      // Fill all required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/account number/i), '123456789');

      // Fill routing number - use the first routing input
      const routingInputs =
        screen.getAllByPlaceholderText(/enter routing number/i);
      await user.type(routingInputs[0], '123456789');

      // Submit form
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      // Should call onSubmit
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Check that the submitted data contains expected fields
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData).toHaveProperty('partyDetails');
      expect(submittedData.partyDetails).toHaveProperty('firstName', 'John');
      expect(submittedData.partyDetails).toHaveProperty('lastName', 'Doe');
    });

    test('does not call onSubmit when form has validation errors', async () => {
      const mockOnSubmit = vi.fn();
      const user = userEvent.setup();
      renderRecipientForm({ onSubmit: mockOnSubmit });

      // Submit empty form
      await user.click(
        screen.getByRole('button', { name: /create recipient/i })
      );

      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText(/form errors:/i)).toBeInTheDocument();
      });

      // Should not call onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    test('calls onCancel when cancel button is clicked', async () => {
      const mockOnCancel = vi.fn();
      const user = userEvent.setup();
      renderRecipientForm({ onCancel: mockOnCancel });

      // Click cancel button
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Should call onCancel
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });
});
