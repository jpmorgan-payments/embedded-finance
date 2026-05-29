/**
 * Shared types for user event tracking across all components
 */

/**
 * Rich context for user events, providing all information RUM libraries need
 */
export type UserEventContext = {
  /** Name of the action/event (journey identifier) */
  actionName: string;
  /** Type of DOM event (e.g., 'click', 'blur', 'focus') or 'programmatic' */
  eventType: string;
  /** Timestamp when the event occurred (milliseconds since epoch) */
  timestamp: number;
  /** The DOM element that triggered the event (if available) */
  element?: HTMLElement;
  /** Additional metadata for the event */
  metadata?: Record<string, unknown>;
};

/**
 * Lifecycle handlers for RUM libraries that need enter/leave action pairs
 */
export type UserEventLifecycle = {
  /** Called when an action starts. Returns actionId for tracking lifecycle */
  onEnter?: (context: UserEventContext) => void | number;
  /** Called when an action ends. Receives context with optional actionId */
  onLeave?: (context: UserEventContext & { actionId?: number }) => void;
};

/**
 * Standard props for user event tracking that all components can use
 */
export type UserTrackingProps = {
  /** Handler for user events with rich context */
  userEventsHandler?: (context: UserEventContext) => void | number;
  /** Optional lifecycle handlers for RUM libraries that need enter/leave pairs */
  userEventsLifecycle?: UserEventLifecycle;
};
