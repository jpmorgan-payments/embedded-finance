import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Footer } from './footer';

describe('Footer', () => {
  it('renders regulatory disclaimer and powered-by line', () => {
    render(<Footer themeForDisplay="SellSense" />);
    expect(
      screen.getByText(/Deposit holding and other banking services/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/SellSense is not a bank/i)).toBeInTheDocument();
    expect(screen.getByText(/Powered by J\.P\.\s?Morgan/i)).toBeInTheDocument();
  });

  it('shows theme logo when path is defined', () => {
    render(<Footer themeForDisplay="SellSense" />);
    const logo = screen.getByRole('img', { name: /SellSense Logo/i });
    expect(logo).toHaveAttribute('src', '/sellSense.svg');
  });

  it('does not render logo image for Empty theme', () => {
    render(<Footer themeForDisplay="Empty" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
