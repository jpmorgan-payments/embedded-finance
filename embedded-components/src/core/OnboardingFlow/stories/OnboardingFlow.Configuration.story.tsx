/**
 * OnboardingFlow - Configuration
 *
 * Different configuration variants and feature combinations.
 */

import { db } from '@/msw/db';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ORGANIZATION_TYPE_LIST } from '@/core/OnboardingFlow/consts';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  createOnboardingFlowHandlers,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientApproved,
  mockClientNoIndustry,
  mockExistingLinkedAccount,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Configuration',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
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
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// =============================================================================
// SIDEBAR VARIANTS
// =============================================================================

/**
 * **With Sidebar (Default)**
 *
 * Shows the timeline sidebar for navigating between onboarding sections.
 *
 * **Key Features:**
 * - Timeline navigation showing all onboarding sections
 * - Visual progress indicators (completed, current, not started)
 * - Click to navigate directly to specific sections
 * - Responsive design (hidden on mobile)
 */
export const WithSidebar: Story = {
  name: 'With Sidebar (Default)',
  args: {
    ...commonArgs,
    hideSidebar: false,
  },
};

/**
 * **Without Sidebar**
 *
 * Onboarding flow with sidebar hidden.
 * Linear progression through the flow.
 */
export const WithoutSidebar: Story = {
  args: {
    ...commonArgs,
    hideSidebar: true,
  },
};

// =============================================================================
// PRODUCT & JURISDICTION VARIANTS
// =============================================================================

/**
 * **Merchant Services Only**
 *
 * Onboarding flow configured for Merchant Services product.
 */
export const MerchantServicesOnly: Story = {
  args: {
    ...commonArgs,
    availableProducts: ['MERCHANT_SERVICES'],
    availableJurisdictions: ['US'],
  },
};

/**
 * **Multiple Products**
 *
 * Onboarding flow with both Embedded Payments and Merchant Services.
 */
export const MultipleProducts: Story = {
  args: {
    ...commonArgs,
    availableProducts: ['EMBEDDED_PAYMENTS', 'MERCHANT_SERVICES'],
    availableJurisdictions: ['US', 'CA'],
  },
};

/**
 * **Canada Jurisdiction**
 *
 * Onboarding flow for Canadian businesses.
 */
export const CanadaJurisdiction: Story = {
  args: {
    ...commonArgs,
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['CA'],
  },
};

/**
 * **All Organization Types**
 *
 * Onboarding with all available organization types enabled.
 */
export const AllOrganizationTypes: Story = {
  args: {
    ...commonArgs,
    availableOrganizationTypes: ORGANIZATION_TYPE_LIST,
  },
};

// =============================================================================
// FEATURE VARIANTS
// =============================================================================

/**
 * **With Download Checklist**
 *
 * Shows the "Download Checklist" button in the overview screen header.
 */
export const WithDownloadChecklist: Story = {
  args: {
    ...commonArgs,
    showDownloadChecklist: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'OnboardingFlow with the "Download checklist" button visible in the overview screen header.',
      },
    },
  },
};

/**
 * **With Link Account Step**
 *
 * Shows the "Link Bank Account" step in the onboarding overview.
 * By default this step is hidden. Enable it when your integration
 * requires users to connect a bank account during onboarding.
 */
export const WithLinkAccountStep: Story = {
  loaders: [
    async () => {
      db.recipient.deleteMany({ where: {} });
      return {};
    },
  ],
  args: {
    ...commonArgs,
    showLinkAccountStep: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'OnboardingFlow with the link bank account step visible in the overview screen.',
      },
    },
  },
};

/**
 * **With Link Account Step (Approved)**
 *
 * Shows the "Link Bank Account" step unlocked for an APPROVED client.
 * Only APPROVED clients can link a bank account — the step appears
 * as actionable rather than locked/on-hold.
 */
export const WithLinkAccountStepApproved: Story = {
  name: 'With Link Account Step (Approved)',
  loaders: [
    async () => {
      resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientApproved,
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
    docs: {
      description: {
        story:
          'OnboardingFlow with the link bank account step visible and unlocked for an APPROVED client.',
      },
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    showLinkAccountStep: true,
  },
};

/**
 * **With Link Account Step (New + Existing Account)**
 *
 * Shows a NEW client that already has an existing linked bank account.
 * The bank account section on the overview displays the linked account
 * card even though KYC has not yet been approved.
 */
export const WithLinkAccountStepNewExistingAccount: Story = {
  name: 'With Link Account Step (New + Existing Account)',
  loaders: [
    async () => {
      db.recipient.deleteMany({ where: {} });
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        existingLinkedAccounts: [mockExistingLinkedAccount],
      }),
    },
    docs: {
      description: {
        story:
          'OnboardingFlow with a NEW client that already has an existing linked bank account displayed in the overview.',
      },
    },
  },
  args: {
    ...commonArgs,
    showLinkAccountStep: true,
  },
};

// =============================================================================
// NAICS RECOMMENDATION VARIANTS
// =============================================================================

/**
 * **NAICS - Single Recommendation**
 *
 * Shows AI-powered industry code suggestion with a single match.
 */
