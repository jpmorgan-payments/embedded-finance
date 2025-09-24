import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
} from './types';

interface AccountSelectorProps {
  accounts: ListAccountsResponse | undefined;
  accountsStatus: string;
  refetchAccounts: () => void;
  selectedAccountId?: string;
  accountBalance?: any;
  isBalanceLoading?: boolean;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  accountsStatus,
  refetchAccounts,
  selectedAccountId,
  accountBalance,
  isBalanceLoading,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();

  return (
    <FormField
      control={form.control}
      name="from"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {t('fields.from.label', {
              defaultValue: '2. Which account are you paying from?',
            })}
          </FormLabel>
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
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
            disabled={accountsStatus !== 'success'}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={t('fields.from.placeholder', {
                    defaultValue: 'Pay from',
                  })}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {accounts?.items?.map((account: AccountResponseType) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.label} ({account.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
          <div className="eb-mt-1 eb-text-[11px] eb-text-muted-foreground">
            {t('helpers.from.balance', {
              defaultValue: 'Select or type name or last 4 numbers',
            })}
          </div>

          {/* Account Balance Display */}
          {selectedAccountId && (
            <div className="eb-mt-2 eb-rounded-md eb-bg-muted eb-p-3">
              {isBalanceLoading ? (
                <div className="eb-text-sm eb-text-muted-foreground">
                  Loading balance...
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
                          ${availableBalanceData.amount.toFixed(2)}{' '}
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
  );
};
