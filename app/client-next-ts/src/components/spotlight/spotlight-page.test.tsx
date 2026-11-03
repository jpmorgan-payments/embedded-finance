import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpotlightPage } from './spotlight-page';

describe('SpotlightPage', () => {
  it('renders the page heading and both sections', () => {
    render(<SpotlightPage />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /client stories and insights/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Client Stories' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Thought Leadership' })
    ).toBeInTheDocument();
  });

  it('features the newest story as Latest', () => {
    render(<SpotlightPage />);
    const latestLink = screen.getByRole('link', {
      name: /latest.*mercado libre/i,
    });
    expect(latestLink).toHaveAttribute(
      'href',
      'https://www.jpmorgan.com/payments/newsroom/mercado-libre-global-selling-embedded-payments'
    );
  });

  it('lists the remaining client stories newest first', () => {
    render(<SpotlightPage />);
    const section = screen.getByRole('region', { name: 'Client Stories' });
    const orgs = within(section)
      .getAllByRole('link')
      .map((link) => link.textContent ?? '');
    expect(orgs).toHaveLength(3);
    expect(orgs[0]).toMatch(/Dream Payments/);
    expect(orgs[1]).toMatch(/BILL/);
    expect(orgs[2]).toMatch(/Walmart Marketplace/);
  });

  it('opens every story in a new tab safely', () => {
    render(<SpotlightPage />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveTextContent(/opens in a new tab/);
    }
  });
});
