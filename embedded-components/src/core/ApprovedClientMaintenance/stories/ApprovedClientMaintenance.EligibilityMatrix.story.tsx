import type { Meta, StoryObj } from '@storybook/react-vite';

import { ApprovedClientMaintenance } from '../ApprovedClientMaintenance';
import { APPROVED_CLIENT_MAINTENANCE_OPERATIONS } from '../ApprovedClientMaintenance.types';
import {
  CANADIAN_CORPORATION,
  eligibilityFor,
  LLC_WITH_MIXED_OWNERSHIP,
} from './support/maintenanceStoryClients';
import {
  maintenanceStoryArgs,
  maintenanceStoryArgTypes,
  maintenanceStoryDecorator,
  withScenario,
  type MaintenanceStoryArgs,
} from './support/maintenanceStoryMeta';

/**
 * One client with a controller who owns directly, an intermediary business,
 * and an owner through it, so each configuration's effect is visible.
 * A missing operation hides its controls; nothing is shown disabled for lack
 * of permission.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Eligibility matrix',
  component: ApprovedClientMaintenance,
  decorators: [maintenanceStoryDecorator],
  parameters: {
    layout: 'padded',
    ...withScenario({ client: LLC_WITH_MIXED_OWNERSHIP }),
  },
  args: maintenanceStoryArgs,
  argTypes: maintenanceStoryArgTypes,
  render: (args) => <ApprovedClientMaintenance {...args} />,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** Every operation is configured. */
export const AllOperations: Story = {
  args: { eligibility: eligibilityFor(APPROVED_CLIENT_MAINTENANCE_OPERATIONS) },
};

/**
 * The business matches a rule that lists no operations. The profile is
 * read-only and says that changes aren't available.
 */
export const NoOperations: Story = {
  args: { eligibility: eligibilityFor([]) },
};

/** Only the Limited DDA Payments upgrade. People and the business are read-only. */
export const ProductUpgradeOnly: Story = {
  args: { eligibility: eligibilityFor(['ADD_LIMITED_DDA_PAYMENTS']) },
};

/**
 * Edit the business and its people, replace the controller, and manage direct
 * owners. Adding an owner skips the direct-or-indirect choice, intermediaries
 * have no actions, and no product upgrade button appears.
 */
export const ProfileOnly: Story = {
  args: { eligibility: eligibilityFor(['MANAGE_PROFILE']) },
};

/**
 * Profile management plus intermediary businesses and the people who own
 * through them. Adding an owner offers both direct and indirect ownership.
 */
export const ProfileWithIndirectOwnership: Story = {
  args: {
    eligibility: eligibilityFor([
      'MANAGE_PROFILE',
      'MANAGE_INDIRECT_OWNERSHIP',
    ]),
  },
};

/**
 * Indirect ownership builds on profile management; configured alone it
 * unlocks nothing.
 */
export const IndirectOwnershipWithoutProfile: Story = {
  args: { eligibility: eligibilityFor(['MANAGE_INDIRECT_OWNERSHIP']) },
};

/** The matrix covers US C corporations only; this Canadian one gets nothing. */
export const CountryNotConfigured: Story = {
  parameters: withScenario({ client: CANADIAN_CORPORATION }),
  args: {
    eligibility: eligibilityFor(
      APPROVED_CLIENT_MAINTENANCE_OPERATIONS,
      'US',
      'C_CORPORATION'
    ),
  },
};

/** The matrix covers US C corporations only; this LLC gets nothing. */
export const OrganizationTypeNotConfigured: Story = {
  args: {
    eligibility: eligibilityFor(
      APPROVED_CLIENT_MAINTENANCE_OPERATIONS,
      'US',
      'C_CORPORATION'
    ),
  },
};
