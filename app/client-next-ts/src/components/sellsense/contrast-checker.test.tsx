import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContrastChecker } from './contrast-checker';

describe('ContrastChecker', () => {
  it('renders full panel with ratio for valid colors', () => {
    render(
      <ContrastChecker foreground="#000000" background="#ffffff" label="Test" />
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText(/Ratio:/i)).toBeInTheDocument();
  });

  it('renders compact badge when compact', () => {
    render(
      <ContrastChecker
        foreground="#000000"
        background="#ffffff"
        compact
        showRatio
      />
    );
    expect(screen.getByText(/\d+(\.\d+)?:1/)).toBeInTheDocument();
  });
});
