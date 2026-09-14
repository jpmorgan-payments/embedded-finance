import { RotateCcwIcon } from 'lucide-react';

import type { ProfileFieldRestoreAction } from './ProfileTextField';

export function ProfileFieldRestore({
  action,
}: {
  action: ProfileFieldRestoreAction;
}) {
  return (
    <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2 eb-rounded-md eb-border eb-border-border eb-bg-muted eb-px-2.5 eb-py-2">
      <span className="eb-text-xs eb-text-foreground">
        {action.originalValue}
      </span>
      <button
        type="button"
        className="eb-inline-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-semibold eb-text-foreground hover:eb-text-primary focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring"
        onClick={action.onClick}
      >
        <RotateCcwIcon className="eb-size-3.5" />
        {action.label}
      </button>
    </div>
  );
}
