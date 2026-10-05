import {
  Building2Icon,
  NetworkIcon,
  PackageIcon,
  UserRoundIcon,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import type { MaintenanceStatusTone } from '../utils/maintenanceStatusTone';
import { maintenanceToneBadgeClass } from '../utils/maintenanceStatusTone';

const ICONS = {
  person: UserRoundIcon,
  business: Building2Icon,
  structure: NetworkIcon,
  product: PackageIcon,
};

export function MaintenanceEntityMedallion({
  kind,
  icon,
  tone = 'neutral',
  size = 'md',
  className,
}: {
  kind: keyof typeof ICONS;
  /** Overrides the kind's icon, e.g. to show a request's state. */
  icon?: LucideIcon;
  tone?: MaintenanceStatusTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const Icon = icon ?? ICONS[kind];

  return (
    <span
      aria-hidden="true"
      data-entity-medallion={kind}
      className={cn(
        'eb-flex eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full',
        size === 'sm' ? 'eb-size-7' : size === 'md' ? 'eb-size-8' : 'eb-size-9',
        maintenanceToneBadgeClass[tone === 'emphasis' ? 'neutral' : tone],
        className
      )}
    >
      <Icon className={size === 'sm' ? 'eb-size-3.5' : 'eb-size-4'} />
    </span>
  );
}
