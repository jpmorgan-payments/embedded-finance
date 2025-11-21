import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import type { RecipientColumnKey } from '../../Recipients.columns';

interface SortableColumnHeaderProps {
  title: string;
  sortKey: RecipientColumnKey;
  currentSortBy: RecipientColumnKey | null;
  sortOrder: 'asc' | 'desc';
  onSort: (column: RecipientColumnKey) => void;
  className?: string;
  sortable?: boolean;
}

/**
 * SortableColumnHeader - Reusable sortable column header component
 */
export function SortableColumnHeader({
  title,
  sortKey,
  currentSortBy,
  sortOrder,
  onSort,
  className,
  sortable = true,
}: SortableColumnHeaderProps) {
  const isSorted = currentSortBy === sortKey;

  if (!sortable) {
    return (
      <div className={cn('eb-font-semibold', className)}>
        <span>{title}</span>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'eb--ml-3 eb-h-8 eb-font-semibold hover:eb-bg-accent',
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span>{title}</span>
      {isSorted ? (
        sortOrder === 'desc' ? (
          <ArrowDown className="eb-ml-2 eb-h-4 eb-w-4" />
        ) : (
          <ArrowUp className="eb-ml-2 eb-h-4 eb-w-4" />
        )
      ) : (
        <ChevronsUpDown className="eb-ml-2 eb-h-4 eb-w-4 eb-opacity-50" />
      )}
    </Button>
  );
}
