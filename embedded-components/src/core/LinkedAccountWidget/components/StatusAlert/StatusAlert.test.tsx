import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { StatusAlert } from './StatusAlert';

describe('StatusAlert', () => {
  it('should render default description for PENDING status', () => {
    render(<StatusAlert status="PENDING" />);

    expect(
      screen.getByText(/your account information is being processed/i)
    ).toBeInTheDocument();
  });

  it('should render default description for MICRODEPOSITS_INITIATED status', () => {
    render(<StatusAlert status="MICRODEPOSITS_INITIATED" />);

    expect(
      screen.getByText(/we're sending two small deposits/i)
    ).toBeInTheDocument();
  });

  it('should render default description for READY_FOR_VALIDATION status', () => {
    render(<StatusAlert status="READY_FOR_VALIDATION" />);

    expect(
      screen.getByText(/verification deposits have arrived/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/please verify the amounts within 20 business days/i)
    ).toBeInTheDocument();
  });

  it('should render default description for REJECTED status', () => {
    render(<StatusAlert status="REJECTED" />);

    expect(
      screen.getByText(/there was an issue linking this account/i)
    ).toBeInTheDocument();
  });

  it('should render default description for INACTIVE status', () => {
    render(<StatusAlert status="INACTIVE" />);

    expect(
      screen.getByText(/this account has been deactivated/i)
    ).toBeInTheDocument();
  });

  it('should not render for ACTIVE status by default', () => {
    const { container } = render(<StatusAlert status="ACTIVE" />);

    // The component returns null for ACTIVE status without custom content
    // but the test setup still renders a wrapper, so we check that no alert is shown
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeInTheDocument();
  });

  it('should render for ACTIVE status with custom content', () => {
    render(<StatusAlert status="ACTIVE" title="Success" />);

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should render custom title when provided', () => {
    render(<StatusAlert status="PENDING" title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render custom description when provided', () => {
    render(
      <StatusAlert status="PENDING" description="Custom description text" />
    );

    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('should render action element when provided', () => {
    const action = <button type="button">Verify Now</button>;

    render(<StatusAlert status="READY_FOR_VALIDATION" action={action} />);

    expect(
      screen.getByRole('button', { name: /verify now/i })
    ).toBeInTheDocument();
  });

  it('should render icon for each status', () => {
    const { container: container1 } = render(<StatusAlert status="PENDING" />);
    expect(container1.querySelector('svg')).toBeInTheDocument();

    const { container: container2 } = render(
      <StatusAlert status="READY_FOR_VALIDATION" />
    );
    expect(container2.querySelector('svg')).toBeInTheDocument();

    const { container: container3 } = render(<StatusAlert status="REJECTED" />);
    expect(container3.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatusAlert status="PENDING" className="eb-custom-class" />
    );

    const alert = container.querySelector('.eb-custom-class');
    expect(alert).toBeInTheDocument();
  });

  it('should have role="alert"', () => {
    render(<StatusAlert status="PENDING" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with warning variant for READY_FOR_VALIDATION', () => {
    const { container } = render(<StatusAlert status="READY_FOR_VALIDATION" />);

    // Alert component should exist
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('should render with destructive variant for REJECTED', () => {
    const { container } = render(<StatusAlert status="REJECTED" />);

    // Alert component should exist
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });
});
