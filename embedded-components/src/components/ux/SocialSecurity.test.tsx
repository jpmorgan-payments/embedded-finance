import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Ssn4Input, Ssn9Input } from './SocialSecurity';

describe('SocialSecurity', () => {
  describe('Ssn4Input', () => {
    it('renders an input element', () => {
      render(<Ssn4Input onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Ssn9Input', () => {
    it('renders an input element', () => {
      render(<Ssn9Input onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
