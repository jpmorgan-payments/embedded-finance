import type { Meta, StoryObj } from '@storybook/react-vite';

import { BeneficialOwner } from '../IndirectOwnership.types';
import {
  commonArgs,
  commonArgTypes,
  IndirectOwnershipStory,
} from './story-utils';

const meta = {
  title: 'Core/IndirectOwnership',
  component: IndirectOwnershipStory,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Streamlined beneficial ownership structure building with real-time validation and interactive ownership management.'
      }
    }
  },
  tags: ['autodocs'],
  args: commonArgs,
  argTypes: commonArgTypes,
} satisfies Meta<typeof IndirectOwnershipStory>;

export default meta;
type Story = StoryObj<typeof IndirectOwnershipStory>;

// Sample owners for stories matching the requested character examples
const monicaGeller: BeneficialOwner = {
  id: 'monica-001',
  firstName: 'Monica',
  lastName: 'Geller',
  ownershipType: 'DIRECT',
  status: 'COMPLETE',
  meets25PercentThreshold: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const rossGeller: BeneficialOwner = {
  id: 'ross-001', 
  firstName: 'Ross',
  lastName: 'Geller',
  ownershipType: 'INDIRECT',
  status: 'COMPLETE',
  meets25PercentThreshold: true,
  ownershipHierarchy: {
    id: 'hierarchy-ross-001',
    steps: [
      {
        id: 'step-1',
        entityName: 'Central Perk Coffee',
        entityType: 'COMPANY' as const,
        hasOwnership: true,
        ownsRootBusinessDirectly: true,
        level: 1,
        metadata: {
          ownershipPercentage: 25,
          verificationStatus: 'VERIFIED' as const
        }
      }
    ],
    isValid: true,
    meets25PercentThreshold: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const rachelGreen: BeneficialOwner = {
  id: 'rachel-001',
  firstName: 'Rachel',
  lastName: 'Green',
  ownershipType: 'INDIRECT',
  status: 'COMPLETE',
  meets25PercentThreshold: false,
  ownershipHierarchy: {
    id: 'hierarchy-rachel-001',
    steps: [
      {
        id: 'step-1',
        entityName: 'Cookie Co.',
        entityType: 'COMPANY' as const,
        hasOwnership: true,
        ownsRootBusinessDirectly: false,
        level: 1,
        metadata: {
          ownershipPercentage: 20,
          verificationStatus: 'VERIFIED' as const
        }
      },
      {
        id: 'step-2',
        entityName: 'Central Perk Cookie',
        entityType: 'COMPANY' as const,
        hasOwnership: true,
        ownsRootBusinessDirectly: true,
        level: 2,
        metadata: {
          ownershipPercentage: 20,
          verificationStatus: 'VERIFIED' as const
        }
      }
    ],
    isValid: true,
    meets25PercentThreshold: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  createdAt: new Date(),
  updatedAt: new Date()
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
 * Pending state story showing an indirect owner waiting for ownership hierarchy.
 * Demonstrates the workflow to build ownership chain with "Build Ownership Hierarchy" button.
 */
export const ErrorState: Story = {
  args: {
    rootCompanyName: 'Central Perk Coffee & Cookies',
    initialOwners: [
      {
        id: 'pending-001',
        firstName: 'Ross',
        lastName: 'Geller',
        ownershipType: 'INDIRECT',
        status: 'PENDING_HIERARCHY',
        meets25PercentThreshold: undefined, // Will be determined after hierarchy is built
        createdAt: new Date(),
        updatedAt: new Date()
        // Note: No ownershipHierarchy property - user needs to build it
      }
    ],
    readOnly: false,
    testId: 'indirect-ownership-pending'
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