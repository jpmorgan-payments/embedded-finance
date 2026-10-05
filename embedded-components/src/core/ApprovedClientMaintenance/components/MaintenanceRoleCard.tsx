import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import type { MaintenanceRoleState } from '../utils/getMaintenanceRoleState';

export function MaintenanceRoleCard({
  partyRole,
  state = 'active',
  icon,
  title,
  status,
  description,
  stateNote,
  detail,
  actions,
}: {
  partyRole: string;
  state?: MaintenanceRoleState;
  icon: ReactNode;
  title: ReactNode;
  status?: ReactNode;
  description: ReactNode;
  stateNote?: ReactNode;
  detail?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      data-role={partyRole}
      data-role-state={state}
      className={cn(
        'eb-overflow-hidden eb-rounded-md eb-border eb-border-border eb-bg-background',
        state === 'pending-addition' &&
          'eb-border-informative/70 eb-bg-informative-accent/40',
        state === 'pending-removal' &&
          'eb-border-destructive/50 eb-bg-destructive-accent/40'
      )}
    >
      <div className="eb-flex eb-items-start eb-gap-3 eb-px-4 eb-py-3">
        <span
          aria-hidden="true"
          className={cn(
            'eb-flex eb-size-9 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full [&>svg]:eb-size-4',
            state === 'pending-addition'
              ? 'eb-bg-informative-accent eb-text-informative'
              : state === 'pending-removal'
                ? 'eb-bg-destructive-accent eb-text-destructive'
                : 'eb-bg-muted eb-text-muted-foreground'
          )}
        >
          {icon}
        </span>
        <div className="eb-min-w-0 eb-flex-1">
          <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2">
            <p className="eb-text-sm eb-font-medium">{title}</p>
            {status}
          </div>
          <p className="eb-mt-1 eb-text-xs eb-leading-5 eb-text-muted-foreground">
            {description}
          </p>
          {stateNote ? (
            <p className="eb-mt-2 eb-max-w-2xl eb-text-xs eb-leading-5 eb-text-muted-foreground">
              {stateNote}
            </p>
          ) : null}
        </div>
      </div>
      {detail ? (
        <div className="eb-border-t eb-border-border eb-px-4 eb-py-3">
          {detail}
        </div>
      ) : null}
      {actions ? (
        <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-end eb-gap-2 eb-border-t eb-border-border eb-bg-muted/15 eb-px-4 eb-py-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
