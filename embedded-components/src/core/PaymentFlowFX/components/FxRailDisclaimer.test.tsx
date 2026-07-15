import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { FxRailDisclaimer } from './FxRailDisclaimer';

describe('FxRailDisclaimer', () => {
  it('renders nothing for a domestic (USD) / unsupported currency', () => {
    render(<FxRailDisclaimer currency="USD" />);
    expect(screen.queryByTestId('fx-rail-disclaimer')).not.toBeInTheDocument();
  });

  it('lists both rails, in WIRE-before-ACH order, for a dual-rail currency', () => {
    render(<FxRailDisclaimer currency="AUD" />);

    expect(screen.getByTestId('fx-rail-disclaimer')).toBeInTheDocument();
    // Title names the country and currency.
    expect(screen.getByText(/Australia \(AUD\)/i)).toBeInTheDocument();
    // Both value tiers are shown.
    expect(screen.getByText(/FX High-value/i)).toBeInTheDocument();
    expect(screen.getByText(/FX Low-value/i)).toBeInTheDocument();
  });

  it('shows only the supported rail for a single-rail currency', () => {
    render(<FxRailDisclaimer currency="EUR" />);

    expect(screen.getByText(/FX High-value/i)).toBeInTheDocument();
    expect(screen.queryByText(/FX Low-value/i)).not.toBeInTheDocument();
  });

  it('clarifies that ACH / Wire are FX tiers, not US domestic networks', () => {
    render(<FxRailDisclaimer currency="MXN" />);

    expect(
      screen.getByText(/not US domestic ACH or Fedwire/i)
    ).toBeInTheDocument();
  });
});
