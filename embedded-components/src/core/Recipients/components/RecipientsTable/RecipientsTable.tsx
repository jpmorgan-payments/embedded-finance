import React from 'react';
import { useTranslation } from 'react-i18next';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { RecipientColumnKey } from '../../Recipients.columns';
import { renderTableCell } from '../../utils/renderTableCell';
import { SortableColumnHeader } from '../SortableColumnHeader/SortableColumnHeader';

export interface RecipientsTableProps {
  recipients: Recipient[];
  visibleColumns: RecipientColumnKey[];
  columnConfig: Record<
    RecipientColumnKey,
    { visible: boolean; sortable: boolean; label: string }
  >;
  sortBy: RecipientColumnKey | null;
  sortOrder: 'asc' | 'desc';
  onSort: (column: RecipientColumnKey) => void;
  onViewDetails: (recipient: Recipient) => void;
  onEdit: (recipient: Recipient) => void;
  onDeactivate: (recipient: Recipient) => void;
  makePaymentComponent?: React.ReactNode;
  isDeactivating: boolean;
  locale?: string;
  layout?: 'widget' | 'tablet' | 'desktop';
}

/**
 * RecipientsTable - Renders recipients in a table format
 *
 * Supports different layouts:
 * - widget: Minimal columns, right-aligned actions
 * - tablet: Full column configuration
 * - desktop: Full column configuration with dynamic visibility
 *
 * All layouts use dynamic column configuration with sortable headers
 * and column visibility controls.
 */
export const RecipientsTable: React.FC<RecipientsTableProps> = ({
  recipients,
  visibleColumns,
  columnConfig,
  sortBy,
  sortOrder,
  onSort,
  onViewDetails,
  onEdit,
  onDeactivate,
  makePaymentComponent,
  isDeactivating,
  locale = 'en-US',
  layout = 'desktop',
}) => {
  const { t: tRaw } = useTranslation(['recipients', 'common']);
  // Type assertion to avoid TypeScript overload issues
  const t = tRaw as (key: string, options?: any) => string;
  // All layouts (desktop, tablet, widget) use dynamic column configuration
  return (
    <div className="eb-w-full eb-overflow-hidden eb-rounded-md eb-border">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((columnKey) => {
              const colConfig = columnConfig[columnKey];
              if (!colConfig || !colConfig.visible) return null;

              return (
                <TableHead
                  key={columnKey}
                  className={
                    columnKey === 'actions' && layout === 'widget'
                      ? 'eb-text-right'
                      : undefined
                  }
                >
                  {colConfig.sortable ? (
                    <SortableColumnHeader
                      title={colConfig.label}
                      sortKey={columnKey}
                      currentSortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={onSort}
                      sortable={colConfig.sortable}
                    />
                  ) : (
                    <div className="eb-font-semibold">{colConfig.label}</div>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length}
                className="eb-py-8 eb-text-center eb-text-gray-500"
              >
                {t('recipients:emptyState.noRecipients', {
                  defaultValue: 'No recipients found',
                })}
              </TableCell>
            </TableRow>
          ) : (
            recipients.map((recipient) => (
              <TableRow key={recipient.id}>
                {visibleColumns.map((columnKey) =>
                  renderTableCell(columnKey, recipient, {
                    onViewDetails,
                    onEdit,
                    onDeactivate,
                    makePaymentComponent,
                    isDeactivating,
                    locale,
                    t,
                  })
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
