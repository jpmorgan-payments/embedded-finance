import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AccountResponse } from '@/api/generated/ep-accounts.schemas';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { PaymentFormData, Recipient } from '../../types';
import {
  groupRecipientsByType,
  maskAccount,
  renderRecipientName,
} from '../../utils';

interface RecipientSelectorProps {
  filteredRecipients: Recipient[];
  selectedAccount: AccountResponse | undefined;
  recipientsStatus: string;
  refetchRecipients: () => void;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  filteredRecipients,
  recipientsStatus,
  refetchRecipients,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();

  const { linkedAccounts, regularRecipients } =
    groupRecipientsByType(filteredRecipients);

  // Check if there's only one recipient available
  const hasSingleRecipient = filteredRecipients.length === 1;
  const singleRecipient = hasSingleRecipient
    ? filteredRecipients[0]
    : undefined;

  return (
    <FormField
      control={form.control}
      name="to"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {t('fields.to.label', { defaultValue: '1. Who are you paying?' })}
          </FormLabel>
          {recipientsStatus === 'pending' && (
            <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
              Loading recipients...
            </div>
          )}
          {recipientsStatus === 'error' && (
            <div className="eb-py-2 eb-text-xs eb-text-destructive">
              Failed to load recipients.{' '}
              <Button
                variant="link"
                size="sm"
                onClick={() => refetchRecipients()}
              >
                Retry
              </Button>
            </div>
          )}
          {filteredRecipients.length === 0 &&
            recipientsStatus === 'success' && (
              <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                No recipients available
              </div>
            )}

          {/* Show simple text label if only one recipient */}
          {hasSingleRecipient &&
          recipientsStatus === 'success' &&
          singleRecipient ? (
            <div className="eb-rounded-md eb-border eb-bg-muted/50 eb-p-3">
              <div className="eb-text-sm eb-font-medium">
                {renderRecipientName(singleRecipient)}
                {' - '}
                {singleRecipient.account?.number
                  ? maskAccount(singleRecipient.account.number)
                  : ''}
              </div>
            </div>
          ) : (
            <>
              <div className="eb-mb-1 eb-text-xs eb-text-muted-foreground">
                {t('helpers.to', {
                  defaultValue: 'Select or type recipient',
                })}
              </div>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                disabled={
                  recipientsStatus !== 'success' ||
                  filteredRecipients.length === 0
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        recipientsStatus === 'pending'
                          ? 'Loading recipients...'
                          : recipientsStatus === 'error'
                            ? 'Failed to load recipients'
                            : filteredRecipients.length === 0
                              ? 'No recipients available'
                              : t('fields.to.placeholder', {
                                  defaultValue: 'Select or type recipient',
                                })
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="eb-max-h-60">
                  {/* Group recipients by type */}
                  <>
                    {/* Linked Accounts Group */}
                    {linkedAccounts.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                          Linked Accounts
                        </SelectLabel>
                        {linkedAccounts.map((recipient: Recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            {renderRecipientName(recipient)}
                            {' - '}
                            {recipient.account?.number
                              ? maskAccount(recipient.account.number)
                              : ''}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}

                    {/* Separator if both groups have items */}
                    {linkedAccounts.length > 0 &&
                      regularRecipients.length > 0 && <SelectSeparator />}

                    {/* Regular Recipients Group */}
                    {regularRecipients.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                          Recipients
                        </SelectLabel>
                        {regularRecipients.map((recipient: Recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            {renderRecipientName(recipient)}
                            {' - '}
                            {recipient.account?.number
                              ? maskAccount(recipient.account.number)
                              : ''}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}

                    {/* Fallback if no grouping is possible */}
                    {linkedAccounts.length === 0 &&
                      regularRecipients.length === 0 && (
                        <>
                          {filteredRecipients.map((recipient: Recipient) => (
                            <SelectItem key={recipient.id} value={recipient.id}>
                              {renderRecipientName(recipient)}
                              {' - '}
                              {recipient.account?.number
                                ? maskAccount(recipient.account.number)
                                : ''}
                            </SelectItem>
                          ))}
                        </>
                      )}
                  </>
                </SelectContent>
              </Select>
            </>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
