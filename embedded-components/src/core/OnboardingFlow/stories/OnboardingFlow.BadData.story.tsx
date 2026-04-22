/**
 * OnboardingFlow - Bad API Data Handling
 *
 * Stories demonstrating how the onboarding flow handles invalid or
 * inconsistent data returned from the API. These scenarios exercise:
 *
 * - **Data normalization** (Layer 1): Cross-field inconsistencies are
 *   corrected at the API→form boundary in `convertPartyResponseToFormValues`.
 * - **Validate-on-mount** (Layer 2): Single-field validation errors from
 *   pre-populated data are surfaced immediately via `form.trigger()`.
 * - **editableWhenInvalid** (Layer 2b): Readonly fields auto-unlock when
 *   they carry a validation error.
 */

import { efClientSolPropWithMoreData } from '@/mocks/efClientSolPropWithMoreData.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cloneDeep } from 'lodash';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
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

// ============================================================================
// Mock Data — Bad / Inconsistent API Responses
// ============================================================================

/**
 * Sole proprietorship where the controller's address country differs
 * from their countryOfResidence. For sole props the address country is
 * normally readonly (locked to countryOfFormation). The refineSchemaFn
 * on ContactDetailsForm validates that address country === countryOfResidence;
 * when it fails, the readonly field becomes editable so the user can fix it.
 */
function createMockClientMismatchedAddressCountry(): ClientResponse {
  const mock = cloneDeep(efClientSolPropWithMoreData);
  mock.id = DEFAULT_CLIENT_ID;
  const controller = mock.parties?.find((p) =>
    (p as any).roles?.includes('CONTROLLER')
  ) as any;

  if (controller) {
    // countryOfResidence is US, but address says CA
    controller.individualDetails.countryOfResidence = 'US';
    controller.individualDetails.addresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['100 King Street West'],
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5X 1A1',
        country: 'CA',
      },
    ];
  }
  return mock;
}

/**
 * Controller has an invalid EIN-format SSN (too short).
 * validateOnMount should surface the validation error immediately.
 */
function createMockClientInvalidSSN(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as any).roles?.includes('CONTROLLER')
  ) as any;

  if (controller) {
    controller.individualDetails.individualIds = [
      {
        idType: 'SSN',
        issuer: 'US',
        value: '123', // Too short — should be 9 digits
      },
    ];
  }
  return mock;
}

/**
 * Organization has an invalid EIN (too short).
 * validateOnMount should surface the validation error on the business
 * identity step.
 */
function createMockClientInvalidEIN(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const org = mock.parties?.find(
    (p) => (p as any).partyType === 'ORGANIZATION'
  ) as any;

  if (org) {
    org.organizationDetails.organizationIds = [
      {
        idType: 'EIN',
        issuer: 'US',
        value: '12345', // Too short — should be 9 digits
      },
    ];
  }
  return mock;
}

/**
 * Controller has an invalid postal code format for their country.
 */
function createMockClientInvalidPostalCode(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as any).roles?.includes('CONTROLLER')
  ) as any;

  if (controller) {
    controller.individualDetails.addresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['2029 Century Park E'],
        city: 'Los Angeles',
        state: 'CA',
        postalCode: 'ABCDE', // Invalid US postal code
        country: 'US',
      },
    ];
  }
  return mock;
}

/**
 * Controller has an address state that doesn't match any valid US subdivision.
 */
function createMockClientInvalidState(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as any).roles?.includes('CONTROLLER')
  ) as any;

  if (controller) {
    controller.individualDetails.addresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['2029 Century Park E'],
        city: 'Los Angeles',
        state: 'ZZ', // Not a valid US state/territory
        postalCode: '90067',
        country: 'US',
      },
    ];
  }
  return mock;
}

/**
 * Multiple issues at once: mismatched address country, invalid postal code,
 * and invalid SSN.
 */
