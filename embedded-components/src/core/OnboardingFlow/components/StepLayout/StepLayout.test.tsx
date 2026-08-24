import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StepLayout } from './StepLayout';

describe('StepLayout', () => {
  it('renders block content in the description without nesting it in a paragraph', () => {
    render(
      <StepLayout
        title="Operational details"
        description={
          <ul aria-label="Requirements">
            <li>First requirement</li>
          </ul>
        }
      >
        <div>Form content</div>
      </StepLayout>
    );

    const list = screen.getByRole('list', { name: 'Requirements' });
    expect(list.parentElement?.tagName).toBe('DIV');
    expect(list.closest('p')).toBeNull();
  });
});
