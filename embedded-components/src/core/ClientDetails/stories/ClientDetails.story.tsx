/**
 * ClientDetails - Stories
 *
 * Displays all information for a fully onboarded ACTIVE client from GET /clients/:id.
 * View modes: accordion (similar to onboarding final review) and cards.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { ClientDetails } from '../ClientDetails';
import type { ClientDetailsProps } from '../ClientDetails.types';
import { createClientDetailsHandlers } from './story-utils';

const CLIENT_ID = '0030000133';

type ClientDetailsStoryArgs = Omit<BaseStoryArgs, 'clientId'> &
  ClientDetailsProps;

const meta: Meta<ClientDetailsStoryArgs> = {
  title: 'Beta/ClientDetails',
  component: ClientDetails,
  tags: ['@core', '@client-details'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createClientDetailsHandlers(),
    },
  },
  args: {
    clientId: CLIENT_ID,
    viewMode: 'accordion',
    title: 'Client details',
  },
  argTypes: {
    clientId: {
      control: 'text',
      description: 'Client ID to fetch (GET /clients/:id)',
    },
    viewMode: {
      control: 'radio',
      options: ['accordion', 'cards'],
      description: 'Display mode',
    },
    title: { control: 'text', description: 'Section title' },
  },
  // Ensure clientId is always passed so the component never shows "Client ID is required"
  render: (args) => (
    <ClientDetails {...args} clientId={args.clientId || CLIENT_ID} />
  ),
};

export default meta;

type Story = StoryObj<ClientDetailsStoryArgs>;

/**
 * Accordion view: sections in collapsible accordion (similar to onboarding final review step).
 * Sections: Client information, Parties, Question responses, Results.
 */
export const AccordionView: Story = {
  name: 'Accordion',
  args: {
    clientId: CLIENT_ID,
    viewMode: 'accordion',
    title: 'Client details',
  },
};

/**
 * Cards view: same information grouped as visual cards.
 * Responsive grid: 1 column on small screens, 2 on md, single column max-width on lg.
 */
export const CardsView: Story = {
  name: 'Cards',
  args: {
    clientId: CLIENT_ID,
    viewMode: 'cards',
    title: 'Client details',
  },
};
