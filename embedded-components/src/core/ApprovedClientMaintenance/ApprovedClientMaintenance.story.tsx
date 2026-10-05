import type { Meta, StoryObj } from '@storybook/react-vite';

import { ApprovedClientMaintenance } from './ApprovedClientMaintenance';
import { LLC_WITH_MIXED_OWNERSHIP } from './stories/support/maintenanceStoryClients';
import {
  maintenanceStoryArgs,
  maintenanceStoryArgTypes,
  maintenanceStoryDecorator,
  withScenario,
  type MaintenanceStoryArgs,
} from './stories/support/maintenanceStoryMeta';

/**
 * Maintenance for an already approved client. The folders below show
 * eligibility matrix configurations, client profiles, maintenance request
 * statuses, and edge cases, all against a stateful mock API.
 */
const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance',
  component: ApprovedClientMaintenance,
  tags: ['autodocs'],
  decorators: [maintenanceStoryDecorator],
  parameters: { layout: 'padded' },
  args: maintenanceStoryArgs,
  argTypes: {
    apiBaseUrl: {
      control: { type: 'text' },
      description: 'API gateway base URL',
      table: { category: 'API Testing' },
    },
    clientId: {
      control: { type: 'text' },
      description: 'Approved client ID to load',
      table: { category: 'API Testing' },
    },
    headers: {
      control: { type: 'object' },
      description: 'Authentication and platform headers',
      table: { category: 'API Testing' },
    },
    ...maintenanceStoryArgTypes,
  },
  render: (args) => <ApprovedClientMaintenance {...args} />,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/**
 * Connects to the configured API without MSW. Set `VITE_API_BASE_URL`,
 * `VITE_API_CLIENT_ID`, and `VITE_API_PLATFORM_ID`, or edit the Controls.
 * Replace the eligibility matrix in Controls with the client's exact
 * country and legal entity configuration.
 */
export const Default: Story = {
  parameters: { msw: { handlers: [] } },
  args: {
    clientId: import.meta.env.VITE_API_CLIENT_ID ?? '',
    headers: {
      platform_id: import.meta.env.VITE_API_PLATFORM_ID ?? '',
    },
  },
};

/** Every operation allowed, on a client with direct and indirect ownership. */
export const Playground: Story = {
  parameters: withScenario({ client: LLC_WITH_MIXED_OWNERSHIP }),
};

/** The same client in a phone-width container. */
export const NarrowProfile: Story = {
  parameters: {
    layout: 'fullscreen',
    ...withScenario({ client: LLC_WITH_MIXED_OWNERSHIP }),
  },
  render: (args) => (
    <div className="eb-mx-auto eb-w-[390px] eb-max-w-full eb-p-3">
      <ApprovedClientMaintenance {...args} />
    </div>
  ),
};
