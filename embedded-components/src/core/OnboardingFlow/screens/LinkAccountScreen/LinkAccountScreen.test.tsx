import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
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
  });

  test('readonly prefill shows review UI and submit passes merged form data', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'readonly',
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
      await screen.findByRole('heading', { name: /Review your bank account/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Confirm and link account/i })
    );

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const payload = mockSubmit.mock.calls[0][0];
    expect(payload.firstName).toBe('Taylor');
    expect(payload.accountNumber).toBe('12345678901234567');
    expect(payload.routingNumbers[0].routingNumber).toBe('021000021');
  });

  test('readonly review acknowledgements block confirm until all checked', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'readonly',
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
        reviewAcknowledgements: [
          {
            id: 'terms',
            labelKey:
              'screens.linkAccount.review.acknowledgements.termsAndPolicies',
            linkHrefs: {
              termsLink: 'https://example.com/terms',
              privacyLink: 'https://example.com/privacy',
            },
          },
        ],
      },
    });

    expect(
      await screen.findByRole('heading', { name: /Review your bank account/i })
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm and link account/i,
    });
    expect(confirmBtn).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', { name: /By confirming, you agree/i })
    );

    expect(confirmBtn).not.toBeDisabled();

    await user.click(confirmBtn);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  test('readonly review requires every acknowledgement checked when multiple rows', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LinkAccountScreen />, {
      ...baseOnboardingContext,
      linkAccountStepOptions: {
        completionMode: 'readonly',
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
        reviewAcknowledgements: [
          {
            id: 'a',
            labelKey:
              'screens.linkAccount.review.acknowledgements.termsAndPolicies',
            linkHrefs: { termsLink: 'https://example.com/t' },
          },
          {
            id: 'b',
            labelKey:
              'screens.linkAccount.review.acknowledgements.payoutAccountAttestation',
          },
        ],
      },
    });

    await screen.findByRole('heading', { name: /Review your bank account/i });

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm and link account/i,
    });
    expect(confirmBtn).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', { name: /By confirming, you agree/i })
    );
    expect(confirmBtn).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', {
        name: /I confirm this bank account is owned/i,
      })
    );
    expect(confirmBtn).not.toBeDisabled();

    await user.click(confirmBtn);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
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
