/**
 * RTL coverage for {@link TermsAndConditionsForm}: validation, host acknowledgement list,
 * and KYC initiation wiring (mutations mocked).
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import { OnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';

import { TermsAndConditionsForm } from './TermsAndConditionsForm';

const termsTestHooks = vi.hoisted(() => {
  const handleNext = vi.fn();
  const handlePrev = vi.fn();
  const kycMutateAsync = vi.fn(
    async (_args: unknown, opts?: { onSuccess?: () => Promise<void> }) => {
      await opts?.onSuccess?.();
    }
  );
  const updateMutateAsync = vi.fn().mockResolvedValue({});
  const setIsFormSubmitting = vi.fn();

  return {
    handleNext,
    handlePrev,
    kycMutateAsync,
    updateMutateAsync,
    setIsFormSubmitting,
    useFlowContextMock() {
      return {
        isFormSubmitting: false,
        setIsFormSubmitting,
        setFlowUnsavedChanges: vi.fn(),
      };
    },
  };
});

vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: () => termsTestHooks.useFlowContextMock(),
  };
});

vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoUpdateClientLegacy: () =>
      ({
        mutateAsync: termsTestHooks.updateMutateAsync,
        error: null,
        status: 'idle',
      }) as unknown as ReturnType<typeof actual.useSmbdoUpdateClientLegacy>,
    useSmbdoPostClientVerifications: () =>
      ({
        mutateAsync: termsTestHooks.kycMutateAsync,
        error: null,
        status: 'idle',
      }) as unknown as ReturnType<
        typeof actual.useSmbdoPostClientVerifications
      >,
  };
});

const termsClient: ClientResponse = {
  id: 'terms-client',
  status: 'NEW',
  partyId: 'party-org',
  parties: [
    {
      id: 'party-org',
      roles: ['CLIENT'],
      partyType: 'ORGANIZATION',
      organizationDetails: {
        organizationName: 'Terms Org',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
        jurisdiction: 'US',
      },
      status: 'ACTIVE',
      validationResponse: [],
    },
    {
      id: 'party-controller',
      roles: ['CONTROLLER'],
      partyType: 'INDIVIDUAL',
      individualDetails: {
        firstName: 'Sam',
        lastName: 'Signer',
      },
      status: 'ACTIVE',
      validationResponse: [],
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
};

function renderTermsForm(
  onboardingOverrides: Partial<OnboardingContextType> = {}
) {
  const onboardingContext = {
    setClientId: vi.fn(),
    organizationType: 'LIMITED_LIABILITY_COMPANY' as const,
    docUploadOnlyMode: false,
    showLinkAccountStep: false,
    showDownloadChecklist: false,
    clientGetStatus: 'success' as const,
    clientData: termsClient,
    availableJurisdictions: ['US'] as const,
    availableProducts: ['EMBEDDED_PAYMENTS'] as const,
    disclosureConfig: undefined,
    reviewAttestTermsAcknowledgements: undefined,
    showReviewAttestTermsAcknowledgementsIntro: false,
    onPostClientSettled: vi.fn(),
    ...onboardingOverrides,
  } as OnboardingContextType;

  render(
    <OnboardingContext.Provider value={onboardingContext}>
      <TermsAndConditionsForm
        handlePrev={termsTestHooks.handlePrev}
        handleNext={termsTestHooks.handleNext}
        getPrevButtonLabel={() => 'Back'}
        getNextButtonLabel={() => 'Continue'}
      />
    </OnboardingContext.Provider>
  );
}

describe('TermsAndConditionsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    termsTestHooks.kycMutateAsync.mockImplementation(
      async (_args: unknown, opts?: { onSuccess?: () => Promise<void> }) => {
        await opts?.onSuccess?.();
      }
    );
    const g = globalThis as {
      __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
    };
    g.__EB_QUERY_CLIENT__?.clear();
  });

  test('requires standard attestation checkbox before Continue succeeds', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderTermsForm();

    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(
      await screen.findByText(/must agree to the terms/i)
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', {
        name: /you have read and agree to the j\.p\. morgan account terms/i,
      })
    );

    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    await waitFor(() => {
      expect(termsTestHooks.kycMutateAsync).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(termsTestHooks.handleNext).toHaveBeenCalled();
    });
  });

  test('host acknowledgement list must be completed before KYC runs', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderTermsForm({
      reviewAttestTermsAcknowledgements: [
        {
          id: 'host-ack-1',
          labelKey: 'reviewAndAttest.termsAndConditions.agreeToTerms',
        },
      ],
    });

    const continueBtn = screen.getByRole('button', { name: /^continue$/i });
    expect(continueBtn).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));

    await waitFor(() => expect(continueBtn).not.toBeDisabled());

    await user.click(continueBtn);

    await waitFor(() => {
      expect(termsTestHooks.kycMutateAsync).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(termsTestHooks.handleNext).toHaveBeenCalled();
    });
  });

  test('Back invokes handlePrev', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderTermsForm();

    await user.click(screen.getByRole('button', { name: /^back$/i }));

    expect(termsTestHooks.handlePrev).toHaveBeenCalled();
  });
});
