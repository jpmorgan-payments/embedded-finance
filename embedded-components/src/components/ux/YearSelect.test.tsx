import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { YearSelect } from './YearSelect';

describe('YearSelect', () => {
  it('renders with a placeholder', () => {
    render(<YearSelect onChange={vi.fn()} />);
    expect(screen.getByText('YYYY')).toBeInTheDocument();
  });

  it('renders with a selected value', () => {
    render(<YearSelect onChange={vi.fn()} value="2020" />);
    expect(screen.getByText('2020')).toBeInTheDocument();
  });

  it('renders with custom maxDate', () => {
    render(<YearSelect onChange={vi.fn()} maxDate={2030} />);
    expect(screen.getByText('YYYY')).toBeInTheDocument();
  });
});
