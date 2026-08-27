/**
 * OnboardingFlow — Readonly fields story
 *
 * Illustrates the `readonlyFields` prop: hosts can lock selected fields so users
 * cannot edit data that is authoritative in the host's own systems, while still
 * completing anything genuinely missing.
 *
 * Both stories resume a prepopulated LLC (Neverland Books) and land on the
 * **Business** section so the locked business fields are visible immediately.
 */

import { efClientOperator80Mock } from '@/mocks/efClientOperator80.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { type ClientResponse } from '@/api/generated/smbdo.schemas';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import type { OnboardingFlowProps } from '../types/onboarding.types';
import {
  commonArgs,
  commonArgsWithCallbacks,
  commonArgTypes,
  defaultHandlers,
  OnboardingFlowTemplate,
  resetAndSeedClient,
} from './story-utils';

type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

// ============================================================================
// Mock Data
// ============================================================================

const PREPOPULATED_CLIENT_ID = '3100006997';

const mockClientOperator80: ClientResponse = {
  ...efClientOperator80Mock,
};

/**
 * Sample business-section field list for the content fragment / CFA config.
 * These are root field-map keys (see `src/core/OnboardingFlow/config/fieldMap.ts`):
 * - `organizationTypeHierarchy` — Business Type / Legal Structure
 * - `organizationName`          — Business Name
 * - `dbaName`                   — DBA Name
 * - `organizationIdEin`         — EIN
 * - `organizationDescription`   — Business Description
 * - `industry`                  — NAICS
 * - `organizationAddress`       — Registered Address (locks every sub-input)
 */
const BUSINESS_READONLY_FIELDS = [
  'organizationTypeHierarchy',
  'organizationName',
  'dbaName',
  'organizationIdEin',
  'organizationDescription',
  'industry',
  'organizationAddress',
] as const;

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/Readonly Fields',
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
    readonlyFields: {
      control: { type: 'object' as const },
      description:
        'Locks selected fields to read-only. `fields` are root field-map keys; ' +
        '`mode` is `whenPopulated` (default) or `always`.',
      table: { category: 'Configuration' },
    },
  },
  render: (args) => <OnboardingFlowTemplate {...args} />,
};

export default meta;
type Story = StoryObj<OnboardingFlowStoryArgs>;

// =============================================================================
// READONLY FIELDS STORIES
// =============================================================================

/**
 * **Lock populated business fields (`mode: 'whenPopulated'`, default)**
 *
 * The client already has Business Type, Business Name, DBA, Business
 * Description, NAICS and Registered Address on file, so those render
 * **read-only**. The **EIN** is required but missing from the GET client, so it
 * stays **editable** — the user can still complete onboarding.
 *
 * Open the **Business** section (Business identity → Industry → Contact info) to
 * see the locked fields.
 */
export const WhenPopulated: Story = {
  name: 'Lock populated fields (default)',
  loaders: [
    () => resetAndSeedClient(mockClientOperator80, PREPOPULATED_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: PREPOPULATED_CLIENT_ID,
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    flowEntry: {
      screenId: 'business-section',
      stepperStepId: 'business-identity',
    },
    readonlyFields: {
      fields: [...BUSINESS_READONLY_FIELDS],
      mode: 'whenPopulated',
    },
  },
};

/**
 * **Always lock the listed fields (`mode: 'always'`)**
 *
 * Every listed field renders **read-only** regardless of value or whether it is
 * required — so the **EIN** is locked too, even though it is empty. Use this
 * when the host owns these fields entirely and never wants them edited here.
 */
export const AlwaysLocked: Story = {
  name: 'Always lock listed fields',
  loaders: [
    () => resetAndSeedClient(mockClientOperator80, PREPOPULATED_CLIENT_ID),
  ],
  args: {
    ...commonArgs,
    clientId: PREPOPULATED_CLIENT_ID,
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    flowEntry: {
      screenId: 'business-section',
      stepperStepId: 'business-identity',
    },
    readonlyFields: {
      fields: [...BUSINESS_READONLY_FIELDS],
      mode: 'always',
    },
  },
};
