import type { Meta, StoryObj } from '@storybook/react-vite';

import { IndirectOwnership } from '../IndirectOwnership';
// Import OpenAPI-aligned mocks for proper integration
import {
  efClientEmptyOwnership,
  efClientPendingHierarchy,
  efClientWithOwnershipStructure,
} from '../mocks';

// Create mock clients with different states
const mockClientWithOwners = efClientWithOwnershipStructure;
const mockEmptyClient = efClientEmptyOwnership;

const meta = {
  title: 'Beta/IndirectOwnership',
  component: IndirectOwnership,
  tags: ['@core', '@indirect-ownership'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Streamlined beneficial ownership structure building with real-time validation and interactive ownership management.',
      },
    },
  },
  argTypes: {
    client: {
      control: { type: 'object' },
      description: 'Client data with ownership structure',
    },
    readOnly: {
      control: { type: 'boolean' },
      description: 'Whether the component is in read-only mode',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    onOwnershipComplete: { action: 'onOwnershipComplete' },
    onValidationChange: { action: 'onValidationChange' },
  },
} satisfies Meta<typeof IndirectOwnership>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock clients now provide proper OpenAPI-aligned sample data

/**
 * Default story demonstrating completed ownership structure using OpenAPI mocks.
 * Shows multiple beneficial owners with proper validation and hierarchy status.
 */
export const Default: Story = {
  args: {
    client: mockClientWithOwners,
    readOnly: false,
    testId: 'indirect-ownership-default',
  },
};

/**
 * Empty state story showing the component when no owners have been added yet.
 * Demonstrates the initial state with validation messages and add owner workflow.
 */
export const EmptyState: Story = {
  args: {
    client: mockEmptyClient,
    readOnly: false,
    testId: 'indirect-ownership-empty',
  },
};

/**
 * Pending hierarchy story showing indirect owners that need hierarchy building.
 * Demonstrates the warning badge and PENDING_HIERARCHY status.
 */
export const PendingHierarchy: Story = {
  args: {
    client: efClientPendingHierarchy,
    readOnly: false,
    testId: 'indirect-ownership-pending',
  },
};

/**
 * Read-only view of a completed ownership structure.
 * Shows the component in a non-editable state for review purposes.
 */
export const ReadOnly: Story = {
  args: {
    client: mockClientWithOwners,
    readOnly: true,
    testId: 'indirect-ownership-readonly',
  },
};
