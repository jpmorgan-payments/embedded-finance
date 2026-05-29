import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { RecipientCardSkeleton } from './RecipientCardSkeleton';

describe('RecipientCardSkeleton', () => {
  it('should render loading skeleton', () => {
    render(<RecipientCardSkeleton />);

    const skeleton = screen.getByRole('article', {
      name: /loading recipient/i,
    });
    expect(skeleton).toBeInTheDocument();
  });

  it('should have aria-busy attribute', () => {
    const { container } = render(<RecipientCardSkeleton />);

    const article = container.querySelector('[role="article"]');
    expect(article).toHaveAttribute('aria-busy', 'true');
  });

  it('should render multiple skeleton elements', () => {
    const { container } = render(<RecipientCardSkeleton />);

    // Should have multiple skeleton elements for different parts
    // Looking for the eb-animate-pulse class which is on Skeleton components
    const skeletons = container.querySelectorAll('[class*="eb-animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it('should match the structure of RecipientCard', () => {
    const { container } = render(<RecipientCardSkeleton />);

    // Should have card structure
    expect(container.querySelector('[role="article"]')).toBeInTheDocument();

    // Should have separators for sections (checking by data-orientation attribute from Radix UI)
    const separators = container.querySelectorAll(
      '[data-orientation="horizontal"]'
    );
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });
});
