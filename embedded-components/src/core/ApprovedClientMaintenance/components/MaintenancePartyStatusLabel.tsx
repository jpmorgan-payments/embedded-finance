import { useTranslationWithTokens } from '@/i18n';
import {
  AlertTriangleIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  Clock3Icon,
  LoaderIcon,
  PencilLineIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import type { MaintenancePartyStatus } from '../utils/getMaintenancePartyStatus';
import {
  maintenanceToneBadgeClass,
  maintenanceToneTextClass,
} from '../utils/maintenanceStatusTone';

function StatusIcon({ status }: { status: MaintenancePartyStatus }) {
  const className = 'eb-size-3.5 eb-shrink-0';
  switch (status.kind) {
    case 'pendingAddition':
      return <CirclePlusIcon className={className} aria-hidden="true" />;
    case 'pendingRemoval':
      return <CircleMinusIcon className={className} aria-hidden="true" />;
    case 'actionRequired':
    case 'unreviewed':
      return <AlertTriangleIcon className={className} aria-hidden="true" />;
    case 'preparingDocuments':
      return <LoaderIcon className={className} aria-hidden="true" />;
    case 'additionUnderReview':
    case 'changeUnderReview':
      return <Clock3Icon className={className} aria-hidden="true" />;
    default:
      return status.changeStatus === 'INFORMATION_REQUESTED' ? (
        <AlertTriangleIcon className={className} aria-hidden="true" />
      ) : status.changeStatus === 'NEW' || !status.changeStatus ? (
        <PencilLineIcon className={className} aria-hidden="true" />
      ) : null;
  }
}

// One vocabulary for every surface, so a status never reads differently in two places.
function useStatusText(status: MaintenancePartyStatus) {
  const { tString } = useTranslationWithTokens('approved-client-maintenance');
  switch (status.kind) {
    case 'unreviewed':
      return tString('status.UNREVIEWED');
    case 'pendingRemoval':
      return tString('status.PENDING_REMOVAL');
    case 'pendingAddition':
      return tString('status.PENDING_ADDITION');
    case 'preparingDocuments':
      return tString('flow.preparingDocuments');
    case 'actionRequired':
      return tString('status.ACTION_REQUIRED');
    case 'additionUnderReview':
      return tString('changes.additionReviewTitle');
    case 'changeUnderReview':
      return tString('changes.reviewTitle');
    default:
      return (status.changeStatus ?? 'NEW') === 'NEW' && status.changeCount > 0
        ? tString('status.pendingChanges', { count: status.changeCount })
        : tString([
            `status.${status.changeStatus ?? 'NEW'}`,
          ] as unknown as TemplateStringsArray);
  }
}

export function MaintenancePartyStatusLabel({
  status,
  className,
}: {
  status: MaintenancePartyStatus;
  className?: string;
}) {
  const label = useStatusText(status);

  return (
    <span
      data-party-status={status.kind}
      className={cn(
        'eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-medium',
        maintenanceToneTextClass[status.tone],
        className
      )}
    >
      <StatusIcon status={status} />
      {label}
    </span>
  );
}

export function MaintenancePartyStatusPill({
  status,
  className,
}: {
  status: MaintenancePartyStatus;
  className?: string;
}) {
  const label = useStatusText(status);

  return (
    <span
      data-party-status={status.kind}
      className={cn(
        'eb-inline-flex eb-items-center eb-gap-1 eb-rounded-full eb-px-2 eb-py-0.5 eb-text-[0.6875rem] eb-font-medium eb-leading-4 [&>svg]:eb-size-3',
        maintenanceToneBadgeClass[status.tone],
        className
      )}
    >
      <StatusIcon status={status} />
      {label}
    </span>
  );
}
