import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { OwnershipCalculationsTooltip } from './OwnershipCalculationsTooltip';

describe('OwnershipCalculationsTooltip', () => {
  test('renders help icon button', () => {
    render(<OwnershipCalculationsTooltip />);

    const button = screen.getByRole('button', {
      name: /learn about ownership calculations/i,
    });
    expect(button).toBeInTheDocument();
  });

  test('shows popover content on click', async () => {
    const user = userEvent.setup();
    render(<OwnershipCalculationsTooltip />);

    const button = screen.getByRole('button', {
      name: /learn about ownership calculations/i,
    });

    // Click the button
    await user.click(button);

    // Wait for popover to appear
    await waitFor(() => {
      expect(
        screen.getByText(/How to Calculate Beneficial Ownership/i)
      ).toBeInTheDocument();
    });
  });

  test('displays example calculations in popover', async () => {
    const user = userEvent.setup();
    render(<OwnershipCalculationsTooltip />);

    const button = screen.getByRole('button', {
      name: /learn about ownership calculations/i,
    });

    await user.click(button);

    await waitFor(() => {
      // Check for examples
      expect(screen.getByText(/Monica Geller/i)).toBeInTheDocument();
      expect(screen.getByText(/Ross Geller/i)).toBeInTheDocument();
      expect(screen.getByText(/Rachel Green/i)).toBeInTheDocument();
      expect(screen.getByText(/Chandler Bing/i)).toBeInTheDocument();
      expect(screen.getByText(/Joey Tribbiani/i)).toBeInTheDocument();
    });
  });

  test('displays key tips and common mistakes', async () => {
    const user = userEvent.setup();
    render(<OwnershipCalculationsTooltip />);

    const button = screen.getByRole('button', {
      name: /learn about ownership calculations/i,
    });

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Key Tips:/i)).toBeInTheDocument();
      expect(screen.getByText(/Common Mistake:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Multiply percentages through each level/i)
      ).toBeInTheDocument();
    });
  });

  test('displays threshold information', async () => {
    const user = userEvent.setup();
    render(<OwnershipCalculationsTooltip />);

    const button = screen.getByRole('button', {
      name: /learn about ownership calculations/i,
    });

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/25% or more/i)).toBeInTheDocument();
    });
  });
});
