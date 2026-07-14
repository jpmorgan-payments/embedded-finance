/**
 * OnboardingFlow — Inline delta mode
 *
 * Same eligibility / entry / attestation as panel delta, but review is an
 * always-expanded compact view with missing fields edited in place (no top panel).
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
  title: 'Core/OnboardingFlow/Inline delta mode',
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
    deltaMode: { enabled: true, variant: 'inline' },
    clientId: DEFAULT_CLIENT_ID,
  },
  argTypes: {
    ...commonArgTypes,
    deltaMode: {
      control: { type: 'object' as const },
      description:
        'Enable distilled delta completion with variant "inline" (always-expanded compact review, in-place missing editors).',
      table: { category: 'Configuration' },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

/**
 * **Operational details + sanctions (inline)**
 *
 * Outstanding Total Annual Revenue (30005) and sanctions (30026). Review shows
 * both as highlighted inline editors under Operational details.
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
    deltaMode: { enabled: true, maxPendingFields: 5, variant: 'inline' },
  },
};

/**
 * **Operational + sanctions + tax IDs (inline)**
 *
 * EIN / SSN / revenue / sanctions missing rows edit in place inside Personal /
 * Business / Operational compact section cards.
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
    deltaMode: { enabled: true, maxPendingFields: 5, variant: 'inline' },
  },
};

/**
 * **Controller birthdate + owner SSNs (inline)**
 *
 * Birthdate and owner SSNs edit under their owner / identity cards; filled
 * values settle to normal read-only rows. Includes outstanding sanctions.
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
    deltaMode: { enabled: true, maxPendingFields: 5, variant: 'inline' },
  },
};
