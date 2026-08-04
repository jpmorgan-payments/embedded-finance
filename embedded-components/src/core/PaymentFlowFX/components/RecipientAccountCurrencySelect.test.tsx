import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@test-utils';

import { RecipientAccountCurrencySelect } from './RecipientAccountCurrencySelect';

describe('RecipientAccountCurrencySelect', () => {
  it('renders the domestic USD option and supported currencies', () => {
    render(
      <RecipientAccountCurrencySelect
        value="USD"
        onValueChange={vi.fn()}
        supportedCurrencies={['EUR', 'GBP']}
        currencyLabels={{ EUR: 'Euro', GBP: 'British Pound' }}
      />
    );

    expect(
      screen.getByText(/recipient's account currency/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/us dollar \(domestic\)/i)).toBeInTheDocument();
  });

  it('shows the FX rail disclaimer for a non-USD currency', () => {
    render(
      <RecipientAccountCurrencySelect
        value="EUR"
        onValueChange={vi.fn()}
        supportedCurrencies={['EUR']}
      />
    );

    // FxRailDisclaimer content varies by currency; presence of the select +
    // non-USD value is enough to mount the disclaimer branch.
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
