import { useTranslationWithTokens } from '@/i18n';
import { AlertTriangleIcon, CircleDashedIcon, Clock3Icon } from 'lucide-react';

import type { MaintenanceStatus } from '../models/maintenanceApi.types';

type MaintenanceStatusBadgeProps = {
  status?: MaintenanceStatus;
  requiresAction?: boolean;
  className?: string;
};

export function MaintenanceStatusBadge({
  status,
  requiresAction = false,
  className,
}: MaintenanceStatusBadgeProps) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');

  if (
    !status ||
    status === 'APPROVED' ||
    status === 'DECLINED' ||
    status === 'TERMINATED'
  ) {
    return null;
  }

  const isActionRequired = requiresAction || status === 'INFORMATION_REQUESTED';
  const Icon = isActionRequired
    ? AlertTriangleIcon
    : status === 'REVIEW_IN_PROGRESS'
      ? Clock3Icon
      : CircleDashedIcon;
  const label = isActionRequired
    ? t('status.ACTION_REQUIRED')
    : t([`status.${status}`] as unknown as TemplateStringsArray);

  return (
    <span
      className={`eb-inline-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-medium ${
        isActionRequired
          ? 'eb-text-warning-foreground'
          : status === 'REVIEW_IN_PROGRESS'
            ? 'eb-text-informative'
            : 'eb-text-muted-foreground'
      } ${className ?? ''}`}
    >
      <Icon className="eb-size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
