/**
 * OnboardingFlow - Publicly Traded Companies (PTC)
 *
 * Stories demonstrating onboarding flows for Publicly Traded Companies
 * and their subsidiaries. The PTC feature is controlled by the
 * `enablePubliclyTradedCompanies` prop (feature flag).
 *
 * ## Scenarios:
 *
 * **Primary Exchange (NYSE/NASDAQ):**
 * - Beneficial owners section: SKIPPED
 * - Controller collects name, address, job title only (no gov ID)
 * - FinCEN attestation: SKIPPED
 *
 * **Non-Primary Exchange (all others):**
 * - Beneficial owners section: COLLECTED (≥25% ownership)
 * - Controller collects full details INCLUDING gov ID
 * - FinCEN attestation: REQUIRED
 *
 * ## Test Data:
 *
 * **Primary PTC (Acme Corporation):**
 * - Ticker: ACME, Exchange: XNYS (NYSE)
 * - Controller: Jane Smith, CFO — no gov ID
 * - No beneficial owners
 *
 * **Primary Subsidiary (Acme Widgets LLC):**
 * - Parent Ticker: ACME, Exchange: XNAS (NASDAQ)
 * - Same collection rules as primary PTC
 *
 * **Non-Primary PTC (Neverland Books Inc.):**
 * - Ticker: NVLD, Exchange: XCBO (Cboe)
 * - Controller: Peiter Pan, CEO — with SSN
 * - Beneficial Owner: Tink Bell, VP Operations
 *
 * **Non-Primary Subsidiary (Neverland Comics LLC):**
 * - Parent Ticker: NVLD, Exchange: Other (OTC Markets)
 * - Same collection rules as non-primary PTC
 */

