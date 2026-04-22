/**
 * OnboardingFlow - Publicly Traded Companies (PTC)
 *
 * Stories demonstrating onboarding flows for Publicly Traded Companies
 * and their subsidiaries. The PTC feature is controlled by the
 * `enablePubliclyTradedCompanies` prop (feature flag).
 *
 * ## Scenarios:
 *
 * **US Exchange (NYSE/NASDAQ):**
 * - Beneficial owners section: SKIPPED
 * - Controller collects name, address, job title only (no gov ID)
 * - FinCEN attestation: SKIPPED
 *
 * **Non-US Exchange (all others):**
 * - Beneficial owners section: COLLECTED (≥25% ownership)
 * - Controller collects full details INCLUDING gov ID
 * - FinCEN attestation: REQUIRED
 *
 * ## Test Data:
 *
 * **US PTC (Acme Corporation):**
 * - Ticker: ACME, Exchange: XNYS (NYSE)
 * - Controller: Jane Smith, CFO — no gov ID
 * - No beneficial owners
 *
 * **US Subsidiary (Acme Widgets LLC):**
 * - Parent Ticker: ACME, Exchange: XNAS (NASDAQ)
 * - Same collection rules as US PTC
 *
 * **Non-US PTC (Globex Corporation):**
 * - Ticker: GLBX, Exchange: XLON (London)
 * - Controller: Hank Scorpio, CEO — with passport
 * - Beneficial Owner: Frank Grimes, VP Operations
 *
 * **Non-US Subsidiary (Globex Asia Holdings):**
 * - Parent Ticker: GLBX, Exchange: Other (Tokyo Stock Exchange)
 * - Same collection rules as non-US PTC
 */

import {
  efClientCorpPTC_NonUS_Mock,
  efClientCorpPTC_NonUS_Subsidiary_Mock,
  efClientCorpPTC_US_Mock,
  efClientCorpPTC_US_Subsidiary_Mock,
} from '@/mocks/efClientCorpPTC.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
// US EXCHANGE — PTC
// =============================================================================

/**
 * **US PTC — NYSE (XNYS)**
 *
 * A C Corporation publicly traded on the New York Stock Exchange.
 *
 * Key behaviors:
 * - `publiclyTraded.stockExchange: "XNYS"` → US exchange rules apply
 * - Beneficial owners section is **skipped**
 * - Controller collects **name, address, job title only** (no gov ID)
 * - FinCEN digital attestation is **skipped**
 */
export const US_PTC_NYSE: Story = {
  name: 'US PTC — NYSE',
  loaders: [() => resetAndSeedClient(efClientCorpPTC_US_Mock, '0030000150')],
  args: {
    ...commonArgs,
    clientId: '0030000150',
    enablePubliclyTradedCompanies: true,
  },
};

// =============================================================================
// US EXCHANGE — SUBSIDIARY
// =============================================================================

/**
 * **US Subsidiary — NASDAQ (XNAS)**
 *
 * An LLC that is a subsidiary of a US PTC (Acme Corp) traded on NASDAQ.
 *
 * Key behaviors:
 * - `isSubsidiary: true` — ticker/exchange refer to parent PTC
 * - Same collection rules as US PTC (no beneficial owners, no controller gov ID)
 * - `publiclyTraded.tickerSymbol` = parent company's ticker
 */
export const US_Subsidiary_NASDAQ: Story = {
  name: 'US Subsidiary — NASDAQ',
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
// NON-US EXCHANGE — PTC
// =============================================================================

/**
 * **Non-US PTC — London Stock Exchange (XLON)**
 *
 * A corporation traded on a non-US exchange (LSE).
 *
 * Key behaviors:
 * - `publiclyTraded.stockExchange: "XLON"` → non-US exchange rules apply
 * - Beneficial owners section is **collected** (≥25% ownership)
 * - Controller collects **full details including gov ID** (passport)
 * - FinCEN digital attestation is **required**
 */
export const NonUS_PTC_London: Story = {
  name: 'Non-US PTC — London',
  loaders: [() => resetAndSeedClient(efClientCorpPTC_NonUS_Mock, '0030000152')],
  args: {
    ...commonArgs,
    clientId: '0030000152',
    enablePubliclyTradedCompanies: true,
  },
};

// =============================================================================
// NON-US EXCHANGE — SUBSIDIARY (with "Other" exchange)
// =============================================================================

/**
 * **Non-US Subsidiary — Other Exchange (Tokyo Stock Exchange)**
 *
 * A subsidiary of a non-US PTC, using `stockExchange: "Other"` with a
 * custom `stockExchangeName`.
 *
 * Key behaviors:
 * - `isSubsidiary: true` + `stockExchange: "Other"` + `stockExchangeName: "Tokyo Stock Exchange"`
 * - Same collection rules as non-US PTC (collect everything)
 * - Demonstrates the "Other" exchange conditional field
 */
export const NonUS_Subsidiary_Other: Story = {
  name: 'Non-US Subsidiary — Other Exchange',
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
// FEATURE FLAG DISABLED
// =============================================================================

/**
 * **Feature Flag Disabled (Default)**
 *
 * When `enablePubliclyTradedCompanies` is `false` (default), the PTC
 * question should never appear, even if the entity type supports it.
 * This is the current production behavior.
 */
export const FeatureFlagDisabled: Story = {
  name: 'Feature Flag Disabled (Default)',
  args: {
    ...commonArgs,
    enablePubliclyTradedCompanies: false,
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
 */
export const SoleProprietorship_NoPTC: Story = {
  name: 'Sole Proprietorship — No PTC',
  args: {
    ...commonArgs,
    availableOrganizationTypes: ['SOLE_PROPRIETORSHIP'],
    enablePubliclyTradedCompanies: true,
  },
};
