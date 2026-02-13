/**
 * ClientDetails - Stories
 *
 * Displays all information for a fully onboarded ACTIVE client from GET /clients/:id.
 * View modes: summary (compact card with drill-down), accordion, and cards.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

// import { fn } from '@storybook/test';

import { Button } from '@/components/ui/button';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { ClientDetails } from '../ClientDetails';
import type { ClientDetailsProps } from '../ClientDetails.types';
import { createClientDetailsHandlers, mockClientDetails } from './story-utils';

const CLIENT_ID = '0030000133';

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
    docs: {
      description: {
        component: `
## ClientDetails Component

A flexible component for displaying client information with three view modes:

### View Modes

| Mode | Description | Best For |
|------|-------------|----------|
| **summary** | Compact card with quick stats and section navigation | Dashboards, overviews |
| **accordion** | Collapsible sections (similar to onboarding review) | Detailed review, printing |
| **cards** | Grid of cards for each section | Visual browsing |

### Summary Mode Features

- **Quick Stats**: Shows owner count and pending items at a glance
- **Section Navigation**: Click sections to drill down into details
- **Sheet Navigation**: Navigate between sections within the detail sheet
- **Refresh**: Reload client data without leaving the view

### Customization

- Choose which sections to display
- Disable drill-down for read-only mode
- Add custom action buttons
- Handle section clicks externally for routing
        `,
      },
    },
  },
  args: {
    clientId: CLIENT_ID,
    viewMode: 'summary',
    title: 'Client details',
    enableDrillDown: true,
  },
  argTypes: {
    clientId: {
      control: 'text',
      description: 'Client ID to fetch (GET /clients/:id)',
    },
    viewMode: {
      control: 'radio',
      options: ['summary', 'accordion', 'cards'],
      description: 'Display mode',
    },
    title: {
      control: 'text',
      description: 'Section title (not used in summary mode)',
    },
    enableDrillDown: {
      control: 'boolean',
      description:
        'Enable drill-down sheets when clicking sections (summary mode)',
    },
    sections: {
      control: 'check',
      options: [
        'identity',
        'verification',
        'ownership',
        'compliance',
        'accounts',
        'activity',
      ],
      description: 'Which sections to display (summary mode)',
    },
    onSectionClick: {
      description: 'Callback when a section is clicked (overrides drill-down)',
    },
  },
  render: (args) => (
    <div className="eb-max-w-2xl">
      <ClientDetails {...args} clientId={args.clientId || CLIENT_ID} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<ClientDetailsStoryArgs>;

// =============================================================================
// SUMMARY VIEW STORIES
// =============================================================================

/**
 * **Default Summary View**
 *
 * Compact card with quick stats and section navigation.
 * Click on any section to drill down into details via slide-out sheet.
 * Use the navigation at the bottom of the sheet to move between sections.
 */
export const SummaryView: Story = {
  name: 'Default',
  args: {
    clientId: CLIENT_ID,
    viewMode: 'summary',
    enableDrillDown: true,
  },
};

/**
 * **Summary with Custom Sections**
 *
 * Only display specific sections relevant to your use case.
 * Here we show just identity, verification, and ownership.
 */
export const SummaryCustomSections: Story = {
  name: 'Summary (Custom Sections)',
  args: {
    clientId: CLIENT_ID,
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
    clientId: CLIENT_ID,
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
    clientId: CLIENT_ID,
    viewMode: 'summary',
    enableDrillDown: false,
  },
};

/**
 * **Summary with External Handler**
 *
 * When you provide `onSectionClick`, drill-down is disabled and you handle
 * navigation yourself. Useful for routing to dedicated pages.
 */
export const SummaryWithExternalHandler: Story = {
  name: 'Summary (External Handler)',
  args: {
    clientId: CLIENT_ID,
    viewMode: 'summary',
    // onSectionClick: fn((section: ClientSection) => {
    //   // eslint-disable-next-line no-console
    //   console.log(`Navigate to /client/${CLIENT_ID}/${section}`);
    // }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click sections to see the action logged. In a real app, you would navigate to a dedicated page.',
      },
    },
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
    clientId: CLIENT_ID,
    viewMode: 'summary',
    enableDrillDown: true,
  },
  render: (args) => (
    <div className="eb-max-w-2xl">
      <ClientDetails
        {...args}
        clientId={args.clientId || CLIENT_ID}
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
// ACCORDION & CARDS VIEW STORIES
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
    clientId: CLIENT_ID,
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
    clientId: CLIENT_ID,
    viewMode: 'cards',
    title: 'Client details',
  },
};

// =============================================================================
// STATE STORIES
// =============================================================================

/**
 * **Loading State**
 *
 * Shows skeleton loading state while fetching client data.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({ delayMs: 60000 }),
    },
  },
  args: {
    clientId: CLIENT_ID,
    viewMode: 'summary',
  },
};

/**
 * **Error State**
 *
 * Shows error message when client fetch fails.
 */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({ status: 404 }),
    },
  },
  args: {
    clientId: 'invalid-id',
    viewMode: 'summary',
  },
};

/**
 * **Client Status: In Review**
 *
 * Shows how the component displays when client is under review.
 */
export const StatusInReview: Story = {
  name: 'Status: In Review',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({
        client: {
          ...mockClientDetails,
          status: 'REVIEW_IN_PROGRESS',
          results: {
            customerIdentityStatus: 'REVIEW_IN_PROGRESS',
          },
        },
      }),
    },
  },
  args: {
    clientId: CLIENT_ID,
    viewMode: 'summary',
  },
};

/**
 * **Client Status: Information Requested**
 *
 * Shows warning indicators when additional information is needed.
 */
export const StatusInfoRequested: Story = {
  name: 'Status: Info Requested',
  parameters: {
    msw: {
      handlers: createClientDetailsHandlers({
        client: {
          ...mockClientDetails,
          status: 'INFORMATION_REQUESTED',
          results: {
            customerIdentityStatus: 'INFORMATION_REQUESTED',
          },
          outstanding: {
            documentRequestIds: ['doc-1', 'doc-2'],
            questionIds: ['q-1'],
            partyIds: [],
            partyRoles: [],
          },
        },
      }),
    },
  },
  args: {
    clientId: CLIENT_ID,
    viewMode: 'summary',
  },
};
