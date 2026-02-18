/**
 * ClientDetails - View Modes
 *
 * Showcase of different display modes for client information.
 * Choose the view mode that best fits your use case.
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
  title: 'Core/ClientDetails/View Modes',
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
 * **Summary with Custom Sections**
 *
 * Only display specific sections relevant to your use case.
 * Here we show just identity, verification, and ownership.
 */
export const SummaryCustomSections: Story = {
  name: 'Summary (Custom Sections)',
  args: {
    viewMode: 'summary',
    sections: ['identity', 'verification', 'ownership'],
    enableDrillDown: true,
  },
};

/**
 * **Summary with All Sections**
 *
 * Display all available sections including accounts and activity
 * (placeholders for future integration).
 */
export const SummaryAllSections: Story = {
  name: 'Summary (All Sections)',
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
 * **Summary without Drill-Down**
 *
 * Display-only mode where sections show information but aren't clickable.
 * Useful for compact dashboards or when you handle navigation externally.
 */
export const SummaryNoDrillDown: Story = {
  name: 'Summary (No Drill-Down)',
  args: {
    viewMode: 'summary',
    enableDrillDown: false,
  },
};

/**
 * **Summary with Custom Actions**
 *
 * Add custom action buttons in the card footer for quick actions.
 */
export const SummaryWithActions: Story = {
  name: 'Summary (With Actions)',
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

// =============================================================================
// ACCORDION & CARDS VIEWS
// =============================================================================

/**
 * **Accordion View**
 *
 * Full detail view with collapsible sections.
 * Similar to the onboarding final review step.
 * Best for detailed review or printing.
 */
export const AccordionView: Story = {
  name: 'Accordion',
  args: {
    viewMode: 'accordion',
    title: 'Client details',
  },
};

/**
 * **Cards View**
 *
 * Full detail view with information grouped as visual cards.
 * Responsive grid: 1 column on small screens, 2 on medium+.
 */
export const CardsView: Story = {
  name: 'Cards',
  args: {
    viewMode: 'cards',
    title: 'Client details',
  },
};
