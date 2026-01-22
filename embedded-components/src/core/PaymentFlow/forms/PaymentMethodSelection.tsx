'use client';

import React from 'react';
import { Banknote, Building2, Zap } from 'lucide-react';

import { DEFAULT_PAYMENT_METHODS } from '../PaymentFlow.constants';
import type { PaymentMethod, PaymentMethodType } from '../PaymentFlow.types';

interface PaymentMethodSelectionProps {
  availablePaymentMethods?: PaymentMethod[];
  onSelect: (method: PaymentMethodType) => void;
  onCancel: () => void;
}

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
      return Building2;
    default:
      return Banknote;
  }
}

/**
 * PaymentMethodSelection component
 * Allows user to select a payment method before adding a new recipient
 */
export function PaymentMethodSelection({
  availablePaymentMethods = DEFAULT_PAYMENT_METHODS,
  onSelect,
  onCancel,
}: PaymentMethodSelectionProps) {
  return (
    <div className="eb-space-y-6">
      <div>
        <h2 className="eb-text-lg eb-font-semibold">
          How do you want to pay this recipient?
        </h2>
      </div>

      <div className="eb-space-y-3">
        {availablePaymentMethods.map((method) => {
          const Icon = getPaymentMethodIcon(method.id);

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className="eb-flex eb-w-full eb-items-center eb-gap-4 eb-rounded-lg eb-border eb-border-border eb-p-4 eb-text-left eb-transition-colors hover:eb-border-primary hover:eb-bg-muted/50"
            >
              <div className="eb-flex eb-h-12 eb-w-12 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
                <Icon className="eb-h-6 eb-w-6" />
              </div>
              <div className="eb-flex-1">
                <div className="eb-font-medium">{method.name}</div>
                {method.fee !== undefined && method.fee > 0 && (
                  <div className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
                    ${method.fee} fee
                  </div>
                )}
                {method.id === 'WIRE' && (
                  <div className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
                    Additional address info required
                  </div>
                )}
              </div>
              <svg
                className="eb-h-5 eb-w-5 eb-text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          );
        })}
      </div>

      <p className="eb-text-center eb-text-sm eb-text-muted-foreground">
        💡 You can enable additional payment methods for this recipient later.
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="eb-w-full eb-text-center eb-text-sm eb-text-muted-foreground hover:eb-text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
