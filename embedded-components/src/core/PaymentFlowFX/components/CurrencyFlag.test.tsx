import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { CurrencyFlag } from './CurrencyFlag';

describe('CurrencyFlag', () => {
  it('renders a country flag SVG for a single-country currency', () => {
    const { container } = render(
      <CurrencyFlag currency="USD" title="US Dollar" />
    );

    // Exposed to assistive tech via the accessible name.
    expect(screen.getByRole('img', { name: 'US Dollar' })).toBeInTheDocument();

    // A flag SVG is rendered (not the muted globe fallback).
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('class') ?? '').not.toContain(
      'eb-text-muted-foreground'
    );
  });

  it('falls back to a globe for the Eurozone (EU has no single flag)', () => {
    const { container } = render(<CurrencyFlag currency="EUR" title="Euro" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('class') ?? '').toContain(
      'eb-text-muted-foreground'
    );
  });

  it('falls back to a globe for an unknown currency', () => {
    const { container } = render(<CurrencyFlag currency="ZZZ" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('class') ?? '').toContain(
      'eb-text-muted-foreground'
    );
  });

  it('is decorative (aria-hidden) when no title is provided', () => {
    const { container } = render(<CurrencyFlag currency="GBP" />);

    const wrapper = container.querySelector('span');
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
