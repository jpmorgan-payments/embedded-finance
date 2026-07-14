/**
 * OnboardingFlow — Delta mode
 *
 * Distilled completion for pre-created LLC clients with few remaining fields.
 * Opens on review, treats owners as complete, shows missing fields inline,
 * and merges Terms & Conditions into the same screen.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  createDeltaModeBirthdateAndOwnerSsnsClient,
  createDeltaModeOperationalAndTaxIdsClient,
  createDeltaModeOperationalOnlyClient,
  deltaModeTermsStoryArgs,
} from './deltaModeStorySeeds';
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

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Delta mode',
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
    ...deltaModeTermsStoryArgs,
    deltaMode: true,
    clientId: DEFAULT_CLIENT_ID,
  },
  argTypes: {
    ...commonArgTypes,
    deltaMode: {
      control: { type: 'boolean' as const },
      description:
        'Enable distilled delta completion (review-first, owners complete, terms merged). Activates only when pending fields ≤ maxPendingFields (default 5). Default variant is panel.',
      table: { category: 'Configuration' },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

/**
 * **Operational details + sanctions**
 *
 * Pre-created LLC with rich GET client data. Total Annual Revenue (30005) and
 * sanctions (30026) outstanding. Delta mode opens on review with those fields
 * editable, owners marked complete, and Terms combined on the same screen.
 */
export const OperationalDetailsOnly: Story = {
  name: 'Operational details + sanctions',
  loaders: [
    () =>
      resetAndSeedClient(
        createDeltaModeOperationalOnlyClient(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    ...deltaModeTermsStoryArgs,
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5 },
  },
};

/**
 * **Operational + sanctions + tax IDs**
 *
 * Pre-created LLC missing Total Annual Revenue, sanctions, business EIN, and
 * controller SSN. Delta review shows those fields for inline completion, then
 * acknowledgements, with a single Agree and finish action.
 */
export const OperationalDetailsAndTaxIds: Story = {
  name: 'Operational + sanctions + tax IDs',
  loaders: [
    () =>
      resetAndSeedClient(
        createDeltaModeOperationalAndTaxIdsClient(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    ...deltaModeTermsStoryArgs,
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5 },
  },
};

/**
 * **Controller birthdate + owner SSNs**
 *
 * Five pending fields: Total Annual Revenue, sanctions, controller birthdate,
 * and SSN for each of two beneficial owners (Tinker + Wendy).
 */
export const BirthdateAndOwnerSsns: Story = {
  name: 'Controller birthdate + 2 owner SSNs',
  loaders: [
    () =>
      resetAndSeedClient(
        createDeltaModeBirthdateAndOwnerSsnsClient(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    ...deltaModeTermsStoryArgs,
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5 },
  },
};
