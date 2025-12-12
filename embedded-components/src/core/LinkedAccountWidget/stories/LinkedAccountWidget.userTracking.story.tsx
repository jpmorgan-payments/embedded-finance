/**
 * LinkedAccountWidget - User Journey Tracking Stories
 *
 * These stories demonstrate how userEventsHandler works and what data
 * is passed to RUM/analytics systems. Open the browser console to see
 * the logged events.
 */

import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LinkedAccountWidget } from '../LinkedAccountWidget';
import {
  commonArgs,
  createRecipientHandlers,
  seedRecipientData,
} from './story-utils';

const meta = {
  title: 'Core/LinkedAccountWidget/User Journey Tracking',
  component: LinkedAccountWidget,
  tags: ['@core', '@linked-accounts', '@user-tracking'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'These stories demonstrate user journey tracking for linked accounts. Open the browser console to see what data is passed to RUM/analytics systems when you interact with the component.',
      },
    },
    msw: {
      handlers: createRecipientHandlers(),
    },
  },
  args: {
    ...commonArgs,
    variant: 'default',
  },
} satisfies Meta<typeof LinkedAccountWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic user tracking demonstration.
 * All user interactions are logged to the console with full context.
 *
 * **Try it:**
 * - Click "Link New Account" button
 * - Click "Verify" on a pending account
 * - Click "Remove" on an account
 * - View account details
 *
 * **Check the console** to see the event data that would be sent to your RUM system.
 */
export const BasicTracking: Story = {
  args: {
    userEventsHandler: (context) => {
      console.group('🔍 Linked Account Journey Event');
      console.log('Action Name:', context.actionName);
      console.log('Event Type:', context.eventType);
      console.log('Timestamp:', new Date(context.timestamp).toISOString());
      console.log('Element:', context.element);
      console.log('Metadata:', context.metadata);
      console.groupEnd();
    },
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Simulates Dynatrace integration.
 * Shows how to use the handler with Dynatrace's dtrum API.
 *
 * **Check the console** to see Dynatrace-style action tracking.
 */
export const DynatraceIntegration: Story = {
  args: {
    userEventsHandler: (context) => {
      console.log('📊 Dynatrace Linked Account Event:', {
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
        console.log('🚀 Linked Account Action Started:', context.actionName);
        if (typeof window !== 'undefined' && (window as any).dtrum) {
          return (window as any).dtrum.enterAction(context.actionName);
        }
      },
      onLeave: (context) => {
        console.log('✅ Linked Account Action Completed:', context.actionName);
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
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Simulates Datadog RUM integration.
 * Shows how to use the handler with Datadog's RUM API.
 *
 * **Check the console** to see Datadog-style action tracking.
 */
export const DatadogIntegration: Story = {
  args: {
    userEventsHandler: (context) => {
      console.log('📈 Datadog RUM Linked Account Event:', {
        action: {
          type: 'custom',
          name: context.actionName,
        },
        context: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'LinkedAccountWidget',
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
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};

/**
 * Generic analytics integration example.
 * Shows how to send events to any analytics service.
 *
 * **Check the console** to see analytics-style event tracking.
 */
export const GenericAnalytics: Story = {
  args: {
    userEventsHandler: (context) => {
      const analyticsEvent = {
        event: context.actionName,
        properties: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'LinkedAccountWidget',
          ...context.metadata,
        },
      };

      console.log('📡 Analytics Event:', analyticsEvent);

      // Track account linking success/failure rates
      if (context.actionName === 'linked_account_link_completed') {
        console.log('✅ Account linked successfully:', context.metadata);
      }
      if (context.actionName === 'linked_account_verify_completed') {
        console.log('✅ Account verified successfully:', context.metadata);
      }
    },
  },
  loaders: [
    async () => {
      await seedRecipientData(linkedAccountListMock);
    },
  ],
};
