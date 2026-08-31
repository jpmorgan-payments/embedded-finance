import type { ReactNode } from 'react';
import { ArrowLeftIcon } from 'lucide-react';

import { Button } from '@/components/ui';

type MaintenanceViewNavigationProps = {
  backLabel: string;
  onBack: () => void;
  action?: ReactNode;
};

export function MaintenanceViewNavigation({
  backLabel,
  onBack,
  action,
}: MaintenanceViewNavigationProps) {
  return (
    <nav
      aria-label={backLabel}
      className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-3 eb-border-t eb-bg-background eb-px-4 eb-py-4"
    >
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeftIcon />
        {backLabel}
      </Button>
      {action}
    </nav>
  );
}
