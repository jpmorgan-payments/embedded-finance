/**
 * Accounts - User Journey Tracking Stories
 *
 * These stories demonstrate how userEventsHandler works and what data
 * is passed to RUM/analytics systems. Open the browser console to see
 * the logged events.
 */

/* eslint-disable no-console */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { Accounts } from '../Accounts';
import type { AccountsProps } from '../Accounts.types';

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
        routingInformation: [
          {
            type: 'ABA',
            value: '028000024',
          },
        ],
      },
      createdAt: '2025-04-14T08:57:21.792272Z',
      category: 'LIMITED_DDA',
    },
    {
      id: 'account2',
      clientId: '1000012400',
      label: 'MAIN3212',
      state: 'OPEN',
      paymentRoutingInformation: {
        accountNumber: '20000097603212',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '028000024',
          },
        ],
      },
      createdAt: '2025-04-14T08:57:21.913631Z',
      category: 'LIMITED_DDA_PAYMENTS',
    },
  ],
};

const meta: Meta<AccountsProps & BaseStoryArgs> = {
  title: 'Core/Accounts/User Journey Tracking',
  component: Accounts,
  tags: ['@core', '@accounts', '@user-tracking'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'These stories demonstrate user journey tracking for accounts. Open the browser console to see what data is passed to RUM/analytics systems when you interact with the component.',
      },
    },
    msw: {
      handlers: [
        http.get('*/accounts', () => {
          return HttpResponse.json(mockAccountsResponse);
        }),
        http.get('*/accounts/:id/balance', () => {
          return HttpResponse.json({
            balanceTypes: [
              { typeCode: 'ITAV', amount: '10000.50' },
              { typeCode: 'ITBD', amount: '10000.50' },
            ],
            currency: 'USD',
          });
        }),
      ],
    },
  },
  args: {
    apiBaseUrl: 'https://api.example.com',
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    clientId: 'client-001',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic user tracking demonstration.
 * All user interactions are logged to the console with full context.
 *
 * **Try it:**
 * - View accounts list (automatically tracked)
 * - Click refresh button
 * - Toggle account details visibility
 *
 * **Check the console** to see the event data that would be sent to your RUM system.
 */
export const BasicTracking: Story = {
  args: {
    userEventsHandler: (context: any) => {
      console.group('🔍 Accounts Journey Event');
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
    userEventsHandler: (context: any) => {
      console.log('📊 Dynatrace Accounts Event:', {
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
  },
};

/**
 * Simulates Datadog RUM integration.
 * Shows how to use the handler with Datadog's RUM API.
 */
export const DatadogIntegration: Story = {
  args: {
    userEventsHandler: (context: any) => {
      console.log('📈 Datadog RUM Accounts Event:', {
        action: {
          type: 'custom',
          name: context.actionName,
        },
        context: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'Accounts',
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
    userEventsHandler: (context: any) => {
      const analyticsEvent = {
        event: context.actionName,
        properties: {
          eventType: context.eventType,
          timestamp: context.timestamp,
          component: 'Accounts',
          ...context.metadata,
        },
      };

      console.log('📡 Analytics Event:', analyticsEvent);

      // Track account views
      if (context.actionName === 'accounts_viewed') {
        console.log(
          '👀 User viewed accounts:',
          context.metadata?.count,
          'accounts'
        );
      }
      if (context.actionName === 'accounts_refresh') {
        console.log('🔄 User refreshed accounts list');
      }
    },
  },
};
