import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ExperiencesSection } from './experiences-section';

describe('ExperiencesSection', () => {
  it('renders integration helper chips', () => {
    render(<ExperiencesSection />);
    expect(screen.getByText(/view full documentation/i)).toBeInTheDocument();
    expect(screen.getByText(/view partially hosted demo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/partially hosted integration guide/i)
    ).toBeInTheDocument();
  });

  it('renders seven experience cards', () => {
    render(<ExperiencesSection />);
    const demoButtons = screen.getAllByTitle('View Live Demo');
    expect(demoButtons.length).toBe(7);
  });

  it('renders correct status badges for experiences', () => {
    render(<ExperiencesSection />);
    const testingBadges = screen.getAllByText('Testing');
    // Five experiences are in Testing, one (Onboarding) is Available, and Client Details is In Progress
    expect(testingBadges.length).toBe(5);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders Client Details as the seventh card with correct title and description', () => {
    render(<ExperiencesSection />);
    expect(screen.getByText('Client Details')).toBeInTheDocument();
    expect(
      screen.getByText(
        /view comprehensive client information for fully onboarded clients/i
      )
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
    expect(
      within(dialog).getByText(/onboardingflow component/i)
    ).toBeInTheDocument();
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
    expect(
      within(dialog).getByText(/clientdetails component/i)
    ).toBeInTheDocument();
  });

  it('each card has demo and github links', () => {
    render(<ExperiencesSection />);
    expect(screen.getAllByTitle('View Live Demo').length).toBe(7);
    expect(screen.getAllByTitle('View Source Code').length).toBe(7);
  });
});
