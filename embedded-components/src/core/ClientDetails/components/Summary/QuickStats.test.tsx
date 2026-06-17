import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { QuickStats } from './QuickStats';

describe('QuickStats', () => {
  it('renders stat cards with labels and values', () => {
    const stats = [
      { label: 'Total Owners', value: '3' },
      { label: 'Active', value: '2' },
    ];
    render(<QuickStats stats={stats} />);

    expect(screen.getByText('Total Owners')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders empty when no stats', () => {
    const { container } = render(<QuickStats stats={[]} />);
    expect(container.querySelectorAll('[class*="card"]').length).toBe(0);
  });

  it('handles stats with onClick', () => {
    const onClick = vi.fn();
    const stats = [{ label: 'Clickable', value: '5', onClick }];
    render(<QuickStats stats={stats} />);

    (
      screen.getByText('Clickable').closest('button, div') as HTMLElement
    )?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const stats = [{ label: 'Test', value: '1' }];
    const { container } = render(
      <QuickStats stats={stats} className="eb-custom" />
    );
    expect(container.firstElementChild?.className).toContain('eb-custom');
  });
});
