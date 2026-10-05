import type { Meta, StoryObj } from '@storybook/react-vite';

import { ApprovedClientMaintenance } from '../../ApprovedClientMaintenance';
import { LLC_WITH_DIRECT_OWNERS } from '../support/maintenanceStoryClients';
import {
  maintenanceStoryArgs,
  maintenanceStoryArgTypes,
  maintenanceStoryDecorator,
  withScenario,
  type MaintenanceStoryArgs,
} from '../support/maintenanceStoryMeta';

const meta: Meta<MaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance/Edge cases/Data and API',
  component: ApprovedClientMaintenance,
  decorators: [maintenanceStoryDecorator],
  parameters: { layout: 'padded' },
  args: maintenanceStoryArgs,
  argTypes: maintenanceStoryArgTypes,
  render: (args) => <ApprovedClientMaintenance {...args} />,
};

export default meta;
type Story = StoryObj<MaintenanceStoryArgs>;

/** The client can't be loaded; the component offers a retry. */
export const ClientLoadFailure: Story = {
  parameters: withScenario({
    client: LLC_WITH_DIRECT_OWNERS,
    failClientLoad: true,
  }),
};
