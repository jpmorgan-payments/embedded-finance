import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ApprovedClientMaintenance } from '../ApprovedClientMaintenance';
import {
  CANADIAN_CORPORATION,
  CORPORATION_AT_OWNER_LIMIT,
  LLC_WITH_DIRECT_OWNERS,
  LLC_WITH_MIXED_OWNERSHIP,
  LLC_WITHOUT_LIMITED_DDA,
  NON_PROFIT_WITHOUT_OWNERS,
  PARTNERSHIP_WITH_INTERMEDIARY_CHAIN,
  SOLE_PROPRIETORSHIP,
} from './support/maintenanceStoryClients';
import {
  maintenanceStoryArgs,
  maintenanceStoryArgTypes,
  maintenanceStoryDecorator,
  withScenario,
  type MaintenanceStoryArgs,
} from './support/maintenanceStoryMeta';

/**
 * Approved clients with no maintenance request, covering different organization
 * types, controllers, and ownership structures. Every operation is allowed,
 * so each profile can be changed freely.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Client profiles',
  component: ApprovedClientMaintenance,
  decorators: [maintenanceStoryDecorator],
  parameters: { layout: 'padded' },
  args: maintenanceStoryArgs,
  argTypes: maintenanceStoryArgTypes,
  render: (args) => <ApprovedClientMaintenance {...args} />,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** LLC whose controller is also a direct owner, plus a second direct owner. */
export const LlcWithDirectOwners: Story = {
  parameters: withScenario({ client: LLC_WITH_DIRECT_OWNERS }),
};

/** One person runs the business. As in onboarding, there is no ownership structure. */
export const SoleProprietorship: Story = {
  parameters: withScenario({ client: SOLE_PROPRIETORSHIP }),
};

/**
 * The controller owns nothing, and four direct owners reach the limit, so
 * Add beneficial owner is disabled with an explanation.
 */
export const CorporationAtOwnerLimit: Story = {
  parameters: withScenario({ client: CORPORATION_AT_OWNER_LIMIT }),
};

/** Owners hold their stakes through two levels of intermediary businesses. */
export const PartnershipWithIntermediaryChain: Story = {
  parameters: withScenario({ client: PARTNERSHIP_WITH_INTERMEDIARY_CHAIN }),
};

/** A controller who owns directly, next to an intermediary with its own owner. */
export const MixedDirectAndIndirectOwnership: Story = {
  parameters: withScenario({ client: LLC_WITH_MIXED_OWNERSHIP }),
};

/** Nobody owns 25% or more, so the controller is the only related party. */
export const NonProfitWithoutOwners: Story = {
  parameters: withScenario({ client: NON_PROFIT_WITHOUT_OWNERS }),
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
