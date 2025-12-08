import React from 'react';

import type { RecipientStatus } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';

import { formatStatusText } from '../../utils/formatStatusText';
import { getStatusVariant } from '../../utils/getStatusVariant';

export interface StatusBadgeProps {
  status: RecipientStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <Badge variant={getStatusVariant(status)} className="eb-text-xs">
      {formatStatusText(status)}
    </Badge>
  );
};
