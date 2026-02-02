/**
 * Recipients - User Journey Tracking Stories
 *
 * These stories demonstrate how userEventsHandler works and what data
 * is passed to RUM/analytics systems. Open the browser console to see
 * the logged events.
 */

/* eslint-disable no-console */

import { mockRecipientsResponse } from '@/mocks/recipients.mock';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { Recipients } from '../Recipients';
import type { RecipientsProps } from '../Recipients.types';

const meta: Meta<RecipientsProps & BaseStoryArgs> = {
  title: 'Legacy/Recipients/User Journey Tracking',
  component: Recipients,
  tags: ['@legacy', '@recipients', '@user-tracking'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'These stories demonstrate user journey tracking. Open the browser console to see what data is passed to RUM/analytics systems when you interact with the component.',
      },
    },
    msw: {
      handlers: [
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
      ],
    },
  },
  args: {
    apiBaseUrl: 'https://api.example.com',
    clientId: 'client-001',
    showCreateButton: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic user tracking demonstration.
 * All user interactions are logged to the console with full context.
 *
 * **Try it:**
 * - Click "Add Recipient" button
 * - Click "Details" or "Edit" on any recipient
 * - Search for recipients
 * - Change filters
 * - Navigate pages
 *
 * **Check the console** to see the event data that would be sent to your RUM system.
 */
export const BasicTracking: Story = {
  args: {
    userEventsHandler: (context) => {
      console.group('🔍 User Journey Event');
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
 *
 * **Check the console** to see Dynatrace-style action tracking.
 */
export const DynatraceIntegration: Story = {
  args: {
    userEventsHandler: (context) => {
      console.log('📊 Dynatrace Event:', {
        actionName: context.actionName,
        timestamp: context.timestamp,
        metadata: context.metadata,
      });

      // Simulate Dynatrace integration
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
        console.log('🚀 Action Started:', context.actionName);
        if (typeof window !== 'undefined' && (window as any).dtrum) {
          return (window as any).dtrum.enterAction(context.actionName);
        }
        return undefined;
      },
      onLeave: (context) => {
        console.log('✅ Action Completed:', context.actionName);
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
 *
 * **Check the console** to see Datadog-style action tracking.
 */
export const DatadogIntegration: Story = {
  args: {
    userEventsHandler: (context) => {
      console.log('📈 Datadog RUM Event:', {
        action: {
          type: 'custom',
          name: context.actionName,
        },
        context: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          ...context.metadata,
        },
      });

      // Simulate Datadog integration
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
          component: 'Recipients',
          ...context.metadata,
        },
      };

      console.log('📡 Analytics Event:', analyticsEvent);

      // Simulate sending to analytics service
      // In real implementation, you would do:
      // analytics.track(analyticsEvent.event, analyticsEvent.properties);
      // or
      // gtag('event', analyticsEvent.event, analyticsEvent.properties);
    },
  },
};

/**
 * Comprehensive tracking with error handling.
 * Shows how to handle errors gracefully in your tracking implementation.
 */
export const WithErrorHandling: Story = {
  args: {
    userEventsHandler: (context) => {
      try {
        console.log('✅ Successfully tracked:', context.actionName);

        // Simulate analytics call that might fail
        // In real implementation, wrap your analytics call in try-catch
        if (Math.random() > 0.9) {
          throw new Error('Simulated analytics error');
        }

        console.log('📊 Event data:', {
          actionName: context.actionName,
          eventType: context.eventType,
          timestamp: context.timestamp,
          metadata: context.metadata,
        });
      } catch (error) {
        console.error('❌ Error tracking event:', error);
        // Don't break the component - errors are handled gracefully
      }
    },
  },
};
