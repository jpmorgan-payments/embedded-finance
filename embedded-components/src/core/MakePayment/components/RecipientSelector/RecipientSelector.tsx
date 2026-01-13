import React, { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  recipientDisabledMap?: Map<string, boolean>;
  allRecipients?: Recipient[]; // All recipients (not filtered) for showing disabled options
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  filteredRecipients,
  recipientsStatus,
  refetchRecipients,
  recipientDisabledMap,
  allRecipients,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();
  const [open, setOpen] = useState(false);

  // Use allRecipients if provided (for showing disabled options), otherwise use filteredRecipients
  const recipientsToShow = allRecipients || filteredRecipients;
  const { linkedAccounts, regularRecipients } =
    groupRecipientsByType(recipientsToShow);

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
              <div className="eb-mb-1 eb-text-[11px] eb-text-muted-foreground">
                {t('helpers.to', {
                  defaultValue: 'Select or type name or last 4 numbers',
                })}
              </div>
              <Popover open={open} onOpenChange={setOpen}>
                <FormControl>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="eb-w-full eb-justify-between"
                      disabled={
                        recipientsStatus !== 'success' ||
                        filteredRecipients.length === 0
                      }
                      data-user-event="payment_recipient_selected"
                      onClick={(e) => {
                        // Prevent clearing when clicking the button itself
                        if (
                          (e.target as HTMLElement).closest(
                            '[data-clear-button]'
                          )
                        ) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      <span className="eb-flex-1 eb-truncate eb-text-left">
                        {field.value
                          ? (() => {
                              const selected = recipientsToShow.find(
                                (r) => r.id === field.value
                              );
                              return selected
                                ? `${renderRecipientName(selected)} - ${
                                    selected.account?.number
                                      ? maskAccount(selected.account.number)
                                      : ''
                                  }`
                                : t('fields.to.placeholder', {
                                    defaultValue: 'Pay to',
                                  });
                            })()
                          : recipientsStatus === 'pending'
                            ? 'Loading recipients...'
                            : recipientsStatus === 'error'
                              ? 'Failed to load recipients'
                              : filteredRecipients.length === 0
                                ? 'No recipients available'
                                : t('fields.to.placeholder', {
                                    defaultValue: 'Pay to',
                                  })}
                      </span>
                      <div className="eb-flex eb-items-center eb-gap-1">
                        {field.value && (
                          <button
                            type="button"
                            data-clear-button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              field.onChange('');
                              setOpen(false);
                            }}
                            className="eb-rounded-sm eb-opacity-70 eb-ring-offset-background hover:eb-opacity-100 focus:eb-outline-none focus:eb-ring-2 focus:eb-ring-ring focus:eb-ring-offset-2 disabled:eb-pointer-events-none"
                            aria-label="Clear selection"
                          >
                            <X className="eb-h-4 eb-w-4" />
                          </button>
                        )}
                        <ChevronsUpDown className="eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="eb-w-[--radix-popover-trigger-width] eb-p-0">
                  <Command>
                    <CommandInput
                      placeholder={t('fields.to.placeholder', {
                        defaultValue: 'Search recipient...',
                      })}
                      className="eb-h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t('fields.to.empty', {
                          defaultValue: 'No recipient found.',
                        })}
                      </CommandEmpty>
                      {/* Linked Accounts Group */}
                      {linkedAccounts.length > 0 && (
                        <CommandGroup>
                          <div className="eb-px-2 eb-py-1.5 eb-text-xs eb-font-medium eb-text-muted-foreground">
                            Linked Accounts
                          </div>
                          {linkedAccounts.map((recipient: Recipient) => {
                            const isDisabled =
                              recipientDisabledMap?.get(recipient.id) || false;
                            const recipientLabel = `${renderRecipientName(recipient)} - ${
                              recipient.account?.number
                                ? maskAccount(recipient.account.number)
                                : ''
                            }`;
                            return (
                              <CommandItem
                                key={recipient.id}
                                value={`${recipientLabel} ${recipient.id}`}
                                onSelect={() => {
                                  field.onChange(
                                    recipient.id === field.value
                                      ? ''
                                      : recipient.id
                                  );
                                  setOpen(false);
                                }}
                                disabled={isDisabled}
                                className="eb-cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    'eb-mr-2 eb-h-4 eb-w-4',
                                    field.value === recipient.id
                                      ? 'eb-opacity-100'
                                      : 'eb-opacity-0'
                                  )}
                                />
                                {recipientLabel}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}

                      {/* Regular Recipients Group */}
                      {regularRecipients.length > 0 && (
                        <CommandGroup>
                          <div className="eb-px-2 eb-py-1.5 eb-text-xs eb-font-medium eb-text-muted-foreground">
                            Recipients
                          </div>
                          {regularRecipients.map((recipient: Recipient) => {
                            const isDisabled =
                              recipientDisabledMap?.get(recipient.id) || false;
                            const recipientLabel = `${renderRecipientName(recipient)} - ${
                              recipient.account?.number
                                ? maskAccount(recipient.account.number)
                                : ''
                            }`;
                            return (
                              <CommandItem
                                key={recipient.id}
                                value={`${recipientLabel} ${recipient.id}`}
                                onSelect={() => {
                                  field.onChange(
                                    recipient.id === field.value
                                      ? ''
                                      : recipient.id
                                  );
                                  setOpen(false);
                                }}
                                disabled={isDisabled}
                                className="eb-cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    'eb-mr-2 eb-h-4 eb-w-4',
                                    field.value === recipient.id
                                      ? 'eb-opacity-100'
                                      : 'eb-opacity-0'
                                  )}
                                />
                                {recipientLabel}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}

                      {/* Fallback if no grouping is possible */}
                      {linkedAccounts.length === 0 &&
                        regularRecipients.length === 0 && (
                          <CommandGroup>
                            {recipientsToShow.map((recipient: Recipient) => {
                              const isDisabled =
                                recipientDisabledMap?.get(recipient.id) ||
                                false;
                              const recipientLabel = `${renderRecipientName(recipient)} - ${
                                recipient.account?.number
                                  ? maskAccount(recipient.account.number)
                                  : ''
                              }`;
                              return (
                                <CommandItem
                                  key={recipient.id}
                                  value={`${recipientLabel} ${recipient.id}`}
                                  onSelect={() => {
                                    field.onChange(
                                      recipient.id === field.value
                                        ? ''
                                        : recipient.id
                                    );
                                    setOpen(false);
                                  }}
                                  disabled={isDisabled}
                                  className="eb-cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      'eb-mr-2 eb-h-4 eb-w-4',
                                      field.value === recipient.id
                                        ? 'eb-opacity-100'
                                        : 'eb-opacity-0'
                                    )}
                                  />
                                  {recipientLabel}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
