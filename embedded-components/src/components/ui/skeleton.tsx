import * as React from 'react';

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('eb-animate-pulse eb-rounded-md eb-bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
