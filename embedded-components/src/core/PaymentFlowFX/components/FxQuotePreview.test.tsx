import { describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { FxQuote } from '../PaymentFlowFX.types';
import { FxQuotePreview } from './FxQuotePreview';

const lockedQuote: FxQuote = {
  rate: 0.92,
  isIndicative: false,
  rateId: 'rate-eur-exec',
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
};

describe('FxQuotePreview', () => {
  it('renders skeletons (no content) while loading', () => {
    render(
      <FxQuotePreview status="loading" targetCurrency="EUR" usdAmount={100} />
    );
    expect(screen.queryByText(/recipient gets/i)).not.toBeInTheDocument();
  });

  it('shows the default market-rate message when idle', () => {
    render(
      <FxQuotePreview status="idle" targetCurrency="EUR" usdAmount={100} />
    );
    expect(screen.getByText(/market rate on execution/i)).toBeInTheDocument();
  });

  it('shows a custom unavailable reason', () => {
    render(
      <FxQuotePreview
        status="unavailable"
        unavailableReason="Corridor not supported"
        targetCurrency="EUR"
        usdAmount={100}
      />
    );
    expect(screen.getByText(/corridor not supported/i)).toBeInTheDocument();
  });

  it('renders nothing when success but no quote is present', () => {
    render(
      <FxQuotePreview status="success" targetCurrency="EUR" usdAmount={100} />
    );
    expect(screen.queryByText(/recipient gets/i)).not.toBeInTheDocument();
  });

  it('shows recipient amount, rate line, Locked chip and countdown for a locked quote', () => {
    render(
      <FxQuotePreview
        status="success"
        quote={lockedQuote}
        targetCurrency="EUR"
        usdAmount={100}
      />
    );
    expect(screen.getByText(/recipient gets/i)).toBeInTheDocument();
    expect(screen.getByText(/€92\.00/)).toBeInTheDocument();
    expect(screen.getByText(/1 USD = 0\.92 EUR/)).toBeInTheDocument();
    expect(screen.getByText(/locked/i)).toBeInTheDocument();
    expect(screen.getByText(/expires in/i)).toBeInTheDocument();
  });

  it('shows an Indicative chip and no countdown for indicative quotes', () => {
    render(
      <FxQuotePreview
        status="success"
        quote={{ rate: 0.92, isIndicative: true }}
        targetCurrency="EUR"
        usdAmount={100}
      />
    );
    expect(screen.getByText(/indicative/i)).toBeInTheDocument();
    expect(screen.queryByText(/expires in/i)).not.toBeInTheDocument();
  });

  it('renders a dash when the USD amount is zero', () => {
    render(
      <FxQuotePreview
        status="success"
        quote={lockedQuote}
        targetCurrency="EUR"
        usdAmount={0}
      />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows the market-rate fallback warning', () => {
    render(
      <FxQuotePreview
        status="success"
        quote={lockedQuote}
        targetCurrency="EUR"
        usdAmount={100}
        usedMarketRateFallback
      />
    );
    expect(
      screen.getByText(/submitted at the market rate/i)
    ).toBeInTheDocument();
  });

  it('toggles the rate disclaimer', async () => {
    render(
      <FxQuotePreview
        status="success"
        quote={{
          rate: 0.92,
          isIndicative: false,
          disclaimer: 'Rates are subject to change.',
        }}
        targetCurrency="EUR"
        usdAmount={100}
      />
    );
    expect(screen.queryByText(/subject to change/i)).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /rate disclaimer/i })
    );
    expect(screen.getByText(/subject to change/i)).toBeInTheDocument();
  });
});
