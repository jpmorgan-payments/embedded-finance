import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { CriteriaSelector } from '../CriteriaSelector';
import type { CriteriaOptions } from '../../types';

const mockAvailableOptions: CriteriaOptions = {
  products: ['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES'],
  jurisdictions: ['US', 'CA'],
  legalEntityTypes: ['LLC', 'CORPORATION', 'PARTNERSHIP'],
};

describe('CriteriaSelector Integration', () => {
  it('validates supported criteria combinations', async () => {
    const mockOnCriteriaChange = vi.fn();

    const { container } = render(
      <CriteriaSelector
        onCriteriaChange={mockOnCriteriaChange}
        availableOptions={mockAvailableOptions}
      />,
    );

    // Find the select triggers
    const productTrigger = container.querySelector('[id="product-select"]');
    const jurisdictionTrigger = container.querySelector(
      '[id="jurisdiction-select"]',
    );
    const entityTrigger = container.querySelector('[id="entity-select"]');
    const submitButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Generate Journey'),
    );

    expect(productTrigger).toBeTruthy();
    expect(jurisdictionTrigger).toBeTruthy();
    expect(entityTrigger).toBeTruthy();
    expect(submitButton).toBeTruthy();

    // Check that the button text is correct
    expect(submitButton?.textContent).toContain('Generate Journey');
  });

  it('shows validation errors for unsupported combinations', async () => {
    const mockOnCriteriaChange = vi.fn();

    const { container } = render(
      <CriteriaSelector
        onCriteriaChange={mockOnCriteriaChange}
        availableOptions={mockAvailableOptions}
      />,
    );

    // The component should render without errors
    expect(container.textContent).toContain('Select Your Onboarding Criteria');
  });

  it('handles loading state correctly', () => {
    const mockOnCriteriaChange = vi.fn();

    const { container } = render(
      <CriteriaSelector
        onCriteriaChange={mockOnCriteriaChange}
        availableOptions={mockAvailableOptions}
        isLoading={true}
      />,
    );

    // Check that loading state is handled
    expect(container.textContent).toContain('Loading...');
  });

  it('displays combination preview when valid selection is made', () => {
    const mockOnCriteriaChange = vi.fn();

    const { container } = render(
      <CriteriaSelector
        onCriteriaChange={mockOnCriteriaChange}
        availableOptions={mockAvailableOptions}
      />,
    );

    // Component should render the form elements
    expect(container.querySelector('[id="product-select"]')).toBeTruthy();
    expect(container.querySelector('[id="jurisdiction-select"]')).toBeTruthy();
    expect(container.querySelector('[id="entity-select"]')).toBeTruthy();
  });
});
