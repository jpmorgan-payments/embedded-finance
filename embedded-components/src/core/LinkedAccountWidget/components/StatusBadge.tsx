import React from 'react';

import { RecipientStatus } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';

import { STATUS_BADGE_VARIANTS } from '../LinkedAccountWidget.constants';

export interface StatusBadgeProps {
  /** The recipient status to display */
  status: RecipientStatus;
  /** Optional CSS class name */
  className?: string;
}

/**
 * StatusBadge - Displays a status badge for a recipient account
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  return (
    <Badge
      {...STATUS_BADGE_VARIANTS[status]}
      className={`eb-text-xs ${className || ''}`}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};
