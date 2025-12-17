/**
 * User journey identifiers for Recipients component
 * These are automatically tracked when userEventsHandler is provided
 */
export const RECIPIENT_USER_JOURNEYS = {
  VIEW_DETAILS: 'recipient_details_viewed',
  CREATE_STARTED: 'recipient_create_started',
  CREATE_COMPLETED: 'recipient_created',
  EDIT_STARTED: 'recipient_edit_started',
  EDIT_COMPLETED: 'recipient_updated',
  DEACTIVATE_STARTED: 'recipient_deactivate_started',
  DEACTIVATE_COMPLETED: 'recipient_deactivated',
  SEARCH: 'recipient_search',
  FILTER_CHANGED: 'recipient_filter_changed',
  PAGE_CHANGED: 'recipient_page_changed',
} as const;
