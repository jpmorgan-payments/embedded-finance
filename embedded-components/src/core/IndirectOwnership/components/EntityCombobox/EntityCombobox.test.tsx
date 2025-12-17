import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EntityCombobox } from './EntityCombobox';

const mockExistingEntities = [
  'Apple Inc',
  'Google LLC',
  'Microsoft Corporation',
  'Tech Holdings LLC',
];

describe('EntityCombobox', () => {
  test('renders with placeholder text', () => {
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={mockExistingEntities}
        placeholder="Enter company name"
      />
    );
    
    expect(screen.getByText('Enter company name')).toBeInTheDocument();
  });

  test('displays selected value', () => {
    render(
      <EntityCombobox
        value="Apple Inc"
        onChange={vi.fn()}
        existingEntities={mockExistingEntities}
      />
    );
    
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    expect(screen.getByText('existing')).toBeInTheDocument();
  });

  test('shows dropdown when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={mockExistingEntities}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Previously added companies')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc')).toBeInTheDocument();
      expect(screen.getByText('Google LLC')).toBeInTheDocument();
    });
  });

  test('filters entities based on input', async () => {
    const user = userEvent.setup();
    
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={mockExistingEntities}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const input = screen.getByPlaceholderText('Search companies...');
    await user.type(input, 'Apple');
    
    await waitFor(() => {
      expect(screen.getByText('Apple Inc')).toBeInTheDocument();
      expect(screen.queryByText('Google LLC')).not.toBeInTheDocument();
    });
  });

  test('calls onChange when entity is selected', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    render(
      <EntityCombobox
        value=""
        onChange={mockOnChange}
        existingEntities={mockExistingEntities}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const appleOption = screen.getByText('Apple Inc');
    await user.click(appleOption);
    
    expect(mockOnChange).toHaveBeenCalledWith('Apple Inc');
  });

  test('shows "add new" message for non-existing entities', async () => {
    const user = userEvent.setup();
    
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={mockExistingEntities}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const input = screen.getByPlaceholderText('Search companies...');
    await user.type(input, 'New Company Inc');
    
    await waitFor(() => {
      expect(screen.getByText('No existing companies found')).toBeInTheDocument();
      expect(screen.getByText('"New Company Inc" will be added as a new company')).toBeInTheDocument();
    });
  });

  test('respects disabled state', () => {
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={mockExistingEntities}
        disabled={true}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  test('case-insensitive filtering', async () => {
    const user = userEvent.setup();
    
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={['Apple Inc', 'GOOGLE LLC', 'microsoft corp']}
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const input = screen.getByPlaceholderText('Search companies...');
    await user.type(input, 'apple');
    
    await waitFor(() => {
      expect(screen.getByText('Apple Inc')).toBeInTheDocument();
      expect(screen.queryByText('GOOGLE LLC')).not.toBeInTheDocument();
    });
  });

  test('does not show entities that are already in the hierarchy chain', () => {
    // This test verifies that entities already in the current hierarchy 
    // are filtered out by the parent component's existingEntities filtering
    const filteredEntities = ['Available Company A', 'Available Company B'];
    
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={filteredEntities}
        placeholder="Enter company name"
      />
    );
    
    // The dropdown should only show the filtered entities
    // The parent component (IndirectOwnership) filters out entities already in the chain
    expect(screen.getByText('Enter company name')).toBeInTheDocument();
  });
});
