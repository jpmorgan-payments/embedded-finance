'use client';

import React from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowRightLeft, Banknote, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { RadioIndicator } from '../components/RadioIndicator';
import type {
  PaymentMethod,
  PaymentMethodSelectorProps,
  PaymentMethodType,
} from '../PaymentFlow.types';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Get icon for payment method
 */
function getPaymentMethodIcon(methodId: PaymentMethodType) {
  switch (methodId) {
    case 'ACH':
      return Banknote;
    case 'RTP':
      return Zap;
    case 'WIRE':
      return ArrowRightLeft;
    default:
      return Banknote;
  }
}

interface PaymentMethodOptionProps {
  method: PaymentMethod;
  isSelected: boolean;
  isEnabled: boolean;
  isLinkedAccount: boolean;
  onSelect: () => void;
  onEnable: () => void;
  /**
   * When set, the method is shown as unavailable (not selectable, no Enable
   * action) with this reason. Used for e.g. FX-incompatible methods.
   */
  unavailableReason?: string;
  /** Optional delivery estimate shown as a sublabel on the enabled state. */
  deliveryEstimate?: string;
  t: (
    key: string,
    fallback: string,
    options?: Record<string, unknown>
  ) => React.ReactNode;
}

/**
 * PaymentMethodOption component
 * Individual payment method option with enabled/locked states
 */
function PaymentMethodOption({
  method,
  isSelected,
  isEnabled,
  isLinkedAccount,
  onSelect,
  onEnable,
  unavailableReason,
  deliveryEstimate,
  t,
}: PaymentMethodOptionProps) {
  const Icon = getPaymentMethodIcon(method.id);

  // Unavailable state - method exists but cannot be used in this context
  // (e.g. RTP for international/FX payments). Not selectable, no Enable action.
  if (unavailableReason) {
    return (
      <div className="eb-flex eb-items-center eb-gap-3 eb-bg-muted/30 eb-p-3 eb-opacity-60">
        <RadioIndicator isSelected={false} disabled />

        <div className="eb-flex eb-h-8 eb-w-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted/50">
          <Icon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
        </div>

        <div className="eb-min-w-0 eb-flex-1">
          <div className="eb-text-sm eb-font-medium eb-text-muted-foreground">
            {method.name}
          </div>
          <div className="eb-text-xs eb-text-muted-foreground">
            {unavailableReason}
          </div>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    // Locked state - compact with sublabel
    return (
      <div className="eb-flex eb-items-center eb-gap-3 eb-bg-muted/30 eb-p-3 eb-opacity-70">
        <RadioIndicator isSelected={false} locked />

        <div className="eb-flex eb-h-8 eb-w-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted/50">
          <Icon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
        </div>

        <div className="eb-min-w-0 eb-flex-1">
          <div className="eb-text-sm eb-font-medium eb-text-muted-foreground">
            {method.name}
          </div>
          <div className="eb-text-xs eb-text-muted-foreground">
            {isLinkedAccount
              ? t(
                  'paymentMethod.notEnabledLinkedAccount',
                  'Not enabled for this linked account'
                )
              : t(
                  'paymentMethod.notEnabledRecipient',
                  'Not enabled for this recipient'
                )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="eb-h-auto eb-shrink-0 eb-px-2 eb-py-1 eb-text-xs eb-text-primary"
          onClick={onEnable}
        >
          {t('paymentMethod.enableButton', 'Enable')}
        </Button>
      </div>
    );
  }

  // Enabled state - compact single line
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-3 eb-py-3 eb-text-left eb-transition-colors',
        isSelected ? 'eb-bg-primary/5' : 'hover:eb-bg-muted/50'
      )}
    >
      <RadioIndicator isSelected={isSelected} />

      <div className="eb-flex eb-h-8 eb-w-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary/10">
        <Icon className="eb-h-4 eb-w-4 eb-text-primary" />
      </div>

      <div className="eb-flex-1">
        <span className="eb-text-sm eb-font-medium">{method.name}</span>
        {method.fee !== undefined && method.fee > 0 && (
          <span className="eb-ml-2 eb-text-sm eb-text-muted-foreground">
            {formatCurrency(method.fee)}
          </span>
        )}
        {deliveryEstimate && (
          <div className="eb-mt-0.5 eb-text-xs eb-text-muted-foreground">
            {deliveryEstimate}
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * PaymentMethodSelector component
 * Displays available payment methods with enabled/locked states based on payee
 */
export function PaymentMethodSelector({
  payee,
  selectedMethod,
  availableMethods,
  onSelect,
  onEnableMethod,
  disabled = false,
  methodAvailability,
  deliveryOverrides,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslationWithTokens(['make-payment']);

  if (disabled || !payee) {
    // Disabled state - no payee selected (subtle text only)
    return (
      <div className="eb-py-2 eb-text-center eb-text-sm eb-text-muted-foreground">
        {t('paymentMethod.selectPayeeFirst', 'Select a payee first')}
      </div>
    );
  }

  const isLinkedAccount = payee.type === 'LINKED_ACCOUNT';

  return (
    <div className="eb-overflow-hidden eb-rounded-lg eb-border eb-border-border">
      {availableMethods.map((method, index) => {
        const isEnabled = payee.enabledPaymentMethods.includes(method.id);
        const isSelected = selectedMethod === method.id;
        const availability = methodAvailability?.[method.id];
        const unavailableReason =
          availability && availability.available === false
            ? availability.reason
            : undefined;

        return (
          <React.Fragment key={method.id}>
            {index > 0 && <div className="eb-border-t eb-border-border" />}
            <PaymentMethodOption
              method={method}
              isSelected={isSelected}
              isEnabled={isEnabled}
              isLinkedAccount={isLinkedAccount}
              onSelect={() => onSelect(method.id)}
              onEnable={() => onEnableMethod(method.id)}
              unavailableReason={unavailableReason}
              deliveryEstimate={deliveryOverrides?.[method.id]}
              t={t}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
