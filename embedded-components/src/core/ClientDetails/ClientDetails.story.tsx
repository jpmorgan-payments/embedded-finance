/**
 * ClientDetails - Main Stories
 *
 * Displays all information for a fully onboarded ACTIVE client from GET /clients/:id.
 * View modes: summary (compact card with drill-down), accordion, and cards.
 *
 * For specialized scenarios, see:
 * - View Modes/* - Summary variants, Accordion, and Cards views
 * - Client Statuses/* - Loading, error, and approval status states
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../.storybook/preview';
import { ClientDetails } from './ClientDetails';
import type { ClientDetailsProps } from './ClientDetails.types';
import {
  commonArgs,
  commonArgTypes,
  createClientDetailsHandlers,
} from './stories/story-utils';

/**
 * Story args interface extending base provider args
 */
type ClientDetailsStoryArgs = Omit<BaseStoryArgs, 'clientId'> &
  ClientDetailsProps;

const meta: Meta<ClientDetailsStoryArgs> = {
  title: 'Core/ClientDetails',
  component: ClientDetails,
  tags: ['@core', '@client-details'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createClientDetailsHandlers(),
    },
  },
  args: {
    ...commonArgs,
  },
  argTypes: {
    ...commonArgTypes,
  },
  render: (args) => (
    <div className="eb-max-w-2xl">
      <ClientDetails
        {...args}
        clientId={args.clientId || commonArgs.clientId}
      />
    </div>
  ),
};

export default meta;
type Story = StoryObj<ClientDetailsStoryArgs>;

/**
 * **Default Summary View**
 *
 * Compact card with quick stats and section navigation.
 * Click on any section to drill down into details via slide-out sheet.
 * Use the navigation at the bottom of the sheet to move between sections.
 */
export const Default: Story = {
  args: {
    viewMode: 'summary',
    enableDrillDown: true,
  },
};
