import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RecipientCurrencyBadge } from './RecipientCurrencyBadge';

describe('RecipientCurrencyBadge', () => {
  it('renders an accessible flag and ISO code', () => {
    render(<RecipientCurrencyBadge currency="EUR" />);

    expect(screen.getByRole('img', { name: 'EUR — Euro' })).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
  });

  it('renders the full form-style label when requested', () => {
    render(<RecipientCurrencyBadge currency="GBP" showFullLabel />);

    // Flag is decorative when the full label is visible (PaymentFlowFX form pattern)
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('GBP — British Pound')).toBeInTheDocument();
  });

  it('defaults unknown currencies to the raw code', () => {
    render(<RecipientCurrencyBadge currency="zzz" />);

    expect(screen.getByRole('img', { name: 'ZZZ — ZZZ' })).toBeInTheDocument();
    expect(screen.getByText('ZZZ')).toBeInTheDocument();
  });
});
