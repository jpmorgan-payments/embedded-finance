import { act } from 'react';
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

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGoTo = vi.fn();
const mockSubmit = vi.fn();
const mockSetFlowUnsavedChanges = vi.fn();
const mockUpdateSessionData = vi.fn();
const mockReset = vi.fn();

vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: () => ({
      goBack: vi.fn(),
      goTo: mockGoTo,
      setFlowUnsavedChanges: mockSetFlowUnsavedChanges,
      sessionData: {},
      updateSessionData: mockUpdateSessionData,
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderScreen(contextOverrides: Partial<OnboardingContextType> = {}) {
  const context: OnboardingContextType = {
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    clientData: undefined,
    clientGetStatus: 'success',
    setClientId: vi.fn(),
    organizationType: undefined,
    ...contextOverrides,
  };

  return render(
    <EBComponentsProvider
      apiBaseUrl=""
      apiBaseUrlTransforms={{
        clients: (baseUrl) => baseUrl.replace('v1', '/do/v1'),
      }}
    >
      <QueryClientProvider client={queryClient}>
        <OnboardingContext.Provider value={context}>
          <LinkAccountScreen />
        </OnboardingContext.Provider>
      </QueryClientProvider>
    </EBComponentsProvider>
  );
}

/** Complete prefill values for an individual checking account. */
const FULL_PREFILL_VALUES = {
  accountType: 'INDIVIDUAL' as const,
  firstName: 'Taylor',
  lastName: 'Morgan',
  routingNumbers: [{ paymentType: 'ACH' as const, routingNumber: '021000021' }],
  accountNumber: '12345678901234567',
  bankAccountType: 'CHECKING' as const,
  paymentTypes: ['ACH' as const],
  certify: false,
};

const ACTIVE_RECIPIENT = {
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

const SECOND_RECIPIENT = {
  ...ACTIVE_RECIPIENT,
  id: 'la-existing-2',
  partyDetails: { type: 'ORGANIZATION' as const, businessName: 'Acme Corp' },
  account: { ...ACTIVE_RECIPIENT.account, number: '98765432109876543' },
};

function mockRecipientsResponse(recipients: unknown[] = []) {
  vi.mocked(useGetAllRecipients).mockReturnValue({
    data: { recipients },
    isLoading: false,
  } as unknown as ReturnType<typeof useGetAllRecipients>);
}

function mockLoadingRecipients() {
  vi.mocked(useGetAllRecipients).mockReturnValue({
    data: undefined,
    isLoading: true,
  } as unknown as ReturnType<typeof useGetAllRecipients>);
}

function mockRecipientFormWithCallback() {
  let onSuccessCb: (() => void) | undefined;
  vi.mocked(useRecipientForm).mockImplementation((opts) => {
    onSuccessCb = opts.onSuccess;
    return {
      submit: mockSubmit,
      status: 'idle',
      error: null,
      reset: mockReset,
      isPending: false,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof useRecipientForm>;
  });
  return () => onSuccessCb?.();
}

function mockRecipientFormWithError(error: unknown) {
  vi.mocked(useRecipientForm).mockReturnValue({
    submit: mockSubmit,
    status: 'error',
    error,
    reset: mockReset,
    isPending: false,
    isSuccess: false,
    isError: true,
  } as unknown as ReturnType<typeof useRecipientForm>);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LinkAccountScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    mockRecipientsResponse([]);

    vi.mocked(useSmbdoGetClient).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useSmbdoGetClient>);

    vi.mocked(useRecipientForm).mockReturnValue({
      submit: mockSubmit,
      status: 'idle',
      error: null,
      reset: mockReset,
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // Loading State
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('loading state', () => {
    test('renders skeleton and no form while fetching recipients', async () => {
      mockLoadingRecipients();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      expect(
        await screen.findByRole('heading', { name: /Link a bank account/i })
      ).toBeInTheDocument();

      // No form buttons rendered during loading
      expect(
        screen.queryByRole('button', { name: /Confirm and link account/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /^Link Account$/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Continue to Account Details/i })
      ).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Single Account Redirect
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('existing account redirect (single-account mode)', () => {
    test('redirects to overview when active account exists', async () => {
      mockRecipientsResponse([ACTIVE_RECIPIENT]);

      renderScreen();

      await vi.waitFor(() => {
        expect(mockGoTo).toHaveBeenCalledWith('overview', {
          resetHistory: true,
        });
      });
    });

    test('does NOT redirect for INACTIVE accounts', async () => {
      mockRecipientsResponse([{ ...ACTIVE_RECIPIENT, status: 'INACTIVE' }]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'editable',
          initialValues: {},
        },
      });

      expect(
        await screen.findByRole('button', {
          name: /Continue to Account Details/i,
        })
      ).toBeInTheDocument();
      expect(mockGoTo).not.toHaveBeenCalled();
    });

    test('does NOT redirect for REJECTED accounts', async () => {
      mockRecipientsResponse([{ ...ACTIVE_RECIPIENT, status: 'REJECTED' }]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'editable',
          initialValues: {},
        },
      });

      expect(
        await screen.findByRole('button', {
          name: /Continue to Account Details/i,
        })
      ).toBeInTheDocument();
      expect(mockGoTo).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Prefill Summary Mode
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('reviewOnly mode', () => {
    test('shows read-only fields with prefilled values', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      expect(
        await screen.findByRole('heading', { name: /Link a bank account/i })
      ).toBeInTheDocument();

      // Read-only (disabled) inputs show prefilled data
      expect(screen.getByDisplayValue('021000021')).toBeDisabled();
      expect(screen.getByDisplayValue('12345678901234567')).toBeDisabled();
    });

    test('requires certification checkbox before enabling confirm button', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      const confirmBtn = await screen.findByRole('button', {
        name: /Confirm and link account/i,
      });
      expect(confirmBtn).toBeDisabled();

      const certifyCheckbox = screen.getByRole('checkbox', {
        name: /I authorize verification of this external bank account/i,
      });
      expect(certifyCheckbox).not.toBeChecked();

      await user.click(certifyCheckbox);
      expect(confirmBtn).not.toBeDisabled();
    });

    test('submits form data with certify=true after certification', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      await user.click(
        await screen.findByRole('checkbox', {
          name: /I authorize verification of this external bank account/i,
        })
      );
      await user.click(
        screen.getByRole('button', { name: /Confirm and link account/i })
      );

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Taylor',
          lastName: 'Morgan',
          accountNumber: '12345678901234567',
          routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
          certify: true,
        })
      );
    });

    test('with reviewAcknowledgements: all must be checked before confirm is enabled', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
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

      // Intro text shown
      expect(
        await screen.findByText(/By electronically linking this account/i)
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', {
        name: /Confirm and link account/i,
      });
      expect(confirmBtn).toBeDisabled();

      // Check only first two — still disabled
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
      expect(confirmBtn).toBeDisabled();

      // Check third — now enabled
      await user.click(
        screen.getByRole('checkbox', { name: /JPMorgan Chase Bank/i })
      );
      expect(confirmBtn).not.toBeDisabled();

      await user.click(confirmBtn);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ certify: true })
      );
    });

    test('does NOT show editable form buttons', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      expect(
        await screen.findByRole('button', { name: /Confirm and link account/i })
      ).toBeInTheDocument();

      expect(
        screen.queryByRole('button', { name: /Continue to Account Details/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /^Link Account$/i })
      ).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Editable Mode
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('editable mode', () => {
    test('renders BankAccountForm step 1 with prefilled values', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'editable',
          initialValues: {
            accountNumber: '98765432109876543',
            routingNumbers: [
              { paymentType: 'ACH', routingNumber: '021000021' },
            ],
          },
        },
      });

      expect(
        await screen.findByRole('heading', { name: /Link a bank account/i })
      ).toBeInTheDocument();

      // Step 1 button visible
      await user.click(
        screen.getByRole('button', { name: /Continue to Account Details/i })
      );

      // Prefilled account number on step 2
      const accountInput = await screen.findByLabelText(/account number/i);
      expect(accountInput).toHaveValue('98765432109876543');
    });

    test('with reviewAcknowledgements: shows intro text and gates submit on step 2', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'editable',
          initialValues: {
            accountNumber: '98765432109876543',
            routingNumbers: [
              { paymentType: 'ACH', routingNumber: '021000021' },
            ],
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

      await user.click(
        await screen.findByRole('button', {
          name: /Continue to Account Details/i,
        })
      );

      // Intro text
      expect(
        await screen.findByText(/By electronically linking this account/i)
      ).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /^Link Account$/i });
      await waitFor(() => expect(submitBtn).toBeDisabled());

      // Check first acknowledgement — still gated
      await user.click(
        screen.getByRole('checkbox', {
          name: /primarily for business purposes/i,
        })
      );
      expect(submitBtn).toBeDisabled();

      // Check second — now enabled
      await user.click(
        screen.getByRole('checkbox', {
          name: /authorize verification of this linked account/i,
        })
      );
      await waitFor(() => expect(submitBtn).not.toBeDisabled());
    });

    test('without linkAccountStepOptions shows form directly', async () => {
      renderScreen();

      expect(
        await screen.findByRole('button', {
          name: /Continue to Account Details/i,
        })
      ).toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // PartyId Resolution
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('partyId resolution', () => {
    test('no partyId: useRecipientForm receives undefined', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      expect(useRecipientForm).toHaveBeenCalledWith(
        expect.objectContaining({
          partyId: undefined,
          recipientType: 'LINKED_ACCOUNT',
          mode: 'create',
        })
      );
    });

    test('top-level partyId passed when no presets exist', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          partyId: 'top-level-only',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      expect(useRecipientForm).toHaveBeenCalledWith(
        expect.objectContaining({ partyId: 'top-level-only' })
      );
    });

    test('preset partyId takes precedence over top-level', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          partyId: 'top-level-party',
          initialValues: {},
          presetAccounts: [
            {
              id: 'preset-1',
              label: 'Preset Account',
              partyId: 'preset-party-override',
              initialValues: FULL_PREFILL_VALUES,
            },
          ],
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      expect(useRecipientForm).toHaveBeenCalledWith(
        expect.objectContaining({ partyId: 'preset-party-override' })
      );
    });

    test('preset without partyId falls back to top-level', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          partyId: 'top-level-fallback',
          initialValues: {},
          presetAccounts: [
            {
              id: 'preset-no-party',
              label: 'No Party Preset',
              initialValues: FULL_PREFILL_VALUES,
            },
          ],
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      expect(useRecipientForm).toHaveBeenCalledWith(
        expect.objectContaining({ partyId: 'top-level-fallback' })
      );
    });

    test('partyId is not included in form submission payload', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          partyId: 'party-123',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      await user.click(
        await screen.findByRole('checkbox', {
          name: /I authorize verification of this external bank account/i,
        })
      );
      await user.click(
        screen.getByRole('button', { name: /Confirm and link account/i })
      );

      const payload = mockSubmit.mock.calls[0][0];
      expect(payload.partyId).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Preset Account Selection
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('preset account selection', () => {
    const twoPresets = [
      {
        id: 'preset-1',
        label: 'Business Account A',
        partyId: 'party-a',
        initialValues: {
          ...FULL_PREFILL_VALUES,
          accountType: 'ORGANIZATION' as const,
          businessName: 'Alpha Corp',
          accountNumber: '11111111111111111',
        },
      },
      {
        id: 'preset-2',
        label: 'Business Account B',
        partyId: 'party-b',
        initialValues: {
          ...FULL_PREFILL_VALUES,
          accountType: 'ORGANIZATION' as const,
          businessName: 'Beta Corp',
          accountNumber: '22222222222222222',
        },
      },
    ] as const;

    test('renders selector dropdown when multiple presets provided', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'editable',
          initialValues: {},
          presetAccounts: twoPresets,
        },
      });

      expect(
        await screen.findByTestId('preset-account-select')
      ).toBeInTheDocument();
    });

    test('does NOT render selector with single preset', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: {},
          presetAccounts: [twoPresets[0]],
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      expect(
        screen.queryByTestId('preset-account-select')
      ).not.toBeInTheDocument();
    });

    test('does NOT render selector when no presets provided', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'editable',
          initialValues: { accountNumber: '98765432109876543' },
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      expect(
        screen.queryByTestId('preset-account-select')
      ).not.toBeInTheDocument();
    });

    test('first preset selected by default and submitted', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: {},
          presetAccounts: twoPresets,
        },
      });

      // Certify and submit — first preset's data used
      await user.click(
        await screen.findByRole('checkbox', {
          name: /I authorize verification of this external bank account/i,
        })
      );
      await user.click(
        screen.getByRole('button', { name: /Confirm and link account/i })
      );

      expect(useRecipientForm).toHaveBeenCalledWith(
        expect.objectContaining({ partyId: 'party-a' })
      );
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ businessName: 'Alpha Corp' })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Multi-Account Mode
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('multi-account mode (allowMultipleAccounts)', () => {
    test('does NOT redirect when existing account found', async () => {
      mockRecipientsResponse([ACTIVE_RECIPIENT]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'editable',
          allowMultipleAccounts: true,
          initialValues: {},
        },
      });

      expect(
        await screen.findByRole('heading', { name: /Link a bank account/i })
      ).toBeInTheDocument();
      expect(mockGoTo).not.toHaveBeenCalled();
    });

    test('shows existing accounts list and "Add account" button, hides form', async () => {
      mockRecipientsResponse([ACTIVE_RECIPIENT]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          allowMultipleAccounts: true,
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      expect(
        await screen.findByTestId('existing-linked-accounts')
      ).toBeInTheDocument();
      expect(screen.getByTestId('add-another-account-btn')).toBeInTheDocument();

      // Form not visible
      expect(
        screen.queryByRole('button', { name: /Confirm and link account/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Continue to Account Details/i })
      ).not.toBeInTheDocument();
    });

    test('clicking "Add account" reveals form and hides existing accounts section', async () => {
      const user = userEvent.setup();
      mockRecipientsResponse([ACTIVE_RECIPIENT]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          allowMultipleAccounts: true,
          initialValues: {
            ...FULL_PREFILL_VALUES,
            accountNumber: '99988877766655544', // Different from existing
          },
        },
      });

      await user.click(await screen.findByTestId('add-another-account-btn'));

      // Form now visible
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Confirm and link account/i })
        ).toBeInTheDocument();
      });

      // Existing section hidden after form shown
      expect(
        screen.queryByTestId('existing-linked-accounts')
      ).not.toBeInTheDocument();
    });

    test('displays count for multiple existing accounts', async () => {
      mockRecipientsResponse([ACTIVE_RECIPIENT, SECOND_RECIPIENT]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'editable',
          allowMultipleAccounts: true,
          initialValues: {},
        },
      });

      expect(
        await screen.findByText(/Linked accounts \(2\)/i)
      ).toBeInTheDocument();
    });

    test('existingAccountsDisplay: compact renders existing section', async () => {
      mockRecipientsResponse([ACTIVE_RECIPIENT]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          allowMultipleAccounts: true,
          existingAccountsDisplay: 'compact',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      expect(
        await screen.findByTestId('existing-linked-accounts')
      ).toBeInTheDocument();
    });

    test('hideLinkedAccountRemoval renders without remove actions', async () => {
      mockRecipientsResponse([ACTIVE_RECIPIENT]);

      renderScreen({
        hideLinkedAccountRemoval: true,
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          allowMultipleAccounts: true,
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      expect(
        await screen.findByTestId('existing-linked-accounts')
      ).toBeInTheDocument();
      expect(screen.getByTestId('add-another-account-btn')).toBeInTheDocument();
    });

    test('onSuccess resets form state and does NOT navigate away', async () => {
      const triggerSuccess = mockRecipientFormWithCallback();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          allowMultipleAccounts: true,
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      act(() => {
        triggerSuccess();
      });

      // Does not navigate to overview
      expect(mockGoTo).not.toHaveBeenCalled();
      // Resets form
      expect(mockReset).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Duplicate Account Detection
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('duplicate account detection', () => {
    test('forces editable mode when prefilled account already exists', async () => {
      const user = userEvent.setup();
      mockRecipientsResponse([ACTIVE_RECIPIENT]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          allowMultipleAccounts: true,
          // Same account number as ACTIVE_RECIPIENT
          initialValues: {
            ...FULL_PREFILL_VALUES,
            accountNumber: '12345678901234567',
          },
        },
      });

      // Show "Add account" first
      await user.click(await screen.findByTestId('add-another-account-btn'));

      // Should show editable form (forced by duplicate), NOT reviewOnly
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Continue to Account Details/i })
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('button', { name: /Confirm and link account/i })
      ).not.toBeInTheDocument();
    });

    test('no duplicate detection when allowMultipleAccounts is false', async () => {
      // With single-account mode and existing account → redirect (no duplicate logic)
      mockRecipientsResponse([ACTIVE_RECIPIENT]);

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: {
            ...FULL_PREFILL_VALUES,
            accountNumber: '12345678901234567',
          },
        },
      });

      // Single-account mode with existing → redirect
      await vi.waitFor(() => {
        expect(mockGoTo).toHaveBeenCalledWith('overview', {
          resetHistory: true,
        });
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Error Handling
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('error handling', () => {
    test('displays error alert when form submission fails', async () => {
      mockRecipientFormWithError({
        response: { status: 400 },
      });

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      expect(
        await screen.findByText(/Failed to link account/i)
      ).toBeInTheDocument();
    });

    test('no error alert when error is null', async () => {
      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      expect(
        screen.queryByText(/Failed to link account/i)
      ).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('navigation', () => {
    test('cancel button navigates to overview', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      await user.click(await screen.findByRole('button', { name: /Cancel/i }));

      expect(mockGoTo).toHaveBeenCalledWith('overview', {
        resetHistory: true,
      });
    });

    test('single-account onSuccess navigates to overview with session data', async () => {
      const triggerSuccess = mockRecipientFormWithCallback();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
        },
      });

      await screen.findByRole('heading', { name: /Link a bank account/i });

      act(() => {
        triggerSuccess();
      });

      await waitFor(() => {
        expect(mockUpdateSessionData).toHaveBeenCalledWith({
          linkAccountJustCreated: true,
        });
        expect(mockGoTo).toHaveBeenCalledWith('overview', {
          resetHistory: true,
        });
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Unsaved Changes Tracking
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('unsaved changes tracking', () => {
    test('reviewOnly marks dirty when acknowledgement is checked', async () => {
      const user = userEvent.setup();

      renderScreen({
        linkAccountStepOptions: {
          completionMode: 'reviewOnly',
          initialValues: FULL_PREFILL_VALUES,
          reviewAcknowledgements: [
            {
              id: 'a',
              labelKey:
                'screens.linkAccount.prefillSummary.acknowledgements.businessPurpose',
            },
          ],
        },
      });

      await user.click(
        await screen.findByRole('checkbox', {
          name: /primarily for business purposes/i,
        })
      );

      expect(mockSetFlowUnsavedChanges).toHaveBeenCalledWith(true);
    });
  });
});
