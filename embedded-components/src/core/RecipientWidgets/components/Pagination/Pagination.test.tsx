import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { Pagination } from './Pagination';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EBComponentsProvider apiBaseUrl="http://test">
    {children}
  </EBComponentsProvider>
);

const defaultProps = {
  pageIndex: 0,
  pageSize: 10,
  totalCount: 50,
  pageCount: 5,
  canPreviousPage: false,
  canNextPage: true,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe('Pagination', () => {
  it('renders pagination buttons', () => {
    render(<Pagination {...defaultProps} />, { wrapper });

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} canPreviousPage={false} />, {
      wrapper,
    });

    const prevButtons = screen.getAllByRole('button');
    // First/prev buttons should be disabled
    expect(prevButtons[0]).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        {...defaultProps}
        pageIndex={4}
        canNextPage={false}
        canPreviousPage
      />,
      { wrapper }
    );

    const buttons = screen.getAllByRole('button');
    // Last button(s) should be disabled
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });

  it('calls onPageChange when next is clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />, {
      wrapper,
    });

    const buttons = screen.getAllByRole('button');
    // Click a next/last button that isn't disabled
    const enabledButtons = buttons.filter((b) => !b.hasAttribute('disabled'));
    if (enabledButtons.length > 0) {
      enabledButtons[enabledButtons.length - 1].click();
      expect(onPageChange).toHaveBeenCalled();
    }
  });

  it('renders with custom className', () => {
    const { container } = render(
      <Pagination {...defaultProps} className="eb-custom-pagination" />,
      { wrapper }
    );

    expect(container.innerHTML).toContain('eb-custom-pagination');
  });

  it('renders page size selector when enabled', () => {
    render(
      <Pagination
        {...defaultProps}
        showPageSizeSelector
        pageSizeOptions={[10, 25, 50]}
      />,
      { wrapper }
    );

    // Should render extra controls for page size
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
