/**
 * QuickStats - Key metrics row for client summary
 */

import { cn } from '@/lib/utils';

export interface QuickStat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface QuickStatsProps {
  stats: QuickStat[];
  className?: string;
}

export function QuickStats({ stats, className }: QuickStatsProps) {
  if (stats.length === 0) return null;

  return (
    <div
      className={cn(
        'eb-grid eb-grid-cols-2 eb-gap-3 @sm:eb-grid-cols-4',
        className
      )}
    >
      {stats.map((stat) => (
        <button
          key={stat.label}
          type="button"
          onClick={stat.onClick}
          disabled={!stat.onClick}
          className={cn(
            'eb-flex eb-flex-col eb-items-center eb-justify-center eb-rounded-lg eb-border eb-border-border eb-bg-muted/30 eb-p-3 eb-text-center eb-transition-colors',
            stat.onClick &&
              'eb-cursor-pointer hover:eb-border-primary/50 hover:eb-bg-muted/50',
            !stat.onClick && 'eb-cursor-default'
          )}
        >
          <div className="eb-flex eb-items-center eb-gap-1.5">
            {stat.icon && (
              <span className="eb-text-muted-foreground">{stat.icon}</span>
            )}
            <span className="eb-text-xl eb-font-semibold eb-text-foreground @sm:eb-text-2xl">
              {stat.value}
            </span>
          </div>
          <span className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
            {stat.label}
          </span>
        </button>
      ))}
    </div>
  );
}
