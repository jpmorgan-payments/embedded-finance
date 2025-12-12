/**
 * OnboardingFlow - User Journey Tracking Stories
 *
 * These stories demonstrate how userEventsHandler works and what data
 * is passed to RUM/analytics systems. Open the browser console to see
 * the logged events.
 */

/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';

import { OnboardingFlow, OnboardingFlowProps } from '@/core/OnboardingFlow';
import { ORGANIZATION_TYPE_LIST } from '@/core/OnboardingFlow/consts';

import type { BaseStoryArgs } from '../../../../.storybook/preview';
import { handlers } from '../../../msw/handlers';

export type OnboardingFlowStoryArgs = OnboardingFlowProps & BaseStoryArgs;

const meta: Meta<OnboardingFlowStoryArgs> = {
  title: 'Core/OnboardingFlow/User Journey Tracking',
  component: OnboardingFlow,
  tags: ['@core', '@onboarding', '@user-tracking'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'These stories demonstrate user journey tracking in the OnboardingFlow. Open the browser console to see what data is passed to RUM/analytics systems when you navigate through the onboarding flow.',
      },
    },
    msw: {
      handlers,
    },
  },
  args: {
    availableProducts: ['MERCHANT_SERVICES', 'EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US', 'CA'],
    availableOrganizationTypes: ORGANIZATION_TYPE_LIST,
  },
};

export default meta;

const Template: StoryFn<OnboardingFlowStoryArgs> = (args) => {
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ height: containerHeight, overflow: 'auto' }}>
      <OnboardingFlow {...args} />
    </div>
  );
};

/**
 * Basic user tracking demonstration.
 * All navigation and interactions are logged to the console.
 *
 * **Try it:**
 * - Navigate between sections using the sidebar (if enabled)
 * - Complete form steps
 * - Upload documents
 * - Submit forms
 *
 * **Check the console** to see the event data that would be sent to your RUM system.
 */
export const BasicTracking: StoryFn<OnboardingFlowStoryArgs> = Template.bind(
  {}
);
BasicTracking.args = {
  enableSidebar: true,
  userEventsHandler: (context) => {
    console.group('🔍 Onboarding Journey Event');
    console.log('Action Name:', context.actionName);
    console.log('Event Type:', context.eventType);
    console.log('Timestamp:', new Date(context.timestamp).toISOString());
    console.log('Element:', context.element);
    console.log('Metadata:', context.metadata);
    console.groupEnd();
  },
};

/**
 * Simulates Dynatrace integration.
 * Shows how to use the handler with Dynatrace's dtrum API for onboarding flows.
 */
export const DynatraceIntegration: StoryFn<OnboardingFlowStoryArgs> =
  Template.bind({});
DynatraceIntegration.args = {
  enableSidebar: true,
  userEventsHandler: (context) => {
    console.log('📊 Dynatrace Onboarding Event:', {
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
      console.log('🚀 Onboarding Action Started:', context.actionName);
      if (typeof window !== 'undefined' && (window as any).dtrum) {
        return (window as any).dtrum.enterAction(context.actionName);
      }
      return undefined;
    },
    onLeave: (context) => {
      console.log('✅ Onboarding Action Completed:', context.actionName);
      if (
        typeof window !== 'undefined' &&
        (window as any).dtrum &&
        context.actionId
      ) {
        (window as any).dtrum.leaveAction(context.actionId);
      }
    },
  },
};

/**
 * Simulates Datadog RUM integration.
 * Shows how to track onboarding progress with Datadog.
 */
export const DatadogIntegration: StoryFn<OnboardingFlowStoryArgs> =
  Template.bind({});
DatadogIntegration.args = {
  enableSidebar: true,
  userEventsHandler: (context) => {
    console.log('📈 Datadog RUM Onboarding Event:', {
      action: {
        type: 'custom',
        name: context.actionName,
      },
      context: {
        eventType: context.eventType,
        timestamp: context.timestamp,
        component: 'OnboardingFlow',
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
};

/**
 * Generic analytics integration example.
 * Shows how to track onboarding completion rates and drop-off points.
 */
export const GenericAnalytics: StoryFn<OnboardingFlowStoryArgs> = Template.bind(
  {}
);
GenericAnalytics.args = {
  enableSidebar: true,
  userEventsHandler: (context) => {
    const analyticsEvent = {
      event: context.actionName,
      properties: {
        eventType: context.eventType,
        timestamp: context.timestamp,
        component: 'OnboardingFlow',
        ...context.metadata,
      },
    };

    console.log('📡 Analytics Event:', analyticsEvent);

    // Track onboarding progress
    if (context.actionName === 'onboarding_screen_navigation') {
      console.log('📍 User navigated to:', context.metadata?.screenId);
    }
    if (context.actionName === 'onboarding_step_completed') {
      console.log('✅ Step completed:', context.metadata);
    }
    if (context.actionName === 'onboarding_section_completed') {
      console.log('🎉 Section completed:', context.metadata);
    }
  },
};
