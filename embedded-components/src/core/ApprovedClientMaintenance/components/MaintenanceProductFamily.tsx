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

import {
  MaintenanceActionMenu,
  type MaintenanceAction,
} from './MaintenanceActionMenu';
import { MaintenanceTreeBranch } from './MaintenanceTreeBranch';

export type MaintenanceProductState =
  | 'active'
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
  menu?: { label: string; actions: MaintenanceAction[] };
};

const STATE_ICON: Partial<Record<MaintenanceProductState, typeof Clock3Icon>> =
  {
    pending: PackagePlusIcon,
    review: Clock3Icon,
    action: AlertTriangleIcon,
    declined: XCircleIcon,
  };

// Toned frames like the ownership structure's cards; fills stay for page banners.
const STATE_CARD_CLASS: Partial<Record<MaintenanceProductState, string>> = {
  pending: 'eb-border-informative/50',
  review: 'eb-border-informative/50',
  action: 'eb-border-warning/50',
  declined: 'eb-border-destructive/50',
};

const STATE_TEXT_CLASS: Partial<Record<MaintenanceProductState, string>> = {
  pending: 'eb-font-semibold eb-text-informative',
  review: 'eb-font-semibold eb-text-informative',
  action: 'eb-font-semibold eb-text-warning-foreground',
  declined: 'eb-font-semibold eb-text-destructive',
};

const STATE_ICON_CLASS: Partial<Record<MaintenanceProductState, string>> = {
  pending: 'eb-bg-informative-accent eb-text-informative',
  review: 'eb-bg-informative-accent eb-text-informative',
  action: 'eb-bg-warning-accent eb-text-warning-foreground',
  declined: 'eb-bg-destructive-accent eb-text-destructive',
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
    <div data-product-family="" data-product-tree="">
      <div className="eb-flex eb-items-center eb-gap-3">
        <span className="eb-flex eb-size-9 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-sm eb-bg-muted eb-text-foreground">
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
      {subProducts.length > 0 ? (
        <ul className="eb-ml-[1.125rem] eb-mt-2 eb-space-y-2">
          {subProducts.map((subProduct, index) => {
            const StatusIcon = STATE_ICON[subProduct.state];
            const NodeIcon = StatusIcon ?? BoxesIcon;
            const isLast = index === subProducts.length - 1;
            const line = subProduct.state === 'pending' ? 'dashed' : 'solid';
            return (
              <MaintenanceTreeBranch
                key={subProduct.id}
                isLast={isLast}
                line={line}
                nextLine={
                  subProducts[index + 1]?.state === 'pending'
                    ? 'dashed'
                    : 'solid'
                }
                data-sub-product={subProduct.id}
                data-last-sub-product={isLast ? 'true' : 'false'}
              >
                <div
                  className={cn(
                    'eb-flex eb-items-stretch eb-overflow-hidden eb-rounded-md eb-border eb-bg-background',
                    STATE_CARD_CLASS[subProduct.state]
                  )}
                >
                  <div className="eb-flex eb-min-w-0 eb-flex-1 eb-items-start eb-gap-3 eb-p-3">
                    <span
                      className={cn(
                        'eb-flex eb-size-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-sm eb-bg-muted eb-text-muted-foreground',
                        STATE_ICON_CLASS[subProduct.state]
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
                          'eb-text-xs eb-text-muted-foreground',
                          STATE_TEXT_CLASS[subProduct.state]
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
                  {subProduct.menu ? (
                    <div
                      data-sub-product-actions=""
                      className="eb-flex eb-shrink-0 eb-items-start eb-border-l eb-border-border eb-p-1.5"
                    >
                      <MaintenanceActionMenu
                        label={subProduct.menu.label}
                        actions={subProduct.menu.actions}
                      />
                    </div>
                  ) : null}
                </div>
              </MaintenanceTreeBranch>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
