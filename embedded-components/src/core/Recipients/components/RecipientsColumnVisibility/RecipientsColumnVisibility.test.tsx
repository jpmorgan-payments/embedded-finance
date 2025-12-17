import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  defaultRecipientsColumnConfig,
  type RecipientsColumnConfiguration,
} from '../../Recipients.columns';
import { RecipientsColumnVisibility } from './RecipientsColumnVisibility';

const mockColumnConfig: RecipientsColumnConfiguration = {
  ...defaultRecipientsColumnConfig,
  name: { visible: true, sortable: true, label: 'Name' },
  type: { visible: true, sortable: true, label: 'Type' },
  status: { visible: true, sortable: true, label: 'Status' },
  accountNumber: { visible: false, sortable: false, label: 'Account Number' },
  actions: { visible: true, sortable: false, label: 'Actions' },
};

describe('RecipientsColumnVisibility', () => {
  const mockOnColumnVisibilityChange = vi.fn();

  test('renders Columns button', () => {
    render(
      <RecipientsColumnVisibility
        columnConfig={mockColumnConfig}
        onColumnVisibilityChange={mockOnColumnVisibilityChange}
      />
    );

    const columnsButton = screen.getByRole('button', { name: /columns/i });
    expect(columnsButton).toBeInTheDocument();
  });

  test('opens column toggle menu on click', async () => {
    const user = userEvent.setup();
    render(
      <RecipientsColumnVisibility
        columnConfig={mockColumnConfig}
        onColumnVisibilityChange={mockOnColumnVisibilityChange}
      />
    );

    const columnsButton = screen.getByRole('button', { name: /columns/i });
    await user.click(columnsButton);

    expect(screen.getByText('Toggle columns')).toBeInTheDocument();
  });

  test('shows toggleable columns in menu', async () => {
    const user = userEvent.setup();
    render(
      <RecipientsColumnVisibility
        columnConfig={mockColumnConfig}
        onColumnVisibilityChange={mockOnColumnVisibilityChange}
      />
    );

    const columnsButton = screen.getByRole('button', { name: /columns/i });
    await user.click(columnsButton);

    // Should show columns that can be toggled (not actions)
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Account Number')).toBeInTheDocument();
  });

  test('does not show actions column in menu', async () => {
    const user = userEvent.setup();
    render(
      <RecipientsColumnVisibility
        columnConfig={mockColumnConfig}
        onColumnVisibilityChange={mockOnColumnVisibilityChange}
      />
    );

    const columnsButton = screen.getByRole('button', { name: /columns/i });
    await user.click(columnsButton);

    // Actions should not appear (it's filtered out)
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });

  test('calls onColumnVisibilityChange when column is toggled', async () => {
    const user = userEvent.setup();
    render(
      <RecipientsColumnVisibility
        columnConfig={mockColumnConfig}
        onColumnVisibilityChange={mockOnColumnVisibilityChange}
      />
    );

    const columnsButton = screen.getByRole('button', { name: /columns/i });
    await user.click(columnsButton);

    // Toggle Account Number column (currently hidden)
    const accountNumberCheckbox = screen.getByRole('menuitemcheckbox', {
      name: /account number/i,
    });
    await user.click(accountNumberCheckbox);

    expect(mockOnColumnVisibilityChange).toHaveBeenCalledWith(
      'accountNumber',
      true
    );
  });
});
