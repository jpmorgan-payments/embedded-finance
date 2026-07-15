import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import type { PaymentFlowFXFormData } from '../PaymentFlowFX.types';
import { FxReviewBlock } from './FxReviewBlock';

function makeFormData(
  overrides: Partial<PaymentFlowFXFormData> = {}
): PaymentFlowFXFormData {
  return {
    amount: '100',
    currency: 'USD',
    ...overrides,
  } as unknown as PaymentFlowFXFormData;
}

describe('FxReviewBlock', () => {
  it('renders nothing for a domestic (USD) payment', () => {
    render(
      <FxReviewBlock formData={makeFormData({ targetCurrency: 'USD' })} />
    );
    expect(screen.queryByText(/currency conversion/i)).not.toBeInTheDocument();
  });

  it('renders nothing when no target currency is present', () => {
    render(
      <FxReviewBlock formData={makeFormData({ targetCurrency: undefined })} />
    );
    expect(screen.queryByText(/currency conversion/i)).not.toBeInTheDocument();
  });

  it('shows the conversion title for a cross-border payout', () => {
    render(
      <FxReviewBlock formData={makeFormData({ targetCurrency: 'EUR' })} />
    );
    expect(screen.getByText(/currency conversion/i)).toBeInTheDocument();
  });

  it('shows the "determined at processing" fallback when no rate is available', () => {
    render(
      <FxReviewBlock formData={makeFormData({ targetCurrency: 'EUR' })} />
    );
    expect(screen.getByText(/determined at processing/i)).toBeInTheDocument();
  });

  it('shows the estimated target amount and rate line when a rate is available', () => {
    render(
      <FxReviewBlock
        formData={makeFormData({
          amount: '100',
          targetCurrency: 'EUR',
          fxQuote: {
            rate: 0.92,
            isIndicative: false,
            fetchedAt: new Date(),
          },
        })}
      />
    );

    // Recipient gets (approx.) row present.
    expect(screen.getByText(/recipient gets/i)).toBeInTheDocument();
    // 100 USD * 0.92 = 92 EUR
    expect(screen.getByText(/€92\.00/)).toBeInTheDocument();
    // Rate line present.
    expect(screen.getByText(/1 USD = 0\.92 EUR/)).toBeInTheDocument();
  });

  it('renders the Locked chip for an executable (non-indicative) quote', () => {
    render(
      <FxReviewBlock
        formData={makeFormData({
          targetCurrency: 'EUR',
          fxQuote: {
            rate: 0.92,
            isIndicative: false,
            fetchedAt: new Date(),
          },
        })}
      />
    );
    expect(screen.getByText(/locked/i)).toBeInTheDocument();
  });

  it('renders the Indicative chip for an indicative quote', () => {
    render(
      <FxReviewBlock
        formData={makeFormData({
          targetCurrency: 'EUR',
          fxQuote: {
            rate: 0.92,
            isIndicative: true,
            fetchedAt: new Date(),
          },
        })}
      />
    );
    expect(screen.getByText(/indicative/i)).toBeInTheDocument();
  });

  it('shows a live expiry countdown for a locked quote', () => {
    render(
      <FxReviewBlock
        formData={makeFormData({
          targetCurrency: 'EUR',
          fxQuote: {
            rate: 0.92,
            isIndicative: false,
            fetchedAt: new Date(),
            expiresAt: new Date(Date.now() + 90 * 1000),
          },
        })}
      />
    );
    expect(screen.getByText(/expires in/i)).toBeInTheDocument();
  });

  it('does not show a countdown for an indicative quote', () => {
    render(
      <FxReviewBlock
        formData={makeFormData({
          targetCurrency: 'EUR',
          fxQuote: {
            rate: 0.92,
            isIndicative: true,
            fetchedAt: new Date(),
            expiresAt: new Date(Date.now() + 90 * 1000),
          },
        })}
      />
    );
    expect(screen.queryByText(/expires in/i)).not.toBeInTheDocument();
  });
});
