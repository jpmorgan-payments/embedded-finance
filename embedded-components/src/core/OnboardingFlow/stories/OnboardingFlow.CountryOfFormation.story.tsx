/**
 * OnboardingFlow — Country of formation (experimental preview)
 *
 * Demonstrates a **future** feature: onboarding a business formed outside the
 * US. The API does not accept non-US countries of formation yet, so these
 * stories only work against the Storybook mock API. The entity types per
 * country below are made up for the demo; hosts supply their own through
 * `experimental_organizationTypesByCountryOfFormation`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type {
  ClientResponse,
  OrganizationType,
} from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type {
  ExperimentalOrganizationTypeOption,
  OnboardingFlowProps,
} from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const DEMO_ORGANIZATION_TYPES_BY_COUNTRY: Partial<
  Record<string, readonly ExperimentalOrganizationTypeOption[]>
> = {
  CN: [
    {
      value: 'CN_LIMITED_LIABILITY_COMPANY',
      label: 'Limited liability company',
      description: 'Owned by 1 to 50 shareholders',
      generalOrganizationType: 'REGISTERED_BUSINESS',
    },
    {
      value: 'CN_COMPANY_LIMITED_BY_SHARES',
      label: 'Company limited by shares',
      description: 'Capital divided into equal shares',
      generalOrganizationType: 'REGISTERED_BUSINESS',
    },
    {
      value: 'CN_WHOLLY_FOREIGN_OWNED_ENTERPRISE',
      label: 'Wholly foreign-owned enterprise (WFOE)',
      description: 'Limited company owned entirely by foreign investors',
      generalOrganizationType: 'REGISTERED_BUSINESS',
    },
    {
      value: 'CN_PARTNERSHIP_ENTERPRISE',
      label: 'Partnership enterprise',
      generalOrganizationType: 'REGISTERED_BUSINESS',
    },
    {
      value: 'CN_SOCIAL_ORGANIZATION',
      label: 'Social organization',
      description: 'Non-profit membership organization',
      generalOrganizationType: 'OTHER',
    },
  ],
  GB: [
    {
      value: 'GB_PRIVATE_LIMITED_COMPANY',
      label: 'Private limited company (Ltd)',
      generalOrganizationType: 'REGISTERED_BUSINESS',
    },
    {
      value: 'GB_PUBLIC_LIMITED_COMPANY',
      label: 'Public limited company (PLC)',
      generalOrganizationType: 'REGISTERED_BUSINESS',
    },
    {
      value: 'GB_LIMITED_LIABILITY_PARTNERSHIP',
      label: 'Limited liability partnership (LLP)',
      generalOrganizationType: 'REGISTERED_BUSINESS',
    },
    {
      value: 'GB_CHARITABLE_INCORPORATED_ORGANISATION',
      label: 'Charitable incorporated organisation (CIO)',
      generalOrganizationType: 'OTHER',
    },
  ],
};

const previewArgs: Partial<OnboardingFlowStoryArgs> = {
  ...commonArgs,
  experimental_availableCountriesOfFormation: ['US', 'CN', 'GB'],
  experimental_organizationTypesByCountryOfFormation:
    DEMO_ORGANIZATION_TYPES_BY_COUNTRY,
};

const CHINA_ORGANIZATION_PARTY_ID = '2000000111';

const mockChinaFormedClient: ClientResponse = {
  ...mockClientNew,
  parties: mockClientNew.parties?.map((party) =>
    party.id === CHINA_ORGANIZATION_PARTY_ID && party.organizationDetails
      ? {
          ...party,
          organizationDetails: {
            ...party.organizationDetails,
            // Made-up value; the API's OrganizationType enum has no non-US types yet.
            organizationType:
              'CN_WHOLLY_FOREIGN_OWNED_ENTERPRISE' as unknown as OrganizationType,
            organizationName: 'Big Seller Trading (Shanghai) Co., Ltd.',
            dbaName: 'Big Seller',
            countryOfFormation: 'CN',
            addresses: [
              {
                addressType: 'BUSINESS_ADDRESS',
                addressLines: ['1 Century Avenue'],
                city: 'Shanghai',
                state: 'SH',
                postalCode: '200120',
                country: 'CN',
              },
            ],
            organizationIds: [
              {
                idType: 'BUSINESS_REGISTRATION_ID',
                issuer: 'CN',
                value: '91310000MA1FL1234X',
              },
            ],
          },
        }
      : party
  ),
};

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Country of formation (preview)',
  component: OnboardingFlowTemplate,
  tags: ['@core', '@onboarding'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: defaultHandlers,
    },
    docs: {
      description: {
        component:
          'Experimental preview of onboarding a business formed outside the US. The API does not support this yet; the per-country entity types are made up for the demo.',
      },
    },
  },
  args: {
    ...commonArgsWithCallbacks,
  },
  argTypes: {
    ...commonArgTypes,
    experimental_organizationTypesByCountryOfFormation: {
      control: { type: 'object' as const },
      description:
        'Experimental preview. Entity types offered on the gateway per country of formation.',
      table: {
        category: 'Configuration',
      },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

/**
 * **Gateway: choose a country, then a business type**
 *
 * The gateway asks where the business is registered before asking its type.
 * Try switching countries:
 * - **US** offers the built-in types, including sole proprietorship.
 * - **CN** and **GB** offer only their configured entity types; sole
 *   proprietorship is US-only.
 * - Switching to a country that doesn't offer the selected type clears it.
 *
 * After **Get Started**, Business → Identity shows the country read-only and
 * asks for a business registration ID instead of an EIN.
 */
export const GatewayCountryFirst: Story = {
  name: 'Gateway: country first',
  args: previewArgs,
};

/**
 * **China-formed business in progress**
 *
 * A seeded client registered in China as a wholly foreign-owned enterprise,
 * with a business registration ID instead of an EIN. Open the gateway (change
 * business type) or Business → Identity to see how the country and the
 * host-defined entity type are displayed.
 */
export const ChinaFormedBusiness: Story = {
  name: 'China-formed business',
  loaders: [() => resetAndSeedClient(mockChinaFormedClient, DEFAULT_CLIENT_ID)],
  args: {
    ...previewArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **Feature off (default)**
 *
 * Without `experimental_availableCountriesOfFormation`, the gateway is
 * unchanged: no country question and the built-in business types.
 */
export const FeatureOff: Story = {
  name: 'Feature off (default)',
  args: {
    ...commonArgs,
  },
};
