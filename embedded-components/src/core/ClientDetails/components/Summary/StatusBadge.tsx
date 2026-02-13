/**
 * StatusBadge - Clean status indicator for client status
 * Functional design with clear semantic colors
 */

import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/api/generated/smbdo.schemas';

interface StatusBadgeProps {
  status: ClientStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

type StatusConfig = {
  label: string;
  colorClass: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  APPROVED: {
    label: 'Approved',
    colorClass:
      'eb-bg-green-100 eb-text-green-700 dark:eb-bg-green-900/40 dark:eb-text-green-300',
  },
  ACTIVE: {
    label: 'Active',
    colorClass:
      'eb-bg-green-100 eb-text-green-700 dark:eb-bg-green-900/40 dark:eb-text-green-300',
  },
  NEW: {
    label: 'New',
    colorClass:
      'eb-bg-blue-100 eb-text-blue-700 dark:eb-bg-blue-900/40 dark:eb-text-blue-300',
  },
  REVIEW_IN_PROGRESS: {
    label: 'In Review',
    colorClass:
      'eb-bg-amber-100 eb-text-amber-700 dark:eb-bg-amber-900/40 dark:eb-text-amber-300',
  },
  INFORMATION_REQUESTED: {
    label: 'Info Requested',
    colorClass:
      'eb-bg-orange-100 eb-text-orange-700 dark:eb-bg-orange-900/40 dark:eb-text-orange-300',
  },
  DECLINED: {
    label: 'Declined',
    colorClass:
      'eb-bg-red-100 eb-text-red-700 dark:eb-bg-red-900/40 dark:eb-text-red-300',
  },
  SUSPENDED: {
    label: 'Suspended',
    colorClass:
      'eb-bg-red-100 eb-text-red-700 dark:eb-bg-red-900/40 dark:eb-text-red-300',
  },
  TERMINATED: {
    label: 'Terminated',
    colorClass:
      'eb-bg-gray-200 eb-text-gray-600 dark:eb-bg-gray-800 dark:eb-text-gray-400',
  },
  NOT_STARTED: {
    label: 'Not Started',
    colorClass:
      'eb-bg-gray-100 eb-text-gray-600 dark:eb-bg-gray-800 dark:eb-text-gray-400',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  label: 'Unknown',
  colorClass:
    'eb-bg-gray-100 eb-text-gray-600 dark:eb-bg-gray-800 dark:eb-text-gray-400',
};

export function StatusBadge({
  status,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;

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
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
