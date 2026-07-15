'use client';

import React from 'react';
import { Building2, Plus, User } from 'lucide-react';

import { cn } from '@/lib/utils';

import { RadioIndicator } from '../components/RadioIndicator';
import type { Payee } from '../PaymentFlow.types';

interface PayeeListItemProps {
  payee: Payee;
  isSelected: boolean;
  onSelect: (payee: Payee) => void;
  /**
   * Optional badge rendered inline after the payee name (e.g. a currency chip).
   * Non-breaking: when omitted, nothing extra is rendered.
   */
  renderBadge?: (payee: Payee) => React.ReactNode;
  /**
   * When provided, the item is not selectable and this reason is shown as a
   * sublabel. Non-breaking: when omitted, the item is selectable as before.
   */
  disabledReason?: string;
}

/**
 * Format account number with established pattern
 */
function formatAccountNumber(accountNumber?: string): string {
  if (!accountNumber) return '';
  const lastFour = accountNumber.slice(-4);
  return `(...${lastFour})`;
}

/**
 * PayeeListItem component
 * Compact single-line payee item
 */
export function PayeeListItem({
  payee,
  isSelected,
  onSelect,
  renderBadge,
  disabledReason,
}: PayeeListItemProps) {
  const isBusiness = payee.recipientType === 'BUSINESS';

  // Use Building2 for business, User for individuals (regardless of linked account status)
  const Icon = isBusiness ? Building2 : User;

  const accountSuffix = payee.accountNumber
    ? ` ending in ${payee.accountNumber.slice(-4)}`
    : '';

  const isDisabled = !!disabledReason;
  const badge = renderBadge?.(payee);

  return (
    <button
      type="button"
      onClick={() => onSelect(payee)}
      disabled={isDisabled}
      className={cn(
        'eb-flex eb-w-full eb-items-center eb-gap-2 eb-px-3 eb-py-2.5 eb-text-left eb-text-sm eb-transition-colors',
        isDisabled && 'eb-cursor-not-allowed eb-opacity-60',
        !isDisabled && isSelected && 'eb-bg-primary/5',
        !isDisabled && !isSelected && 'hover:eb-bg-muted/50'
      )}
      aria-label={`${isSelected ? 'Selected: ' : ''}${payee.name}${accountSuffix}${disabledReason ? ` — ${disabledReason}` : ''}`}
      aria-pressed={isSelected}
    >
      <RadioIndicator isSelected={isSelected} size="sm" disabled={isDisabled} />

      <div className="eb-flex eb-h-7 eb-w-7 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary/10">
        <Icon
          className="eb-h-3.5 eb-w-3.5 eb-text-primary"
          aria-hidden="true"
        />
      </div>

      <div className="eb-min-w-0 eb-flex-1">
        <div className="eb-flex eb-items-center eb-gap-1.5">
          <span className="eb-truncate eb-font-medium">{payee.name}</span>
          {payee.accountNumber && (
            <span className="eb-text-muted-foreground">
              {formatAccountNumber(payee.accountNumber)}
            </span>
          )}
          {badge}
        </div>
        {disabledReason && (
          <div className="eb-mt-0.5 eb-text-xs eb-text-destructive">
            {disabledReason}
          </div>
        )}
      </div>
    </button>
  );
}

interface AddNewPayeeButtonProps {
  label: string;
  onClick: () => void;
}

/**
 * AddNewPayeeButton component
 * Footer-style button to add a new payee/linked account
 */
export function AddNewPayeeButton({ label, onClick }: AddNewPayeeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="eb-flex eb-w-full eb-items-center eb-justify-center eb-gap-1.5 eb-border-t eb-border-border eb-bg-muted/30 eb-px-3 eb-py-2.5 eb-text-sm eb-font-medium eb-text-primary eb-transition-colors hover:eb-bg-muted/50"
      aria-label={label}
    >
      <Plus className="eb-h-4 eb-w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
