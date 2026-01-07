import * as React from 'react';
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClipboardListIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  canVerifyMicrodeposits,
  getRecipientDisplayName,
} from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
import { ApiError } from '@/api/generated/ep-recipients.schemas';
import type {
  MicrodepositVerificationResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RecipientDetailsDialog } from '../RecipientDetailsDialog/RecipientDetailsDialog';
import { MakePayment } from '@/core/MakePayment';

import { MicrodepositsFormDialogTrigger } from '../../forms/MicrodepositsForm/MicrodepositsForm';
import { useLinkedAccountsTable } from '../../hooks/useLinkedAccountsTable';
import { LINKED_ACCOUNT_USER_JOURNEYS } from '../../RecipientWidgets.constants';
import { SupportedRecipientType } from '../../types';
import { LinkedAccountFormDialog } from '../LinkedAccountFormDialog/LinkedAccountFormDialog';
import { RemoveAccountDialogTrigger } from '../RemoveAccountDialog/RemoveAccountDialog';
import { getLinkedAccountsColumns } from './LinkedAccountsTableView.columns';

/**
 * Props for LinkedAccountsTableView component
 *
 * Can operate in two modes:
 * 1. Client-side pagination: Pass `data` prop with all accounts
 * 2. Server-side pagination: Set `useServerPagination={true}` and the component
 *    will fetch data automatically
 */
export interface LinkedAccountsTableViewProps {
  /** Array of linked account recipients to display (client-side pagination mode) */
  data?: Recipient[];

  /** Whether to use server-side pagination via the useLinkedAccountsTable hook */
  useServerPagination?: boolean;

  /** Optional MakePayment component renderer */
  renderPaymentAction?: (recipient: Recipient) => React.ReactNode;

  /** Callback when account is edited or removed */
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;

  /** Callback when microdeposit verification is completed */
  onMicrodepositVerifySettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: Recipient
  ) => void;

  /** Callback when account is successfully removed */
  onRemoveSuccess?: (recipient: Recipient) => void;

  /** Optional additional CSS classes */
  className?: string;

  /** Default page size for pagination */
  defaultPageSize?: number;

  /** Show/hide pagination controls */
  showPagination?: boolean;

  /**
   * Type of recipients to display
   * @default 'LINKED_ACCOUNT'
   */
  recipientType?: SupportedRecipientType;
}

/**
 * LinkedAccountsTableView - Table view for linked accounts using TanStack Table
 *
 * Features:
 * - Sortable columns (account holder, status, created date)
 * - Filterable by status
 * - Pagination with configurable page size (client-side or server-side)
 * - Row actions (edit, verify, delete)
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * // Server-side pagination (recommended for large datasets)
 * <LinkedAccountsTableView
 *   useServerPagination
 *   onLinkedAccountSettled={(recipient, error) => {
 *     if (error) console.error('Error:', error);
 *     else console.log('Success:', recipient);
 *   }}
 * />
 *
 * // Client-side pagination (for small datasets)
 * <LinkedAccountsTableView
 *   data={linkedAccounts}
 *   onLinkedAccountSettled={(recipient, error) => {
 *     if (error) console.error('Error:', error);
 *     else console.log('Success:', recipient);
 *   }}
 * />
 * ```
 */
export const LinkedAccountsTableView: React.FC<
  LinkedAccountsTableViewProps
