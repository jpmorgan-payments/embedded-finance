import React from 'react';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { RecipientStatus } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';

import { STATUS_BADGE_VARIANTS } from '../../LinkedAccountWidget.constants';

export interface StatusBadgeProps {
  /** The recipient status to display */
  status: RecipientStatus;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Get icon for status with appropriate semantic meaning
 */
const getStatusIcon = (status: RecipientStatus) => {
  const iconClass = 'eb-h-3.5 eb-w-3.5';
  switch (status) {
    case 'ACTIVE':
      return <CheckCircle2Icon className={iconClass} />;
    case 'PENDING':
      return <ClockIcon className={iconClass} />; // Waiting for processing
    case 'MICRODEPOSITS_INITIATED':
      return <ClockIcon className={iconClass} />; // In progress
    case 'READY_FOR_VALIDATION':
      return <AlertCircleIcon className={iconClass} />; // Action required
    case 'REJECTED':
      return <XCircleIcon className={iconClass} />; // Failed/denied
    case 'INACTIVE':
      return <AlertTriangleIcon className={iconClass} />; // Disabled/suspended
    default:
      return null;
  }
};

/**
 * StatusBadge - Displays a status badge for a recipient account with icon
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  className,
}) => {
  const { t } = useTranslation('linked-accounts');

  return (
    <Badge
      {...STATUS_BADGE_VARIANTS[status]}
      className={cn(
        'eb-inline-flex eb-items-center eb-gap-1 eb-text-xs',
        className
      )}
    >
      {showIcon && getStatusIcon(status)}
      {t(`status.labels.${status}`)}
    </Badge>
  );
};
