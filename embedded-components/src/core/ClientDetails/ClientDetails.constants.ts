/**
 * ClientDetails - Constants
 *
 * Section IDs align with Review-and-attest–style grouping:
 * Client information, Organization, Controller, Beneficial owners, Question responses, Results.
 */

import type { ClientDetailsViewMode } from './ClientDetails.types';

export const CLIENT_DETAILS_DEFAULT_VIEW_MODE: ClientDetailsViewMode =
  'summary';

export const CLIENT_DETAILS_SECTION_IDS = {
  CLIENT_INFO: 'client-info',
  ORGANIZATION: 'organization',
  CONTROLLER: 'controller',
  BENEFICIAL_OWNERS: 'beneficial-owners',
  QUESTION_RESPONSES: 'question-responses',
  RESULTS: 'results',
} as const;
