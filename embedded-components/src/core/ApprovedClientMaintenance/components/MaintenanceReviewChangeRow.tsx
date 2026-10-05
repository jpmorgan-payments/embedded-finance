import type { ReactNode } from 'react';
import { ArrowRightIcon } from 'lucide-react';

import type { MaintenanceStatusTone } from '../utils/maintenanceStatusTone';
import {
  MaintenanceActionMenu,
  type MaintenanceAction,
} from './MaintenanceActionMenu';
import { MaintenanceEntityMedallion } from './MaintenanceEntityMedallion';

export function MaintenanceReviewChangeRow({
  changeId,
  entityKind,
  tone,
  name,
  caption,
  status,
  onOpen,
  menuLabel,
  actions,
  children,
}: {
  changeId: string;
  entityKind: 'person' | 'business' | 'product';
  tone: MaintenanceStatusTone;
  name: string;
  caption: ReactNode;
  status?: ReactNode;
  onOpen?: () => void;
  menuLabel: string;
  actions: MaintenanceAction[];
  children?: ReactNode;
}) {
  const summary = (
    <>
      <MaintenanceEntityMedallion
        kind={entityKind}
        tone={tone}
        size="sm"
        className="eb-mt-0.5"
      />
      <span className="eb-min-w-0 eb-flex-1">
        <span className="eb-block eb-break-words eb-text-sm eb-font-medium eb-leading-5">
          {name}
        </span>
        <span className="eb-block eb-text-xs eb-leading-5 eb-text-muted-foreground">
          {caption}
        </span>
        {status ? <span className="eb-mt-1.5 eb-block">{status}</span> : null}
      </span>
    </>
  );

  return (
    <li data-review-change={changeId}>
      <div className="eb-flex eb-items-start">
        {onOpen ? (
          <button
            type="button"
            className="eb-flex eb-min-w-0 eb-flex-1 eb-items-start eb-gap-3 eb-px-4 eb-py-3 eb-text-left eb-transition-colors hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring"
            onClick={onOpen}
          >
            {summary}
            <ArrowRightIcon
              aria-hidden="true"
              className="eb-mt-1 eb-size-4 eb-shrink-0 eb-text-muted-foreground"
            />
          </button>
        ) : (
          <div className="eb-flex eb-min-w-0 eb-flex-1 eb-items-start eb-gap-3 eb-px-4 eb-py-3">
            {summary}
          </div>
        )}
        {actions.length > 0 ? (
          <div className="eb-shrink-0 eb-py-2 eb-pr-2">
            <MaintenanceActionMenu label={menuLabel} actions={actions} />
          </div>
        ) : null}
      </div>
      {children}
    </li>
  );
}
