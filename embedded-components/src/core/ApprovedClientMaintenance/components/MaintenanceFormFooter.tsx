import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function MaintenanceFormFooter({
  leading,
  trailing,
  sticky = false,
  className,
}: {
  leading?: ReactNode;
  trailing: ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        'eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-3 eb-border-t eb-bg-background eb-px-4 eb-py-3',
        sticky &&
          'eb-sticky eb-bottom-0 eb--mx-4 eb-bg-background/95 eb-backdrop-blur',
        className
      )}
    >
      {leading ?? <span />}
      {trailing}
    </footer>
  );
}
