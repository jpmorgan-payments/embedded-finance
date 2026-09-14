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
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const updatedValueLabel =
    mode === 'draft'
      ? tString('changes.draftUpdate')
      : tString('changes.submittedUpdate');

  if (changes.length === 0) return null;

  return (
    <div>
      <div className="eb-hidden eb-grid-cols-[minmax(5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] eb-gap-3 eb-border-b eb-bg-muted/30 eb-px-4 eb-py-2 @[40rem]:eb-grid">
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
            change.labelKey,
          ] as unknown as TemplateStringsArray);
          const formatValue = (rawValue: unknown, displayValue: string) =>
            change.field === 'roles' && Array.isArray(rawValue)
              ? rawValue
                  .map((role) =>
                    tString(
                      [
                        `common:partyRoles.${String(role)}`,
                      ] as unknown as TemplateStringsArray,
                      { defaultValue: String(role) }
                    )
                  )
                  .join(', ')
              : displayValue;
          const approvedDisplayValue = formatValue(
            change.approvedRawValue,
            change.approvedValue
          );
          const proposedDisplayValue = formatValue(
            change.proposedRawValue,
            change.proposedValue
          );
          const currentValue = approvedDisplayValue || tString('notProvided');
          const updatedValue = proposedDisplayValue || tString('notProvided');
          const isCurrentValueMissing = !change.approvedValue;
          const isUpdatedValueMissing = !change.proposedValue;

          return (
            <div
              key={change.field}
              className="eb-grid eb-grid-cols-2 eb-items-start eb-gap-x-3 eb-gap-y-2 eb-px-4 eb-py-3 @[40rem]:eb-grid-cols-[minmax(5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] @[40rem]:eb-items-center"
            >
              <dt className="eb-col-span-2 eb-text-sm eb-font-medium @[40rem]:eb-col-span-1">
                {fieldLabel}
              </dt>
              <dd
                className={cn(
                  'eb-min-w-0 eb-break-words eb-text-sm eb-text-muted-foreground',
                  isCurrentValueMissing && 'eb-italic'
                )}
                aria-label={`${tString('changes.currentProfile')}: ${currentValue}`}
              >
                <span className="eb-mb-0.5 eb-block eb-text-xs eb-font-semibold eb-text-muted-foreground @[40rem]:eb-hidden">
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
                <span className="eb-mb-0.5 eb-block eb-text-xs eb-font-semibold eb-text-muted-foreground @[40rem]:eb-hidden">
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
