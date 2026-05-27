/**
 * OnboardingFlow — NAICS / Industry selection
 *
 * Dedicated story group for the **Business → Industry** step:
 *
 * - **AI suggestions** (`NAICS_SUGGESTION_FEATURE_FLAG`): single match, multiple
 *   matches, empty response (vague description), and API error.
 * - **Priority industry codes** (`priorityIndustryCodes` prop): host-curated
 *   subset pinned at the top of the industry combobox while the full catalog
 *   remains selectable below. Composes with the AI suggestion feature.
 *
 * Every story uses `flowEntry: { screenId: 'business-section', stepperStepId: 'industry' }`
 * so it lands the user directly on the Industry step — no manual navigation
 * required to reach the surface under test.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  createOnboardingFlowHandlers,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNoIndustry,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

/** Open the flow directly on the Industry step. */
const INDUSTRY_FLOW_ENTRY: OnboardingFlowProps['flowEntry'] = {
  screenId: 'business-section',
  stepperStepId: 'industry',
};

/** Clone {@link mockClientNoIndustry} and stamp the organization description
 *  onto its organization-typed party so the Industry form lands with the
 *  textarea pre-filled. The combobox "Suggest" button becomes enabled
 *  immediately, making each AI scenario one click away. */
const withOrgDescription = (description: string): ClientResponse => ({
  ...mockClientNoIndustry,
  parties: mockClientNoIndustry.parties?.map((party) =>
    party.organizationDetails
      ? {
          ...party,
          organizationDetails: {
            ...party.organizationDetails,
            organizationDescription: description,
          },
        }
      : party
  ),
});

/** Build a Storybook loader that seeds the MSW db with the given client.
 *  `createOnboardingFlowHandlers`'s `client` option is informational only —
 *  the actual `GET /clients/:id` response comes from the db, so seeding via
 *  a loader is what makes `organizationDescription` actually render. */
const seedClientLoader = (client: ClientResponse) => () =>
  resetAndSeedClient(client, DEFAULT_CLIENT_ID);

/** A handful of restaurant / retail / bakery NAICS codes used by the
 *  priority-list stories — chosen to be realistic for a food-platform host. */
const FOOD_PLATFORM_PRIORITY_CODES = [
  '722511', // Full-Service Restaurants
  '722513', // Limited-Service Restaurants
  '722515', // Snack and Nonalcoholic Beverage Bars
  '445110', // Supermarkets and Other Grocery (except Convenience) Stores
  '311811', // Retail Bakeries
] as const;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/NAICS / Industry',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding', '@naics'],
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
// AI SUGGESTIONS (feature flag: NAICS_SUGGESTION_FEATURE_FLAG)
// =============================================================================

/**
 * **AI — Single recommendation**
 *
 * Single AI-suggested NAICS code rendered as a chip above the combobox.
 */
export const AISingleRecommendation: Story = {
  name: 'AI — single recommendation',
  loaders: [
    seedClientLoader(
      withOrgDescription(
        'We operate a fast-casual restaurant serving burgers, fries, and beverages.'
      )
    ),
  ],
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
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
    flowEntry: INDUSTRY_FLOW_ENTRY,
  },
};

/**
 * **AI — Multiple recommendations**
 *
 * Three AI-suggested NAICS codes rendered as chips above the combobox.
 */
export const AIMultipleRecommendations: Story = {
  name: 'AI — multiple recommendations',
  loaders: [
    seedClientLoader(
      withOrgDescription(
        'We provide custom software development services, web application development, and technology consulting.'
      )
    ),
  ],
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
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
    flowEntry: INDUSTRY_FLOW_ENTRY,
  },
};

/**
 * **AI — No recommendations**
 *
 * Vague business description → empty response → "improve your description" warning.
 */
export const AINoRecommendations: Story = {
  name: 'AI — no recommendations (vague description)',
  loaders: [
    seedClientLoader(
      withOrgDescription('We do business stuff and make money.')
    ),
  ],
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
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
    flowEntry: INDUSTRY_FLOW_ENTRY,
  },
};

/**
 * **AI — API error**
 *
 * Recommendation API returns 400 → recoverable error alert above the combobox.
 */
export const AIAPIError: Story = {
  name: 'AI — API error',
  loaders: [
    seedClientLoader(
      withOrgDescription(
        'We operate a fast-casual restaurant serving burgers, fries, and beverages.'
      )
    ),
  ],
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
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
    flowEntry: INDUSTRY_FLOW_ENTRY,
  },
};

// =============================================================================
// PRIORITY INDUSTRY CODES (host-curated pinned subset)
// =============================================================================

/**
 * **Priority codes — food platform preset**
 *
 * Five host-curated restaurant / retail / bakery NAICS codes pinned at the top
 * of the industry combobox. Open the combobox to see the "Suggested for your
 * platform" group above "All industries".
 */
export const PriorityCodesFoodPlatform: Story = {
  name: 'Priority codes — food platform preset',
  loaders: [seedClientLoader(mockClientNoIndustry)],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: INDUSTRY_FLOW_ENTRY,
    priorityIndustryCodes: [...FOOD_PLATFORM_PRIORITY_CODES],
  },
};

/**
 * **Priority codes — single preset entry**
 *
 * Smallest possible pinned group: one code. Useful for hosts that want to
 * surface a single recommended code (e.g., a vertical-specific marketplace).
 */
export const PriorityCodesSingle: Story = {
  name: 'Priority codes — single entry',
  loaders: [seedClientLoader(mockClientNoIndustry)],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: INDUSTRY_FLOW_ENTRY,
    priorityIndustryCodes: ['722511'],
  },
};

/**
 * **Priority codes — with unknown codes (filtered)**
 *
 * Demonstrates resilience: unknown codes are silently dropped (with a dev
 * `console.warn`) so a stale host config never blocks onboarding.
 */
export const PriorityCodesWithUnknown: Story = {
  name: 'Priority codes — with unknown codes (filtered)',
  loaders: [seedClientLoader(mockClientNoIndustry)],
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        clientId: DEFAULT_CLIENT_ID,
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: INDUSTRY_FLOW_ENTRY,
    priorityIndustryCodes: ['722511', '999999', '445110', '000000'],
  },
};

/**
 * **Priority codes + AI suggestions**
 *
 * Both surfaces active. The AI chip group sits **above** the combobox; the
 * pinned "Suggested for your platform" group sits **inside** the combobox.
 * The two are complementary and independent.
 */
export const PriorityCodesPlusAI: Story = {
  name: 'Priority codes + AI suggestions',
  loaders: [
    seedClientLoader(
      withOrgDescription(
        'We operate a chain of bakeries serving fresh bread, pastries, and coffee.'
      )
    ),
  ],
  play: async () => {
    localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
  },
  parameters: {
    msw: {
      handlers: createOnboardingFlowHandlers({
        clientId: DEFAULT_CLIENT_ID,
        naicsRecommendations: {
          resource: [
            {
              naicsCode: '311811',
              naicsDescription: 'Retail Bakeries',
            },
            {
              naicsCode: '722515',
              naicsDescription: 'Snack and Nonalcoholic Beverage Bars',
            },
          ],
          message: 'Recommended NAICS codes for bakery business',
        },
      }),
    },
  },
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    flowEntry: INDUSTRY_FLOW_ENTRY,
    priorityIndustryCodes: [...FOOD_PLATFORM_PRIORITY_CODES],
  },
};
