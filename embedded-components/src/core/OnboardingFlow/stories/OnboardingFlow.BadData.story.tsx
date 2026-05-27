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

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import {
  createMockClientCOOWithDescription,
  createMockClientInvalidEIN,
  createMockClientInvalidJobTitle,
  createMockClientInvalidPostalCode,
  createMockClientInvalidSSN,
  createMockClientInvalidState,
  createMockClientMismatchedAddressCountry,
  createMockClientMultipleIssues,
} from '../fixtures/badApiClient.fixtures';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  DEFAULT_CLIENT_ID,
  defaultHandlers,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

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

// =============================================================================
// JOB TITLE SCENARIOS
// =============================================================================

/**
 * **Invalid Job Title — "Associate"**
 *
 * The API returns `jobTitle: "Associate"` which is not one of the
 * accepted enum values (CEO, CFO, COO, etc.). `validateOnMount`
 * should surface a validation error on the **Personal Details** step
 * so the user can pick a valid title.
 *
 * Navigate to the controller's **Personal Details** step.
 */
export const InvalidJobTitle: Story = {
  loaders: [
    () =>
      resetAndSeedClient(createMockClientInvalidJobTitle(), DEFAULT_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};

/**
 * **COO with Job Title Description**
 *
 * The API returns `jobTitle: "COO"` with
 * `jobTitleDescription: "Top Dog"`. Both values are valid — this
 * story verifies the form correctly pre-populates the title dropdown
 * and the free-text description field.
 *
 * Navigate to the controller's **Personal Details** step.
 */
export const COOWithDescription: Story = {
  loaders: [
    () =>
      resetAndSeedClient(
        createMockClientCOOWithDescription(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
  },
};
