import type { ReactNode } from 'react';
import { EllipsisVerticalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui';

export type MaintenanceAction = {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  destructive?: boolean;
  onSelect: () => void;
};

export function MaintenanceActionMenu({
  label,
  actions,
}: {
  label: string;
  actions: MaintenanceAction[];
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="eb-size-8 eb-shrink-0 eb-px-0"
          aria-label={label}
          title={label}
        >
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="eb-max-w-[18rem]">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            className={cn(
              'eb-items-start',
              action.destructive &&
                'eb-text-destructive focus:eb-text-destructive'
            )}
            onSelect={action.onSelect}
          >
            <span className="eb-mt-0.5 eb-shrink-0 [&>svg]:eb-size-4">
              {action.icon}
            </span>
            <span className="eb-min-w-0 eb-flex-1">
              <span className="eb-block eb-font-medium">{action.label}</span>
              {action.description ? (
                <span
                  className={cn(
                    'eb-mt-0.5 eb-block eb-whitespace-normal eb-text-xs eb-leading-5',
                    action.destructive
                      ? 'eb-text-destructive/80'
                      : 'eb-text-muted-foreground'
                  )}
                >
                  {action.description}
                </span>
              ) : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
