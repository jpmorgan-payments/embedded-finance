import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EntityCombobox } from './EntityCombobox';

describe('EntityCombobox - Circular Reference Prevention', () => {
  test('does not show entities that would create circular references', async () => {
    const user = userEvent.setup();
    
    // Scenario: Company A -> Company B, editing Company B
    // Company B should not appear in dropdown to prevent Company A -> Company B -> Company B
    const mockExistingEntities = [
      'Apple Inc',
      'Google LLC', 
      'Microsoft Corporation',
    ];
    
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={mockExistingEntities}
        placeholder="Enter company name"
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Previously added companies')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc')).toBeInTheDocument();
      expect(screen.getByText('Google LLC')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
    });
  });

  test('filters out entities already in hierarchy when searching', async () => {
    const user = userEvent.setup();
    
    // Only entities not in current chain should be available
    const mockExistingEntities = [
      'Available Company',
      'Another Available Company'
    ];
    
    render(
      <EntityCombobox
        value=""
        onChange={vi.fn()}
        existingEntities={mockExistingEntities}
        placeholder="Enter company name"
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const input = screen.getByPlaceholderText('Search companies...');
    await user.type(input, 'Available');
    
    await waitFor(() => {
      expect(screen.getByText('Available Company')).toBeInTheDocument();
      expect(screen.getByText('Another Available Company')).toBeInTheDocument();
    });
  });

  test('allows selection of filtered available entities', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    const mockExistingEntities = [
      'Available Company',
    ];
    
    render(
      <EntityCombobox
        value=""
        onChange={mockOnChange}
        existingEntities={mockExistingEntities}
        placeholder="Enter company name"
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const availableOption = screen.getByText('Available Company');
    await user.click(availableOption);
    
    expect(mockOnChange).toHaveBeenCalledWith('Available Company');
  });

  test('still allows adding new companies not in existing entities', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    const mockExistingEntities = [
      'Existing Company A',
      'Existing Company B'
    ];
    
    render(
      <EntityCombobox
        value=""
        onChange={mockOnChange}
        existingEntities={mockExistingEntities}
        placeholder="Enter company name"
      />
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const input = screen.getByPlaceholderText('Search companies...');
    await user.type(input, 'Completely New Company');
    
    await waitFor(() => {
      expect(screen.getByText('No existing companies found')).toBeInTheDocument();
      expect(screen.getByText('"Completely New Company" will be added as a new company')).toBeInTheDocument();
    });
    
    // Should be able to select the new company
    const newCompanyOption = screen.getByText('"Completely New Company" will be added as a new company');
    await user.click(newCompanyOption);
    
    expect(mockOnChange).toHaveBeenCalledWith('Completely New Company');
  });
});
