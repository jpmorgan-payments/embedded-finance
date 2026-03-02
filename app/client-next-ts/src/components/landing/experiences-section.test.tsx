import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ExperiencesSection } from './experiences-section';

describe('ExperiencesSection', () => {
  it('renders section heading and description', () => {
    render(<ExperiencesSection />);
    expect(
      screen.getByRole('heading', { name: /explore embedded business components/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pre-built workflows and implementation patterns/i)
    ).toBeInTheDocument();
  });

  it('renders seven experience cards', () => {
    render(<ExperiencesSection />);
    const demoButtons = screen.getAllByTitle('View Live Demo');
    expect(demoButtons.length).toBe(7);
  });

  it('renders all six original components with Testing status', () => {
    render(<ExperiencesSection />);
    const testingBadges = screen.getAllByText('Testing');
    expect(testingBadges.length).toBeGreaterThanOrEqual(6);
  });

  it('renders Client Details as the seventh card with correct title and description', () => {
    render(<ExperiencesSection />);
    expect(screen.getByText('Client Details')).toBeInTheDocument();
    expect(
      screen.getByText(/view comprehensive client information for fully onboarded clients/i)
    ).toBeInTheDocument();
  });

  it('opens code examples modal when a card title is clicked', async () => {
    const user = userEvent.setup();
    render(<ExperiencesSection />);
    const onboardingButton = screen.getByRole('button', {
      name: /client onboarding \(kyc\/kyb\)/i,
    });
    await user.click(onboardingButton);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/onboardingflow component/i)).toBeInTheDocument();
  });

  it('opens Client Details code example when Client Details title is clicked', async () => {
    const user = userEvent.setup();
    render(<ExperiencesSection />);
    const clientDetailsButton = screen.getByRole('button', {
      name: /^client details$/i,
    });
    await user.click(clientDetailsButton);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/clientdetails component/i)).toBeInTheDocument();
  });

  it('each card has demo and github links', () => {
    render(<ExperiencesSection />);
    expect(screen.getAllByTitle('View Live Demo').length).toBe(7);
    expect(screen.getAllByTitle('View Source Code').length).toBe(7);
  });
});
