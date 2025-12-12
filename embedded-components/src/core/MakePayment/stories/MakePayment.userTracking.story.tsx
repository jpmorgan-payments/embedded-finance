/**
 * MakePayment - User Journey Tracking Stories
 *
 * These stories demonstrate how userEventsHandler works and what data
 * is passed to RUM/analytics systems. Open the browser console to see
 * the logged events.
 */

/* eslint-disable no-console */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { MakePayment } from '../MakePayment';
import type { PaymentComponentProps } from '../types';

const mockAccountsResponse = {
  items: [
    {
      id: 'account1',
      clientId: '0085199987',
      label: 'MAIN3919',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '20000057603919',
        country: 'US',
        routingInformation: [{ type: 'ABA', value: '028000024' }],
      },
      category: 'LIMITED_DDA_PAYMENTS',
    },
  ],
};

const mockRecipientsResponse = {
  recipients: [
    {
      id: 'recipient1',
      status: 'ACTIVE',
      partyDetails: {
        type: 'INDIVIDUAL',
        individualDetails: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
      account: {
        number: '1234567890',
        type: 'CHECKING',
      },
    },
  ],
};

const meta: Meta<PaymentComponentProps & BaseStoryArgs> = {
  title: 'Core/MakePayment/User Journey Tracking',
  component: MakePayment,
  tags: ['@core', '@make-payment', '@user-tracking'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'These stories demonstrate user journey tracking for payments. Open the browser console to see what data is passed to RUM/analytics systems when you interact with the payment form.',
      },
    },
    msw: {
      handlers: [
        http.get('*/accounts', () => {
          return HttpResponse.json(mockAccountsResponse);
        }),
        http.get('*/recipients', () => {
          return HttpResponse.json(mockRecipientsResponse);
        }),
        http.get('*/accounts/:id/balance', () => {
          return HttpResponse.json({
            balanceTypes: [{ typeCode: 'ITAV', amount: '10000.50' }],
            currency: 'USD',
          });
        }),
        http.post('*/transactions', () => {
          return HttpResponse.json({
            id: 'txn-123',
            status: 'PENDING',
          });
        }),
      ],
    },
  },
  args: {
    apiBaseUrl: 'https://api.example.com',
    paymentMethods: [
      { id: 'ACH', name: 'ACH', fee: 2.5 },
      { id: 'RTP', name: 'RTP', fee: 1 },
      { id: 'WIRE', name: 'WIRE', fee: 25 },
    ],
    showPreviewPanel: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic user tracking demonstration.
 * All user interactions are logged to the console with full context.
 *
 * **Try it:**
 * - Click the payment trigger button
 * - Select an account
 * - Select a recipient
 * - Select a payment method
 * - Submit the payment form
 *
 * **Check the console** to see the event data that would be sent to your RUM system.
 */
export const BasicTracking: Story = {
  args: {
    userEventsHandler: (context) => {
      console.group('🔍 Payment Journey Event');
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
 * Shows how to use the handler with Dynatrace's dtrum API for payment tracking.
 */
export const DynatraceIntegration: Story = {
  args: {
    userEventsHandler: (context) => {
      console.log('📊 Dynatrace Payment Event:', {
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
        console.log('🚀 Payment Action Started:', context.actionName);
        if (typeof window !== 'undefined' && (window as any).dtrum) {
          return (window as any).dtrum.enterAction(context.actionName);
        }
        return undefined;
      },
      onLeave: (context) => {
        console.log('✅ Payment Action Completed:', context.actionName);
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
 * Shows how to track payment flows with Datadog.
 */
export const DatadogIntegration: Story = {
  args: {
    userEventsHandler: (context) => {
      console.log('📈 Datadog RUM Payment Event:', {
        action: {
          type: 'custom',
          name: context.actionName,
        },
        context: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'MakePayment',
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
 * Shows how to track payment completion rates and abandonment.
 */
export const GenericAnalytics: Story = {
  args: {
    userEventsHandler: (context) => {
      const analyticsEvent = {
        event: context.actionName,
        properties: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'MakePayment',
          ...context.metadata,
        },
      };

      console.log('📡 Analytics Event:', analyticsEvent);

      // Track payment funnel
      if (context.actionName === 'payment_form_started') {
        console.log('🚀 Payment form opened');
      }
      if (context.actionName === 'payment_submitted') {
        console.log('📤 Payment submitted:', context.metadata);
      }
      if (context.actionName === 'payment_completed') {
        console.log('✅ Payment completed successfully');
      }
      if (context.actionName === 'payment_failed') {
        console.log('❌ Payment failed:', context.metadata);
      }
    },
  },
};
