import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui';

type MaintenanceDraftActionsProps = {
  editLabel: string;
  removeLabel?: string;
  moreLabel: string;
  onEdit: () => void;
  onRemove?: () => void;
};

export function MaintenanceDraftActions({
  editLabel,
  removeLabel,
  moreLabel,
  onEdit,
  onRemove,
}: MaintenanceDraftActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="eb-w-9 eb-px-0"
          aria-label={moreLabel}
          title={moreLabel}
        >
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <PencilIcon />
          {editLabel}
        </DropdownMenuItem>
        {removeLabel && onRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="eb-text-destructive focus:eb-text-destructive"
              onSelect={onRemove}
            >
              <Trash2Icon />
              {removeLabel}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
