import type { ReactNode } from 'react';
import {
  AlertTriangleIcon,
  BoxesIcon,
  Clock3Icon,
  PackageIcon,
  PackagePlusIcon,
  XCircleIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export type MaintenanceProductState =
  | 'active'
  | 'available'
  | 'ready'
  | 'pending'
  | 'review'
  | 'action'
  | 'declined';

export type MaintenanceSubProductItem = {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  state: MaintenanceProductState;
  eyebrow?: ReactNode;
  presentation?: 'detail' | 'action-only';
  action?: ReactNode;
};

const STATE_ICON: Partial<Record<MaintenanceProductState, typeof Clock3Icon>> =
  {
    pending: PackagePlusIcon,
    review: Clock3Icon,
    action: AlertTriangleIcon,
    declined: XCircleIcon,
  };

export function MaintenanceProductFamily({
  productName,
  productLabel,
  subProductLabel,
  subProducts,
}: {
  productName: ReactNode;
  productLabel: ReactNode;
  subProductLabel: ReactNode;
  subProducts: MaintenanceSubProductItem[];
}) {
  return (
    <div
      data-product-family=""
      data-product-tree=""
      className="eb-bg-background"
    >
      <div className="eb-flex eb-items-center eb-gap-3 eb-pb-2">
        <span className="eb-relative eb-z-10 eb-flex eb-size-9 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-sm eb-bg-muted eb-text-foreground">
          <PackageIcon className="eb-size-5" aria-hidden="true" />
        </span>
        <div className="eb-min-w-0">
          <p className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-muted-foreground">
            {productLabel}
          </p>
          <h4 className="eb-mt-0.5 eb-truncate eb-text-base eb-font-semibold">
            {productName}
          </h4>
        </div>
      </div>
      <ul className="eb-ml-[1.125rem]">
        {subProducts.map((subProduct, index) => {
          const StatusIcon = STATE_ICON[subProduct.state];
          const NodeIcon = StatusIcon ?? BoxesIcon;
          const isActionOnly = subProduct.presentation === 'action-only';
          const isFirst = index === 0;
          const isLast = index === subProducts.length - 1;
          return (
            <li
              key={subProduct.id}
              data-sub-product={subProduct.id}
              data-last-sub-product={isLast ? 'true' : 'false'}
              data-presentation={isActionOnly ? 'action-only' : 'detail'}
              className={cn(
                'eb-relative eb-grid eb-gap-3 eb-py-3 eb-pl-8 eb-pr-1 @[40rem]:eb-grid-cols-[minmax(0,1fr)_auto] @[40rem]:eb-items-center',
                subProduct.state === 'action' &&
                  'eb-rounded-sm eb-bg-warning-accent/40',
                subProduct.state === 'declined' &&
                  'eb-rounded-sm eb-bg-destructive-accent/30'
              )}
            >
              <span
                aria-hidden="true"
                data-tree-spine=""
                className={cn(
                  'eb-absolute eb-left-0 eb-border-l eb-border-border',
                  isFirst ? 'eb--top-2' : 'eb-top-0',
                  isLast ? 'eb-bottom-1/2' : 'eb-bottom-0'
                )}
              />
              <span
                aria-hidden="true"
                className="eb-absolute eb-left-0 eb-top-1/2 eb-w-8 eb-border-t eb-border-border"
              />
              {isActionOnly ? (
                <div className="eb-col-span-full eb-flex eb-items-center">
                  {subProduct.action}
                </div>
              ) : (
                <>
                  <div className="eb-flex eb-min-w-0 eb-items-start eb-gap-3">
                    <span
                      className={cn(
                        'eb-relative eb-z-10 eb-flex eb-size-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-sm',
                        StatusIcon
                          ? 'eb-bg-informative-accent eb-text-informative'
                          : 'eb-bg-muted eb-text-muted-foreground',
                        subProduct.state === 'action' &&
                          'eb-bg-warning-accent eb-text-warning-foreground',
                        subProduct.state === 'declined' &&
                          'eb-bg-destructive-accent eb-text-destructive'
                      )}
                    >
                      <NodeIcon
                        className="eb-size-4"
                        data-product-state-icon={
                          StatusIcon ? subProduct.state : undefined
                        }
                        aria-hidden="true"
                      />
                    </span>
                    <div className="eb-min-w-0">
                      <p
                        className={cn(
                          'eb-text-xs',
                          StatusIcon
                            ? 'eb-font-semibold eb-text-informative'
                            : 'eb-text-muted-foreground',
                          subProduct.state === 'action' &&
                            'eb-text-warning-foreground',
                          subProduct.state === 'declined' &&
                            'eb-text-destructive'
                        )}
                      >
                        {subProduct.eyebrow ?? subProductLabel}
                      </p>
                      <p className="eb-mt-0.5 eb-text-sm eb-font-medium">
                        {subProduct.label}
                      </p>
                      {subProduct.description ? (
                        <p className="eb-mt-1 eb-text-xs eb-leading-5 eb-text-muted-foreground">
                          {subProduct.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2 eb-pl-11 @[40rem]:eb-justify-end @[40rem]:eb-pl-0">
                    {subProduct.action}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
