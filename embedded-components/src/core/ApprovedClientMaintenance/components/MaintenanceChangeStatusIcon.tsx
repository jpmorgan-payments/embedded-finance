import { Clock3Icon, PencilLineIcon } from 'lucide-react';

import type { MaintenanceStatus } from '../models/maintenanceApi.types';

export function MaintenanceChangeStatusIcon({
  status,
  className,
}: {
  status?: MaintenanceStatus;
  className?: string;
}) {
  const Icon =
    status === 'NEW'
      ? PencilLineIcon
      : status === 'REVIEW_IN_PROGRESS'
        ? Clock3Icon
        : null;

  return Icon ? <Icon className={className} aria-hidden="true" /> : null;
}
