import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type MaintenanceSectionProps = {
  id: string;
  title: ReactNode;
  caption?: ReactNode;
  actions?: ReactNode;
  afterContent?: ReactNode;
  unframed?: boolean;
  tone?: 'default' | 'informative' | 'warning';
  divided?: boolean;
  footer?: ReactNode;
  children: ReactNode;
};

/** Label gutter beside a bounded content group; the shared section shape for every maintenance view. */
export function MaintenanceSection({
  id,
  title,
  caption,
  actions,
  afterContent,
  unframed = false,
  tone = 'default',
  divided = false,
  footer,
  children,
}: MaintenanceSectionProps) {
  const contentGroup = unframed ? (
    <div className="eb-min-w-0">{children}</div>
  ) : (
    <div
      className={cn(
        'eb-overflow-hidden eb-rounded-md eb-border eb-bg-background',
        tone === 'informative' && 'eb-border-informative/50',
        tone === 'warning' && 'eb-border-warning/50'
      )}
    >
      {children}
      {footer ? (
        <div className="eb-border-t eb-bg-muted/10 eb-px-4 eb-py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      aria-labelledby={id}
      className={cn(
        'eb-grid eb-gap-x-8 eb-gap-y-3 eb-px-4 eb-py-5 sm:eb-grid-cols-[minmax(8rem,1fr)_2.5fr]',
        tone === 'informative'
          ? 'eb-bg-informative-accent/40'
          : tone === 'warning'
            ? 'eb-bg-warning-accent/40'
            : 'eb-bg-muted/20',
        divided && 'eb-border-t'
      )}
    >
      <div>
        <h3
          id={id}
          className={cn(
            'eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider',
            tone === 'informative'
              ? 'eb-text-informative'
              : tone === 'warning'
                ? 'eb-text-warning'
                : 'eb-text-foreground'
          )}
        >
          {title}
        </h3>
        {caption ? (
          <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
            {caption}
          </p>
        ) : null}
      </div>
      {actions || afterContent ? (
        <div className="eb-min-w-0">
          {actions ? (
            <div className="eb-mb-3 eb-flex eb-flex-wrap eb-items-center eb-justify-end eb-gap-2">
              {actions}
            </div>
          ) : null}
          {contentGroup}
          {afterContent ? (
            <div className="eb-mt-3 eb-flex eb-justify-end">{afterContent}</div>
          ) : null}
        </div>
      ) : (
        contentGroup
      )}
    </section>
  );
}
