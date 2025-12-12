/**
 * IndirectOwnership - User Journey Tracking Stories
 *
 * These stories demonstrate how userEventsHandler works and what data
 * is passed to RUM/analytics systems. Open the browser console to see
 * the logged events.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { IndirectOwnership } from '../IndirectOwnership';
import type { IndirectOwnershipProps } from '../IndirectOwnership.types';

const mockClient = {
  id: 'client-001',
  parties: [
    {
      id: 'party-1',
      partyType: 'ORGANIZATION',
      roles: ['BENEFICIAL_OWNER'],
      organizationDetails: {
        legalName: 'Acme Corp',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    },
  ],
};

const meta: Meta<IndirectOwnershipProps & BaseStoryArgs> = {
  title: 'Core/IndirectOwnership/User Journey Tracking',
  component: IndirectOwnership,
  tags: ['@core', '@indirect-ownership', '@user-tracking'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'These stories demonstrate user journey tracking for indirect ownership management. Open the browser console to see what data is passed to RUM/analytics systems when you interact with the component.',
      },
    },
  },
  args: {
    apiBaseUrl: 'https://api.example.com',
    client: mockClient as any,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic user tracking demonstration.
 * All user interactions are logged to the console with full context.
 *
 * **Try it:**
 * - Click "Add Owner" button
 * - Edit an existing owner
 * - Remove an owner
 * - View ownership structure
 *
 * **Check the console** to see the event data that would be sent to your RUM system.
 */
export const BasicTracking: Story = {
  args: {
    userEventsHandler: (context) => {
      console.group('🔍 Ownership Journey Event');
      console.log('Action Name:', context.actionName);
      console.log('Event Type:', context.eventType);
      console.log('Timestamp:', new Date(context.timestamp).toISOString());
      console.log('Element:', context.element);
      console.log('Metadata:', context.metadata);
      console.groupEnd();
    },
  },
};

/**
 * Simulates Dynatrace integration.
 * Shows how to use the handler with Dynatrace's dtrum API.
 */
export const DynatraceIntegration: Story = {
  args: {
    userEventsHandler: (context) => {
      console.log('📊 Dynatrace Ownership Event:', {
        actionName: context.actionName,
        timestamp: context.timestamp,
        metadata: context.metadata,
      });

      if (typeof window !== 'undefined' && (window as any).dtrum) {
        const actionId = (window as any).dtrum.enterAction(context.actionName);
        console.log('Dynatrace Action ID:', actionId);
        setTimeout(() => {
          (window as any).dtrum.leaveAction(actionId);
        }, 100);
      } else {
        console.log('💡 Dynatrace not available - this is just a demo');
      }
    },
    userEventsLifecycle: {
      onEnter: (context) => {
        console.log('🚀 Ownership Action Started:', context.actionName);
        if (typeof window !== 'undefined' && (window as any).dtrum) {
          return (window as any).dtrum.enterAction(context.actionName);
        }
      },
      onLeave: (context) => {
        console.log('✅ Ownership Action Completed:', context.actionName);
        if (
          typeof window !== 'undefined' &&
          (window as any).dtrum &&
          context.actionId
        ) {
          (window as any).dtrum.leaveAction(context.actionId);
        }
      },
    },
  },
};

/**
 * Simulates Datadog RUM integration.
 * Shows how to use the handler with Datadog's RUM API.
 */
export const DatadogIntegration: Story = {
  args: {
    userEventsHandler: (context) => {
      console.log('📈 Datadog RUM Ownership Event:', {
        action: {
          type: 'custom',
          name: context.actionName,
        },
        context: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'IndirectOwnership',
          ...context.metadata,
        },
      });

      if (typeof window !== 'undefined' && (window as any).datadogRum) {
        (window as any).datadogRum.addAction(context.actionName, {
          eventType: context.eventType,
          timestamp: context.timestamp,
          ...context.metadata,
        });
      } else {
        console.log('💡 Datadog RUM not available - this is just a demo');
      }
    },
  },
};

/**
 * Generic analytics integration example.
 * Shows how to send events to any analytics service.
 */
export const GenericAnalytics: Story = {
  args: {
    userEventsHandler: (context) => {
      const analyticsEvent = {
        event: context.actionName,
        properties: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'IndirectOwnership',
          ...context.metadata,
        },
      };

      console.log('📡 Analytics Event:', analyticsEvent);

      // Track ownership management actions
      if (context.actionName === 'ownership_add_owner_completed') {
        console.log('✅ Owner added successfully:', context.metadata);
      }
      if (context.actionName === 'ownership_edit_owner_completed') {
        console.log('✅ Owner updated successfully:', context.metadata);
      }
      if (context.actionName === 'ownership_remove_owner_completed') {
        console.log('✅ Owner removed successfully:', context.metadata);
      }
    },
  },
};
