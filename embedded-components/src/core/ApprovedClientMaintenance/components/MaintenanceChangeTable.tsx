import { useTranslationWithTokens } from '@/i18n';

import { cn } from '@/lib/utils';

import type { PartyFieldChange } from '../utils/buildMaintenanceProjection';

type MaintenanceChangeTableProps = {
  changes: PartyFieldChange[];
  mode: 'draft' | 'submitted';
};

export function MaintenanceChangeTable({
  changes,
  mode,
}: MaintenanceChangeTableProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const updatedValueLabel =
    mode === 'draft'
      ? tString('changes.draftUpdate')
      : tString('changes.submittedUpdate');

  return (
    <div>
      <div className="eb-hidden eb-grid-cols-[minmax(5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] eb-gap-3 eb-border-b eb-bg-muted/30 eb-px-4 eb-py-2 sm:eb-grid">
        <span className="eb-text-xs eb-font-semibold eb-text-muted-foreground">
          {t('changes.field')}
        </span>
        <span className="eb-text-xs eb-font-semibold eb-text-muted-foreground">
          {t('changes.currentProfile')}
        </span>
        <span className="eb-text-xs eb-font-semibold eb-text-muted-foreground">
          {updatedValueLabel}
        </span>
      </div>
      <dl className="eb-divide-y">
        {changes.map((change) => {
          const fieldLabel = tString([
            `editor.${change.field}`,
          ] as unknown as TemplateStringsArray);
          const currentValue = change.approvedValue || tString('notProvided');
          const updatedValue = change.proposedValue || tString('notProvided');
          const isCurrentValueMissing = !change.approvedValue;
          const isUpdatedValueMissing = !change.proposedValue;

          return (
            <div
              key={change.field}
              className="eb-grid eb-grid-cols-2 eb-items-start eb-gap-x-3 eb-gap-y-2 eb-px-4 eb-py-3 sm:eb-grid-cols-[minmax(5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] sm:eb-items-center"
            >
              <dt className="eb-col-span-2 eb-text-sm eb-font-medium sm:eb-col-span-1">
                {fieldLabel}
              </dt>
              <dd
                className={cn(
                  'eb-min-w-0 eb-break-words eb-text-sm eb-text-muted-foreground',
                  isCurrentValueMissing && 'eb-italic'
                )}
                aria-label={`${tString('changes.currentProfile')}: ${currentValue}`}
              >
                <span className="eb-mb-0.5 eb-block eb-text-xs eb-font-semibold eb-text-muted-foreground sm:eb-hidden">
                  {t('changes.currentProfile')}
                </span>
                {currentValue}
              </dd>
              <dd
                className={cn(
                  'eb-min-w-0 eb-break-words eb-text-sm eb-font-medium',
                  isUpdatedValueMissing && 'eb-italic eb-text-muted-foreground'
                )}
                aria-label={`${updatedValueLabel}: ${updatedValue}`}
              >
                <span className="eb-mb-0.5 eb-block eb-text-xs eb-font-semibold eb-text-muted-foreground sm:eb-hidden">
                  {updatedValueLabel}
                </span>
                {updatedValue}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
