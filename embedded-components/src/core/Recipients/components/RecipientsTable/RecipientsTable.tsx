import React from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { RecipientColumnKey } from '../../Recipients.columns';
import { getSupportedPaymentMethods } from '../../utils/getSupportedPaymentMethods';
import { formatRecipientName } from '../../utils/recipientHelpers';
import { renderTableCell } from '../../utils/renderTableCell';
import { SortableColumnHeader } from '../SortableColumnHeader/SortableColumnHeader';
import { StatusBadge } from '../StatusBadge/StatusBadge';

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
  layout?: 'widget' | 'tablet' | 'desktop';
}

/**
 * RecipientsTable - Renders recipients in a table format
 *
 * Supports different layouts:
 * - widget: Minimal columns, right-aligned actions
 * - tablet: Full column configuration
 * - desktop: Fixed column layout with responsive visibility
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
  layout = 'desktop',
}) => {
  // Desktop layout uses fixed columns (legacy behavior)
  if (layout === 'desktop') {
    return (
      <div className="eb-overflow-hidden eb-rounded-md eb-border">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Person/Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Methods</TableHead>
                <TableHead className="eb-hidden sm:eb-table-cell">
                  Account
                </TableHead>
                <TableHead className="eb-hidden md:eb-table-cell">
                  Created
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="eb-py-8 eb-text-center eb-text-gray-500"
                  >
                    No recipients found
                  </TableCell>
                </TableRow>
              ) : (
                recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="eb-truncate eb-font-medium">
                      {formatRecipientName(recipient)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="eb-text-xs">
                        {recipient.partyDetails?.type === 'INDIVIDUAL'
                          ? 'Individual'
                          : 'Business'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={recipient.status!} />
                    </TableCell>
                    <TableCell>
                      <div className="eb-flex eb-flex-wrap eb-gap-1">
                        {getSupportedPaymentMethods(recipient).length > 0 ? (
                          getSupportedPaymentMethods(recipient).map(
                            (method) => (
                              <Badge
                                key={method}
                                variant="secondary"
                                className="eb-text-xs"
                              >
                                {method}
                              </Badge>
                            )
                          )
                        ) : (
                          <span className="eb-text-xs eb-text-gray-400">
                            None
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="eb-hidden sm:eb-table-cell">
                      <span className="eb-text-sm eb-text-gray-600">
                        {recipient.account?.number
                          ? `****${recipient.account.number.slice(-4)}`
                          : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="eb-hidden md:eb-table-cell">
                      <span className="eb-text-sm eb-text-gray-600">
                        {recipient.createdAt
                          ? new Date(recipient.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )
                          : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="eb-flex eb-gap-3">
                        {makePaymentComponent &&
                          recipient.status === 'ACTIVE' && (
                            <div className="eb-mr-auto">
                              {React.cloneElement(
                                makePaymentComponent as React.ReactElement,
                                {
                                  recipientId: recipient.id,
                                }
                              )}
                            </div>
                          )}
                        <Button
                          variant="link"
                          size="sm"
                          className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs"
                          onClick={() => onViewDetails(recipient)}
                          title="View details"
                        >
                          Details
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs"
                          onClick={() => onEdit(recipient)}
                          title="Edit recipient"
                        >
                          Edit
                        </Button>
                        {recipient.status === 'ACTIVE' && (
                          <Button
                            variant="link"
                            size="sm"
                            className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs eb-text-red-600 hover:eb-text-red-700"
                            onClick={() => onDeactivate(recipient)}
                            disabled={isDeactivating}
                            title="Deactivate recipient"
                          >
                            {isDeactivating ? 'Deactivating...' : 'Deactivate'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Widget and Tablet layouts use dynamic column configuration
  return (
    <div className="eb-overflow-hidden eb-rounded-md eb-border">
      <div>
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
                  No recipients found
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
                    })
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
