import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders optional message', () => {
    render(<LoadingState message="Loading data…" />);

    expect(screen.getByText('Loading data…')).toBeInTheDocument();
  });

  it('renders without message', () => {
    const { container } = render(<LoadingState />);

    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.querySelector('p')).toHaveTextContent('');
  });
});
