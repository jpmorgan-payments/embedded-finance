import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type MaintenanceDetail = {
  label: ReactNode;
  value?: ReactNode;
  multiline?: boolean;
};

export function MaintenanceDetailsGroup({
  title,
  description,
  details,
  notProvided,
  unframed = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  details: MaintenanceDetail[];
  notProvided: ReactNode;
  unframed?: boolean;
}) {
  return (
    <section className="eb-border-t first:eb-border-t-0">
      <header
        className={cn(
          'eb-py-3',
          unframed ? 'eb-px-0' : 'eb-bg-muted/20 eb-px-5'
        )}
      >
        <h4 className="eb-text-sm eb-font-semibold">{title}</h4>
        {description ? (
          <p className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      <dl className={cn('eb-divide-y', unframed ? 'eb-px-0' : 'eb-px-5')}>
        {details.map((detail, index) => {
          const hasValue =
            detail.value !== undefined &&
            detail.value !== null &&
            detail.value !== '';
          return (
            <div
              key={`${String(detail.label)}-${index}`}
              className="eb-grid eb-gap-1 eb-py-3 @[40rem]:eb-grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.6fr)] @[40rem]:eb-gap-6"
            >
              <dt className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                {detail.label}
              </dt>
              <dd
                className={cn(
                  'eb-text-sm eb-font-medium',
                  detail.multiline && 'eb-whitespace-pre-line',
                  !hasValue && 'eb-font-normal eb-text-muted-foreground'
                )}
              >
                {hasValue ? detail.value : notProvided}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
