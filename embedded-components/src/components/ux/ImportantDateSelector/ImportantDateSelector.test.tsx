import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { vi } from 'vitest';

import { ImportantDateSelector } from './ImportantDateSelector';

// Test wrapper component to simulate form context
function TestWrapper({
  onSubmit = vi.fn(),
  defaultValues = {},
  children,
}: {
  onSubmit?: (data: any) => void;
  defaultValues?: any;
  children: React.ReactNode;
}) {
  const form = useForm({ defaultValues });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {children}
      <button type="submit">Submit</button>
    </form>
  );
}

describe('C', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  // Basic rendering tests
  test('renders with default format (MDY)', () => {
    render(<ImportantDateSelector onChange={mockOnChange} />);

    expect(screen.getByLabelText('Month')).toBeInTheDocument();
    expect(screen.getByLabelText('Day')).toBeInTheDocument();
    expect(screen.getByLabelText('Year')).toBeInTheDocument();
  });

  test('renders with custom format (DMY)', () => {
    render(<ImportantDateSelector onChange={mockOnChange} format="DMY" />);

    const labels = screen.getAllByRole('textbox');
    expect(labels[0].getAttribute('placeholder')).toBe('DD');
    expect(labels[1].getAttribute('placeholder')).toBe('YYYY');
  });

  // Input handling tests
  test.skip('handles valid date input', async () => {
    render(<ImportantDateSelector onChange={mockOnChange} />);

    // Select month
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('January'));

    // Enter day and year
    await userEvent.type(screen.getByLabelText('Day'), '15');
    await userEvent.type(screen.getByLabelText('Year'), '2000');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(new Date(2000, 0, 15));
    });
  });

  test('handles invalid date input', async () => {
    render(<ImportantDateSelector onChange={mockOnChange} />);

    // Select invalid date (February 31st)
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('February'));
    await userEvent.type(screen.getByLabelText('Day'), '31');
    await userEvent.type(screen.getByLabelText('Year'), '2000');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        null,
        expect.stringContaining('Invalid date')
      );
    });
  });

  // Date validation tests
  test('validates minDate constraint', async () => {
    const minDate = new Date(2000, 0, 1);
    render(<ImportantDateSelector onChange={mockOnChange} minDate={minDate} />);

    // Enter date before minDate
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('January'));
    await userEvent.type(screen.getByLabelText('Day'), '01');
    await userEvent.type(screen.getByLabelText('Year'), '1999');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        null,
        expect.stringContaining(
          'Date indicates age over 120 years old. Please verify the date'
        )
      );
    });
  });

  test('validates maxDate constraint', async () => {
    const maxDate = new Date(2000, 0, 1);
    render(<ImportantDateSelector onChange={mockOnChange} maxDate={maxDate} />);

    // Enter date after maxDate
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('January'));

    await userEvent.type(screen.getByLabelText('Day'), '02');
    await userEvent.type(screen.getByLabelText('Year'), '2000');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        null,
        expect.stringContaining('Must be at least 18 years old to proceed')
      );
    });
  });

  // Clear functionality tests
  test('clears input when clear button is clicked', async () => {
    render(<ImportantDateSelector onChange={mockOnChange} showClearIcon />);

    // Enter a valid date first
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('January'));
    await userEvent.type(screen.getByLabelText('Day'), '15');
    await userEvent.type(screen.getByLabelText('Year'), '2000');

    // Clear the input
    await userEvent.click(screen.getByLabelText('Clear date'));

    expect(screen.getByLabelText('Day')).toHaveValue('');
    expect(screen.getByLabelText('Year')).toHaveValue('');
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  // Disabled state tests
  test('disables all inputs when disabled prop is true', () => {
    render(<ImportantDateSelector onChange={mockOnChange} disabled />);

    expect(screen.getByLabelText('Day')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByLabelText('Year')).toBeDisabled();
  });

  // Integration with form tests
  test.skip('integrates with react-hook-form', async () => {
    const onSubmit = vi.fn();
    const defaultDate = new Date(2000, 0, 15);

    render(
      <TestWrapper
        onSubmit={onSubmit}
        defaultValues={{ birthDate: defaultDate }}
      >
        <ImportantDateSelector
          name="birthDate"
          value={defaultDate}
          onChange={mockOnChange}
        />
      </TestWrapper>
    );

    // Verify initial values
    expect(screen.getByLabelText('Day')).toHaveValue('15');
    expect(screen.getByLabelText('Year')).toHaveValue('2000');

    // Submit form
    await userEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        birthDate: defaultDate,
      }),
      expect.anything()
    );
  });
});
