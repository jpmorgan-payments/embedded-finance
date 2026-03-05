/**
 * StatusBadge - Clean status indicator for client status
 * Functional design with clear semantic colors
 */

import { useTranslationWithTokens } from '@/i18n';

import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/api/generated/smbdo.schemas';

interface StatusBadgeProps {
  status: ClientStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

type StatusConfig = {
  labelKey: string;
  colorClass: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  APPROVED: {
    labelKey: 'statusBadge.approved',
    colorClass:
      'eb-bg-green-100 eb-text-green-700 dark:eb-bg-green-900/40 dark:eb-text-green-300',
  },
  ACTIVE: {
    labelKey: 'statusBadge.active',
    colorClass:
      'eb-bg-green-100 eb-text-green-700 dark:eb-bg-green-900/40 dark:eb-text-green-300',
  },
  NEW: {
    labelKey: 'statusBadge.new',
    colorClass:
      'eb-bg-blue-100 eb-text-blue-700 dark:eb-bg-blue-900/40 dark:eb-text-blue-300',
  },
  REVIEW_IN_PROGRESS: {
    labelKey: 'statusBadge.inReview',
    colorClass:
      'eb-bg-amber-100 eb-text-amber-700 dark:eb-bg-amber-900/40 dark:eb-text-amber-300',
  },
  INFORMATION_REQUESTED: {
    labelKey: 'statusBadge.infoRequested',
    colorClass:
      'eb-bg-orange-100 eb-text-orange-700 dark:eb-bg-orange-900/40 dark:eb-text-orange-300',
  },
  DECLINED: {
    labelKey: 'statusBadge.declined',
    colorClass:
      'eb-bg-red-100 eb-text-red-700 dark:eb-bg-red-900/40 dark:eb-text-red-300',
  },
  SUSPENDED: {
    labelKey: 'statusBadge.suspended',
    colorClass:
      'eb-bg-red-100 eb-text-red-700 dark:eb-bg-red-900/40 dark:eb-text-red-300',
  },
  TERMINATED: {
    labelKey: 'statusBadge.terminated',
    colorClass:
      'eb-bg-gray-200 eb-text-gray-600 dark:eb-bg-gray-800 dark:eb-text-gray-400',
  },
  NOT_STARTED: {
    labelKey: 'statusBadge.notStarted',
    colorClass:
      'eb-bg-gray-100 eb-text-gray-600 dark:eb-bg-gray-800 dark:eb-text-gray-400',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  labelKey: 'statusBadge.unknown',
  colorClass:
    'eb-bg-gray-100 eb-text-gray-600 dark:eb-bg-gray-800 dark:eb-text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  'statusBadge.approved': 'Approved',
  'statusBadge.active': 'Active',
  'statusBadge.new': 'New',
  'statusBadge.inReview': 'In Review',
  'statusBadge.infoRequested': 'Info Requested',
  'statusBadge.declined': 'Declined',
  'statusBadge.suspended': 'Suspended',
  'statusBadge.terminated': 'Terminated',
  'statusBadge.notStarted': 'Not Started',
  'statusBadge.unknown': 'Unknown',
};

export function StatusBadge({
  status,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const { t, tString } = useTranslationWithTokens('client-details');
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;
  const label = STATUS_LABELS[config.labelKey] ?? 'Unknown';

  return (
    <span
      className={cn(
        'eb-inline-flex eb-items-center eb-rounded eb-font-medium',
        config.colorClass,
        size === 'sm' && 'eb-px-1.5 eb-py-0.5 eb-text-xs',
        size === 'md' && 'eb-px-2 eb-py-0.5 eb-text-xs',
        className
      )}
      role="status"
      aria-label={tString(config.labelKey, label)}
    >
      {t(config.labelKey, label)}
    </span>
  );
}
