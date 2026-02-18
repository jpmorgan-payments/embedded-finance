/**
 * ClientDetails - Main Entry Point
 *
 * Displays all information for a fully onboarded client from GET /clients/:id.
 *
 * **View Modes:**
 * - `summary` - Compact card with drill-down capability (default)
 * - `accordion` - Full detail view with collapsible sections
 * - `cards` - Visual cards layout in responsive grid
 *
 * **Features:**
 * - i18n support (en-US, es-US, fr-CA)
 * - Loading skeletons per view mode
 * - Section drill-down with navigation
 * - Custom actions support
 *
 * **See Also:**
 * - View Modes/* - Different layout options
 * - States/* - Loading, error, and client status variants
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
 * **Default - Summary View**
 *
 * Compact card showing business overview with clickable sections.
 * Click any section to open drill-down sheet with navigation.
 *
 * See also:
 * - View Modes/* for layout variants
 * - States/* for loading, error, and status variants
 */
export const Default: Story = {
  args: {
    viewMode: 'summary',
    enableDrillDown: true,
  },
};
