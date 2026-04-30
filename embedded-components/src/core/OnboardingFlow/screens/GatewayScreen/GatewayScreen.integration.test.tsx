/**
 * RTL coverage for {@link GatewayScreen}: session alert dismiss, sole-prop submit → POST client,
 * and existing-client shortcut when organization type already matches.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import { OnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';
import { GatewayScreen } from '@/core/OnboardingFlow/screens/GatewayScreen/GatewayScreen';
import * as onboardingFormUtils from '@/core/OnboardingFlow/utils/formUtils';

const gwCtx = vi.hoisted(() => {
  const postMutate = vi.fn(
    (
      _vars: unknown,
      opts?: {
        onSuccess?: (r: ClientResponse) => void;
        onError?: (err: unknown) => void;
      }
    ) => {
      opts?.onSuccess?.({
        id: 'new-client',
        status: 'NEW',
        partyId: 'party-org',
        parties: [],
        products: ['EMBEDDED_PAYMENTS'],
        outstanding: {
          partyIds: [],
          partyRoles: [],
          questionIds: [],
          documentRequestIds: [],
          attestationDocumentIds: [],
        },
      });
    }
  );
  const updatePartyMutate = vi.fn();
  const updateClientMutate = vi.fn();

  return {
    goTo: vi.fn(),
    updateSessionData: vi.fn(),
    setIsFormSubmitting: vi.fn(),
    postMutate,
    updatePartyMutate,
    updateClientMutate,
    flowMock() {
      return {
        currentScreenId: 'gateway' as const,
        originScreenId: null,
        goTo: gwCtx.goTo,
        goBack: vi.fn(),
        editingPartyIds: {},
        updateEditingPartyId: vi.fn(),
        staticScreens: [],
        sections: [],
        sessionData: {},
        updateSessionData: gwCtx.updateSessionData,
        previouslyCompleted: false,
        reviewScreenOpenedSectionId: null,
        initialStepperStepId: null,
        currentStepperStepId: undefined,
        setCurrentStepperStepIdFallback: vi.fn(),
        setCurrentStepper: vi.fn(),
        currentStepperGoTo: vi.fn(),
        shortLabelOverride: null,
        savedFormValues: {},
        saveFormValue: vi.fn(),
        isFormSubmitting: false,
        setIsFormSubmitting: gwCtx.setIsFormSubmitting,
        unsavedChangesRef: { current: false },
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
    useFlowContext: () => gwCtx.flowMock(),
  };
});

vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoPostClients: () => ({
      mutate: gwCtx.postMutate,
      error: null,
      status: 'idle',
    }),
    useSmbdoUpdateClientLegacy: () => ({
      mutate: gwCtx.updateClientMutate,
      error: null,
      status: 'idle',
    }),
    useUpdatePartyLegacy: () => ({
      mutate: gwCtx.updatePartyMutate,
      error: null,
      status: 'idle',
    }),
  };
});

function clearSharedQueryClient() {
  const g = globalThis as {
    __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
  };
  g.__EB_QUERY_CLIENT__?.clear();
}

const baseOnboarding: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: undefined,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: undefined,
  showLinkAccountStep: false,
  showDownloadChecklist: false,
  docUploadOnlyMode: false,
  docUploadMaxFileSizeBytes: 8 * 1024 * 1024,
};

function renderGateway(overrides: Partial<OnboardingContextType> = {}) {
  return render(
    <OnboardingContext.Provider value={{ ...baseOnboarding, ...overrides }}>
      <GatewayScreen />
    </OnboardingContext.Provider>
  );
}

describe('GatewayScreen (integration)', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.clearAllMocks();
    clearSharedQueryClient();
  });

  test('dismiss info alert calls updateSessionData with hideGatewayInfoAlert', async () => {
    renderGateway();

    await screen.findByText(/Is this you\?/i);

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(gwCtx.updateSessionData).toHaveBeenCalledWith({
      hideGatewayInfoAlert: true,
    });
  });

  test('sole proprietorship + Get Started POSTs client then navigates to overview', async () => {
    renderGateway();

    await screen.findByRole('heading', {
      name: /let's help you get started/i,
    });

    await user.click(
      screen.getByRole('radio', { name: /i'm the sole owner/i })
    );

    await user.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(gwCtx.postMutate).toHaveBeenCalled();
    });

    expect(baseOnboarding.setClientId).toHaveBeenCalledWith('new-client');
    expect(gwCtx.goTo).toHaveBeenCalledWith('overview');
    expect(gwCtx.updatePartyMutate).not.toHaveBeenCalled();
    expect(gwCtx.updateClientMutate).not.toHaveBeenCalled();
  });

  test('existing organization party with same specific type skips mutations and navigates', async () => {
    const existingClient: ClientResponse = {
      id: 'client-existing',
      status: 'NEW',
      partyId: 'party-org',
      parties: [
        {
          id: 'party-org',
          active: true,
          roles: ['CLIENT'],
          partyType: 'ORGANIZATION',
          organizationDetails: {
            organizationName: 'Acme LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
            jurisdiction: 'US',
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

    renderGateway({
      clientData: existingClient,
      organizationType: 'LIMITED_LIABILITY_COMPANY',
    });

    const submitBtn = screen.getByRole('button', { name: /get started/i });

    await waitFor(() => expect(submitBtn).not.toBeDisabled());

    await user.click(submitBtn);

    await waitFor(() => {
      expect(gwCtx.goTo).toHaveBeenCalledWith('overview');
    });

    expect(gwCtx.postMutate).not.toHaveBeenCalled();
    expect(gwCtx.updatePartyMutate).not.toHaveBeenCalled();
    expect(gwCtx.updateClientMutate).not.toHaveBeenCalled();
  });

  test('POST client API error with validation context invokes setApiFormErrors', async () => {
    const setErrorsSpy = vi
      .spyOn(onboardingFormUtils, 'setApiFormErrors')
      .mockImplementation(() => {});

    gwCtx.postMutate.mockImplementationOnce((_vars, opts) => {
      opts?.onError?.({
        response: {
          data: {
            context: [
              {
                field: '$.parties.0.organizationDetails.organizationType',
                message: 'Organization type invalid',
              },
            ],
          },
        },
      } as never);
    });

    try {
      renderGateway();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await user.click(
        screen.getByRole('radio', { name: /i'm the sole owner/i })
      );
      await user.click(screen.getByRole('button', { name: /get started/i }));

      await waitFor(() => {
        expect(setErrorsSpy).toHaveBeenCalled();
      });

      expect(gwCtx.goTo).not.toHaveBeenCalled();
    } finally {
      setErrorsSpy.mockRestore();
    }
  });

  test('client without an organization party uses updateClient addParties', async () => {
    gwCtx.updateClientMutate.mockImplementationOnce((_vars, opts) => {
      opts?.onSuccess?.();
    });

    const clientWithoutOrgParty: ClientResponse = {
      id: 'client-no-org-party',
      status: 'NEW',
      partyId: 'party-controller',
      parties: [
        {
          id: 'party-controller',
          active: true,
          roles: ['CONTROLLER'],
          partyType: 'INDIVIDUAL',
          individualDetails: {
            firstName: 'Taylor',
            lastName: 'Lee',
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

    renderGateway({
      clientData: clientWithoutOrgParty,
      organizationType: undefined,
    });

    await screen.findByRole('heading', {
      name: /let's help you get started/i,
    });

    await user.click(
      screen.getByRole('radio', { name: /i'm the sole owner/i })
    );
    await user.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(gwCtx.updateClientMutate).toHaveBeenCalled();
    });

    expect(gwCtx.postMutate).not.toHaveBeenCalled();
    expect(gwCtx.updatePartyMutate).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(gwCtx.goTo).toHaveBeenCalledWith('overview');
    });
  });

  test('changing LLC to another registered-business subtype calls updateParty', async () => {
    gwCtx.updatePartyMutate.mockImplementationOnce((_vars, opts) => {
      opts?.onSuccess?.({
        id: 'party-org',
        roles: ['CLIENT'],
        partyType: 'ORGANIZATION',
        organizationDetails: {
          organizationName: 'Acme LLC',
          organizationType: 'C_CORPORATION',
          countryOfFormation: 'US',
          jurisdiction: 'US',
        },
        status: 'ACTIVE',
        validationResponse: [],
      });
    });

    const llcClient: ClientResponse = {
      id: 'client-org-switch',
      status: 'NEW',
      partyId: 'party-org',
      parties: [
        {
          id: 'party-org',
          active: true,
          roles: ['CLIENT'],
          partyType: 'ORGANIZATION',
          organizationDetails: {
            organizationName: 'Acme LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
            jurisdiction: 'US',
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

    renderGateway({
      clientData: llcClient,
      organizationType: 'LIMITED_LIABILITY_COMPANY',
    });

    const submitBtn = screen.getByRole('button', { name: /get started/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());

    const combo = screen.getByRole('combobox');
    await user.click(combo);

    const cCorpOption = await screen.findByRole('option', {
      name: /c corporation/i,
    });
    await user.click(cCorpOption);

    await user.click(submitBtn);

    await waitFor(() => {
      expect(gwCtx.updatePartyMutate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(gwCtx.goTo).toHaveBeenCalledWith('overview');
    });

    expect(gwCtx.postMutate).not.toHaveBeenCalled();
    expect(gwCtx.updateClientMutate).not.toHaveBeenCalled();
  });
});
