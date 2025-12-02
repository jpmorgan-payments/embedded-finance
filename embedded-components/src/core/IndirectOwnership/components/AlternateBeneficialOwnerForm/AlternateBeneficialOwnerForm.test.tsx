import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { AlternateBeneficialOwnerForm } from './AlternateBeneficialOwnerForm';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('AlternateBeneficialOwnerForm', () => {
  const mockProps = {
    owners: [],
    onOwnersChange: vi.fn(),
    onNext: vi.fn(),
    kycCompanyName: 'Test Company',
  };

  it('renders the component correctly', () => {
    render(<AlternateBeneficialOwnerForm {...mockProps} />);
    
    expect(screen.getByText('Who are the beneficial owners?')).toBeInTheDocument();
    expect(screen.getByText(/A beneficial owner is any individual who owns 25% or more of Test Company/)).toBeInTheDocument();
  });

  it('shows empty state when no owners are added', () => {
    render(<AlternateBeneficialOwnerForm {...mockProps} />);
    
    expect(screen.getByText('No beneficial owners added yet')).toBeInTheDocument();
  });

  it('displays current owners count', () => {
    const owners = [
      { id: '1', firstName: 'John', lastName: 'Doe' },
      { id: '2', firstName: 'Jane', lastName: 'Smith' },
    ];
    
    render(<AlternateBeneficialOwnerForm {...mockProps} owners={owners} />);
    
    expect(screen.getByText('Current Owners (2)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
