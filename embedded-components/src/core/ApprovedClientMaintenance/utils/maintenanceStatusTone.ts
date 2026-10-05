export type MaintenanceStatusTone =
  | 'informative'
  | 'emphasis'
  | 'warning'
  | 'destructive'
  | 'neutral';

export const maintenanceToneTextClass: Record<MaintenanceStatusTone, string> = {
  informative: 'eb-text-informative',
  emphasis: 'eb-text-foreground',
  warning: 'eb-text-warning-foreground',
  destructive: 'eb-text-destructive',
  neutral: 'eb-text-muted-foreground',
};

export const maintenanceToneBadgeClass: Record<MaintenanceStatusTone, string> =
  {
    informative: 'eb-bg-informative-accent eb-text-informative',
    emphasis: 'eb-border eb-border-border eb-bg-background eb-text-foreground',
    warning: 'eb-bg-warning-accent eb-text-warning-foreground',
    destructive: 'eb-bg-destructive-accent eb-text-destructive',
    neutral: 'eb-bg-muted eb-text-muted-foreground',
  };
