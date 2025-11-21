import React from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';

import type { RecipientColumnKey } from '../Recipients.columns';
import { formatRecipientName } from './recipientHelpers';

/**
 * Render a table cell for a specific column
 */
export function renderTableCell(
  column: RecipientColumnKey,
  recipient: Recipient,
  options?: {
    onViewDetails?: (recipient: Recipient) => void;
    onEdit?: (recipient: Recipient) => void;
    onDeactivate?: (recipient: Recipient) => void;
    makePaymentComponent?: React.ReactNode;
    isDeactivating?: boolean;
  }
): React.ReactNode {
  switch (column) {
    case 'name':
      return (
        <TableCell className="eb-truncate eb-font-medium">
          {options?.onViewDetails ? (
            <Button
              variant="link"
              className="eb-h-auto eb-p-0 eb-text-left eb-font-medium hover:eb-underline"
              onClick={() => options.onViewDetails?.(recipient)}
              title="View recipient details"
            >
              {formatRecipientName(recipient)}
            </Button>
          ) : (
            formatRecipientName(recipient)
          )}
        </TableCell>
      );

    case 'type':
      return (
        <TableCell>
          <Badge variant="outline" className="eb-text-sm">
            {recipient.type === 'LINKED_ACCOUNT'
              ? 'Linked Account'
              : recipient.type === 'SETTLEMENT_ACCOUNT'
                ? 'Settlement Account'
                : 'Recipient'}
          </Badge>
        </TableCell>
      );

    case 'status':
      return (
        <TableCell>
          <Badge
            variant={
              recipient.status === 'ACTIVE'
                ? 'default'
                : recipient.status === 'INACTIVE'
                  ? 'secondary'
                  : 'outline'
            }
            className="eb-text-sm"
          >
            {recipient.status?.replace(/_/g, ' ') || 'N/A'}
          </Badge>
        </TableCell>
      );

    case 'accountNumber':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.account?.number
              ? `****${recipient.account.number.slice(-4)}`
              : 'N/A'}
          </span>
        </TableCell>
      );

    case 'accountType':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.account?.type || 'N/A'}
          </span>
        </TableCell>
      );

    case 'routingNumber':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.account?.routingInformation?.[0]?.routingNumber || 'N/A'}
          </span>
        </TableCell>
      );

    case 'createdAt':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.createdAt
              ? new Date(recipient.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A'}
          </span>
        </TableCell>
      );

    case 'updatedAt':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.updatedAt
              ? new Date(recipient.updatedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A'}
          </span>
        </TableCell>
      );

    case 'partyId':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.partyId || 'N/A'}
          </span>
        </TableCell>
      );

    case 'clientId':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.clientId || 'N/A'}
          </span>
        </TableCell>
      );

    case 'actions':
      return (
        <TableCell>
          <div className="eb-flex eb-gap-3">
            {options?.makePaymentComponent && recipient.status === 'ACTIVE' && (
              <div className="eb-mr-auto">
                {React.cloneElement(
                  options.makePaymentComponent as React.ReactElement,
                  {
                    recipientId: recipient.id,
                  }
                )}
              </div>
            )}
            {options?.onViewDetails && (
              <Button
                variant="link"
                size="sm"
                className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs"
                onClick={() => options.onViewDetails?.(recipient)}
                title="View details"
              >
                Details
              </Button>
            )}
            {options?.onEdit && (
              <Button
                variant="link"
                size="sm"
                className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs"
                onClick={() => options.onEdit?.(recipient)}
                title="Edit recipient"
              >
                Edit
              </Button>
            )}
            {options?.onDeactivate && recipient.status === 'ACTIVE' && (
              <Button
                variant="link"
                size="sm"
                className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs eb-text-red-600 hover:eb-text-red-700"
                onClick={() => options.onDeactivate?.(recipient)}
                disabled={options.isDeactivating}
                title="Deactivate recipient"
              >
                {options.isDeactivating ? 'Deactivating...' : 'Deactivate'}
              </Button>
            )}
          </div>
        </TableCell>
      );

    default:
      return <TableCell>N/A</TableCell>;
  }
}
