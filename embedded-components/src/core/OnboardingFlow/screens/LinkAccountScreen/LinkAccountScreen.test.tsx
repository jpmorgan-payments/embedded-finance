import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  useGetAllRecipients,
  useGetRecipient,
  useRecipientsVerification,
} from '@/api/generated/ep-recipients';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import {
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';

import { LinkAccountScreen } from './LinkAccountScreen';

const mockGoBack = vi.fn();
const mockGoTo = vi.fn();
const mockSubmit = vi.fn();

vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: () => ({
      goBack: mockGoBack,
      goTo: mockGoTo,
      setFlowUnsavedChanges: vi.fn(),
      sessionData: {},
      updateSessionData: vi.fn(),
    }),
  };
});

vi.mock('@/api/generated/ep-recipients', () => ({
  useGetAllRecipients: vi.fn(),
  useGetRecipient: vi.fn(),
  useRecipientsVerification: vi.fn(),
}));

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoGetClient: vi.fn(),
}));

vi.mock(
  '@/core/EBComponentsProvider/EBComponentsProvider',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/core/EBComponentsProvider/EBComponentsProvider')
      >();
    return {
      ...actual,
      useClientId: () => 'client-1',
      useInterceptorStatus: () => ({ interceptorReady: true }),
    };
  }
);

