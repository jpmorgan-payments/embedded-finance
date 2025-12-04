import type { Meta, StoryObj } from '@storybook/react-vite';

import { IndirectOwnership } from '../IndirectOwnership';
import { BeneficialOwner } from '../IndirectOwnership.types';

const meta = {
  title: 'Core/IndirectOwnership',
  component: IndirectOwnership,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Streamlined beneficial ownership structure building with real-time validation and interactive ownership management.'
      }
    },
    // Use Salt theme to match LinkedAccountWidget
    themes: {
      default: 'salt'
    }
  },
  tags: ['autodocs'],
  argTypes: {
    rootCompanyName: {
      control: 'text',
      description: 'Name of the company being onboarded'
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the component is in read-only mode'
    },
    initialOwners: {
      control: 'object',
      description: 'Pre-populated beneficial owners for editing scenarios'
    }
  },
  args: {
    onOwnershipComplete: (structure) => console.log('Ownership completed:', structure),
    onValidationChange: (summary) => console.log('Validation changed:', summary),
  },
} satisfies Meta<typeof IndirectOwnership>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample owners for stories matching the requested character examples
const monicaGeller: BeneficialOwner = {
  id: 'monica-001',
  name: 'Monica Geller',
  type: 'individual',
  ownershipPercentage: 55,
  isDirectOwner: true,
  firstName: 'Monica',
  lastName: 'Geller'
};

const rossGeller: BeneficialOwner = {
  id: 'ross-001', 
  name: 'Ross Geller',
  type: 'individual',
  ownershipPercentage: 25,
  isDirectOwner: false,
  firstName: 'Ross',
  lastName: 'Geller'
};

const rachelGreen: BeneficialOwner = {
  id: 'rachel-001',
  name: 'Rachel Green', 
  type: 'individual',
  ownershipPercentage: 20,
  isDirectOwner: false,
  firstName: 'Rachel',
  lastName: 'Green'
};

/**
 * Default story illustrating the beneficial ownership structure with:
 * - Monica Geller (direct owner): 55%
 * - Ross Geller (indirect owner): 25%
 * - Rachel Green (indirect owner): 20%
 * 
 * This demonstrates a complete, valid ownership structure totaling 100%.
 */
export const Default: Story = {
  args: {
    rootCompanyName: 'Central Perk Coffee & Cookies',
    initialOwners: [monicaGeller, rossGeller, rachelGreen],
    readOnly: false,
    testId: 'indirect-ownership-default'
  },
};

/**
 * Empty state story showing the component when no owners have been added yet.
 * Demonstrates the initial state with validation messages and add owner workflow.
 */
export const EmptyState: Story = {
  args: {
    rootCompanyName: 'Central Perk Coffee & Cookies', 
    initialOwners: [],
    readOnly: false,
    testId: 'indirect-ownership-empty'
  },
};

/**
 * Error state story showing validation issues with incomplete ownership structure.
 * Demonstrates validation feedback when ownership doesn't total 100%.
 */
export const ErrorState: Story = {
  args: {
    rootCompanyName: 'Central Perk Coffee & Cookies',
    initialOwners: [
      {
        id: 'incomplete-001',
        name: 'Monica Geller',
        type: 'individual',
        ownershipPercentage: 75, // Not 100%, creating validation error
        isDirectOwner: true,
        firstName: 'Monica', 
        lastName: 'Geller'
      }
    ],
    readOnly: false,
    testId: 'indirect-ownership-error'
  },
};

/**
 * Read-only view of a completed ownership structure.
 * Shows the component in a non-editable state for review purposes.
 */
export const ReadOnly: Story = {
  args: {
    rootCompanyName: 'Central Perk Coffee & Cookies',
    initialOwners: [monicaGeller, rossGeller, rachelGreen],
    readOnly: true,
    testId: 'indirect-ownership-readonly'
  },
};
