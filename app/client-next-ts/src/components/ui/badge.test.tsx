import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });
});
