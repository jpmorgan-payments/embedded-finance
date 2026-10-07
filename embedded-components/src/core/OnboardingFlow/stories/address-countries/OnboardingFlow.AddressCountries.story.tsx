/**
 * OnboardingFlow - Address countries
 *
 * One story per country state / postal-code behavior in `AddressFields`.
 * Each seeds the controller's residential address; open **Your personal
 * details → Contact details** to see the address editor.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { AddressDto, ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  mockClientNew,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from '../story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const CONTROLLER_PARTY_ID = '2000000112';

function withControllerAddress(
  address: Omit<AddressDto, 'addressType'>
): ClientResponse {
  return {
    ...mockClientNew,
    parties: mockClientNew.parties?.map((party) =>
      party.id === CONTROLLER_PARTY_ID && party.individualDetails
        ? {
            ...party,
            individualDetails: {
              ...party.individualDetails,
              countryOfResidence: address.country,
              addresses: [{ addressType: 'RESIDENTIAL_ADDRESS', ...address }],
            },
          }
        : party
    ),
  };
}

function seeded(address: Omit<AddressDto, 'addressType'>): Story {
  return {
    loaders: [
      () =>
        resetAndSeedClient(withControllerAddress(address), DEFAULT_CLIENT_ID),
    ],
    args: {
      ...commonArgs,
      clientId: DEFAULT_CLIENT_ID,
    },
  };
}

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Address countries',
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

/**
 * **State picker + postal code (US)**
 *
 * Baseline: state is chosen from the subdivision list and a ZIP code is
 * required. SMBDO rejects `n/a` as a US or CA postal code.
 */
export const StatePickerAndPostalCode: Story = {
  name: 'State picker + postal code (US)',
  ...seeded({
    addressLines: ['2029 Century Park E'],
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90067',
    country: 'US',
  }),
};

/**
 * **No state, no postal code (HK)**
 *
 * Hong Kong's only subdivision is `HK`, so state is filled in and hidden.
 * HK is also a placeholder-postal country: the postal input is hidden and
 * `n/a` is submitted.
 */
export const NoStateNoPostalCode: Story = {
  name: 'No state, no postal code (HK)',
  ...seeded({
    addressLines: ["1 Queen's Road Central"],
    city: 'Central',
    state: 'HK',
    postalCode: 'n/a',
    country: 'HK',
  }),
};

/**
 * **State picker, no postal code (AE)**
 *
 * AE (and QA) keep the emirate / municipality picker but hide postal code
 * and submit `n/a`.
 */
export const StatePickerNoPostalCode: Story = {
  name: 'State picker, no postal code (AE)',
  ...seeded({
    addressLines: ['1 Sheikh Zayed Road'],
    city: 'Dubai',
    state: 'DU',
    postalCode: 'n/a',
    country: 'AE',
  }),
};

/**
 * **No state, postal code required (SG)**
 *
 * Singapore's only subdivision is `SG`, so state is filled in and hidden,
 * but a postal code is still required. A self-code state does not imply
 * the country has no postal codes.
 */
export const NoStatePostalCode: Story = {
  name: 'No state, postal code required (SG)',
  ...seeded({
    addressLines: ['1 Raffles Place'],
    city: 'Singapore',
    state: 'SG',
    postalCode: '048616',
    country: 'SG',
  }),
};

/**
 * **Prefilled state not in the list (GB `ENG`)**
 *
 * A saved state that is not in the subdivision list stays visible as text so
 * existing data is not silently dropped. Validation flags it on continue;
 * clearing it reveals the picker (e.g. `LND`).
 */
export const UnlistedPrefilledState: Story = {
  name: 'Prefilled state not in list (GB)',
  ...seeded({
    addressLines: ['10 Downing Street'],
    city: 'London',
    state: 'ENG',
    postalCode: 'SW1A 2AA',
    country: 'GB',
  }),
};

/**
 * **No subdivision list (IM)**
 *
 * 15 countries (AX, BL, BQ, CW, GG, IM, JE, ME, MF, PS, RS, SS, SX, TL, UM)
 * have no subdivisions, so state is free text and not validated client-side.
 * SMBDO currently rejects any state for them; this story simulates that
 * 400 response when the address is saved.
 */
export const NoSubdivisionList: Story = {
  name: 'No subdivision list, API rejects state (IM)',
  ...seeded({
    addressLines: ['1 Prospect Hill'],
    city: 'Douglas',
    state: 'DGL',
    postalCode: 'IM1 1ET',
    country: 'IM',
  }),
  parameters: {
    msw: {
      handlers: [
        http.patch('/parties/:partyId', async ({ request }) => {
          const body = (await request.json()) as {
            individualDetails?: { addresses?: unknown[] };
          };
          if (!body.individualDetails?.addresses) return undefined;
          return HttpResponse.json(
            {
              title: 'Bad Request',
              httpStatus: 400,
              context: [
                {
                  code: '10104',
                  field: '$.individualDetails.addresses[0].state',
                  message: 'Invalid state',
                },
              ],
            },
            { status: 400 }
          );
        }),
        ...defaultHandlers,
      ],
    },
  },
};
