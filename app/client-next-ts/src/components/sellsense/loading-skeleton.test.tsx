import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingSkeleton } from './loading-skeleton';

describe('LoadingSkeleton', () => {
  it('renders skeleton layout for default theme', () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('accepts theme prop', () => {
    const { container } = render(<LoadingSkeleton theme="PayFicient" />);
    expect(container.firstChild).toBeTruthy();
  });
});
