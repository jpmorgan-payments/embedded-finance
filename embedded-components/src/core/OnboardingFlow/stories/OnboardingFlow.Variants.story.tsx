/**
 * OnboardingFlow - Variants
 *
 * Different configuration variants and feature combinations.
 */

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
  mockClientNoIndustry,
  OnboardingFlowTemplate,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Variants',
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
 * **With Sidebar**
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
  name: 'With Sidebar',
  args: {
    ...commonArgs,
    enableSidebar: true,
  },
};

/**
 * **Without Sidebar (Default)**
 *
 * Standard onboarding flow without sidebar navigation.
 * Linear progression through the flow.
 */
export const WithoutSidebar: Story = {
  name: 'Without Sidebar',
  args: {
    ...commonArgs,
    enableSidebar: false,
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
  name: 'Merchant Services Only',
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
  name: 'Multiple Products',
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
  name: 'Canada Jurisdiction',
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
  name: 'All Organization Types',
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
  name: 'With Download Checklist',
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
  name: 'With User Tracking',
  args: {
    ...commonArgs,
    enableSidebar: true,
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
