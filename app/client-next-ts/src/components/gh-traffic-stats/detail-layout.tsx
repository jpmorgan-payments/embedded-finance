import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Body heights shared by both repository layouts. Every slot has the same
 * footprint whichever repository is selected, so switching tabs swaps content
 * in place instead of resizing the page.
 */
export const SLOT = {
  week: 330,
  daily: 280,
  side: 270,
  clones: 240,
} as const;

interface ChartCardProps {
  title: string;
  description: string;
  action?: ReactNode;
  /** Fixed body height in px; content scrolls rather than growing the card. */
  bodyHeight?: number;
  footnote?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  description,
  action,
  bodyHeight,
  footnote,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn('flex min-w-0 flex-col', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription
            className="line-clamp-2 h-8 text-xs leading-4"
            title={description}
          >
            {description}
          </CardDescription>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <div
          className={cn(bodyHeight && 'overflow-y-auto')}
          style={bodyHeight ? { height: bodyHeight } : undefined}
        >
          {children}
        </div>
        {footnote}
      </CardContent>
    </Card>
  );
}

/** One line of provenance under the KPI row; always present, never wraps. */
export function ProvenanceLine({ children }: { children: ReactNode }) {
  return (
    <p className="h-5 truncate rounded text-xs text-muted-foreground">
      {children}
    </p>
  );
}
