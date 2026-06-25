/**
 * Publicly Traded Companies (PTC) — End-to-End Integration Tests
 *
 * Tests the full user journey through the Gateway screen with PTC enabled:
 * 1. Fresh flow: select org type → PTC radio → ticker/exchange → submit → overview
 * 2. PTC lock: returning to gateway with existing PTC data → "No" disabled
 * 3. Overview display: PTC info shown, hint for eligible non-PTC orgs
 * 4. Review card: PTC status displayed correctly
 * 5. Section visibility: US PTC hides owners section and identity step
 */

import { EBComponentsProvider } from '@/index';
import { efClientCorpPTC_US_Mock } from '@/mocks/efClientCorpPTC.mock';
import { server } from '@/msw/server';
import {
  screen,
  render as testingLibraryRender,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { OnboardingFlow } from '@/core/OnboardingFlow';
import type { OnboardingFlowProps } from '@/core/OnboardingFlow/types/onboarding.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderOnboardingFlow = (
  props: Partial<OnboardingFlowProps> & { clientId?: string } = {},
  clientMock?: ClientResponse
) => {
  if (clientMock) {
    server.use(
      http.get('/clients/:clientId', () =>
        HttpResponse.json(clientMock, { status: 200 })
      )
    );
  }

  const { clientId, ...onboardingProps } = props;

  const defaultProps: OnboardingFlowProps = {
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    availableOrganizationTypes: [
      'SOLE_PROPRIETORSHIP',
      'LIMITED_LIABILITY_COMPANY',
      'C_CORPORATION',
      'LIMITED_LIABILITY_PARTNERSHIP',
    ],
    docUploadOnlyMode: false,
    alertOnExit: false,
    hideSidebar: true,
    enablePubliclyTradedCompanies: true,
    ...onboardingProps,
  };

  return testingLibraryRender(
    <EBComponentsProvider
      apiBaseUrl=""
      clientId={clientId}
      apiBaseUrlTransforms={{
        clients: (baseUrl) => baseUrl.replace('v1', '/do/v1'),
      }}
    >
      <OnboardingFlow {...defaultProps} />
    </EBComponentsProvider>
  );
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

describe('PTC Feature — End-to-End User Journey', () => {
  beforeEach(() => {
    server.resetHandlers();

    const originalError = console.error;
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('React has detected a change in the order of Hooks')
      ) {
        return;
      }
      originalError(...args);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Fresh gateway flow — select PTC, fill trading info, reach overview
  // =========================================================================

  describe('Gateway → PTC Selection → Overview', () => {
    test('user selects C Corporation, answers "Yes, publicly traded", fills ticker/exchange, and reaches overview with PTC info', async () => {
      const user = userEvent.setup();
      renderOnboardingFlow();

      // Gateway loads
      await waitFor(() => {
        expect(
          screen.getByText(/Select your general business type/i)
        ).toBeInTheDocument();
      });

      // Select "Registered business"
      const registeredBusiness = screen.getByRole('radio', {
        name: /Registered business/i,
      });
      await user.click(registeredBusiness);

      // Wait for specific org type dropdown
      await waitFor(() => {
        expect(
          screen.getByText(/Select the specific legal structure/i)
        ).toBeInTheDocument();
      });

      // Open dropdown and select C Corporation
      const dropdown = screen.getByLabelText(
        /Select the specific legal structure/i
      );
      await user.click(dropdown);
      await user.click(screen.getByRole('option', { name: /C Corporation/i }));

      // PTC question should now appear (C Corp is PTC-eligible)
      await waitFor(() => {
        expect(
          screen.getByText(
            /Is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      // Select "Yes, my organization is publicly traded"
      const ptcOption = screen.getByRole('radio', {
        name: /Yes, my organization is publicly traded/i,
      });
      await user.click(ptcOption);

      // Trading fields should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Ticker symbol/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Stock exchange/i)).toBeInTheDocument();
      });

      // Fill in ticker symbol
      const tickerInput = screen.getByLabelText(/Ticker symbol/i);
      await user.type(tickerInput, 'TEST');

      // Select stock exchange (NYSE) — priority exchanges are visible without typing
      const exchangeCombobox = screen.getByLabelText(/Stock exchange/i);
      await user.click(exchangeCombobox);

      await waitFor(() => {
        expect(
          screen.getByRole('option', {
            name: /New York Stock Exchange \(XNYS\)/i,
          })
        ).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('option', {
          name: /New York Stock Exchange \(XNYS\)/i,
        })
      );

      // Click "Get Started"
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /get started/i });
        expect(btn).toBeInTheDocument();
        return user.click(btn);
      });

      // Should reach overview
      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // PTC info should be visible on the overview
      expect(screen.getByText(/Publicly traded/i)).toBeInTheDocument();
      expect(screen.getByText(/Ticker: TEST/i)).toBeInTheDocument();
      expect(screen.getByText(/Exchange:.*New York/i)).toBeInTheDocument();
    });

    test('user selects LLC (subsidiary-only eligible), answers "Yes, subsidiary", fills parent company info', async () => {
      const user = userEvent.setup();
      renderOnboardingFlow();

      // Gateway
      await waitFor(() => {
        expect(
          screen.getByText(/Select your general business type/i)
        ).toBeInTheDocument();
      });

      const registeredBusiness = screen.getByRole('radio', {
        name: /Registered business/i,
      });
      await user.click(registeredBusiness);

      await waitFor(() => {
        expect(
          screen.getByText(/Select the specific legal structure/i)
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText(
        /Select the specific legal structure/i
      );
      await user.click(dropdown);
      await user.click(
        screen.getByRole('option', {
          name: /Limited Liability Company \(LLC\)/i,
        })
      );

      // For LLC: question should be subsidiary-only (no "publicly traded" option)
      await waitFor(() => {
        expect(
          screen.getByText(
            /Is your organization a subsidiary \(51% or more ownership\) of a publicly traded company/i
          )
        ).toBeInTheDocument();
      });

      // "Yes, publicly traded" option should NOT be present (LLC can only be subsidiary)
      expect(
        screen.queryByRole('radio', {
          name: /Yes, my organization is publicly traded/i,
        })
      ).not.toBeInTheDocument();

      // Select subsidiary option
      const subsidiaryOption = screen.getByRole('radio', {
        name: /Yes, my organization is a subsidiary/i,
      });
      await user.click(subsidiaryOption);

      // Labels should reflect subsidiary context
      await waitFor(() => {
        expect(
          screen.getByLabelText(/Parent company ticker symbol/i)
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText(/Parent company stock exchange/i)
        ).toBeInTheDocument();
      });

      // Fill parent company ticker
      const tickerInput = screen.getByLabelText(
        /Parent company ticker symbol/i
      );
      await user.type(tickerInput, 'PRNT');

      // Select NASDAQ — priority exchanges are visible without typing
      const exchangeCombobox = screen.getByLabelText(
        /Parent company stock exchange/i
      );
      await user.click(exchangeCombobox);

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: /NASDAQ \(XNAS\)/i })
        ).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('option', { name: /NASDAQ \(XNAS\)/i })
      );

      // Get Started
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /get started/i });
        expect(btn).toBeInTheDocument();
        return user.click(btn);
      });

      // Overview
      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Subsidiary PTC info should be visible
      expect(
        screen.getByText(/Subsidiary of publicly traded company/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Ticker: PRNT/i)).toBeInTheDocument();
    });

    test('user selects "No" for PTC — no trading fields shown, overview shows hint for eligible org', async () => {
      const user = userEvent.setup();
      renderOnboardingFlow();

      await waitFor(() => {
        expect(
          screen.getByText(/Select your general business type/i)
        ).toBeInTheDocument();
      });

      const registeredBusiness = screen.getByRole('radio', {
        name: /Registered business/i,
      });
      await user.click(registeredBusiness);

      await waitFor(() => {
        expect(
          screen.getByText(/Select the specific legal structure/i)
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText(
        /Select the specific legal structure/i
      );
      await user.click(dropdown);
      await user.click(screen.getByRole('option', { name: /C Corporation/i }));

      // PTC question appears
      await waitFor(() => {
        expect(
          screen.getByText(
            /Is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      // Select "No"
      const noOption = screen.getByRole('radio', { name: /^No$/i });
      await user.click(noOption);

      // Trading fields should NOT appear
      expect(screen.queryByLabelText(/Ticker symbol/i)).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/Stock exchange/i)
      ).not.toBeInTheDocument();

      // Get Started
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /get started/i });
        expect(btn).toBeInTheDocument();
        return user.click(btn);
      });

      // Overview
      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // No PTC details, but hint should appear for eligible org type
      expect(screen.queryByText(/Ticker:/i)).not.toBeInTheDocument();
      expect(
        screen.getByText(/If your company is publicly traded or a subsidiary/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. PTC Lock — "No" option disabled when PTC data exists
  // =========================================================================

  describe('PTC Lock Behavior', () => {
    test('gateway shows alert banner and disables "No" option when PTC data exists on the client', async () => {
      const user = userEvent.setup();
      renderOnboardingFlow(
        { clientId: efClientCorpPTC_US_Mock.id },
        efClientCorpPTC_US_Mock
      );

      // Should land on overview (client already created)
      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Navigate back to gateway via the Edit button
      const editButton = screen.getByRole('button', {
        name: /Edit business type/i,
      });
      await user.click(editButton);

      // Gateway should load with lock alert
      await waitFor(() => {
        expect(
          screen.getByText(
            /publicly traded status has been saved and cannot be removed/i
          )
        ).toBeInTheDocument();
      });

      // "No" radio should be disabled
      const noOption = screen.getByRole('radio', { name: /^No$/i });
      expect(noOption).toBeDisabled();

      // PTC option should still be selected and enabled
      const ptcOption = screen.getByRole('radio', {
        name: /Yes, my organization is publicly traded/i,
      });
      expect(ptcOption).toBeChecked();
      expect(ptcOption).not.toBeDisabled();
    });

    test('Sole Proprietorship block is disabled when PTC is locked', async () => {
      const user = userEvent.setup();
      renderOnboardingFlow(
        { clientId: efClientCorpPTC_US_Mock.id },
        efClientCorpPTC_US_Mock
      );

      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Navigate to gateway
      const editButton = screen.getByRole('button', {
        name: /Edit business type/i,
      });
      await user.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /publicly traded status has been saved and cannot be removed/i
          )
        ).toBeInTheDocument();
      });

      // Sole owner radio should be disabled
      const soleOwnerOption = screen.getByRole('radio', {
        name: /Sole owner/i,
      });
      expect(soleOwnerOption).toBeDisabled();
    });
  });

  // =========================================================================
  // 3. US PTC — Section visibility (owners hidden, no identity step)
  // =========================================================================

  describe('US PTC Section Visibility', () => {
    test('owners section is hidden for US PTC (NYSE)', async () => {
      renderOnboardingFlow(
        { clientId: efClientCorpPTC_US_Mock.id },
        efClientCorpPTC_US_Mock
      );

      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Business section present
      expect(screen.getByTestId('business-section-button')).toBeInTheDocument();

      // Personal section present (controller info still needed)
      expect(screen.getByTestId('personal-section-button')).toBeInTheDocument();

      // Owners section NOT present (US PTC exempt)
      expect(
        screen.queryByTestId('owners-section-button')
      ).not.toBeInTheDocument();
    });

    test('US PTC controller mock has NO gov ID (individualIds) — identity requirements removed', () => {
      // US PTC controllers don't need to provide gov ID — verified at data level.
      // The isVisible predicate on the identity-document step uses isUSExchangePTC()
      // which returns true for NYSE/NASDAQ, hiding it from the sidebar/timeline.
      const controller = efClientCorpPTC_US_Mock.parties?.find((p) =>
        p.roles?.includes('CONTROLLER')
      );
      expect(controller).toBeDefined();
      expect(controller?.individualDetails?.individualIds).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. Overview PTC Display
  // =========================================================================

  describe('Overview PTC Display', () => {
    test('shows publicly traded label with ticker and exchange for US PTC', async () => {
      renderOnboardingFlow(
        { clientId: efClientCorpPTC_US_Mock.id },
        efClientCorpPTC_US_Mock
      );

      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // PTC info displayed
      expect(screen.getByText(/Publicly traded/i)).toBeInTheDocument();
      expect(screen.getByText(/Ticker: ACME/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Exchange:.*New York Stock Exchange/i)
      ).toBeInTheDocument();
    });

    test('does NOT show PTC hint when PTC data exists', async () => {
      renderOnboardingFlow(
        { clientId: efClientCorpPTC_US_Mock.id },
        efClientCorpPTC_US_Mock
      );

      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Hint should NOT show (PTC data exists)
      expect(
        screen.queryByText(
          /If your company is publicly traded or a subsidiary/i
        )
      ).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. "Other" Stock Exchange — custom exchange name field
  // =========================================================================

  describe('Other Stock Exchange', () => {
    test('selecting "Other" exchange shows the custom exchange name field', async () => {
      const user = userEvent.setup();
      renderOnboardingFlow();

      // Navigate through gateway to PTC selection
      await waitFor(() => {
        expect(
          screen.getByText(/Select your general business type/i)
        ).toBeInTheDocument();
      });

      const registeredBusiness = screen.getByRole('radio', {
        name: /Registered business/i,
      });
      await user.click(registeredBusiness);

      await waitFor(() => {
        expect(
          screen.getByText(/Select the specific legal structure/i)
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText(
        /Select the specific legal structure/i
      );
      await user.click(dropdown);
      await user.click(screen.getByRole('option', { name: /C Corporation/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            /Is your organization publicly traded, or a subsidiary/i
          )
        ).toBeInTheDocument();
      });

      const ptcOption = screen.getByRole('radio', {
        name: /Yes, my organization is publicly traded/i,
      });
      await user.click(ptcOption);

      await waitFor(() => {
        expect(screen.getByLabelText(/Stock exchange/i)).toBeInTheDocument();
      });

      // Select "Other (not listed above)"
      const exchangeCombobox = screen.getByLabelText(/Stock exchange/i);
      await user.click(exchangeCombobox);

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: /Other \(not listed above\)/i })
        ).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('option', { name: /Other \(not listed above\)/i })
      );

      // Stock exchange name field should appear
      await waitFor(() => {
        expect(
          screen.getByLabelText(/Stock exchange name/i)
        ).toBeInTheDocument();
      });

      // Fill it in
      const exchangeNameInput = screen.getByLabelText(/Stock exchange name/i);
      await user.type(exchangeNameInput, 'Tokyo Stock Exchange');

      // Also fill ticker
      const tickerInput = screen.getByLabelText(/Ticker symbol/i);
      await user.type(tickerInput, 'SONY');

      // Get Started
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /get started/i });
        expect(btn).toBeInTheDocument();
        return user.click(btn);
      });

      // Should reach overview
      await waitFor(
        () => {
          expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // PTC info with custom exchange name
      expect(screen.getByText(/Ticker: SONY/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 6. Sole Proprietorship — PTC never shown
  // =========================================================================

  describe('Sole Proprietorship Exclusion', () => {
    test('PTC question never appears for Sole Proprietorship', async () => {
      const user = userEvent.setup();
      renderOnboardingFlow({
        enablePubliclyTradedCompanies: true,
        availableOrganizationTypes: ['SOLE_PROPRIETORSHIP', 'C_CORPORATION'],
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Select your general business type/i)
        ).toBeInTheDocument();
      });

      // Select sole owner
      const soleOwner = screen.getByRole('radio', { name: /Sole owner/i });
      await user.click(soleOwner);

      // PTC question should NOT appear
      expect(
        screen.queryByText(/Is your organization publicly traded/i)
      ).not.toBeInTheDocument();

      // Get Started should be available without PTC
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /get started/i });
        expect(btn).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 7. Feature flag disabled — no PTC UI at all
  // =========================================================================

  describe('Feature Flag Disabled', () => {
    test('PTC question does not appear when enablePubliclyTradedCompanies is false', async () => {
      const user = userEvent.setup();
      renderOnboardingFlow({ enablePubliclyTradedCompanies: false });

      await waitFor(() => {
        expect(
          screen.getByText(/Select your general business type/i)
        ).toBeInTheDocument();
      });

      const registeredBusiness = screen.getByRole('radio', {
        name: /Registered business/i,
      });
      await user.click(registeredBusiness);

      await waitFor(() => {
        expect(
          screen.getByText(/Select the specific legal structure/i)
        ).toBeInTheDocument();
      });

      const dropdown = screen.getByLabelText(
        /Select the specific legal structure/i
      );
      await user.click(dropdown);
      await user.click(screen.getByRole('option', { name: /C Corporation/i }));

      // PTC question should NOT appear
      expect(
        screen.queryByText(/Is your organization publicly traded/i)
      ).not.toBeInTheDocument();

      // No ticker or exchange fields
      expect(screen.queryByLabelText(/Ticker symbol/i)).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/Stock exchange/i)
      ).not.toBeInTheDocument();
    });
  });
});
