/**
 * ClientDetails - Public API Types
 * Only public types that consumers need should be exported here.
 */

/**
 * View mode for displaying client information
 * - accordion: Sections in collapsible accordion (similar to onboarding final review)
 * - cards: Same information grouped as visual cards
 */
export type ClientDetailsViewMode = 'accordion' | 'cards';

/**
 * Props for the ClientDetails component
 */
export interface ClientDetailsProps {
  /** Client ID to fetch and display (GET /clients/:id) */
  clientId: string;
  /** Display mode: accordion or cards */
  viewMode?: ClientDetailsViewMode;
  /** Optional title for the section */
  title?: string;
  /** Optional CSS class for the root container */
  className?: string;
}
