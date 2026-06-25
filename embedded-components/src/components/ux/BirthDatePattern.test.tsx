import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BirthDatePattern } from './BirthDatePattern';

describe('BirthDatePattern', () => {
  it('renders an input element', () => {
    render(<BirthDatePattern onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('accepts a placeholder', () => {
    render(<BirthDatePattern onChange={vi.fn()} placeholder="MM/DD/YYYY" />);
    expect(screen.getByPlaceholderText('MM/DD/YYYY')).toBeInTheDocument();
  });
});
