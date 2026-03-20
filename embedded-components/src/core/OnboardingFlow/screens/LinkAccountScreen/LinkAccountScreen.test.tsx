import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
const mockSubmit = vi.fn();

vi.mock(
  '@/core/OnboardingFlow/contexts/FlowContext',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/core/OnboardingFlow/contexts/FlowContext')
      >();
    return {
      ...actual,
      useFlowContext: () => ({
        goBack: mockGoBack,
      }),
    };
  }
);

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

  test('prefill summary without acknowledgements enables confirm immediately', async () => {
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
          certify: true,
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Link a bank account/i })
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm and link account/i,
    });
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

    expect(
      await screen.findByRole('heading', {
        name: /Your linked bank account/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Verify Account/i })
    ).toBeInTheDocument();
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
});
