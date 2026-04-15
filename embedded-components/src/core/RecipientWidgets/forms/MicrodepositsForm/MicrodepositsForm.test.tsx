import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor, within } from '@test-utils';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

import { MicrodepositsFormDialogTrigger } from './MicrodepositsForm';

const mockRecipient: Recipient = {
  id: 'recipient-1',
  status: 'READY_FOR_VALIDATION',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'John',
    lastName: 'Doe',
  },
  account: {
    number: '12345678',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '123456789',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

describe('MicrodepositsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  it('should render trigger button', () => {
    server.use(
      http.get('/recipients/:id', () => {
        return HttpResponse.json(mockRecipient);
      })
    );

    render(
      <MicrodepositsFormDialogTrigger recipientId="recipient-1">
        <button type="button">Verify Account</button>
      </MicrodepositsFormDialogTrigger>
    );

    expect(
      screen.getByRole('button', { name: /verify account/i })
    ).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/recipients/:id', () => {
        return HttpResponse.json(mockRecipient);
      })
    );

    render(
      <MicrodepositsFormDialogTrigger recipientId="recipient-1">
        <button type="button">Verify Account</button>
      </MicrodepositsFormDialogTrigger>
    );

    await user.click(screen.getByRole('button', { name: /verify account/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should render form fields in dialog', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/recipients/:id', () => {
        return HttpResponse.json(mockRecipient);
      })
    );

    render(
      <MicrodepositsFormDialogTrigger recipientId="recipient-1">
        <button type="button">Verify Account</button>
      </MicrodepositsFormDialogTrigger>
    );

    await user.click(screen.getByRole('button', { name: /verify account/i }));

    await waitFor(() => {
      expect(
        screen.getByLabelText(/first deposit amount/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/second deposit amount/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate microdeposit amounts', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/recipients/:id', () => {
        return HttpResponse.json(mockRecipient);
      })
    );

    render(
      <MicrodepositsFormDialogTrigger recipientId="recipient-1">
        <button type="button">Verify Account</button>
      </MicrodepositsFormDialogTrigger>
    );

    await user.click(screen.getByRole('button', { name: /verify account/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const submitButton = within(dialog).getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    // Should show validation errors for both fields (appears twice - once per field)
    await waitFor(() => {
      const errors = screen.getAllByText(/value must be at least/i);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toBeInTheDocument();
    });
  });

  it('should submit valid microdeposit amounts', async () => {
    const user = userEvent.setup();
    const onSettled = vi.fn();

    server.use(
      http.get('/recipients/:id', () => {
        return HttpResponse.json(mockRecipient);
      }),
      http.post('/recipients/:id/verify-microdeposit', async () => {
        return HttpResponse.json({ status: 'VERIFIED' });
      })
    );

    render(
      <MicrodepositsFormDialogTrigger
        recipientId="recipient-1"
        onVerificationSettled={onSettled}
      >
        <button type="button">Verify Account</button>
      </MicrodepositsFormDialogTrigger>
    );

    await user.click(screen.getByRole('button', { name: /verify account/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill in amounts
    const amount1Input = screen.getByLabelText(/first deposit amount/i);
    const amount2Input = screen.getByLabelText(/second deposit amount/i);

    await user.clear(amount1Input);
    await user.type(amount1Input, '0.25');
    await user.clear(amount2Input);
    await user.type(amount2Input, '0.37');

    const dialog = screen.getByRole('dialog');
    const submitButton = within(dialog).getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSettled).toHaveBeenCalledWith(
        { status: 'VERIFIED' },
        expect.anything()
      );
    });
  });

  it('should handle verification errors', async () => {
    const user = userEvent.setup();
    const onSettled = vi.fn();

    server.use(
      http.get('/recipients/:id', () => {
        return HttpResponse.json(mockRecipient);
      }),
      http.post('/recipients/:id/verify-microdeposit', () => {
        return HttpResponse.json(
          { message: 'Invalid amounts' },
          { status: 400 }
        );
      })
    );

    render(
      <MicrodepositsFormDialogTrigger
        recipientId="recipient-1"
        onVerificationSettled={onSettled}
      >
        <button type="button">Verify Account</button>
      </MicrodepositsFormDialogTrigger>
    );

    await user.click(screen.getByRole('button', { name: /verify account/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill in amounts
    const amount1Input = screen.getByLabelText(/first deposit amount/i);
    const amount2Input = screen.getByLabelText(/second deposit amount/i);

    await user.clear(amount1Input);
    await user.type(amount1Input, '0.25');
    await user.clear(amount2Input);
    await user.type(amount2Input, '0.37');

    const dialog = screen.getByRole('dialog');
    const submitButton = within(dialog).getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
    expect(onSettled).not.toHaveBeenCalled();
  });

  it('should support controlled mode', async () => {
    const onOpenChange = vi.fn();

    server.use(
      http.get('/recipients/:id', () => {
        return HttpResponse.json(mockRecipient);
      })
    );

    const { rerender } = render(
      <MicrodepositsFormDialogTrigger
        recipientId="recipient-1"
        open={false}
        onOpenChange={onOpenChange}
      >
        <button type="button">Verify Account</button>
      </MicrodepositsFormDialogTrigger>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open via controlled prop
    rerender(
      <MicrodepositsFormDialogTrigger
        recipientId="recipient-1"
        open
        onOpenChange={onOpenChange}
      >
        <button type="button">Verify Account</button>
      </MicrodepositsFormDialogTrigger>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
