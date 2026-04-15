import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

describe('Tooltip', () => {
  it('renders trigger and content when defaultOpen', () => {
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <button type="button">Focus target</button>
        </TooltipTrigger>
        <TooltipContent>Tooltip help copy</TooltipContent>
      </Tooltip>
    );

    expect(
      screen.getByRole('button', { name: 'Focus target' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Tooltip help copy').length
    ).toBeGreaterThanOrEqual(1);
  });
});
