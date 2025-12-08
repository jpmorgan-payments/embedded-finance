import React from 'react';
import { useTranslation } from 'react-i18next';

import type { RecipientStatus } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';

import { formatStatusText } from '../../utils/formatStatusText';
import { getStatusVariant } from '../../utils/getStatusVariant';

export interface StatusBadgeProps {
  status: RecipientStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t: tRaw } = useTranslation(['recipients', 'common']);
  // Type assertion to avoid TypeScript overload issues
  const t = tRaw as (key: string, options?: any) => string;
  return (
    <Badge variant={getStatusVariant(status)} className="eb-text-xs">
      {formatStatusText(status, t)}
    </Badge>
  );
};
