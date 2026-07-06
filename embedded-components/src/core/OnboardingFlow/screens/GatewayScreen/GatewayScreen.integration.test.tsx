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
        isPTCWithUSExchange: false,
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

  test('changing an existing org to sole-prop with no controller party still forces countryOfFormation US', async () => {
    gwCtx.updatePartyMutate.mockImplementationOnce((_vars, opts) => {
      opts?.onSuccess?.({
        id: 'party-org',
        roles: ['CLIENT'],
        partyType: 'ORGANIZATION',
        organizationDetails: {
          organizationName: 'Acme LLC',
          organizationType: 'SOLE_PROPRIETORSHIP',
          countryOfFormation: 'US',
          jurisdiction: 'US',
        },
        status: 'ACTIVE',
        validationResponse: [],
      });
    });

    // Existing organization party but NO controller (individual) party present,
    // so getControllerParty() resolves to undefined during submit.
    const orgClientNoController: ClientResponse = {
      id: 'client-soleprop-no-controller',
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
      clientData: orgClientNoController,
      organizationType: 'LIMITED_LIABILITY_COMPANY',
    });

    await screen.findByRole('heading', {
      name: /let's help you get started/i,
    });

    // Switch from the registered business (LLC) to sole proprietorship
    await user.click(
      screen.getByRole('radio', { name: /i'm the sole owner/i })
    );

    const submitBtn = screen.getByRole('button', { name: /get started/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(gwCtx.updatePartyMutate).toHaveBeenCalled();
    });

    // Regression guard: sole-prop must force US formation country even when no
    // controller party is found (previously skipped by an early return).
    const [firstCallArg] = gwCtx.updatePartyMutate.mock.calls[0];
    expect(firstCallArg.data.organizationDetails.organizationType).toBe(
      'SOLE_PROPRIETORSHIP'
    );
    expect(firstCallArg.data.organizationDetails.countryOfFormation).toBe('US');

    expect(gwCtx.postMutate).not.toHaveBeenCalled();
  });

  // =========================================================================
  // PTC Feature Flag Enabled
  // =========================================================================

  describe('enablePubliclyTradedCompanies = true', () => {
    const ptcOrgTypes = [
      'SOLE_PROPRIETORSHIP',
      'LIMITED_LIABILITY_COMPANY',
      'C_CORPORATION',
      'LIMITED_LIABILITY_PARTNERSHIP',
      'LIMITED_PARTNERSHIP',
      'GENERAL_PARTNERSHIP',
      'PARTNERSHIP',
      'S_CORPORATION',
    ] as const;

    function renderGatewayWithPTC(
      overrides: Partial<OnboardingContextType> = {}
    ) {
      return renderGateway({
        enablePubliclyTradedCompanies: true,
        availableOrganizationTypes: [...ptcOrgTypes],
        ...overrides,
      });
    }

    async function selectCCorporation() {
      await user.click(
        screen.getByRole('radio', { name: /registered business/i })
      );

      const combo = await screen.findByRole('combobox');
      await user.click(combo);
      const cCorpOption = await screen.findByRole('option', {
        name: /c corporation/i,
      });
      await user.click(cCorpOption);
    }

    test('PTC question appears after selecting a PTC-eligible org type', async () => {
      renderGatewayWithPTC();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await selectCCorporation();

      // The PTC question should now appear
      await waitFor(() => {
        expect(
          screen.getByText(
            /is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });
    });

    test('PTC question does NOT appear for sole proprietorship', async () => {
      renderGatewayWithPTC();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await user.click(
        screen.getByRole('radio', { name: /i'm the sole owner/i })
      );

      expect(
        screen.queryByText(
          /is your organization publicly traded, or a subsidiary/i
        )
      ).not.toBeInTheDocument();
    });

    test('selecting "Yes, my organization is publicly traded" shows ticker and exchange fields', async () => {
      renderGatewayWithPTC();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await selectCCorporation();

      await waitFor(() => {
        expect(
          screen.getByText(
            /is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      // Select "yes, publicly traded"
      const ptcRadio = screen.getByRole('radio', {
        name: /yes, my organization is publicly traded/i,
      });
      await user.click(ptcRadio);

      // Ticker symbol and stock exchange fields should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/ticker symbol/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/stock exchange/i)).toBeInTheDocument();
      });
    });

    test('selecting "Yes, subsidiary" shows ticker and exchange fields', async () => {
      renderGatewayWithPTC();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await selectCCorporation();

      await waitFor(() => {
        expect(
          screen.getByText(
            /is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      const subsidiaryRadio = screen.getByRole('radio', {
        name: /subsidiary/i,
      });
      await user.click(subsidiaryRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/ticker symbol/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/stock exchange/i)).toBeInTheDocument();
      });
    });

    test('selecting "No" hides ticker and exchange fields', async () => {
      renderGatewayWithPTC();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await selectCCorporation();

      await waitFor(() => {
        expect(
          screen.getByText(
            /is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      // Select PTC first to show the fields
      await user.click(
        screen.getByRole('radio', {
          name: /yes, my organization is publicly traded/i,
        })
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/ticker symbol/i)).toBeInTheDocument();
      });

      // Now select "No"
      const noRadio = screen.getByRole('radio', { name: /no/i });
      await user.click(noRadio);

      await waitFor(() => {
        expect(
          screen.queryByLabelText(/ticker symbol/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText(/stock exchange/i)
        ).not.toBeInTheDocument();
      });
    });

    test('selecting "Other" exchange shows the exchange name text field', async () => {
      renderGatewayWithPTC();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await selectCCorporation();

      await waitFor(() => {
        expect(
          screen.getByText(
            /is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('radio', {
          name: /yes, my organization is publicly traded/i,
        })
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/stock exchange/i)).toBeInTheDocument();
      });

      // Open the stock exchange combobox and select "Other"
      const exchangeCombobox = screen.getAllByRole('combobox')[1];
      await user.click(exchangeCombobox);

      const otherOption = await screen.findByRole('option', {
        name: /other \(not listed above\)/i,
      });
      await user.click(otherOption);

      // The exchange name text field should appear
      await waitFor(() => {
        expect(screen.getByText(/stock exchange name/i)).toBeInTheDocument();
      });
    });

    test('changing org type clears PTC fields', async () => {
      renderGatewayWithPTC();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await selectCCorporation();

      await waitFor(() => {
        expect(
          screen.getByText(
            /is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('radio', {
          name: /yes, my organization is publicly traded/i,
        })
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/ticker symbol/i)).toBeInTheDocument();
      });

      // Switch to sole proprietorship
      await user.click(
        screen.getByRole('radio', { name: /i'm the sole owner/i })
      );

      // PTC fields should be gone
      await waitFor(() => {
        expect(
          screen.queryByText(
            /is your organization publicly traded, or a subsidiary/i
          )
        ).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText(/ticker symbol/i)
        ).not.toBeInTheDocument();
      });
    });

    test('submits PTC data with ticker and exchange when PTC is selected', async () => {
      renderGatewayWithPTC();

      await screen.findByRole('heading', {
        name: /let's help you get started/i,
      });

      await selectCCorporation();

      await waitFor(() => {
        expect(
          screen.getByText(
            /is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('radio', {
          name: /yes, my organization is publicly traded/i,
        })
      );

      // Fill in ticker symbol
      await waitFor(() => {
        expect(screen.getByLabelText(/ticker symbol/i)).toBeInTheDocument();
      });

      const tickerInput = screen.getByRole('textbox');
      await user.type(tickerInput, 'JPM');

      // Select a stock exchange
      const exchangeCombobox = screen.getAllByRole('combobox')[1];
      await user.click(exchangeCombobox);

      const nyseOption = await screen.findByRole('option', {
        name: /new york stock exchange/i,
      });
      await user.click(nyseOption);

      // Submit
      await user.click(screen.getByRole('button', { name: /get started/i }));

      await waitFor(() => {
        expect(gwCtx.postMutate).toHaveBeenCalled();
      });

      // Verify the request includes PTC data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callArgs: any = gwCtx.postMutate.mock.calls[0][0];
      const orgDetails: any = callArgs?.data?.parties?.[0]?.organizationDetails;
      expect(orgDetails?.publiclyTraded?.tickerSymbol).toBe('JPM');
      expect(orgDetails?.publiclyTraded?.stockExchange).toBe('XNYS');
    });
  });
});
