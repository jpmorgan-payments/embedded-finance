import i18n from '@/i18n';
import { server } from '@/msw/server';
import { EBComponentsProvider } from '@/providers/EBComponentsProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';

import { MakePayment } from './MakePayment';

// Setup QueryClient for tests
const queryClient = new QueryClient();

// Mock data setup
const singleAccount = [{ id: 'account1', name: 'Main Account' }];
const multipleAccounts = [
  { id: 'account1', name: 'Main Account' },
  { id: 'account2', name: 'Savings Account' },
];

const singleRecipient = [
  {
    id: 'linkedAccount',
    name: 'Linked Account John Doe',
    accountNumber: '****1234',
  },
];

const multipleRecipients = [
  {
    id: 'linkedAccount1',
    name: 'Linked Account John Doe',
    accountNumber: '****1234',
  },
  {
    id: 'linkedAccount2',
    name: 'Linked Account Jane Smith',
    accountNumber: '****5678',
  },
];

const defaultPaymentMethods = [
  { id: 'ACH', name: 'ACH', fee: 2.5 },
  { id: 'RTP', name: 'RTP', fee: 1 },
  { id: 'WIRE', name: 'WIRE', fee: 25 },
];

const singlePaymentMethod = [{ id: 'ACH', name: 'ACH', fee: 2.5 }];

const customPaymentMethods = [
  {
    id: 'INSTANT',
    name: 'Instant Transfer',
    fee: 5,
    description: 'Instant transfer with a $5 fee',
  },
  {
    id: 'STANDARD',
    name: 'Standard Transfer',
    fee: 0,
    description: 'Free transfer that takes 2-3 business days',
  },
];

// Component Rendering Helper
const renderComponent = (
  accounts = singleAccount,
  recipients = singleRecipient,
  paymentMethods = defaultPaymentMethods
) => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  // Setup explicit API mock handlers
  server.use(
    http.post('/api/transactions', () => {
      return HttpResponse.json({ success: true });
    })
  );

  return render(
    <I18nextProvider i18n={i18n}>
      <EBComponentsProvider
        apiBaseUrl="/"
        headers={{}}
        contentTokens={{
          name: 'enUS',
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MakePayment
            accounts={accounts}
            recipients={recipients}
            paymentMethods={paymentMethods}
          />
        </QueryClientProvider>
      </EBComponentsProvider>
    </I18nextProvider>
  );
};

describe('MakePayment', () => {
  test('renders correctly with initial data', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  test('preselects account when only one account is available', async () => {
    renderComponent(singleAccount, multipleRecipients);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if the account is preselected
    const fromSelect = screen.getByLabelText(/from/i);
    expect(fromSelect).toHaveTextContent('Main Account');
  });

  test('preselects recipient when only one recipient is available', async () => {
    renderComponent(multipleAccounts, singleRecipient);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if the recipient is preselected
    const toSelect = screen.getByLabelText(/to/i);
    expect(toSelect).toHaveTextContent('Linked Account John Doe');
  });

  test('preselects both account and recipient when only one of each is available', async () => {
    renderComponent(singleAccount, singleRecipient);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if both account and recipient are preselected
    const fromSelect = screen.getByLabelText(/from/i);
    const toSelect = screen.getByLabelText(/to/i);

    expect(fromSelect).toHaveTextContent('Main Account');
    expect(toSelect).toHaveTextContent('Linked Account John Doe');
  });

  test('does not preselect account when multiple accounts are available', async () => {
    renderComponent(multipleAccounts, singleRecipient);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if the account is not preselected
    const fromSelect = screen.getByLabelText(/from/i);
    expect(fromSelect).not.toHaveTextContent('Main Account');
    expect(fromSelect).not.toHaveTextContent('Savings Account');
  });

  test('does not preselect recipient when multiple recipients are available', async () => {
    renderComponent(singleAccount, multipleRecipients);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if the recipient is not preselected
    const toSelect = screen.getByLabelText(/to/i);
    expect(toSelect).not.toHaveTextContent('Linked Account John Doe');
    expect(toSelect).not.toHaveTextContent('Linked Account Jane Smith');
  });

  test('renders custom payment methods', async () => {
    renderComponent(singleAccount, singleRecipient, customPaymentMethods);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if custom payment methods are rendered
    expect(screen.getByLabelText(/instant transfer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/standard transfer/i)).toBeInTheDocument();
  });

  test('preselects payment method when only one payment method is available', async () => {
    renderComponent(singleAccount, singleRecipient, singlePaymentMethod);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if the payment method is preselected
    const achRadio = screen.getByLabelText(/ach/i);
    expect(achRadio).toBeChecked();
  });

  test('calculates fee based on selected payment method', async () => {
    renderComponent(singleAccount, singleRecipient, customPaymentMethods);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /make payment/i })
    );

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill in amount
    const amountInput = screen.getByPlaceholderText(/enter amount/i);
    await userEvent.type(amountInput, '100');

    // Select payment method
    const instantTransferRadio = screen.getByLabelText(/instant transfer/i);
    await userEvent.click(instantTransferRadio);

    // Check if fee is calculated correctly
    expect(screen.getByText(/transfer fee: \$5.00/i)).toBeInTheDocument();
  });
});
