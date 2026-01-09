import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface LinkedAccountsTableViewSkeletonProps {
  /** Number of rows to display */
  rowCount?: number;
}

/**
 * Skeleton loading state for LinkedAccountsTableView
 * Matches the actual table structure: Account Holder, Account Number, Status, Payment Methods, Created, Actions
 */
export const LinkedAccountsTableViewSkeleton: React.FC<
  LinkedAccountsTableViewSkeletonProps
> = ({ rowCount = 5 }) => {
  return (
    <div className="eb-w-full eb-space-y-4 eb-overflow-hidden eb-@container">
      {/* Table skeleton */}
      <div className="eb-overflow-hidden eb-rounded-md eb-border">
        <Table className="eb-table-fixed">
          <TableHeader>
            <TableRow>
              {/* Account Holder */}
              <TableHead>
                <Skeleton className="eb-h-4 eb-w-20 eb-max-w-full" />
              </TableHead>
              {/* Account Number */}
              <TableHead>
                <Skeleton className="eb-h-4 eb-w-20 eb-max-w-full" />
              </TableHead>
              {/* Status */}
              <TableHead>
                <Skeleton className="eb-h-4 eb-w-12 eb-max-w-full" />
              </TableHead>
              {/* Payment Methods - hidden on smaller screens */}
              <TableHead className="eb-hidden @lg:eb-table-cell">
                <Skeleton className="eb-h-4 eb-w-24 eb-max-w-full" />
              </TableHead>
              {/* Created - hidden on smaller screens */}
              <TableHead className="eb-hidden @xl:eb-table-cell">
                <Skeleton className="eb-h-4 eb-w-14 eb-max-w-full" />
              </TableHead>
              {/* Actions */}
              <TableHead className="eb-w-24 @2xl:eb-w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={`skeleton-row-${rowIndex}`}>
                {/* Account Holder - name with type below (matches eb-flex eb-flex-col eb-gap-0.5) */}
                <TableCell>
                  <div className="eb-flex eb-flex-col eb-gap-0.5">
                    <Skeleton className="eb-h-5 eb-w-24 eb-max-w-full" />
                    <Skeleton className="eb-h-4 eb-w-16 eb-max-w-full" />
                  </div>
                </TableCell>
                {/* Account Number - monospace with toggle button */}
                <TableCell>
                  <div className="eb-flex eb-items-center eb-gap-2">
                    <Skeleton className="eb-h-5 eb-w-20 eb-max-w-full eb-shrink" />
                    <Skeleton className="eb-h-6 eb-w-6 eb-shrink-0" />
                  </div>
                </TableCell>
                {/* Status - badge with icon */}
                <TableCell>
                  <Skeleton className="eb-h-[22px] eb-w-16 eb-max-w-full eb-rounded-full" />
                </TableCell>
                {/* Payment Methods - badges - hidden on smaller screens */}
                <TableCell className="eb-hidden @lg:eb-table-cell">
                  <div className="eb-flex eb-gap-1">
                    <Skeleton className="eb-h-[22px] eb-w-10 eb-rounded-full" />
                    <Skeleton className="eb-h-[22px] eb-w-12 eb-rounded-full" />
                  </div>
                </TableCell>
                {/* Created - date text - hidden on smaller screens */}
                <TableCell className="eb-hidden @xl:eb-table-cell">
                  <Skeleton className="eb-h-5 eb-w-16 eb-max-w-full" />
                </TableCell>
                {/* Actions - primary button + details button (at @2xl+) + dropdown menu */}
                <TableCell>
                  <div className="eb-flex eb-items-center eb-justify-end eb-gap-1">
                    {/* Primary action (Pay/Verify) */}
                    <Skeleton className="eb-h-8 eb-w-11 eb-shrink-0" />
                    {/* Details button - visible at @2xl+ */}
                    <Skeleton className="eb-hidden eb-h-8 eb-w-8 eb-shrink-0 @2xl:eb-block @3xl:eb-w-16" />
                    {/* Dropdown menu */}
                    <Skeleton className="eb-h-8 eb-w-8 eb-shrink-0" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton - matches Pagination component structure */}
      <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2 eb-px-2">
        {/* Showing X to Y of Z */}
        <Skeleton className="eb-h-4 eb-w-36" />

        <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-4 lg:eb-gap-6">
          {/* Page size selector: "Rows per page" + select */}
          <div className="eb-flex eb-items-center eb-gap-2">
            <Skeleton className="eb-h-4 eb-w-24" />
            <Skeleton className="eb-h-8 eb-w-[70px]" />
          </div>

          {/* Page X of Y */}
          <Skeleton className="eb-h-4 eb-w-[100px]" />

          {/* Navigation buttons */}
          <div className="eb-flex eb-items-center eb-gap-1">
            {/* First page - hidden on mobile */}
            <Skeleton className="eb-hidden eb-h-8 eb-w-8 lg:eb-block" />
            {/* Previous page */}
            <Skeleton className="eb-h-8 eb-w-8" />
            {/* Next page */}
            <Skeleton className="eb-h-8 eb-w-8" />
            {/* Last page - hidden on mobile */}
            <Skeleton className="eb-hidden eb-h-8 eb-w-8 lg:eb-block" />
          </div>
        </div>
      </div>
    </div>
  );
};
