import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  const base = {
    activeView: 'overview' as const,
    onViewChange: vi.fn(),
    theme: 'SellSense' as const,
    isMobileMenuOpen: false,
    setIsMobileMenuOpen: vi.fn(),
  };

  it('shows onboarding-only navigation for New Seller scenario', () => {
    render(<Sidebar {...base} clientScenario="New Seller - Onboarding" />);
    expect(screen.getAllByRole('button', { name: 'Onboarding' }).length).toBe(
      2
    );
    // Desktop is collapsed by default — mode label only on mobile (and after expand)
    expect(screen.getByText('Onboarding Flow')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Home' })
    ).not.toBeInTheDocument();
  });

  it('shows full dashboard navigation for active seller scenario', () => {
    render(<Sidebar {...base} clientScenario="Seller with Limited DDA" />);
    expect(screen.getAllByRole('button', { name: 'Home' }).length).toBe(2);
    expect(screen.getByText('Seller Dashboard')).toBeInTheDocument();
  });

  it('starts collapsed on desktop and can expand to show Current Mode', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...base} clientScenario="Seller with Limited DDA" />);

    expect(
      screen.getByRole('button', { name: 'Expand navigation' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Seller Dashboard')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Expand navigation' }));

    expect(
      screen.getByRole('button', { name: 'Collapse navigation' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Seller Dashboard')).toHaveLength(2);
    expect(screen.getAllByText('Current Mode')).toHaveLength(2);
  });

  it('calls onViewChange and closes mobile menu when a item is clicked', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const setIsMobileMenuOpen = vi.fn();
    render(
      <Sidebar
        {...base}
        clientScenario="Seller with Limited DDA"
        onViewChange={onViewChange}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
    );
    await user.click(
      screen.getAllByRole('button', { name: 'Wallet Management' })[0]
    );
    expect(onViewChange).toHaveBeenCalledWith('wallet');
    expect(setIsMobileMenuOpen).toHaveBeenCalledWith(false);
  });
});
