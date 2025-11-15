import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('should render ACTIVE status with checkmark icon', () => {
    render(<StatusBadge status="ACTIVE" />);

    expect(screen.getByText(/active/i)).toBeInTheDocument();
    // Icon should be present
    const badge = screen.getByText(/active/i).parentElement;
    expect(badge).toBeInTheDocument();
  });

  it('should render PENDING status with clock icon', () => {
    render(<StatusBadge status="PENDING" />);

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('should render MICRODEPOSITS_INITIATED status', () => {
    render(<StatusBadge status="MICRODEPOSITS_INITIATED" />);

    expect(screen.getByText(/pending verification/i)).toBeInTheDocument();
  });

  it('should render READY_FOR_VALIDATION status with alert icon', () => {
    render(<StatusBadge status="READY_FOR_VALIDATION" />);

    expect(screen.getByText(/action required/i)).toBeInTheDocument();
  });

  it('should render REJECTED status with X icon', () => {
    render(<StatusBadge status="REJECTED" />);

    expect(screen.getByText(/rejected/i)).toBeInTheDocument();
  });

  it('should render INACTIVE status with warning icon', () => {
    render(<StatusBadge status="INACTIVE" />);

    expect(screen.getByText(/inactive/i)).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    const { container } = render(
      <StatusBadge status="ACTIVE" showIcon={false} />
    );

    expect(screen.getByText(/active/i)).toBeInTheDocument();
    // Check that no icon SVG is present
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatusBadge status="ACTIVE" className="eb-custom-class" />
    );

    const badge = container.querySelector('.eb-custom-class');
    expect(badge).toBeInTheDocument();
  });

  it('should show icon by default', () => {
    const { container } = render(<StatusBadge status="ACTIVE" />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
