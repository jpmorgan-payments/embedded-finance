/**
 * ClientDetails - Public API
 */

export { ClientDetails } from './ClientDetails';
export type {
  ClientDetailsProps,
  ClientDetailsViewMode,
  ClientSection,
} from './ClientDetails.types';

// Export sub-components for composition
export { ClientSummaryCard } from './components/Summary/ClientSummaryCard';
export { StatusBadge } from './components/Summary/StatusBadge';
export { QuickStats } from './components/Summary/QuickStats';
export type { QuickStat } from './components/Summary/QuickStats';
export { SectionList, getSectionIcon } from './components/Summary/SectionList';
export type { SectionInfo } from './components/Summary/SectionList';
