/**
 * ClientDetails - View Modes
 *
 * Different layout options for displaying client information.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@/components/ui/button';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { ClientDetails } from '../ClientDetails';
import type { ClientDetailsProps } from '../ClientDetails.types';
import {
  commonArgs,
  commonArgTypes,
  createClientDetailsHandlers,
} from './story-utils';

type ClientDetailsStoryArgs = Omit<BaseStoryArgs, 'clientId'> &
  ClientDetailsProps;

const meta: Meta<ClientDetailsStoryArgs> = {
  title: 'Beta/ClientDetails/View Modes',
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

// =============================================================================
// SUMMARY VIEW VARIANTS
// =============================================================================

/**
 * **Summary - All Sections**
 *
 * Display all available sections including accounts and activity placeholders.
 */
export const SummaryAllSections: Story = {
  name: 'Summary - All Sections',
  args: {
    viewMode: 'summary',
    sections: [
      'identity',
      'verification',
      'ownership',
      'compliance',
      'accounts',
      'activity',
    ],
    enableDrillDown: true,
  },
};

/**
 * **Summary - With Custom Actions**
 *
 * Add action buttons in the card footer for common operations.
 */
export const SummaryWithActions: Story = {
  name: 'Summary - With Actions',
  args: {
    viewMode: 'summary',
    enableDrillDown: true,
  },
  render: (args) => (
    <div className="eb-max-w-2xl">
      <ClientDetails
        {...args}
        clientId={args.clientId || commonArgs.clientId}
        actions={
          <>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
            <Button variant="default" size="sm">
              Edit Client
            </Button>
          </>
        }
      />
    </div>
  ),
};

/**
 * **Summary - No Drill-Down**
 *
 * Read-only mode where sections display info but aren't clickable.
 */
export const SummaryReadOnly: Story = {
  name: 'Summary - Read Only',
  args: {
    viewMode: 'summary',
    enableDrillDown: false,
  },
};

// =============================================================================
// ACCORDION & CARDS VIEWS
// =============================================================================

/**
 * **Accordion View**
 *
 * Full detail view with collapsible sections.
 * Best for detailed review workflows or printing.
 */
export const AccordionView: Story = {
  args: {
    viewMode: 'accordion',
    title: 'Client Details',
  },
};

/**
 * **Cards View**
 *
 * Visual cards layout in responsive grid (1 col → 2 cols on medium screens).
 */
export const CardsView: Story = {
  args: {
    viewMode: 'cards',
    title: 'Client Details',
  },
};
