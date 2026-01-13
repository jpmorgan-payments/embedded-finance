import React from 'react';
import { X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type {
  AccountResponseType,
  ListAccountsResponse,
  PaymentFormData,
} from '../../types';
import { formatCurrency } from '../../utils';

interface AccountSelectorProps {
  accounts: ListAccountsResponse | undefined;
  accountsStatus: string;
  refetchAccounts: () => void;
  selectedAccountId?: string;
  accountBalance?: any;
  isBalanceLoading?: boolean;
  isBalanceError?: boolean;
  balanceError?: any;
  refetchBalance?: () => void;
  accountDisabledMap?: Map<string, boolean>;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  accountsStatus,
  refetchAccounts,
  selectedAccountId,
  accountBalance,
  isBalanceLoading,
  isBalanceError,
  balanceError: _balanceError,
  refetchBalance,
  accountDisabledMap,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();

  // Check if there's only one account available
  const hasSingleAccount = accounts?.items?.length === 1;
  const singleAccount = hasSingleAccount ? accounts.items[0] : null;

  return (
    <div className="eb-space-y-4">
      <h3 className="eb-text-base eb-font-semibold">
        {t('fields.from.label', {
          defaultValue: 'Which account are you paying from?',
        })}
      </h3>
      <FormField
        control={form.control}
        name="from"
        render={({ field }) => (
          <FormItem>
            {accountsStatus === 'pending' && (
              <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                Loading accounts...
              </div>
            )}
            {accountsStatus === 'error' && (
              <div className="eb-py-2 eb-text-xs eb-text-destructive">
                Failed to load accounts.{' '}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => refetchAccounts()}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Show simple text label if only one account */}
            {hasSingleAccount &&
            accountsStatus === 'success' &&
            singleAccount ? (
              <div className="eb-rounded-md eb-border eb-bg-muted/50 eb-p-3">
                <div className="eb-text-sm eb-font-medium">
                  {singleAccount.label} ({singleAccount.category})
                </div>
              </div>
            ) : (
              <>
                <div className="eb-mb-1 eb-text-[11px] eb-text-muted-foreground">
                  {t('helpers.from.balance', {
                    defaultValue: 'Select or type name or last 4 numbers',
                  })}
                </div>
                <div className="eb-relative">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={accountsStatus !== 'success'}
                  >
                    <FormControl>
                      <SelectTrigger
                        data-user-event="payment_account_selected"
                        aria-label={t('fields.from.label', {
                          defaultValue: 'Which account are you paying from?',
                        })}
                        className={cn(field.value && 'eb-pr-8')}
                      >
                        <SelectValue
                          placeholder={t('fields.from.placeholder', {
                            defaultValue: 'Pay from',
                          })}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.items?.map((account: AccountResponseType) => {
                        const isDisabled =
                          accountDisabledMap?.get(account.id) || false;
                        return (
                          <SelectItem
                            key={account.id}
                            value={account.id}
                            disabled={isDisabled}
                          >
                            {account.label} ({account.category})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        field.onChange('');
                      }}
                      className="eb-absolute eb-right-8 eb-top-1/2 eb--translate-y-1/2 eb-rounded-sm eb-opacity-70 eb-ring-offset-background hover:eb-opacity-100 focus:eb-outline-none focus:eb-ring-2 focus:eb-ring-ring focus:eb-ring-offset-2 disabled:eb-pointer-events-none"
                      aria-label="Clear selection"
                    >
                      <X className="eb-h-4 eb-w-4" />
                    </button>
                  )}
                </div>
                <FormMessage />
              </>
            )}

            {/* Account Balance Display */}
            {selectedAccountId && (
              <div className="eb-mt-2 eb-rounded-md eb-bg-muted eb-p-3">
                {isBalanceLoading ? (
                  <div className="eb-text-sm eb-text-muted-foreground">
                    Loading balance...
                  </div>
                ) : isBalanceError ? (
                  <div className="eb-space-y-2">
                    <div className="eb-text-sm eb-text-destructive">
                      Failed to load account balance.
                    </div>
                    {refetchBalance && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => refetchBalance()}
                        className="eb-h-auto eb-p-0 eb-text-xs"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                ) : accountBalance?.balanceTypes?.length ? (
                  <div className="eb-space-y-1">
                    {(() => {
                      const availableBalanceData =
                        accountBalance?.balanceTypes?.find(
                          (balance: any) => balance.typeCode === 'ITAV'
                        );
                      return availableBalanceData ? (
                        <div className="eb-flex eb-items-center eb-justify-between eb-text-sm">
                          <span className="eb-text-muted-foreground">
                            Available Balance
                          </span>
                          <span className="eb-font-mono eb-font-medium">
                            ${formatCurrency(availableBalanceData.amount)}{' '}
                            {accountBalance?.currency}
                          </span>
                        </div>
                      ) : (
                        <div className="eb-text-sm eb-text-muted-foreground">
                          No available balance information
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="eb-text-sm eb-text-muted-foreground">
                    No balance information available
                  </div>
                )}
              </div>
            )}
          </FormItem>
        )}
      />
    </div>
  );
};
