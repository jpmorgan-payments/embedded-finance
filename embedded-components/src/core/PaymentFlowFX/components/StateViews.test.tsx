import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import {
  EmptyAccountsView,
  FatalErrorView,
  LoadingStateView,
} from './StateViews';

describe('StateViews', () => {
  it('LoadingStateView renders skeleton placeholders', () => {
    const { container } = render(<LoadingStateView />);
    expect(
      container.querySelectorAll('[class*="eb-rounded"]').length
    ).toBeGreaterThan(0);
  });

  describe('EmptyAccountsView', () => {
    it('renders the title and message', () => {
      render(
        <EmptyAccountsView title="No accounts" message="Nothing to show" />
      );
      expect(screen.getByText('No accounts')).toBeInTheDocument();
      expect(screen.getByText('Nothing to show')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders a Close button when onClose is provided', async () => {
      const onClose = vi.fn();
      render(<EmptyAccountsView title="t" message="m" onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('FatalErrorView', () => {
    it('renders and calls onRetry', async () => {
      const onRetry = vi.fn();
      render(
        <FatalErrorView title="Oops" message="Failed" onRetry={onRetry} />
      );
      expect(screen.getByText('Oops')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it('shows the retrying state with a disabled button', () => {
      render(
        <FatalErrorView
          title="Oops"
          message="Failed"
          onRetry={vi.fn()}
          isRetrying
        />
      );
      expect(screen.getByText(/retrying/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
