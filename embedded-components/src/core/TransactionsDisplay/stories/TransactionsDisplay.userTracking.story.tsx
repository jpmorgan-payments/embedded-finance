/**
 * TransactionsDisplay - User Journey Tracking Stories
 *
 * These stories demonstrate how userEventsHandler works and what data
 * is passed to RUM/analytics systems. Open the browser console to see
 * the logged events.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { TransactionsDisplay } from '../TransactionsDisplay';
import type { TransactionsDisplayProps } from '../TransactionsDisplay.types';

const mockTransactionsResponse = {
  items: [
    {
      id: 'txn-1',
      amount: { value: '100.00', currency: 'USD' },
      status: 'COMPLETED',
      paymentDate: '2025-01-15T10:00:00Z',
      transactionReferenceId: 'REF-001',
      recipient: {
        partyDetails: {
          type: 'INDIVIDUAL',
          individualDetails: { firstName: 'John', lastName: 'Doe' },
        },
      },
    },
    {
      id: 'txn-2',
      amount: { value: '250.50', currency: 'USD' },
      status: 'PENDING',
      paymentDate: '2025-01-14T15:30:00Z',
      transactionReferenceId: 'REF-002',
      recipient: {
        partyDetails: {
          type: 'ORGANIZATION',
          organizationDetails: { legalName: 'Acme Corp' },
        },
      },
    },
  ],
  metadata: {
    total_items: 2,
    page: 0,
    limit: 25,
  },
};

const meta: Meta<TransactionsDisplayProps & BaseStoryArgs> = {
  title: 'Core/TransactionsDisplay/User Journey Tracking',
  component: TransactionsDisplay,
  tags: ['@core', '@transactions', '@user-tracking'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'These stories demonstrate user journey tracking for transactions. Open the browser console to see what data is passed to RUM/analytics systems when you interact with the component.',
      },
    },
    msw: {
      handlers: [
        http.get('*/transactions', () => {
          return HttpResponse.json(mockTransactionsResponse);
        }),
        http.get('*/accounts', () => {
          return HttpResponse.json({
            items: [
              {
                id: 'account1',
                category: 'LIMITED_DDA_PAYMENTS',
              },
            ],
          });
        }),
      ],
    },
  },
  args: {
    apiBaseUrl: 'https://api.example.com',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic user tracking demonstration.
 * All user interactions are logged to the console with full context.
 *
 * **Try it:**
 * - View transactions list (automatically tracked)
 * - Click on a transaction to view details
 * - Change filters
 * - Refresh the list
 *
 * **Check the console** to see the event data that would be sent to your RUM system.
 */
export const BasicTracking: Story = {
  args: {
    userEventsHandler: (context) => {
      console.group('🔍 Transactions Journey Event');
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
      console.log('📊 Dynatrace Transactions Event:', {
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
        console.log('🚀 Transactions Action Started:', context.actionName);
        if (typeof window !== 'undefined' && (window as any).dtrum) {
          return (window as any).dtrum.enterAction(context.actionName);
        }
      },
      onLeave: (context) => {
        console.log('✅ Transactions Action Completed:', context.actionName);
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
      console.log('📈 Datadog RUM Transactions Event:', {
        action: {
          type: 'custom',
          name: context.actionName,
        },
        context: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'TransactionsDisplay',
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
          component: 'TransactionsDisplay',
          ...context.metadata,
        },
      };

      console.log('📡 Analytics Event:', analyticsEvent);

      // Track transaction views
      if (context.actionName === 'transactions_list_viewed') {
        console.log('👀 User viewed transactions list');
      }
      if (context.actionName === 'transaction_details_viewed') {
        console.log('🔍 User viewed transaction details:', context.metadata);
      }
      if (context.actionName === 'transactions_refresh') {
        console.log('🔄 User refreshed transactions list');
      }
    },
  },
};
