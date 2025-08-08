import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CriteriaSelector } from '../CriteriaSelector';
import type { CriteriaOptions } from '../../types';

const mockAvailableOptions: CriteriaOptions = {
  products: ['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES'],
  jurisdictions: ['US', 'CA'],
  legalEntityTypes: ['LLC', 'CORPORATION'],
};

describe('CriteriaSelector', () => {
  it('renders without crashing', () => {
    const mockOnCriteriaChange = vi.fn();

    const { container } = render(
      <CriteriaSelector
        onCriteriaChange={mockOnCriteriaChange}
        availableOptions={mockAvailableOptions}
      />,
    );

    expect(container).toBeTruthy();
    expect(container.textContent).toContain('Select Your Onboarding Criteria');
    expect(container.textContent).toContain('Product Type');
    expect(container.textContent).toContain('Jurisdiction');
    expect(container.textContent).toContain('Legal Entity Type');
  });

  it('displays the generate journey button', () => {
    const mockOnCriteriaChange = vi.fn();

    const { container } = render(
      <CriteriaSelector
        onCriteriaChange={mockOnCriteriaChange}
        availableOptions={mockAvailableOptions}
      />,
    );

    expect(container.textContent).toContain('Generate Journey');
  });
});
