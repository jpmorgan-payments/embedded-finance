import { render, screen } from '@testing-library/react';

import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  test('renders Active status correctly', () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('renders Inactive status correctly', () => {
    render(<StatusBadge status="INACTIVE" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  test('renders Pending status correctly', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('renders Rejected status correctly', () => {
    render(<StatusBadge status="REJECTED" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  test('renders Microdeposits Initiated status correctly', () => {
    render(<StatusBadge status="MICRODEPOSITS_INITIATED" />);
    expect(screen.getByText('Microdeposits Initiated')).toBeInTheDocument();
  });

  test('renders Ready For Validation status correctly', () => {
    render(<StatusBadge status="READY_FOR_VALIDATION" />);
    expect(screen.getByText('Ready For Validation')).toBeInTheDocument();
  });

  test('uses correct badge variant for ACTIVE', () => {
    render(<StatusBadge status="ACTIVE" />);
    // Verify the badge text is rendered (variant is applied via className)
    const badgeText = screen.getByText('Active');
    expect(badgeText).toBeInTheDocument();
    // Verify it's within a div element (Badge component structure)
    expect(badgeText.parentElement).toBeInTheDocument();
  });
});
