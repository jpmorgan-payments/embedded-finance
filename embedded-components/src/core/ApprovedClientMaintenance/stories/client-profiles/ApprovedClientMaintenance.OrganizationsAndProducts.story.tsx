import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import {
  CANADIAN_CORPORATION,
  LLC_WITHOUT_LIMITED_DDA,
  SOLE_PROPRIETORSHIP,
} from '../support/maintenanceStoryClients';
import {
  maintenanceStoryMetaBase,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

/** Organization types, countries, and products that change what's shown. */
const meta: Meta<MaintenanceStoryArgs> = {
  title:
    'Draft/ApprovedClientMaintenance/Client profiles/Organizations and products',
  ...maintenanceStoryMetaBase,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** One person runs the business. As in onboarding, there is no ownership structure. */
export const SoleProprietorship: Story = {
  parameters: withScenario({ client: SOLE_PROPRIETORSHIP }),
};

/** Canadian corporation; people use passports and Canadian addresses. */
export const CanadianCorporation: Story = {
  parameters: withScenario({ client: CANADIAN_CORPORATION }),
};

/**
 * Limited DDA hasn't been added yet. The host supplies
 * `onRequestLimitedDda`; Limited DDA Payments waits until it's approved.
 */
export const WithoutLimitedDda: Story = {
  parameters: withScenario({ client: LLC_WITHOUT_LIMITED_DDA }),
  args: { onRequestLimitedDda: fn() },
};
