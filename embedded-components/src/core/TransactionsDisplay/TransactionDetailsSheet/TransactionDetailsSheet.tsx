import { FC, useState } from 'react';
import { CopyIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/lib/hooks';
import { useGetTransactionV2 } from '@/api/generated/ep-transactions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import {
  formatNumberToCurrency,
  formatStatusText,
  getStatusVariant,
} from '../utils';

export type TransactionDetailsDialogTriggerProps = {
  children: React.ReactNode;
  transactionId: string;
};

export const TransactionDetailsDialogTrigger: FC<
  TransactionDetailsDialogTriggerProps
> = ({ children, transactionId }) => {
  const { t } = useTranslation(['transactions', 'common']);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const {
    data: transaction,
    status,
    error,
    refetch,
  } = useGetTransactionV2(transactionId, { query: { enabled: open } });

  const naText = t('common:na', { defaultValue: 'N/A' });

  // Helper function to check if a field has a value
  const hasValue = (val: any): boolean => {
    return val !== null && val !== undefined && val !== '';
  };

  // Helper function to render a field conditionally
  const renderField = (
    label: string,
    value: any,
    formatter?: (val: any) => string
  ) => {
    const isEmpty = !hasValue(value);
    if (hideEmpty && isEmpty) return null;

    const displayValue = formatter ? formatter(value) : value || naText;

    return (
      <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
        <Label className="eb-shrink-0 eb-text-sm eb-font-normal eb-text-muted-foreground">
          {label}
        </Label>
        <div className="eb-min-w-0 eb-flex-1 eb-text-right eb-text-sm eb-font-normal">
          {displayValue}
        </div>
      </div>
    );
  };

  // Helper to format dates
  const formatDate = (date: string | undefined) => {
    if (!date) return naText;
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to format date-time
  const formatDateTime = (date: string | undefined) => {
    if (!date) return naText;
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-h-full eb-max-w-lg eb-overflow-hidden eb-p-0 sm:eb-max-h-[90vh]">
        <DialogHeader className="eb-shrink-0 eb-border-b eb-p-6 eb-pb-4">
          <div className="eb-space-y-3">
            <DialogTitle className="eb-group eb-flex eb-items-center eb-gap-2 eb-font-header eb-text-xl eb-leading-tight">
              {t('details.title', {
                transactionId,
                defaultValue: `Transaction: ${transactionId}`,
              })}
              <Button
                size="icon"
                variant="outline"
                className="eb-h-6 eb-w-6 eb-opacity-0 eb-transition-opacity group-hover:eb-opacity-100"
                onClick={() => navigator.clipboard.writeText(transactionId)}
              >
                <CopyIcon className="eb-h-3 eb-w-3" />
                <span className="eb-sr-only">
                  {t('actions.copyTransactionId.srOnly', {
                    defaultValue: 'Copy transaction ID',
                  })}
                </span>
              </Button>
            </DialogTitle>
            {transaction && (
              <>
                <div className="eb-text-3xl eb-font-semibold">
                  {transaction.amount
                    ? formatNumberToCurrency(
                        transaction.amount,
                        transaction.currency ?? 'USD',
                        locale
                      )
                    : naText}
                </div>
                <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
                  {transaction.status && (
                    <Badge
                      variant={getStatusVariant(transaction.status)}
                      className="eb-text-xs"
                    >
                      {formatStatusText(transaction.status)}
                    </Badge>
                  )}
                  {transaction.currency && (
                    <span className="eb-rounded-md eb-bg-muted eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-muted-foreground">
                      {transaction.currency}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="eb-flex-1 eb-overflow-y-auto eb-p-6 eb-pt-5">
          <div className="eb-mb-4 eb-flex eb-items-center eb-justify-end eb-gap-2">
            <Switch
              id="show-all"
              checked={!hideEmpty}
              onCheckedChange={(checked) => setHideEmpty(!checked)}
            />
            <Label
              htmlFor="show-all"
              className="eb-text-xs eb-text-muted-foreground"
            >
              {t('details.showAllFields', {
                defaultValue: 'Show all fields',
              })}
            </Label>
          </div>
          {status === 'pending' && (
            <div className="eb-py-8 eb-text-center eb-text-sm eb-text-muted-foreground">
              {t('loading.details', {
                defaultValue: 'Loading transaction details...',
              })}
            </div>
          )}
          {status === 'error' && (
            <ServerErrorAlert
              error={error as any}
              customTitle={t('errors.loadDetails.title', {
                defaultValue: 'Failed to load transaction details',
              })}
              customErrorMessage={{
                '400': t('errors.loadDetails.400', {
                  defaultValue:
                    'Invalid transaction ID. Please check and try again.',
                }),
                '401': t('errors.loadDetails.401', {
                  defaultValue: 'Please log in and try again.',
                }),
                '403': t('errors.loadDetails.403', {
                  defaultValue:
                    'You do not have permission to view this transaction.',
                }),
                '404': t('errors.loadDetails.404', {
                  defaultValue: 'Transaction not found.',
                }),
                '500': t('errors.loadDetails.500', {
                  defaultValue:
                    'An unexpected error occurred while loading transaction details. Please try again later.',
                }),
                '503': t('errors.loadDetails.503', {
                  defaultValue:
                    'The service is currently unavailable. Please try again later.',
                }),
                default: t('errors.loadDetails.default', {
                  defaultValue:
                    'Failed to load transaction details. Please try again.',
                }),
              }}
              tryAgainAction={() => {
                refetch();
              }}
              showDetails={false}
            />
          )}
          {status === 'success' && transaction && (
            <div className="eb-space-y-5">
              {/* General Section */}
              {(!hideEmpty ||
                hasValue(transaction.type) ||
                hasValue(transaction.feeType)) && (
                <>
                  <div className="eb-h-px eb-bg-border" />
                  <div className="eb-space-y-3">
                    <h3 className="eb-text-sm eb-font-semibold eb-text-foreground">
                      {t('details.sections.general', {
                        defaultValue: 'General',
                      })}
                    </h3>
                    <div className="eb-space-y-3">
                      {renderField(
                        t('details.fields.type', { defaultValue: 'Type' }),
                        transaction.type
                      )}
                      {renderField(
                        t('details.fields.feeType', {
                          defaultValue: 'Fee Type',
                        }),
                        transaction.feeType
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Identifiers Section */}
              {(!hideEmpty ||
                hasValue(transaction.id) ||
                hasValue(transaction.transactionReferenceId) ||
                hasValue(transaction.originatingId) ||
                hasValue(transaction.originatingTransactionType)) && (
                <>
                  <div className="eb-h-px eb-bg-border" />
                  <div className="eb-space-y-3">
                    <h3 className="eb-text-sm eb-font-semibold eb-text-foreground">
                      {t('details.sections.identifiers', {
                        defaultValue: 'Identifiers',
                      })}
                    </h3>
                    <div className="eb-space-y-3">
                      {renderField(
                        t('details.fields.transactionId', {
                          defaultValue: 'Transaction ID',
                        }),
                        transaction.id
                      )}
                      {renderField(
                        t('details.fields.transactionReferenceId', {
                          defaultValue: 'Transaction Reference ID',
                        }),
                        transaction.transactionReferenceId
                      )}
                      {renderField(
                        t('details.fields.originatingId', {
                          defaultValue: 'Originating ID',
                        }),
                        transaction.originatingId
                      )}
                      {renderField(
                        t('details.fields.originatingType', {
                          defaultValue: 'Originating Type',
                        }),
                        transaction.originatingTransactionType
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Dates & Versioning Section */}
              {(!hideEmpty ||
                hasValue(transaction.createdAt) ||
                hasValue(transaction.paymentDate) ||
                hasValue(transaction.effectiveDate) ||
                hasValue(transaction.postingVersion)) && (
                <>
                  <div className="eb-h-px eb-bg-border" />
                  <div className="eb-space-y-3">
                    <h3 className="eb-text-sm eb-font-semibold eb-text-foreground">
                      {t('details.sections.datesVersioning', {
                        defaultValue: 'Dates & Versioning',
                      })}
                    </h3>
                    <div className="eb-space-y-3">
                      {renderField(
                        t('details.fields.createdAt', {
                          defaultValue: 'Created At',
                        }),
                        transaction.createdAt,
                        formatDateTime
                      )}
                      {renderField(
                        t('details.fields.paymentDate', {
                          defaultValue: 'Payment Date',
                        }),
                        transaction.paymentDate,
                        formatDate
                      )}
                      {renderField(
                        t('details.fields.effectiveDate', {
                          defaultValue: 'Effective Date',
                        }),
                        transaction.effectiveDate,
                        formatDateTime
                      )}
                      {renderField(
                        t('details.fields.postingVersion', {
                          defaultValue: 'Posting Version',
                        }),
                        transaction.postingVersion
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Debtor Section */}
              {(!hideEmpty ||
                hasValue(transaction.debtorName) ||
                hasValue(transaction.debtorAccountId) ||
                hasValue(transaction.debtorAccountNumber) ||
                hasValue(transaction.debtorClientId)) && (
                <>
                  <div className="eb-h-px eb-bg-border" />
                  <div className="eb-space-y-3">
                    <h3 className="eb-text-sm eb-font-semibold eb-text-foreground">
                      {t('details.sections.debtor', {
                        defaultValue: 'Debtor',
                      })}
                    </h3>
                    <div className="eb-space-y-3">
                      {renderField(
                        t('details.fields.name', { defaultValue: 'Name' }),
                        transaction.debtorName
                      )}
                      {renderField(
                        t('details.fields.accountId', {
                          defaultValue: 'Account ID',
                        }),
                        transaction.debtorAccountId
                      )}
                      {renderField(
                        t('details.fields.accountNumber', {
                          defaultValue: 'Account Number',
                        }),
                        transaction.debtorAccountNumber
                      )}
                      {renderField(
                        t('details.fields.clientId', {
                          defaultValue: 'Client ID',
                        }),
                        transaction.debtorClientId
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Creditor Section */}
              {(!hideEmpty ||
                hasValue(transaction.creditorName) ||
                hasValue(transaction.creditorAccountId) ||
                hasValue(transaction.creditorAccountNumber) ||
                hasValue(transaction.creditorClientId)) && (
                <>
                  <div className="eb-h-px eb-bg-border" />
                  <div className="eb-space-y-3">
                    <h3 className="eb-text-sm eb-font-semibold eb-text-foreground">
                      {t('details.sections.creditor', {
                        defaultValue: 'Creditor',
                      })}
                    </h3>
                    <div className="eb-space-y-3">
                      {renderField(
                        t('details.fields.name', { defaultValue: 'Name' }),
                        transaction.creditorName
                      )}
                      {renderField(
                        t('details.fields.accountId', {
                          defaultValue: 'Account ID',
                        }),
                        transaction.creditorAccountId
                      )}
                      {renderField(
                        t('details.fields.accountNumber', {
                          defaultValue: 'Account Number',
                        }),
                        transaction.creditorAccountNumber
                      )}
                      {renderField(
                        t('details.fields.clientId', {
                          defaultValue: 'Client ID',
                        }),
                        transaction.creditorClientId
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Financial Section */}
              {(!hideEmpty ||
                hasValue(transaction.ledgerBalance) ||
                hasValue(transaction.memo) ||
                hasValue(transaction.recipientId)) && (
                <>
                  <div className="eb-h-px eb-bg-border" />
                  <div className="eb-space-y-3">
                    <h3 className="eb-text-sm eb-font-semibold eb-text-foreground">
                      {t('details.sections.financial', {
                        defaultValue: 'Financial',
                      })}
                    </h3>
                    <div className="eb-space-y-3">
                      {renderField(
                        t('details.fields.ledgerBalance', {
                          defaultValue: 'Ledger Balance',
                        }),
                        transaction.ledgerBalance,
                        (val) =>
                          formatNumberToCurrency(
                            val,
                            transaction.currency ?? 'USD',
                            locale
                          )
                      )}
                      {renderField(
                        t('details.fields.memo', { defaultValue: 'Memo' }),
                        transaction.memo
                      )}
                      {renderField(
                        t('details.fields.recipientId', {
                          defaultValue: 'Recipient ID',
                        }),
                        transaction.recipientId
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Error Section (conditional) */}
              {transaction.error && (
                <>
                  <div className="eb-h-px eb-bg-border" />
                  <div className="eb-space-y-3 eb-rounded-md eb-border eb-border-destructive/50 eb-bg-destructive/5 eb-p-4">
                    <h3 className="eb-text-sm eb-font-semibold eb-text-destructive">
                      {t('details.sections.errorDetails', {
                        defaultValue: 'Error Details',
                      })}
                    </h3>
                    <div className="eb-space-y-3">
                      {renderField(
                        t('details.fields.title', { defaultValue: 'Title' }),
                        transaction.error.title
                      )}
                      {renderField(
                        t('details.fields.httpStatus', {
                          defaultValue: 'HTTP Status',
                        }),
                        transaction.error.httpStatus
                      )}
                      {renderField(
                        t('details.fields.traceId', {
                          defaultValue: 'Trace ID',
                        }),
                        transaction.error.traceId
                      )}
                      {renderField(
                        t('details.fields.requestId', {
                          defaultValue: 'Request ID',
                        }),
                        transaction.error.requestId
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
