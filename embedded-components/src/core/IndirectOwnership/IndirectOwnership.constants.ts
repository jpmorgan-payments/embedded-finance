/**
 * User journey identifiers for IndirectOwnership component
 * These are automatically tracked when userEventsHandler is provided
 */
export const INDIRECT_OWNERSHIP_USER_JOURNEYS = {
  VIEW_STRUCTURE: 'ownership_structure_viewed',
  ADD_OWNER_STARTED: 'ownership_add_owner_started',
  ADD_OWNER_COMPLETED: 'ownership_add_owner_completed',
  EDIT_OWNER_STARTED: 'ownership_edit_owner_started',
  EDIT_OWNER_COMPLETED: 'ownership_edit_owner_completed',
  REMOVE_OWNER_STARTED: 'ownership_remove_owner_started',
  REMOVE_OWNER_COMPLETED: 'ownership_remove_owner_completed',
} as const;
