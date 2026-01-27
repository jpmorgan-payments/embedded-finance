'use client';

import React from 'react';
import { Building2, Check, Plus, User } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { Payee } from '../PaymentFlow.types';

interface PayeeListItemProps {
  payee: Payee;
  isSelected: boolean;
  onSelect: (payee: Payee) => void;
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
}: PayeeListItemProps) {
  const isBusiness = payee.recipientType === 'BUSINESS';

  // Use Building2 for business, User for individuals (regardless of linked account status)
  const Icon = isBusiness ? Building2 : User;

  return (
    <button
      type="button"
      onClick={() => onSelect(payee)}
      className={cn(
        'eb-flex eb-w-full eb-items-center eb-gap-2 eb-px-3 eb-py-2.5 eb-text-left eb-text-sm eb-transition-colors',
        isSelected ? 'eb-bg-primary/5' : 'hover:eb-bg-muted/50'
      )}
    >
      <div className="eb-flex eb-h-7 eb-w-7 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
        <Icon className="eb-h-3.5 eb-w-3.5 eb-text-muted-foreground" />
      </div>

      <div className="eb-min-w-0 eb-flex-1">
        <span className="eb-truncate eb-font-medium">{payee.name}</span>
        {payee.accountNumber && (
          <span className="eb-ml-1 eb-text-muted-foreground">
            {formatAccountNumber(payee.accountNumber)}
          </span>
        )}
      </div>

      {isSelected && (
        <Check className="eb-h-4 eb-w-4 eb-shrink-0 eb-text-primary" />
      )}
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
    >
      <Plus className="eb-h-4 eb-w-4" />
      <span>{label}</span>
    </button>
  );
}
