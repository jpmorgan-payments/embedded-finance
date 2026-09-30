import { Clock3Icon, PencilLineIcon } from 'lucide-react';

import type { KycUpdateRequestStatus } from '@/api/generated/smbdo.schemas';

export function MaintenanceChangeStatusIcon({
  status,
  className,
}: {
  status?: KycUpdateRequestStatus;
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
