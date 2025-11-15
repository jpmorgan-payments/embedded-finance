import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { LinkedAccountCardSkeleton } from './LinkedAccountCardSkeleton';

describe('LinkedAccountCardSkeleton', () => {
  it('should render loading skeleton', () => {
    render(<LinkedAccountCardSkeleton />);

    const skeleton = screen.getByRole('article', {
      name: /loading linked account/i,
    });
    expect(skeleton).toBeInTheDocument();
  });

  it('should have aria-busy attribute', () => {
    const { container } = render(<LinkedAccountCardSkeleton />);

    const article = container.querySelector('[role="article"]');
    expect(article).toHaveAttribute('aria-busy', 'true');
  });

  it('should render multiple skeleton elements', () => {
    const { container } = render(<LinkedAccountCardSkeleton />);

    // Should have multiple skeleton elements for different parts
    // Looking for the eb-animate-pulse class which is on Skeleton components
    const skeletons = container.querySelectorAll('[class*="eb-animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it('should match the structure of LinkedAccountCard', () => {
    const { container } = render(<LinkedAccountCardSkeleton />);

    // Should have card structure
    expect(container.querySelector('[role="article"]')).toBeInTheDocument();

    // Should have separators for sections (checking by data-orientation attribute from Radix UI)
    const separators = container.querySelectorAll(
      '[data-orientation="horizontal"]'
    );
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });
});
