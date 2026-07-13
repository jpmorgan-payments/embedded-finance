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
 * **Operational details only (inline)**
 *
 * Same seed as panel delta. Review shows all sections expanded; Total Annual
 * Revenue appears as an inline editor in Operational details (no top panel).
 */
export const OperationalDetailsOnly: Story = {
  name: 'Operational details only',
  loaders: [
    () =>
      resetAndSeedClient(
        createDeltaModeOperationalOnlyClient(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5, variant: 'inline' },
  },
};

/**
 * **Operational details + tax IDs (inline)**
 *
 * EIN / SSN / revenue missing rows edit in place inside Personal / Business /
 * Operational compact section cards.
 */
export const OperationalDetailsAndTaxIds: Story = {
  name: 'Operational details + tax IDs (business & controller)',
  loaders: [
    () =>
      resetAndSeedClient(
        createDeltaModeOperationalAndTaxIdsClient(),
        DEFAULT_CLIENT_ID
      ),
  ],
  args: {
    ...commonArgs,
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5, variant: 'inline' },
  },
};

/**
 * **Controller birthdate + owner SSNs (inline)**
 *
 * Birthdate and owner SSNs edit under their owner / identity cards; filled
 * values settle to normal read-only rows.
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
    clientId: DEFAULT_CLIENT_ID,
    deltaMode: { enabled: true, maxPendingFields: 5, variant: 'inline' },
  },
};
