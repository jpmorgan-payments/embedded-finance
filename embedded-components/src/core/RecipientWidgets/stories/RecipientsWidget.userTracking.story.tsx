/**
 * RecipientsWidget - User Journey Tracking Stories
 *
 * These stories demonstrate how userEventsHandler works and what data
 * is passed to RUM/analytics systems. Open the browser console to see
 * the logged events.
 */

/* eslint-disable no-console */

import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecipientsWidget } from '../RecipientsWidget/RecipientsWidget';
import {
  commonArgs,
  createRecipientHandlers,
  seedRecipientData,
} from './story-utils';

const meta = {
  title: 'Core/RecipientsWidget/User Journey Tracking',
  component: RecipientsWidget,
  tags: ['@core', '@recipients', '@user-tracking'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'These stories demonstrate user journey tracking for recipients. Open the browser console to see what data is passed to RUM/analytics systems when you interact with the component.',
      },
    },
    msw: {
      handlers: createRecipientHandlers({ recipientType: 'RECIPIENT' }),
    },
  },
  args: {
    ...commonArgs,
    mode: 'list',
  },
} satisfies Meta<typeof RecipientsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic user tracking demonstration.
 * All user interactions are logged to the console with full context.
 *
 * **Try it:**
 * - Click "Add New Recipient" button
 * - Click "Remove" on a recipient
 * - View recipient details
 *
 * **Check the console** to see the event data that would be sent to your RUM system.
 */
export const BasicTracking: Story = {
  args: {
    userEventsHandler: (context) => {
      console.group('🔍 Recipient Journey Event');
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
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status:
              r.status === 'MICRODEPOSITS_INITIATED' ? 'ACTIVE' : r.status,
          })) ?? [],
      });
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
      console.log('📊 Dynatrace Recipient Event:', {
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
        console.log('🚀 Recipient Action Started:', context.actionName);
        if (typeof window !== 'undefined' && (window as any).dtrum) {
          return (window as any).dtrum.enterAction(context.actionName);
        }
        return undefined;
      },
      onLeave: (context) => {
        console.log('✅ Recipient Action Completed:', context.actionName);
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
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status:
              r.status === 'MICRODEPOSITS_INITIATED' ? 'ACTIVE' : r.status,
          })) ?? [],
      });
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
      console.log('📈 Datadog RUM Recipient Event:', {
        action: {
          type: 'custom',
          name: context.actionName,
        },
        context: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'RecipientsWidget',
          ...context.metadata,
        },
      });

      if (
        typeof window !== 'undefined' &&
        (window as any).DD_RUM &&
        (window as any).DD_RUM.addAction
      ) {
        (window as any).DD_RUM.addAction(context.actionName, {
          eventType: context.eventType,
          component: 'RecipientsWidget',
          ...context.metadata,
        });
      } else {
        console.log('💡 Datadog RUM not available - this is just a demo');
      }
    },
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status:
              r.status === 'MICRODEPOSITS_INITIATED' ? 'ACTIVE' : r.status,
          })) ?? [],
      });
    },
  ],
};

/**
 * Advanced tracking with custom metadata enrichment.
 * Shows how to add custom business context to events.
 *
 * **Check the console** to see enriched event data.
 */
export const CustomMetadataEnrichment: Story = {
  args: {
    userEventsHandler: (context) => {
      const enrichedContext = {
        ...context,
        customMetadata: {
          userId: 'user-123',
          sessionId: 'session-456',
          feature: 'recipient-management',
          environment: 'storybook',
          version: '1.0.0',
        },
      };

      console.group('🎯 Enriched Recipient Event');
      console.log('Action:', enrichedContext.actionName);
      console.log('Event Type:', enrichedContext.eventType);
      console.log('Original Metadata:', enrichedContext.metadata);
      console.log('Custom Metadata:', enrichedContext.customMetadata);
      console.groupEnd();
    },
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status:
              r.status === 'MICRODEPOSITS_INITIATED' ? 'ACTIVE' : r.status,
          })) ?? [],
      });
    },
  ],
};

/**
 * Error tracking demonstration.
 * Shows how to capture and log error events.
 *
 * **Check the console** to see error event tracking.
 */
export const ErrorTracking: Story = {
  args: {
    userEventsHandler: (context) => {
      console.group('❌ Recipient Error Event');
      console.log('Action Name:', context.actionName);
      console.log('Event Type:', context.eventType);
      console.log('Timestamp:', new Date(context.timestamp).toISOString());
      console.log('Error Details:', context.metadata);
      console.groupEnd();

      // Example: Send to error tracking service
      if (context.eventType === 'error') {
        console.error('🚨 Error occurred in RecipientsWidget:', {
          action: context.actionName,
          metadata: context.metadata,
        });
      }
    },
  },
  loaders: [
    async () => {
      await seedRecipientData({
        ...linkedAccountListMock,
        recipients:
          linkedAccountListMock.recipients?.map((r) => ({
            ...r,
            type: 'RECIPIENT',
            status:
              r.status === 'MICRODEPOSITS_INITIATED' ? 'ACTIVE' : r.status,
          })) ?? [],
      });
    },
  ],
};