function createMockClientMultipleIssues(): ClientResponse {
  const mock = cloneDeep(mockClientNew);
  const controller = mock.parties?.find((p) =>
    (p as any).roles?.includes('CONTROLLER')
  ) as any;
  const org = mock.parties?.find(
    (p) => (p as any).partyType === 'ORGANIZATION'
  ) as any;

  if (controller) {
    controller.individualDetails.countryOfResidence = 'US';
    controller.individualDetails.addresses = [
      {
        addressType: 'RESIDENTIAL_ADDRESS',
        addressLines: ['100 King Street West'],
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5X 1A1',
        country: 'CA',
      },
    ];
    controller.individualDetails.individualIds = [
      {
        idType: 'SSN',
        issuer: 'US',
        value: '123',
      },
    ];
  }

  if (org) {
    org.organizationDetails.organizationIds = [
      {
        idType: 'EIN',
        issuer: 'US',
        value: '12',
      },
    ];
  }

  return mock;
}

// ============================================================================
// Story Meta
// ============================================================================

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Bad API Data',
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
// LAYER 1 — DATA NORMALIZATION
// =============================================================================

/**
 * **Mismatched Address Country (Sole Prop)**
 *
 * The API returns `countryOfResidence: "US"` but
 * `addresses[0].country: "CA"` for a sole proprietor controller.
 *
 * Normally the address country is **readonly** for sole props (locked to
 * `countryOfFormation`). The `refineContactDetailsFormSchema` cross-field
 * validation detects the mismatch, and `validateOnMount` surfaces the
 * error immediately. The readonly prop is then lifted so the user can
 * correct the country.
 *
 * Navigate to the controller's **Contact Details** step to see the
 * address country field become editable with a validation error.
 */
export const MismatchedAddressCountry: Story = {
  loaders: [
    () =>
      resetAndSeedClient(
        createMockClientMismatchedAddressCountry(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

// =============================================================================
// LAYER 2 — VALIDATE ON MOUNT (SINGLE-FIELD ERRORS)
// =============================================================================

/**
 * **Invalid SSN**
 *
 * The API returns an SSN that is only 3 digits (should be 9).
 * `validateOnMount` triggers validation on form creation, so the
 * **Identity** step should show the SSN field with an error message
 * immediately — no user interaction required.
 *
 * Navigate to the controller's **Identity** step.
 */
export const InvalidSSN: Story = {
  loaders: [
    () => resetAndSeedClient(createMockClientInvalidSSN(), DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **Invalid EIN**
 *
 * The organization's EIN is only 5 digits (should be 9).
 * The **Business Identity** step should show the EIN field with a
 * validation error on mount.
 *
 * Navigate to the **Business Details** section → **Business Identity** step.
 */
export const InvalidEIN: Story = {
  loaders: [
    () => resetAndSeedClient(createMockClientInvalidEIN(), DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **Invalid Postal Code**
 *
 * The controller's US address has postal code "ABCDE" which doesn't
 * match the US format. The **Contact Details** step should show a
 * validation error on the postal code field on mount.
 */
export const InvalidPostalCode: Story = {
  loaders: [
    () =>
      resetAndSeedClient(
        createMockClientInvalidPostalCode(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **Invalid State Code**
 *
 * The controller's US address has state "ZZ" which is not a valid
 * US subdivision. The **Contact Details** step should show a
 * validation error on the state field on mount.
 */
export const InvalidStateCode: Story = {
  loaders: [
    () => resetAndSeedClient(createMockClientInvalidState(), DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

// =============================================================================
// COMBINED — MULTIPLE ISSUES
// =============================================================================

/**
 * **Multiple Data Issues**
 *
 * Combines several problems in one response:
 * - Address country (CA) mismatches countryOfResidence (US) → normalized
 * - SSN is too short → validation error on Identity step
 * - EIN is too short → validation error on Business Identity step
 *
 * Demonstrates that both layers work together: normalization fixes
 * cross-field issues silently, while validateOnMount surfaces
 * single-field errors for the user to correct.
 */
export const MultipleDataIssues: Story = {
  loaders: [
    () =>
      resetAndSeedClient(createMockClientMultipleIssues(), DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};