> = ({
  data: propData,
  useServerPagination = false,
  renderPaymentAction,
  onLinkedAccountSettled,
  onMicrodepositVerifySettled,
  onRemoveSuccess,
  className,
  defaultPageSize = 10,
  showPagination = true,
  recipientType = 'LINKED_ACCOUNT',
}) => {
  const { t } = useTranslation('linked-accounts');

  // Track which account numbers are visible (show full number)
  const [visibleAccountNumbers, setVisibleAccountNumbers] = React.useState<
    Set<string>
  >(new Set());

  // Toggle account number visibility
  const handleToggleAccountNumber = React.useCallback((id: string) => {
    setVisibleAccountNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Table state - pagination controlled here to work with both modes
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  // Server-side pagination hook (only used when useServerPagination is true)
  const serverPaginationData = useLinkedAccountsTable({
    pagination,
    onPaginationChange: setPagination,
    recipientType,
  });

  // Determine which data and pagination values to use
  const isServerMode = useServerPagination;
  const data = isServerMode
    ? serverPaginationData.linkedAccounts
    : propData || [];
  const totalCount = isServerMode
    ? serverPaginationData.totalCount
    : data.length;
  const pageCount = isServerMode
    ? serverPaginationData.pageCount
    : Math.ceil(data.length / pagination.pageSize);
  const isLoading = isServerMode ? serverPaginationData.isLoading : false;

  // Pay button renderer for the table
  const renderPayButton = React.useCallback(
    (recipient: Recipient) => {
      const isActive = recipient.status === 'ACTIVE';
      const displayName = getRecipientDisplayName(recipient);

      // If custom payment action is provided, use it
      if (renderPaymentAction) {
        return isActive ? renderPaymentAction(recipient) : null;
      }

      // Default: Use built-in MakePayment component
      if (!isActive) {
        return null;
      }

      return (
        <MakePayment
          triggerButton={
            <Button
              variant="outline"
              size="sm"
              className="eb-h-8 eb-text-xs"
              aria-label={`${t('actions.makePayment')} from ${displayName}`}
            >
              {t('actions.makePayment', { defaultValue: 'Pay' })}
            </Button>
          }
          recipientId={recipient.id}
        />
      );
    },
    [renderPaymentAction, t]
  );

  // Row actions renderer (dropdown menu)
  const renderRowActions = React.useCallback(
    (recipient: Recipient) => {
      const displayName = getRecipientDisplayName(recipient);
      const showVerifyButton = canVerifyMicrodeposits(recipient);
      const isActive = recipient.status === 'ACTIVE';

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="eb-h-8 eb-w-8"
              aria-label={t('actions.moreActions', {
                defaultValue: 'More actions for {{name}}',
                name: displayName,
              })}
            >
              <MoreVerticalIcon className="eb-h-4 eb-w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="eb-w-48">
            {/* View Details - matches card view */}
            <RecipientDetailsDialog recipient={recipient}>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="eb-cursor-pointer"
              >
                <ClipboardListIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                {t('actions.viewDetails', { defaultValue: 'View details' })}
              </DropdownMenuItem>
            </RecipientDetailsDialog>

            {/* Verify Microdeposits */}
            {showVerifyButton && (
              <>
                <DropdownMenuSeparator />
                <MicrodepositsFormDialogTrigger
                  recipientId={recipient.id}
                  onVerificationSettled={(response) =>
                    onMicrodepositVerifySettled?.(response, recipient)
                  }
                >
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="eb-cursor-pointer"
                    data-user-event={
                      LINKED_ACCOUNT_USER_JOURNEYS.VERIFY_STARTED
                    }
                  >
                    <ArrowRightIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                    {t('actions.verifyAccount', {
                      defaultValue: 'Verify account',
                    })}
                  </DropdownMenuItem>
                </MicrodepositsFormDialogTrigger>
              </>
            )}

            <DropdownMenuSeparator />

            {/* Edit Account - disabled for non-ACTIVE accounts (matches card) */}
            {isActive ? (
              <LinkedAccountFormDialog
                mode="edit"
                recipient={recipient}
                onLinkedAccountSettled={onLinkedAccountSettled}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="eb-cursor-pointer"
                >
                  <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                  {t('actions.edit', { defaultValue: 'Edit' })}
                </DropdownMenuItem>
              </LinkedAccountFormDialog>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DropdownMenuItem
                      disabled
                      className="eb-cursor-not-allowed eb-opacity-50"
                    >
                      <PencilIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                      {t('actions.edit', { defaultValue: 'Edit' })}
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>
                    {t('actions.editDisabledTooltip', {
                      defaultValue: 'Cannot edit inactive account',
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            <DropdownMenuSeparator />

            {/* Remove Account */}
            <RemoveAccountDialogTrigger
              recipient={recipient}
              onLinkedAccountSettled={onLinkedAccountSettled}
              onRemoveSuccess={onRemoveSuccess}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="eb-cursor-pointer eb-text-destructive focus:eb-text-destructive"
                data-user-event={LINKED_ACCOUNT_USER_JOURNEYS.REMOVE_STARTED}
              >
                <TrashIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                {t('actions.remove', { defaultValue: 'Remove' })}
              </DropdownMenuItem>
            </RemoveAccountDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [t, onLinkedAccountSettled, onMicrodepositVerifySettled, onRemoveSuccess]
  );

  // Generate columns with actions
  const columns = React.useMemo(
    () =>
      getLinkedAccountsColumns({
        t: t as unknown as (key: string, options?: unknown) => string,
        renderActions: renderRowActions,
        renderPayButton,
        visibleAccountNumbers,
        onToggleAccountNumber: handleToggleAccountNumber,
      }),
    [
      t,
      renderRowActions,
      renderPayButton,
      visibleAccountNumbers,
      handleToggleAccountNumber,
    ]
  );

  // Initialize table instance
  const table = useReactTable({
    data,
    columns,
    // Use manual pagination for server-side mode
    manualPagination: isServerMode,
    pageCount: isServerMode ? pageCount : undefined,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerMode ? undefined : getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  return (
    <div className={cn('eb-w-full eb-space-y-4', className)}>
      {/* Table */}
      <div className="eb-rounded-md eb-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="eb-whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: pagination.pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_col, j) => (
                    <TableCell key={`skeleton-cell-${i}-${j}`}>
                      <Skeleton className="eb-h-5 eb-w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="eb-transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="eb-h-24 eb-text-center"
                >
                  {t('table.noResults', {
                    defaultValue: 'No linked accounts found.',
                  })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (isServerMode ? totalCount > 0 : data.length > 0) && (
        <div className="eb-flex eb-items-center eb-justify-between eb-px-2">
          <div className="eb-flex eb-items-center eb-space-x-2 eb-text-sm eb-text-muted-foreground">
            <span>
              {t('table.showing', {
                defaultValue: 'Showing {{from}} to {{to}} of {{total}}',
                from:
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                  1,
                to: Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  isServerMode ? totalCount : data.length
                ),
                total: isServerMode ? totalCount : data.length,
              })}
            </span>
          </div>
          <div className="eb-flex eb-items-center eb-space-x-6 lg:eb-space-x-8">
            {/* Page size selector */}
            <div className="eb-flex eb-items-center eb-space-x-2">
              <span className="eb-text-sm eb-font-medium">
                {t('table.rowsPerPage', { defaultValue: 'Rows per page' })}
              </span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="eb-h-8 eb-w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page info */}
            <div className="eb-flex eb-w-[100px] eb-items-center eb-justify-center eb-text-sm eb-font-medium">
              {t('table.pageOf', {
                defaultValue: 'Page {{page}} of {{total}}',
                page: table.getState().pagination.pageIndex + 1,
                total: table.getPageCount(),
              })}
            </div>

            {/* Navigation buttons */}
            <div className="eb-flex eb-items-center eb-space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="eb-hidden eb-h-8 eb-w-8 lg:eb-flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label={t('table.firstPage', {
                  defaultValue: 'Go to first page',
                })}
              >
                <ChevronsLeftIcon className="eb-h-4 eb-w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="eb-h-8 eb-w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label={t('table.previousPage', {
                  defaultValue: 'Go to previous page',
                })}
              >
                <ChevronLeftIcon className="eb-h-4 eb-w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="eb-h-8 eb-w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label={t('table.nextPage', {
                  defaultValue: 'Go to next page',
                })}
              >
                <ChevronRightIcon className="eb-h-4 eb-w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="eb-hidden eb-h-8 eb-w-8 lg:eb-flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label={t('table.lastPage', {
                  defaultValue: 'Go to last page',
                })}
              >
                <ChevronsRightIcon className="eb-h-4 eb-w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
