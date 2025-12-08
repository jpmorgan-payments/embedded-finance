import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type {
  RecipientColumnKey,
  RecipientsColumnConfiguration,
} from '../../Recipients.columns';

/**
 * Props for RecipientsColumnVisibility component
 */
interface RecipientsColumnVisibilityProps {
  /** Current column configuration */
  columnConfig: RecipientsColumnConfiguration;
  /** Callback when column visibility changes */
  onColumnVisibilityChange: (
    columnKey: RecipientColumnKey,
    visible: boolean
  ) => void;
}

/**
 * RecipientsColumnVisibility - Column visibility toggle component
 *
 * Allows users to show/hide table columns.
 * Similar to DataTableViewOptions in Transactions table.
 */
export function RecipientsColumnVisibility({
  columnConfig,
  onColumnVisibilityChange,
}: RecipientsColumnVisibilityProps) {
  const { t: tRaw } = useTranslation(['recipients', 'common']);
  // Type assertion to avoid TypeScript overload issues
  const t = tRaw as (key: string, options?: any) => string;
  // Get all columns except 'actions' (actions should always be visible)
  const toggleableColumns = (
    Object.keys(columnConfig) as RecipientColumnKey[]
  ).filter((key) => key !== 'actions');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="eb-ml-auto eb-h-8">
          <Settings2 className="eb-mr-2 eb-h-4 eb-w-4" />
          {t('recipients:columnToggle.button', { defaultValue: 'Columns' })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="eb-w-[180px]">
        <DropdownMenuLabel>
          {t('recipients:columnToggle.label', {
            defaultValue: 'Toggle columns',
          })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleableColumns.map((columnKey) => {
          const config = columnConfig[columnKey];
          return (
            <DropdownMenuCheckboxItem
              key={columnKey}
              className="eb-capitalize"
              checked={config.visible}
              onCheckedChange={(checked) =>
                onColumnVisibilityChange(columnKey, !!checked)
              }
            >
              {config.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
