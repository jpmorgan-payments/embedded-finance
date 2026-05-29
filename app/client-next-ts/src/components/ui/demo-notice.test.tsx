import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DemoNotice } from './demo-notice';

describe('DemoNotice', () => {
  it('renders demo disclaimer and link to official docs', () => {
    render(<DemoNotice />);
    expect(
      screen.getByText(/Demo showcase for illustration purposes only/i)
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /official docs/i });
    expect(link).toHaveAttribute(
      'href',
      'https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview'
    );
    expect(link).toHaveAttribute('target', '_blank');
  });
});
