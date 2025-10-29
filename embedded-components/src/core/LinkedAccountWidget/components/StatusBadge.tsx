import React from 'react';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
} from 'lucide-react';

import { RecipientStatus } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';

import {
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
} from '../LinkedAccountWidget.constants';

export interface StatusBadgeProps {
  /** The recipient status to display */
  status: RecipientStatus;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Get icon for status
 */
const getStatusIcon = (status: RecipientStatus) => {
  const iconClass = 'eb-h-3 eb-w-3';
  switch (status) {
    case 'ACTIVE':
      return <CheckCircle2Icon className={iconClass} />;
    case 'PENDING':
    case 'MICRODEPOSITS_INITIATED':
      return <ClockIcon className={iconClass} />;
    case 'READY_FOR_VALIDATION':
      return <AlertCircleIcon className={iconClass} />;
    case 'REJECTED':
      return <XCircleIcon className={iconClass} />;
    case 'INACTIVE':
      return <AlertTriangleIcon className={iconClass} />;
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
  return (
    <Badge
      {...STATUS_BADGE_VARIANTS[status]}
      className={`eb-inline-flex eb-items-center eb-gap-1 eb-text-xs ${className || ''}`}
    >
      {showIcon && getStatusIcon(status)}
      {STATUS_LABELS[status]}
    </Badge>
  );
};
