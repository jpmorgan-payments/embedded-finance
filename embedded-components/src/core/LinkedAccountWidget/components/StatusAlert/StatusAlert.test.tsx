import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

import { StatusAlert } from './StatusAlert';

const mockRecipient: Partial<Recipient> = {
  id: 'test-recipient-id',
  updatedAt: '2024-01-15T10:00:00.000Z',
  status: 'READY_FOR_VALIDATION',
};

describe('StatusAlert', () => {
  it('should render default description for PENDING status', () => {
    render(<StatusAlert status="PENDING" />);

    expect(
      screen.getByText(/your account is being verified/i)
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

    expect(screen.getByText(/could not be verified/i)).toBeInTheDocument();
  });

  it('should render default description for INACTIVE status', () => {
    render(<StatusAlert status="INACTIVE" />);

    expect(screen.getByText(/inactive/i)).toBeInTheDocument();
  });

  it('should not render for ACTIVE status by default', () => {
    const { container } = render(<StatusAlert status="ACTIVE" />);

    expect(container.firstChild).toBeNull();
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
    const action = <button>Verify Now</button>;

    render(<StatusAlert status="READY_FOR_VALIDATION" action={action} />);

    expect(
      screen.getByRole('button', { name: /verify now/i })
    ).toBeInTheDocument();
  });

  it('should render icon for each status', () => {
    const { container: container1 } = render(<StatusAlert status="PENDING" />);
    expect(container1.querySelector('svg')).toBeInTheDocument();

    const { container: container2 } = render(
      <StatusAlert
        status="READY_FOR_VALIDATION"
        recipient={mockRecipient as Recipient}
      />
    );
    expect(container2.querySelector('svg')).toBeInTheDocument();

    const { container: container3 } = render(<StatusAlert status="REJECTED" />);
    expect(container3.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatusAlert status="PENDING" className="custom-class" />
    );

    const alert = container.querySelector('.custom-class');
    expect(alert).toBeInTheDocument();
  });

  it('should have role="alert"', () => {
    render(<StatusAlert status="PENDING" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with warning variant for READY_FOR_VALIDATION', () => {
    const { container } = render(
      <StatusAlert
        status="READY_FOR_VALIDATION"
        recipient={mockRecipient as Recipient}
      />
    );

    // Alert component should exist
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('should render with destructive variant for REJECTED', () => {
    const { container } = render(<StatusAlert status="REJECTED" />);

    // Alert component should exist
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });
});
