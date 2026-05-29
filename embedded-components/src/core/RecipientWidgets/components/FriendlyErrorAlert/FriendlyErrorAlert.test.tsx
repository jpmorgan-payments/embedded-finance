import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FriendlyErrorAlert } from './FriendlyErrorAlert';

// Mock react-i18next with all required exports
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'errors.known.RTP_UNAVAILABLE.title': 'Payment Method Not Available',
          'errors.known.RTP_UNAVAILABLE.description':
            "Real-Time Payments (RTP) is not supported by the recipient's bank.",
          'errors.known.RTP_UNAVAILABLE.suggestion':
            'You can still add this recipient using ACH or Wire transfer.',
        };
        return translations[key] || key;
      },
    }),
  };
});

describe('FriendlyErrorAlert', () => {
  it('should render nothing when error is null', () => {
    const { container } = render(<FriendlyErrorAlert error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display friendly error for RTP_UNAVAILABLE error', () => {
    const error = {
      response: {
        data: {
          httpStatus: 400,
          title: 'Payment Method Not Supported',
          context: [
            {
              code: 'RTP_UNAVAILABLE',
              field: 'account.routingInformation[].transactionType',
              message:
                'RTP (Real-Time Payments) is not available at this financial institution.',
            },
          ],
        },
        status: 400,
      },
      status: 400,
    } as any;

    render(<FriendlyErrorAlert error={error} />);

    // Should show friendly title, not the raw API title
    expect(
      screen.getByText('Payment Method Not Available')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Real-Time Payments \(RTP\) is not supported/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You can still add this recipient using ACH or Wire/)
    ).toBeInTheDocument();
  });

  it('should display context message from the error', () => {
    const error = {
      response: {
        data: {
          httpStatus: 400,
          title: 'Payment Method Not Supported',
          context: [
            {
              code: 'RTP_UNAVAILABLE',
              field: 'account.routingInformation[].transactionType',
              message:
                'RTP (Real-Time Payments) is not available at this financial institution.',
            },
          ],
        },
        status: 400,
      },
      status: 400,
    } as any;

    render(<FriendlyErrorAlert error={error} />);

    // Should show the technical message from context
    expect(
      screen.getByText(
        /RTP \(Real-Time Payments\) is not available at this financial institution/
      )
    ).toBeInTheDocument();
  });

  it('should fall back to ServerErrorAlert for unknown errors', () => {
    const error = {
      response: {
        data: {
          httpStatus: 500,
          title: 'Internal Server Error',
        },
        status: 500,
      },
      status: 500,
      message: 'Internal Server Error',
    } as any;

    render(
      <FriendlyErrorAlert
        error={error}
        customTitle="Something went wrong"
        showDetails
      />
    );

    // Should show the custom title from ServerErrorAlert
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const error = {
      response: {
        data: {
          httpStatus: 400,
          title: 'Payment Method Not Supported',
          context: [
            {
              code: 'RTP_UNAVAILABLE',
              message: 'RTP not available',
            },
          ],
        },
        status: 400,
      },
      status: 400,
    } as any;

    render(<FriendlyErrorAlert error={error} className="eb-mt-4" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('eb-mt-4');
  });
});
