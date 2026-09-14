import { useId, type ReactNode } from 'react';

export function MaintenanceFormSection({
  title,
  description,
  children,
  divided = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  divided?: boolean;
}) {
  const headingId = useId();

  return (
    <section
      role="group"
      aria-labelledby={headingId}
      className={`eb-grid eb-gap-4 eb-py-6 @[48rem]:eb-grid-cols-[minmax(9rem,0.8fr)_minmax(0,2fr)] @[48rem]:eb-gap-8 ${
        divided ? 'eb-border-t' : ''
      }`}
    >
      <div>
        <h3
          id={headingId}
          className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider"
        >
          {title}
        </h3>
        {description ? (
          <p className="eb-mt-1 eb-text-xs eb-leading-5 eb-text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="eb-min-w-0 eb-space-y-4">{children}</div>
    </section>
  );
}