import {
  efClientCorpPTC_NonUS_Mock,
  efClientCorpPTC_NonUS_Subsidiary_Mock,
  efClientCorpPTC_US_Mock,
  efClientCorpPTC_US_Subsidiary_Mock,
} from '@/mocks/efClientCorpPTC.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  defaultHandlers,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Publicly Traded Companies',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@ptc'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: defaultHandlers,
    },
  },
  args: {
    ...commonArgsWithCallbacks,
  },
  argTypes: {
    ...commonArgTypes,
    enablePubliclyTradedCompanies: {
      control: { type: 'boolean' },
      description:
        'Enable PTC onboarding flow. When true, non-sole-prop entities ' +
        'can declare themselves as publicly traded or a subsidiary of a PTC.',
      table: {
        category: 'Feature Flags',
        defaultValue: { summary: 'false' },
      },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// =============================================================================
// FRESH CLIENT — ORG TYPE + NAME ONLY
// =============================================================================

/**
 * **Fresh Client (Org Type + Name Only)**
 *
 * An existing client with only organization type and business name populated.
 * PTC feature flag is enabled. Demonstrates the gateway redirect for clients
 * that haven't yet answered the PTC question.
 */
const freshClientMock: ClientResponse = {
  id: '0030000130',
  partyId: '2000000111',
  parties: [
    {
      id: '2000000111',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      profileStatus: 'NEW',
      active: true,
      createdAt: '2024-06-21T18:12:21.005Z',
      organizationDetails: {
        organizationType: 'C_CORPORATION',
        organizationName: 'Neverland Books',
        countryOfFormation: 'US',
      },
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: [],
    partyRoles: [],
    questionIds: ['30005'],
  },
  questionResponses: [],
  status: 'NEW',
};

export const FreshClient: Story = {
  name: 'Fresh Client (Org Type + Name Only)',
  loaders: [() => resetAndSeedClient(freshClientMock, '0030000130')],
  args: {
    ...commonArgs,
    clientId: '0030000130',
    enablePubliclyTradedCompanies: true,
  },
};

// =============================================================================
// PRIMARY EXCHANGE — PTC
// =============================================================================

/**
 * **Primary PTC — NYSE (XNYS)**
 *
 * A C Corporation publicly traded on a primary exchange (NYSE).
 * Primary exchanges are NYSE (XNYS) and NASDAQ (XNAS).
 *
 * Key behaviors:
 * - `publiclyTraded.stockExchange: "XNYS"` → primary exchange rules apply
 * - Beneficial owners section is **skipped**
 * - Controller collects **name, address, job title only** (no gov ID)
 * - FinCEN digital attestation is **skipped**
 */
export const Primary_PTC_NYSE: Story = {
  name: 'Primary PTC — NYSE',
  loaders: [() => resetAndSeedClient(efClientCorpPTC_US_Mock, '0030000150')],
  args: {
    ...commonArgs,
    clientId: '0030000150',
    enablePubliclyTradedCompanies: true,
  },
};

// =============================================================================
// PRIMARY EXCHANGE — SUBSIDIARY
// =============================================================================

/**
 * **Primary Subsidiary — NASDAQ (XNAS)**
 *
 * An LLC that is a subsidiary of a PTC traded on a primary exchange (NASDAQ).
 *
 * Key behaviors:
 * - `isSubsidiary: true` — ticker/exchange refer to parent PTC
 * - Same collection rules as primary PTC (no beneficial owners, no controller gov ID)
 * - `publiclyTraded.tickerSymbol` = parent company's ticker
 */
export const Primary_Subsidiary_NASDAQ: Story = {
  name: 'Primary Subsidiary — NASDAQ',
  loaders: [
    () => resetAndSeedClient(efClientCorpPTC_US_Subsidiary_Mock, '0030000151'),
  ],
  args: {
    ...commonArgs,
    clientId: '0030000151',
    enablePubliclyTradedCompanies: true,
  },
};

// =============================================================================
// NON-PRIMARY EXCHANGE — PTC
// =============================================================================

/**
 * **Non-Primary PTC — Cboe (XCBO)**
 *
 * A corporation traded on a non-primary US exchange (Cboe). Primary exchanges
 * are NYSE (XNYS) and NASDAQ (XNAS) only.
 *
 * Key behaviors:
 * - `publiclyTraded.stockExchange: "XCBO"` → non-primary exchange rules apply
 * - Beneficial owners section is **collected** (≥25% ownership)
 * - Controller collects **full details including gov ID**
 * - FinCEN digital attestation is **required**
 */
export const NonPrimary_PTC_Cboe: Story = {
  name: 'Non-Primary PTC — Cboe',
  loaders: [() => resetAndSeedClient(efClientCorpPTC_NonUS_Mock, '0030000152')],
  args: {
    ...commonArgs,
    clientId: '0030000152',
    enablePubliclyTradedCompanies: true,
  },
};

// =============================================================================
// NON-PRIMARY EXCHANGE — SUBSIDIARY (with "Other" exchange)
// =============================================================================

/**
 * **Non-Primary Subsidiary — Other Exchange (OTC Markets)**
 *
 * A subsidiary of a non-primary PTC, using `stockExchange: "Other"` with a
 * custom `stockExchangeName`. Primary exchanges are NYSE and NASDAQ only.
 *
 * Key behaviors:
 * - `isSubsidiary: true` + `stockExchange: "Other"` + `stockExchangeName: "OTC Markets"`
 * - Same collection rules as non-primary PTC (collect everything)
 * - Demonstrates the "Other" exchange conditional field
 */
export const NonPrimary_Subsidiary_Other: Story = {
  name: 'Non-Primary Subsidiary — Other Exchange',
  loaders: [
    () =>
      resetAndSeedClient(efClientCorpPTC_NonUS_Subsidiary_Mock, '0030000153'),
  ],
  args: {
    ...commonArgs,
    clientId: '0030000153',
    enablePubliclyTradedCompanies: true,
  },
};

// =============================================================================
// SOLE PROPRIETORSHIP EXCLUSION
// =============================================================================

/**
 * **Sole Proprietorship — PTC Not Available**
 *
 * Even when `enablePubliclyTradedCompanies` is `true`, sole proprietorships
 * should NEVER see the PTC question. Per spec: "Any entity type except for
 * Sole Prop will be allowed to send in 'publiclyTraded' block."
 *
 * Uses a partial client with only the organization type pre-selected.
 */
export const SoleProprietorship_NoPTC: Story = {
  name: 'Sole Proprietorship — No PTC',
  loaders: [
    () =>
      resetAndSeedClient(
        {
          id: '0030000154',
          partyId: '2000000154',
          products: ['EMBEDDED_PAYMENTS'],
          outstanding: {},
          status: 'NEW',
          parties: [
            {
              id: '2000000154',
              partyType: 'ORGANIZATION',
              roles: ['CLIENT'],
              profileStatus: 'NEW',
              active: true,
              organizationDetails: {
                organizationType: 'SOLE_PROPRIETORSHIP',
              },
            },
          ],
        },
        '0030000154'
      ),
  ],
  args: {
    ...commonArgs,
    clientId: '0030000154',
    enablePubliclyTradedCompanies: true,
  },
};
