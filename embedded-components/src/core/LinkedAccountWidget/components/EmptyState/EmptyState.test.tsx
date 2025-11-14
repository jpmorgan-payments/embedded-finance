import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('should render default message and description', () => {
    render(<EmptyState />);

    expect(screen.getByText(/no linked accounts found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/link your first bank account/i)
    ).toBeInTheDocument();
  });

  it('should render custom message', () => {
    render(<EmptyState message="Custom message" />);

    expect(screen.getByText('Custom message')).toBeInTheDocument();
  });

  it('should render custom description', () => {
    render(<EmptyState description="Custom description text" />);

    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('should render both custom message and description', () => {
    render(
      <EmptyState message="Custom message" description="Custom description" />
    );

    expect(screen.getByText('Custom message')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<EmptyState className="custom-class" />);

    const emptyState = container.querySelector('.custom-class');
    expect(emptyState).toBeInTheDocument();
  });

  it('should render landmark icon', () => {
    const { container } = render(<EmptyState />);

    // Check for SVG icons
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should render plus circle icon overlay', () => {
    const { container } = render(<EmptyState />);

    // Should have multiple icons (landmark and plus circle)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});
