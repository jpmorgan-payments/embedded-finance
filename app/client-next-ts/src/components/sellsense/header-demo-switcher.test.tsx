import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HeaderDemoSwitcher } from './header-demo-switcher';

describe('HeaderDemoSwitcher', () => {
  it('shows the short scenario name and opens the grouped menu', () => {
    const setClientScenario = vi.fn();

    render(
      <HeaderDemoSwitcher
        clientScenario="Onboarding - Seller with prefilled data (Delta)"
        setClientScenario={setClientScenario}
        themeForDisplay="SellSense"
      />
    );

    expect(screen.getByText('Prefilled (Delta)')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Prefilled \(Delta\)/i,
      })
    );

    expect(
      screen.getByRole('listbox', { name: 'Demo scenarios' })
    ).toBeInTheDocument();
    expect(screen.getByText('Active seller')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: /Docs Needed/i }));
    expect(setClientScenario).toHaveBeenCalledWith('Onboarding - Docs Needed');
  });

  it('keeps prev/next usable with wrap-around', () => {
    const setClientScenario = vi.fn();

    render(
      <HeaderDemoSwitcher
        clientScenario="New Seller - Onboarding"
        setClientScenario={setClientScenario}
        themeForDisplay="SellSense"
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Previous scenario/i,
      })
    );
    expect(setClientScenario).toHaveBeenCalledWith('Seller with FX Payments');
  });
});
