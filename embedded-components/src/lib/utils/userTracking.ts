import { useCallback, useEffect, useRef } from 'react';

import type {
  UserEventContext,
  UserEventLifecycle,
} from '../types/userTracking.types';

/**
 * Extract journey name from data-user-event attribute
 */
export function getUserEventName(element: HTMLElement): string | null {
  return element.getAttribute('data-user-event');
}

/**
 * Create a user event context object
 */
export function createUserEventContext(
  actionName: string,
  eventType: string,
  element?: HTMLElement,
  metadata?: Record<string, unknown>
): UserEventContext {
  return {
    actionName,
    eventType,
    timestamp: Date.now(),
    element,
    metadata,
  };
}

/**
 * Track a user event programmatically
 */
export function trackUserEvent({
  actionName,
  eventType = 'programmatic',
  element,
  metadata,
  userEventsHandler,
  userEventsLifecycle,
}: {
  actionName: string;
  eventType?: string;
  element?: HTMLElement;
  metadata?: Record<string, unknown>;
  userEventsHandler?: (context: UserEventContext) => void | number;
  userEventsLifecycle?: UserEventLifecycle;
}): void {
  if (!userEventsHandler) return;

  try {
    const context = createUserEventContext(
      actionName,
      eventType,
      element,
      metadata
    );

    // Handle lifecycle if provided
    if (userEventsLifecycle?.onEnter) {
      const actionId = userEventsLifecycle.onEnter(context);
      // If lifecycle returns an actionId, store it for onLeave
      if (typeof actionId === 'number' && userEventsLifecycle?.onLeave) {
        // Store actionId in metadata for later use
        const contextWithId = { ...context, actionId };
        // Note: In practice, you'd need to manage actionId storage per action
        // This is a simplified version - components can handle lifecycle more explicitly
        userEventsLifecycle.onLeave(contextWithId);
      }
    } else {
      // Standard handler call
      userEventsHandler(context);
    }
  } catch (error) {
    // Silently handle errors to prevent breaking component functionality
    // eslint-disable-next-line no-console
    console.error('Error tracking user event:', error);
  }
}

/**
 * Hook for automatically tracking user events on DOM elements with data-user-event attributes
 * Uses event delegation for better performance
 */
export function useUserEventTracking({
  containerId,
  userEventsHandler,
  userEventsLifecycle,
  eventsToTrack = ['click', 'blur', 'focus', 'change', 'submit'],
}: {
  containerId: string;
  userEventsHandler?: (context: UserEventContext) => void | number;
  userEventsLifecycle?: UserEventLifecycle;
  eventsToTrack?: string[];
}): void {
  // Store actionIds for lifecycle tracking
  const actionIdsRef = useRef<Map<string, number>>(new Map());

  const eventHandler = useCallback(
    (e: Event) => {
      if (!userEventsHandler) return;

      const target = e.target as HTMLElement;
      if (!target) return;

      // Check if element or any parent has data-user-event attribute
      let element: HTMLElement | null = target;
      let journeyName: string | null = null;

      while (element && element !== document.body) {
        journeyName = getUserEventName(element);
        if (journeyName) break;
        element = element.parentElement;
      }

      if (!journeyName || !element) return;

      try {
        const context = createUserEventContext(journeyName, e.type, element, {
          // Include any additional data attributes
          ...(element.dataset &&
            Object.fromEntries(Object.entries(element.dataset))),
        });

        // Handle lifecycle if provided
        if (userEventsLifecycle?.onEnter) {
          const actionId = userEventsLifecycle.onEnter(context);
          if (typeof actionId === 'number') {
            // Store actionId for this journey
            actionIdsRef.current.set(journeyName, actionId);
          }
        } else {
          // Standard handler call
          userEventsHandler(context);
        }
      } catch (error) {
        // Silently handle errors to prevent breaking component functionality
        // eslint-disable-next-line no-console
        console.error('Error tracking user event:', error);
      }
    },
    [userEventsHandler, userEventsLifecycle]
  );

  useEffect(() => {
    if (!userEventsHandler) {
      return undefined;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      return undefined;
    }

    // Use event delegation - attach listeners to container
    eventsToTrack.forEach((eventType) => {
      container.addEventListener(eventType, eventHandler, true); // Use capture phase
    });

    return () => {
      eventsToTrack.forEach((eventType) => {
        container.removeEventListener(eventType, eventHandler, true);
      });
      // Clean up stored actionIds
      actionIdsRef.current.clear();
    };
  }, [
    containerId,
    userEventsHandler,
    userEventsLifecycle,
    eventsToTrack,
    eventHandler,
  ]);
}