export const NAICSSingleRecommendation: Story = {
  name: 'NAICS - Single Recommendation',
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: {
          ...mockClientNoIndustry,
          parties: mockClientNoIndustry.parties?.map((party) => ({
            ...party,
            organizationDetails: party.organizationDetails
              ? {
                  ...party.organizationDetails,
                  organizationDescription:
                    'We operate a fast-casual restaurant serving burgers, fries, and beverages.',
                }
              : party.organizationDetails,
          })),
        },
        clientId: DEFAULT_CLIENT_ID,
        naicsRecommendations: {
          resource: [
            {
              naicsCode: '722511',
              naicsDescription: 'Full-Service Restaurants',
            },
          ],
          message: 'Recommended NAICS code for restaurant business',
        },
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **NAICS - Multiple Recommendations**
 *
 * Shows AI-powered industry code suggestions with multiple matches.
 */
export const NAICSMultipleRecommendations: Story = {
  name: 'NAICS - Multiple Recommendations',
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: {
          ...mockClientNoIndustry,
          parties: mockClientNoIndustry.parties?.map((party) => ({
            ...party,
            organizationDetails: party.organizationDetails
              ? {
                  ...party.organizationDetails,
                  organizationDescription:
                    'We provide custom software development services, web application development, and technology consulting.',
                }
              : party.organizationDetails,
          })),
        },
        clientId: DEFAULT_CLIENT_ID,
        naicsRecommendations: {
          resource: [
            {
              naicsCode: '541511',
              naicsDescription: 'Custom Computer Programming Services',
            },
            {
              naicsCode: '541512',
              naicsDescription: 'Computer Systems Design Services',
            },
            {
              naicsCode: '541519',
              naicsDescription: 'Other Computer Related Services',
            },
          ],
          message: 'Recommended NAICS codes for software consulting business',
        },
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **NAICS - No Recommendations**
 *
 * Shows behavior when no NAICS codes match the business description.
 */
export const NAICSNoRecommendations: Story = {
  name: 'NAICS - No Recommendations',
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: {
          ...mockClientNoIndustry,
          parties: mockClientNoIndustry.parties?.map((party) => ({
            ...party,
            organizationDetails: party.organizationDetails
              ? {
                  ...party.organizationDetails,
                  organizationDescription:
                    'We do business stuff and make money.',
                }
              : party.organizationDetails,
          })),
        },
        clientId: DEFAULT_CLIENT_ID,
        naicsRecommendations: {
          resource: [],
          message: 'No matching NAICS codes found for this description',
        },
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **NAICS - API Error**
 *
 * Shows error handling when NAICS recommendation API fails.
 */
export const NAICSAPIError: Story = {
  name: 'NAICS - API Error',
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        client: mockClientNoIndustry,
        clientId: DEFAULT_CLIENT_ID,
        naicsRecommendations: {
          resource: [],
          error: true,
          errorStatus: 400,
        },
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

// =============================================================================
// USER TRACKING VARIANTS
// =============================================================================

/**
 * **With User Event Tracking**
 *
 * Demonstrates user journey tracking for analytics integration.
 * Open the browser console to see logged events.
 */
export const WithUserTracking: Story = {
  args: {
    ...commonArgs,
    hideSidebar: false,
    // eslint-disable-next-line no-console
    userEventsHandler: (context) => {
      // eslint-disable-next-line no-console
      console.group('🔍 Onboarding Journey Event');
      // eslint-disable-next-line no-console
      console.log('Action Name:', context.actionName);
      // eslint-disable-next-line no-console
      console.log('Event Type:', context.eventType);
      // eslint-disable-next-line no-console
      console.log('Timestamp:', new Date(context.timestamp).toISOString());
      // eslint-disable-next-line no-console
      console.log('Element:', context.element);
      // eslint-disable-next-line no-console
      console.log('Metadata:', context.metadata);
      // eslint-disable-next-line no-console
      console.groupEnd();
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates user journey tracking. Open the browser console to see what data is passed to RUM/analytics systems.',
      },
    },
  },
};

// =============================================================================
// DISCLOSURE & ATTESTATION VARIANTS
// =============================================================================

/**
 * **With Disclosure Config**
 *
 * Demonstrates the regulatory disclosure footer and enhanced
 * attestation checkboxes (§ 1.1 / § 1.2).
 *
 * When `disclosureConfig` is provided:
 * - A persistent footer shows "[Platform Provider] is not a bank;
 *   Banking services provided by JPMorgan Chase Bank, N.A., Member FDIC."
 * - The Review step displays three attestation checkboxes instead of the
 *   single "data accuracy" checkbox.
 * - The third checkbox includes hyperlinks to J.P. Morgan Account Terms
 *   and the Platform Provider's Program Agreement.
 */
export const WithDisclosureConfig: Story = {
  name: 'With Disclosure Config',
  args: {
    ...commonArgs,
    disclosureConfig: {
      platformName: 'SellSense',
      jpMorganAccountTermsUrl: 'https://example.com/jpmorgan-account-terms',
      platformAgreementUrl: 'https://example.com/sellsense-program-agreement',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the regulatory disclosure footer and enhanced review attestation checkboxes. The footer is visible on every screen. Navigate to the Review step to see the three attestation checkboxes with platform-specific language and hyperlinked terms.',
      },
    },
  },
};

/**
 * **With Disclosure Config (Custom Agreement Label)**
 *
 * Same as above but with a custom label for the platform agreement link.
 */
export const WithDisclosureConfigCustomLabel: Story = {
  name: 'With Disclosure Config (Custom Label)',
  args: {
    ...commonArgs,
    disclosureConfig: {
      platformName: 'PayFicient',
      jpMorganAccountTermsUrl: 'https://example.com/jpmorgan-account-terms',
      platformAgreementUrl:
        'https://example.com/payficient-terms-of-service',
      platformAgreementLabel: "PayFicient's Terms of Service",
    },
  },
};

/**
 * **With Disclosure Config (No Links)**
 *
 * Disclosure config with only `platformName` — no URLs provided.
 * Terms references render as bold text instead of hyperlinks.
 */
export const WithDisclosureConfigNoLinks: Story = {
  name: 'With Disclosure Config (No Links)',
  args: {
    ...commonArgs,
    disclosureConfig: {
      platformName: 'Acme Marketplace',
    },
  },
};
