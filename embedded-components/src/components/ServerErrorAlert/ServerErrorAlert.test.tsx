import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { ServerErrorAlert } from './ServerErrorAlert';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EBComponentsProvider apiBaseUrl="http://test">
    {children}
  </EBComponentsProvider>
);

function createError(overrides: Record<string, any> = {}) {
  return {
    message: 'Request failed',
    status: 400,
    response: {
      data: {
        httpStatus: 400,
        title: 'Bad Request',
        message: 'Validation failed',
        context: [{ field: 'email', message: 'Invalid email format' }],
        reasons: [{ field: 'name', message: 'Required', reason: 'NOT_NULL' }],
      },
    },
    ...overrides,
  } as any;
}

describe('ServerErrorAlert', () => {
  it('renders nothing when error is null', () => {
    render(<ServerErrorAlert error={null} />, { wrapper });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the error title from response data', () => {
    render(<ServerErrorAlert error={createError()} />, { wrapper });
    expect(screen.getByText('Bad Request')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(
      <ServerErrorAlert error={createError()} customTitle="Custom Error" />,
      { wrapper }
    );
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('falls back to error.message when no response title', () => {
    const error = createError({
      response: { data: {} },
      message: 'Network Error',
    });
    render(<ServerErrorAlert error={error} />, { wrapper });
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('renders custom error message string', () => {
    render(
      <ServerErrorAlert
        error={createError()}
        customErrorMessage="Something went wrong"
      />,
      { wrapper }
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('uses API message when available', () => {
    const error = createError({
      response: {
        data: {
          httpStatus: 400,
          title: 'Bad Request',
          message: 'ABA routing number 533100000 not found',
          context: [],
        },
      },
    });
    render(<ServerErrorAlert error={error} />, { wrapper });
    expect(
      screen.getByText('ABA routing number 533100000 not found')
    ).toBeInTheDocument();
  });

  it('prefers context messages when top-level message matches title', () => {
    const error = createError({
      response: {
        data: {
          httpStatus: 400,
          title: 'Bad Request',
          message: 'Bad Request', // Generic - matches title
          context: [{ message: 'Organization type not allowed' }],
        },
      },
    });
    render(<ServerErrorAlert error={error} />, { wrapper });
    expect(
      screen.getByText('Organization type not allowed')
    ).toBeInTheDocument();
  });

  it('renders "Try again" button when tryAgainAction is provided', () => {
    const tryAgain = vi.fn();
    render(
      <ServerErrorAlert error={createError()} tryAgainAction={tryAgain} />,
      {
        wrapper,
      }
    );
    const btn = screen.getByRole('button', { name: /try again/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(tryAgain).toHaveBeenCalledTimes(1);
  });

  it('does not render "Try again" button by default', () => {
    render(<ServerErrorAlert error={createError()} />, { wrapper });
    expect(
      screen.queryByRole('button', { name: /try again/i })
    ).not.toBeInTheDocument();
  });

  it('toggles error details on click', () => {
    render(<ServerErrorAlert error={createError()} />, { wrapper });

    // Find the show details button
    const detailsBtn = screen.getByRole('button', { name: /show details/i });
    expect(detailsBtn).toBeInTheDocument();

    // Click to expand
    fireEvent.click(detailsBtn);

    // Should now show reasons and context
    expect(screen.getByText(/NOT_NULL/)).toBeInTheDocument();
    expect(screen.getByText(/Invalid email format/)).toBeInTheDocument();

    // Click to collapse
    const hideBtn = screen.getByRole('button', { name: /hide details/i });
    fireEvent.click(hideBtn);

    // Details should be hidden
    expect(screen.queryByText(/NOT_NULL/)).not.toBeInTheDocument();
  });

  it('hides details section when showDetails is false', () => {
    render(<ServerErrorAlert error={createError()} showDetails={false} />, {
      wrapper,
    });
    expect(
      screen.queryByRole('button', { name: /show details/i })
    ).not.toBeInTheDocument();
  });

  it('renders reasons with rejectedValue', () => {
    const error = createError({
      response: {
        data: {
          httpStatus: 400,
          title: 'Validation Error',
          reasons: [
            {
              field: 'phone',
              message: 'Invalid format',
              reason: 'PATTERN',
              rejectedValue: '123',
            },
          ],
          context: [],
        },
      },
    });
    render(<ServerErrorAlert error={error} />, { wrapper });

    // Expand details
    fireEvent.click(screen.getByRole('button', { name: /show details/i }));

    expect(screen.getByText('phone')).toBeInTheDocument();
    expect(screen.getByText(/PATTERN/)).toBeInTheDocument();
    expect(screen.getByText(/"123"/)).toBeInTheDocument();
  });

  it('handles string reasons', () => {
    const error = createError({
      response: {
        data: {
          httpStatus: 500,
          title: 'Server Error',
          reasons: ['Something broke'],
          context: [],
        },
      },
    });
    render(<ServerErrorAlert error={error} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /show details/i }));
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders custom error messages by status code', () => {
    const error = createError({
      response: {
        data: {
          httpStatus: 503,
          title: 'Service Unavailable',
          message: undefined,
          context: [],
        },
      },
      status: 503,
    });
    render(
      <ServerErrorAlert
        error={error}
        customErrorMessage={{ '503': 'Server is down', default: 'Oops' }}
      />,
      { wrapper }
    );
    expect(screen.getByText('Server is down')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ServerErrorAlert error={createError()} className="eb-my-custom" />,
      { wrapper }
    );
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.className).toContain('eb-my-custom');
  });
});
