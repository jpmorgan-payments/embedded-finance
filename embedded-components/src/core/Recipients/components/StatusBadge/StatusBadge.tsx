import React from 'react';

import type { RecipientStatus } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';

export interface StatusBadgeProps {
  status: RecipientStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <Badge variant="secondary" className="eb-text-xs">
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};