vi.mock('@/core/RecipientWidgets/hooks/useRecipientForm', () => ({
  useRecipientForm: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: ReactElement, context: OnboardingContextType) {
  return render(
    <EBComponentsProvider
      apiBaseUrl=""
      apiBaseUrlTransforms={{
        clients: (baseUrl) => baseUrl.replace('v1', '/do/v1'),
      }}
    >
      <QueryClientProvider client={queryClient}>
        <OnboardingContext.Provider value={context}>
          {ui}
        </OnboardingContext.Provider>
      </QueryClientProvider>
    </EBComponentsProvider>
  );
}

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: undefined,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: undefined,
};

const mockExistingRecipient = {
  id: 'la-existing-1',
  type: 'LINKED_ACCOUNT' as const,
  status: 'ACTIVE' as const,
  clientId: 'client-1',
  partyDetails: {
    type: 'INDIVIDUAL' as const,
    firstName: 'Existing',
    lastName: 'User',
  },
  account: {
    number: '12345678901234567',
    type: 'CHECKING' as const,
    countryCode: 'US' as const,
    routingInformation: [
      {
        routingCodeType: 'USABA' as const,
        routingNumber: '021000021',
        transactionType: 'ACH' as const,
      },
    ],
  },
  createdAt: '2024-01-15T10:30:00Z',
};

describe('LinkAccountScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    vi.mocked(useSmbdoGetClient).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useSmbdoGetClient>);

    vi.mocked(useRecipientForm).mockReturnValue({
      submit: mockSubmit,
      status: 'idle',
      error: null,
      reset: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof useRecipientForm>);

    vi.mocked(useGetRecipient).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGetRecipient>);

    vi.mocked(useRecipientsVerification).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      status: 'idle',
      data: undefined,
      error: null,
      isPending: false,
      isIdle: true,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof useRecipientsVerification>);
  });

  test('prefill summary without acknowledgements requires default certification before confirm', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'Taylor',
          lastName: 'Morgan',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    const certifyCheckbox = screen.getByRole('checkbox', {
      name: /I authorize verification of this external bank account/i,
    });
    expect(certifyCheckbox).not.toBeChecked();

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm and link account/i,
    });
    expect(confirmBtn).toBeDisabled();

    await user.click(certifyCheckbox);
    expect(confirmBtn).not.toBeDisabled();

    await user.click(confirmBtn);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const payload = mockSubmit.mock.calls[0][0];
    expect(payload.firstName).toBe('Taylor');
    expect(payload.accountNumber).toBe('12345678901234567');
    expect(payload.routingNumbers[0].routingNumber).toBe('021000021');
    expect(payload.certify).toBe(true);
  });

  test('prefill summary shows disabled fields, intro, and submits with certify true', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'Taylor',
          lastName: 'Morgan',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
        reviewAcknowledgements: [
          {
            id: 'a',
            labelKey:
              'screens.linkAccount.prefillSummary.acknowledgements.businessPurpose',
          },
          {
            id: 'b',
            labelKey:
              'screens.linkAccount.prefillSummary.acknowledgements.verifyAndAccuracy',
          },
          {
            id: 'c',
            labelKey:
              'screens.linkAccount.prefillSummary.acknowledgements.debitAndTerms',
          },
        ],
        showAcknowledgementsIntro: true,
      },
    });

    expect(
      await screen.findByText(/By electronically linking this account/i)
    ).toBeInTheDocument();

    expect(screen.getByDisplayValue('021000021')).toBeDisabled();
    expect(screen.getByDisplayValue('12345678901234567')).toBeDisabled();

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm and link account/i,
    });
    expect(confirmBtn).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', {
        name: /primarily for business purposes/i,
      })
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: /authorize verification of this linked account/i,
      })
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: /JPMorgan Chase Bank/i,
      })
    );

    expect(confirmBtn).not.toBeDisabled();
    await user.click(confirmBtn);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        accountNumber: '12345678901234567',
        certify: true,
      })
    );
  });

  test('existing READY_FOR_VALIDATION account shows Verify Account for microdeposits', async () => {
    const readyRecipient = {
      id: 'la-ready-test-1',
      type: 'LINKED_ACCOUNT' as const,
      status: 'READY_FOR_VALIDATION' as const,
      clientId: 'client-1',
      partyDetails: {
        type: 'INDIVIDUAL' as const,
        firstName: 'Alex',
        lastName: 'James',
      },
      account: {
        number: '12345678901234567',
        type: 'CHECKING' as const,
        countryCode: 'US' as const,
        routingInformation: [
          {
            routingCodeType: 'USABA' as const,
            routingNumber: '021000021',
            transactionType: 'ACH' as const,
          },
        ],
      },
      createdAt: '2024-01-15T10:30:00Z',
    };

    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [readyRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    vi.mocked(useGetRecipient).mockReturnValue({
      data: readyRecipient,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGetRecipient>);

    renderWithProviders(<LinkAccountScreen />, baseOnboardingContext);

    // LinkAccountScreen now redirects to overview when an existing account is found
    await vi.waitFor(() => {
      expect(mockGoTo).toHaveBeenCalledWith('overview', {
        resetHistory: true,
      });
    });
  });

  test('editable prefill renders bank account form with overridden account number', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: {
          accountNumber: '98765432109876543',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Continue to Account Details/i })
    );

    const accountInput = await screen.findByLabelText(/account number/i);
    expect(accountInput).toHaveValue('98765432109876543');
  });

  test('editable mode with reviewAcknowledgements shows agreements on step 2 and gates submit', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: {
          accountNumber: '98765432109876543',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
        },
        reviewAcknowledgements: [
          {
            id: 'biz',
            labelKey:
              'screens.linkAccount.prefillSummary.acknowledgements.businessPurpose',
          },
          {
            id: 'verify',
            labelKey:
              'screens.linkAccount.prefillSummary.acknowledgements.verifyAndAccuracy',
          },
        ],
        showAcknowledgementsIntro: true,
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Continue to Account Details/i })
    );

    expect(
      await screen.findByText(/By electronically linking this account/i)
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /^Link Account$/i });
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    await user.click(
      screen.getByRole('checkbox', {
        name: /primarily for business purposes/i,
      })
    );
    expect(submitBtn).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', {
        name: /authorize verification of this linked account/i,
      })
    );
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });
  });

  // ─── New tests: partyId, presetAccounts, allowMultipleAccounts ──────────────

  test('partyId is passed to useRecipientForm hook options', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        partyId: 'party-123',
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'Taylor',
          lastName: 'Morgan',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    // Verify useRecipientForm was called with partyId
    expect(useRecipientForm).toHaveBeenCalledWith(
      expect.objectContaining({
        partyId: 'party-123',
        recipientType: 'LINKED_ACCOUNT',
        mode: 'create',
      })
    );

    const certifyCheckbox = screen.getByRole('checkbox', {
      name: /I authorize verification of this external bank account/i,
    });
    await user.click(certifyCheckbox);

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm and link account/i,
    });
    await user.click(confirmBtn);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    // partyId is NOT on the form data — it's handled inside useRecipientForm
    const payload = mockSubmit.mock.calls[0][0];
    expect(payload.firstName).toBe('Taylor');
    expect(payload.partyId).toBeUndefined();
  });

  test('presetAccounts renders account selector dropdown', async () => {
    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: {},
        presetAccounts: [
          {
            id: 'preset-1',
            label: 'Business Account A',
            partyId: 'party-a',
            initialValues: {
              accountType: 'ORGANIZATION',
              businessName: 'Alpha Corp',
              accountNumber: '11111111111111111',
              routingNumbers: [
                { paymentType: 'ACH', routingNumber: '021000021' },
              ],
            },
          },
          {
            id: 'preset-2',
            label: 'Business Account B',
            partyId: 'party-b',
            initialValues: {
              accountType: 'ORGANIZATION',
              businessName: 'Beta Corp',
              accountNumber: '22222222222222222',
              routingNumbers: [
                { paymentType: 'ACH', routingNumber: '021000021' },
              ],
            },
          },
        ],
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    // The preset selector should be rendered
    expect(screen.getByTestId('preset-account-select')).toBeInTheDocument();
  });

  test('presetAccounts uses selected preset partyId on submit', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        initialValues: {},
        presetAccounts: [
          {
            id: 'preset-1',
            label: 'Business Account A',
            partyId: 'party-a',
            initialValues: {
              accountType: 'ORGANIZATION',
              businessName: 'Alpha Corp',
              routingNumbers: [
                { paymentType: 'ACH', routingNumber: '021000021' },
              ],
              accountNumber: '11111111111111111',
              bankAccountType: 'CHECKING',
              paymentTypes: ['ACH'],
              certify: false,
            },
          },
          {
            id: 'preset-2',
            label: 'Business Account B',
            partyId: 'party-b',
            initialValues: {
              accountType: 'ORGANIZATION',
              businessName: 'Beta Corp',
              routingNumbers: [
                { paymentType: 'ACH', routingNumber: '022000022' },
              ],
              accountNumber: '22222222222222222',
              bankAccountType: 'CHECKING',
              paymentTypes: ['ACH'],
              certify: false,
            },
          },
        ],
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    // First preset is selected by default; certify and submit
    const certifyCheckbox = screen.getByRole('checkbox', {
      name: /I authorize verification of this external bank account/i,
    });
    await user.click(certifyCheckbox);

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm and link account/i,
    });
    await user.click(confirmBtn);

    // Verify useRecipientForm was called with the first preset's partyId
    expect(useRecipientForm).toHaveBeenCalledWith(
      expect.objectContaining({
        partyId: 'party-a',
        recipientType: 'LINKED_ACCOUNT',
        mode: 'create',
      })
    );

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const payload = mockSubmit.mock.calls[0][0];
    // partyId is handled inside useRecipientForm, not on form data
    expect(payload.businessName).toBe('Alpha Corp');
  });

  test('allowMultipleAccounts shows "Link another account" button after success', async () => {
    let onSuccessCb: (() => void) | undefined;

    vi.mocked(useRecipientForm).mockImplementation((opts) => {
      onSuccessCb = opts.onSuccess;
      return {
        submit: mockSubmit,
        status: 'idle',
        error: null,
        reset: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
      } as unknown as ReturnType<typeof useRecipientForm>;
    });

    const { rerender } = renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        allowMultipleAccounts: true,
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'Taylor',
          lastName: 'Morgan',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    // Simulate successful submission by invoking the onSuccess callback
    onSuccessCb?.();

    // After success, should show the "Link another account" button
    await waitFor(() => {
      expect(
        screen.getByTestId('link-another-account-btn')
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('finish-linking-btn')).toBeInTheDocument();
  });

  test('allowMultipleAccounts: existing account does NOT redirect to overview', async () => {
    const existingRecipient = {
      id: 'la-existing-1',
      type: 'LINKED_ACCOUNT' as const,
      status: 'ACTIVE' as const,
      clientId: 'client-1',
      partyDetails: {
        type: 'INDIVIDUAL' as const,
        firstName: 'Existing',
        lastName: 'User',
      },
      account: {
        number: '12345678901234567',
        type: 'CHECKING' as const,
        countryCode: 'US' as const,
        routingInformation: [
          {
            routingCodeType: 'USABA' as const,
            routingNumber: '021000021',
            transactionType: 'ACH' as const,
          },
        ],
      },
      createdAt: '2024-01-15T10:30:00Z',
    };

    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [existingRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'editable',
        allowMultipleAccounts: true,
        initialValues: {
          accountNumber: '98765432109876543',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
        },
      },
    });

    // Should NOT redirect — should show form
    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    // Verify it did NOT redirect
    expect(mockGoTo).not.toHaveBeenCalled();
  });

  test('single initialValues without presetAccounts does not render selector', async () => {
    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: {
          accountNumber: '98765432109876543',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId('preset-account-select')
    ).not.toBeInTheDocument();
  });

  // ─── Tests: existingAccountsDisplay, button-first pattern, multi-account UX ─

  test('allowMultipleAccounts with existing accounts shows existing section and hides form', async () => {
    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [mockExistingRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        allowMultipleAccounts: true,
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'New',
          lastName: 'Account',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
      },
    });

    // Existing accounts section visible (detailed by default)
    expect(
      await screen.findByTestId('existing-linked-accounts')
    ).toBeInTheDocument();

    // "Add account" button visible
    expect(screen.getByTestId('add-another-account-btn')).toBeInTheDocument();

    // Form should NOT be visible (no confirm button)
    expect(
      screen.queryByRole('button', { name: /Confirm and link account/i })
    ).not.toBeInTheDocument();

    // Should NOT redirect
    expect(mockGoTo).not.toHaveBeenCalled();
  });

  test('existingAccountsDisplay compact renders existing accounts section', async () => {
    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [mockExistingRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        allowMultipleAccounts: true,
        existingAccountsDisplay: 'compact',
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'New',
          lastName: 'Account',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
      },
    });

    expect(
      await screen.findByTestId('existing-linked-accounts')
    ).toBeInTheDocument();
    expect(screen.getByTestId('add-another-account-btn')).toBeInTheDocument();
  });

  test('clicking "Add account" reveals the form and hides existing accounts', async () => {
    const user = userEvent.setup();

    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [mockExistingRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        allowMultipleAccounts: true,
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'New',
          lastName: 'Account',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
      },
    });

    // Initially: existing accounts shown, form hidden
    expect(
      await screen.findByTestId('existing-linked-accounts')
    ).toBeInTheDocument();

    // Click "Add account"
    await user.click(screen.getByTestId('add-another-account-btn'));

    // Form should now be visible (confirm button present)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Confirm and link account/i })
      ).toBeInTheDocument();
    });

    // Existing accounts section should be hidden
    expect(
      screen.queryByTestId('existing-linked-accounts')
    ).not.toBeInTheDocument();
  });

  test('Done button after multi-account success navigates to overview', async () => {
    const user = userEvent.setup();
    let onSuccessCb: (() => void) | undefined;

    vi.mocked(useRecipientForm).mockImplementation((opts) => {
      onSuccessCb = opts.onSuccess;
      return {
        submit: mockSubmit,
        status: 'idle',
        error: null,
        reset: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
      } as unknown as ReturnType<typeof useRecipientForm>;
    });

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        allowMultipleAccounts: true,
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'Taylor',
          lastName: 'Morgan',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    // Trigger success
    onSuccessCb?.();

    // Click "Done"
    const doneBtn = await screen.findByTestId('finish-linking-btn');
    await user.click(doneBtn);

    expect(mockGoTo).toHaveBeenCalledWith('overview', { resetHistory: true });
  });

  test('hideLinkedAccountRemoval with existing accounts renders without errors', async () => {
    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [mockExistingRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      hideLinkedAccountRemoval: true,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        allowMultipleAccounts: true,
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'New',
          lastName: 'Account',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          accountNumber: '12345678901234567',
          bankAccountType: 'CHECKING',
          paymentTypes: ['ACH'],
          certify: false,
        },
      },
    });

    // Should render existing accounts section without errors
    expect(
      await screen.findByTestId('existing-linked-accounts')
    ).toBeInTheDocument();
    expect(screen.getByTestId('add-another-account-btn')).toBeInTheDocument();
  });

  test('preset partyId takes precedence over top-level partyId', async () => {
    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        partyId: 'top-level-party',
        initialValues: {},
        presetAccounts: [
          {
            id: 'preset-1',
            label: 'Preset Account',
            partyId: 'preset-party-override',
            initialValues: {
              accountType: 'INDIVIDUAL',
              firstName: 'Override',
              lastName: 'Test',
              routingNumbers: [
                { paymentType: 'ACH', routingNumber: '021000021' },
              ],
              accountNumber: '12345678901234567',
              bankAccountType: 'CHECKING',
              paymentTypes: ['ACH'],
              certify: false,
            },
          },
        ],
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    // Preset partyId should override top-level partyId
    expect(useRecipientForm).toHaveBeenCalledWith(
      expect.objectContaining({
        partyId: 'preset-party-override',
      })
    );
  });

  test('loading state renders skeleton while fetching recipients', async () => {
    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'prefillSummary',
        initialValues: {
          accountType: 'INDIVIDUAL',
          firstName: 'Taylor',
          lastName: 'Morgan',
        },
      },
    });

    // Heading should still render (inside StepLayout)
    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    // Form should NOT be rendered during loading
    expect(
      screen.queryByRole('button', { name: /Confirm and link account/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Link Account$/i })
    ).not.toBeInTheDocument();
  });

  test('multiple existing accounts all shown when allowMultipleAccounts', async () => {
    const secondRecipient = {
      ...mockExistingRecipient,
      id: 'la-existing-2',
      partyDetails: {
        type: 'ORGANIZATION' as const,
        businessName: 'Acme Corp',
      },
      account: {
        ...mockExistingRecipient.account,
        number: '98765432109876543',
      },
    };

    vi.mocked(useGetAllRecipients).mockReturnValue({
      data: { recipients: [mockExistingRecipient, secondRecipient] },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllRecipients>);

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'editable',
        allowMultipleAccounts: true,
        initialValues: {},
      },
    });

    const section = await screen.findByTestId('existing-linked-accounts');
    expect(section).toBeInTheDocument();

    // Count text should reflect both accounts
    expect(screen.getByText(/Linked accounts \(2\)/i)).toBeInTheDocument();
  });
});
