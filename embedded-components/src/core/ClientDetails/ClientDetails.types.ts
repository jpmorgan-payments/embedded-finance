/**
 * ClientDetails - Public API Types
 * Only public types that consumers need should be exported here.
 */

/**
 * Sections available for display in ClientDetails
 */
export type ClientSection =
  | 'identity'
  | 'verification'
  | 'ownership'
  | 'compliance'
  | 'accounts'
  | 'activity';

/**
 * View mode for displaying client information
 * - summary: Compact card with quick stats and section navigation (NEW)
 * - accordion: Sections in collapsible accordion (similar to onboarding final review)
 * - cards: Same information grouped as visual cards
 */
export type ClientDetailsViewMode = 'summary' | 'accordion' | 'cards';

/**
 * Props for the ClientDetails component
 */
export interface ClientDetailsProps {
  /** Client ID to fetch and display (GET /clients/:id) */
  clientId: string;
  /** Display mode: summary, accordion or cards */
  viewMode?: ClientDetailsViewMode;
  /** Optional title for the section (not used in summary mode) */
  title?: string;
  /** Optional CSS class for the root container */
  className?: string;
  /** Which sections to show (summary mode only) */
  sections?: ClientSection[];
  /** Enable drill-down sheets when clicking sections (summary mode only) */
  enableDrillDown?: boolean;
  /** Callback when a section is clicked (summary mode only) */
  onSectionClick?: (section: ClientSection) => void;
  /** Custom actions to show in footer (summary mode only) */
  actions?: React.ReactNode;
}
