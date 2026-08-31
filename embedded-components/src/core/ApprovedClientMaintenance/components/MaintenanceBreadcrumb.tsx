import type { ReactNode } from 'react';
import { ChevronRightIcon } from 'lucide-react';

export type MaintenanceBreadcrumbItem = {
  label: ReactNode;
  onSelect?: () => void;
};

type MaintenanceBreadcrumbProps = {
  items: MaintenanceBreadcrumbItem[];
  ariaLabel: string;
};

export function MaintenanceBreadcrumb({
  items,
  ariaLabel,
}: MaintenanceBreadcrumbProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="eb-mb-3 eb-flex eb-min-w-0 eb-items-center eb-gap-1 eb-text-sm eb-text-muted-foreground"
    >
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        return (
          <span
            key={`${String(item.label)}-${index}`}
            className="eb-flex eb-min-w-0 eb-items-center eb-gap-1"
          >
            {index > 0 ? (
              <ChevronRightIcon
                className="eb-size-3.5 eb-shrink-0"
                aria-hidden="true"
              />
            ) : null}
            {item.onSelect && !isCurrent ? (
              <button
                type="button"
                className="eb-flex eb-min-w-0 eb-items-center eb-gap-1 eb-text-sm eb-text-muted-foreground hover:eb-text-foreground hover:eb-underline focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring"
                onClick={item.onSelect}
              >
                <span className="eb-truncate">{item.label}</span>
              </button>
            ) : (
              <span
                className="eb-truncate eb-font-medium eb-text-foreground"
                aria-current={isCurrent ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
