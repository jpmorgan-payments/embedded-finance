import React from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';

import type { RecipientColumnKey } from '../Recipients.columns';
import { formatStatusText } from './formatStatusText';
import { getStatusVariant } from './getStatusVariant';
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
    locale?: string;
    t?: (key: string, options?: any) => string;
  }
): React.ReactNode {
  const currentLocale = options?.locale || 'en-US';
  const t =
    options?.t || ((key: string, opts?: any) => opts?.defaultValue || key);
  const naText = t('common:na', { defaultValue: 'N/A' });
  switch (column) {
    case 'name':
      return (
        <TableCell className="eb-truncate eb-font-medium">
          {options?.onViewDetails ? (
            <Button
              variant="link"
              className="eb-h-auto eb-p-0 eb-text-left eb-font-medium hover:eb-underline"
              onClick={() => options.onViewDetails?.(recipient)}
              title={t('recipients:actions.viewRecipientDetails', {
                defaultValue: 'View recipient details',
              })}
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
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.type === 'LINKED_ACCOUNT'
              ? t('recipients:filters.type.linkedAccount', {
                  defaultValue: 'Linked Account',
                })
              : recipient.type === 'SETTLEMENT_ACCOUNT'
                ? t('recipients:filters.type.settlementAccount', {
                    defaultValue: 'Settlement Account',
                  })
                : t('recipients:filters.type.recipient', {
                    defaultValue: 'Recipient',
                  })}
          </span>
        </TableCell>
      );

    case 'status':
      return (
        <TableCell>
          <Badge
            variant={getStatusVariant(recipient.status)}
            className="eb-text-sm"
          >
            {formatStatusText(recipient.status, t)}
          </Badge>
        </TableCell>
      );

    case 'accountNumber':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.account?.number
              ? `****${recipient.account.number.slice(-4)}`
              : naText}
          </span>
        </TableCell>
      );

    case 'accountType':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.account?.type || naText}
          </span>
        </TableCell>
      );

    case 'routingNumber':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.account?.routingInformation?.[0]?.routingNumber ||
              naText}
          </span>
        </TableCell>
      );

    case 'createdAt':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.createdAt
              ? new Date(recipient.createdAt).toLocaleDateString(
                  currentLocale,
                  {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }
                )
              : naText}
          </span>
        </TableCell>
      );

    case 'updatedAt':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.updatedAt
              ? new Date(recipient.updatedAt).toLocaleDateString(
                  currentLocale,
                  {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }
                )
              : naText}
          </span>
        </TableCell>
      );

    case 'partyId':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.partyId || naText}
          </span>
        </TableCell>
      );

    case 'clientId':
      return (
        <TableCell>
          <span className="eb-text-sm eb-text-gray-600">
            {recipient.clientId || naText}
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
                title={t('recipients:actions.viewDetails', {
                  defaultValue: 'View details',
                })}
              >
                {t('recipients:actions.viewDetails', {
                  defaultValue: 'Details',
                })}
              </Button>
            )}
            {options?.onEdit && (
              <Button
                variant="link"
                size="sm"
                className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs"
                onClick={() => options.onEdit?.(recipient)}
                title={t('recipients:actions.editRecipientTitle', {
                  defaultValue: 'Edit recipient',
                })}
              >
                {t('recipients:actions.edit', { defaultValue: 'Edit' })}
              </Button>
            )}
            {options?.onDeactivate && recipient.status === 'ACTIVE' && (
              <Button
                variant="link"
                size="sm"
                className="eb-h-auto eb-px-2 eb-py-0 eb-text-xs eb-text-red-600 hover:eb-text-red-700"
                onClick={() => options.onDeactivate?.(recipient)}
                disabled={options.isDeactivating}
                title={t('recipients:actions.deactivateRecipientTitle', {
                  defaultValue: 'Deactivate recipient',
                })}
              >
                {options.isDeactivating
                  ? t('recipients:actions.deactivating', {
                      defaultValue: 'Deactivating...',
                    })
                  : t('recipients:actions.deactivate', {
                      defaultValue: 'Deactivate',
                    })}
              </Button>
            )}
          </div>
        </TableCell>
      );

    default:
      return <TableCell>{naText}</TableCell>;
  }
}
