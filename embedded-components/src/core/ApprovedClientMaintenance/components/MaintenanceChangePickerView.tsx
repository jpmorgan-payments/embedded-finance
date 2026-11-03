import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowLeftIcon, ChevronRightIcon, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { useIsMaintenanceBusy } from './MaintenanceBusyContext';
import {
  CHANGE_CARD_CLASS,
  CHANGE_HEADER_CLASS,
  HEADER_CLASS,
  MaintenanceChangeEyebrow,
  PAGE_CLASS,
} from './MaintenanceChangeEyebrow';
import { MaintenanceEntityMedallion } from './MaintenanceEntityMedallion';
import { MaintenanceFormFooter } from './MaintenanceFormFooter';
import { MaintenancePageBody } from './MaintenancePageBody';

export type MaintenanceChangeChoice = {
  id: string;
  kind: 'person' | 'business' | 'structure';
  /** Overrides the kind's icon. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  onSelect: () => void;
};

/**
 * A step of a change request: a list of what can change, each leading to its
 * own form or to the next list.
 */
export function MaintenanceChangePickerView({
  title,
  description,
  choices,
  emptyMessage,
  breadcrumbs,
  backLabel,
  onBack,
}: {
  title: string;
  description: string;
  choices: MaintenanceChangeChoice[];
  emptyMessage: string;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  backLabel: string;
  onBack: () => void;
}) {
  const { tString } = useTranslationWithTokens('approved-client-maintenance');
  const isBusy = useIsMaintenanceBusy();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return (
    <div className={cn(PAGE_CLASS, CHANGE_CARD_CLASS)}>
      <header className={cn(HEADER_CLASS, CHANGE_HEADER_CLASS)}>
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <MaintenanceChangeEyebrow />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="eb-text-lg eb-font-semibold focus:eb-outline-none"
        >
          {title}
        </h2>
        <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-text-muted-foreground">
          {description}
        </p>
      </header>
      <MaintenancePageBody contentClassName="eb-bg-muted/20 eb-px-4 eb-py-5 @[40rem]:eb-px-5">
        {choices.length === 0 ? (
          <p className="eb-rounded-md eb-border eb-bg-background eb-px-4 eb-py-3.5 eb-text-sm eb-text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul
            data-change-choices=""
            className="eb-divide-y eb-overflow-hidden eb-rounded-md eb-border eb-bg-background"
          >
            {choices.map((choice) => (
              <li key={choice.id}>
                <button
                  type="button"
                  data-change-choice={choice.id}
                  disabled={isBusy}
                  className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-4 eb-py-3.5 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring disabled:eb-cursor-not-allowed disabled:eb-opacity-60"
                  onClick={choice.onSelect}
                >
                  <MaintenanceEntityMedallion
                    kind={choice.kind}
                    icon={choice.icon}
                    size="lg"
                  />
                  <span className="eb-min-w-0 eb-flex-1">
                    <span className="eb-block eb-text-sm eb-font-medium">
                      {choice.title}
                    </span>
                    {choice.description ? (
                      <span className="eb-block eb-text-xs eb-leading-5 eb-text-muted-foreground">
                        {choice.description}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="eb-size-4 eb-shrink-0 eb-text-muted-foreground"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </MaintenancePageBody>
      <MaintenanceFormFooter
        leading={
          <Button variant="outlineSurface" size="sm" onClick={onBack}>
            <ArrowLeftIcon />
            {backLabel}
          </Button>
        }
        trailing={null}
      />
    </div>
  );
}
