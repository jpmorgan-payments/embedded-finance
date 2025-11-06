import React from 'react';

import { PaymentType } from '@/api/generated/ep-transactions.schemas';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { PAYMENT_TYPE_INFO } from '../../LinkedAccountWidget.constants';

type PaymentTypeWithoutTransfer = Exclude<PaymentType, 'TRANSFER'>;

interface PaymentTypeSelectorProps {
  selectedTypes: PaymentTypeWithoutTransfer[];
  onChange: (types: PaymentTypeWithoutTransfer[]) => void;
  disabled?: boolean;
}

/**
 * PaymentTypeSelector - Allows selection of payment types with descriptions
 */
export const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({
  selectedTypes,
  onChange,
  disabled = false,
}) => {
  const togglePaymentType = (type: PaymentTypeWithoutTransfer) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="eb-space-y-3">
      <Label className="eb-text-base eb-font-medium">
        Payment Methods <span className="eb-text-red-600">*</span>
      </Label>
      <p className="eb-text-sm eb-text-muted-foreground">
        Select the payment methods you want to enable for this account
      </p>
      <div className="eb-space-y-2.5">
        {(Object.keys(PAYMENT_TYPE_INFO) as PaymentTypeWithoutTransfer[]).map(
          (type) => {
            const info = PAYMENT_TYPE_INFO[type];
            const isSelected = selectedTypes.includes(type);

            return (
              <label
                key={type}
                htmlFor={`payment-type-${type}`}
                className={`eb-flex eb-items-start eb-gap-3 eb-rounded-lg eb-border eb-p-3.5 eb-transition-all ${
                  isSelected
                    ? 'eb-border-primary eb-bg-primary/5 eb-shadow-sm'
                    : 'eb-border-border hover:eb-border-muted-foreground/20 hover:eb-bg-muted/50'
                } ${disabled ? 'eb-cursor-not-allowed eb-opacity-50' : 'eb-cursor-pointer'}`}
              >
                <Checkbox
                  id={`payment-type-${type}`}
                  checked={isSelected}
                  onCheckedChange={() => togglePaymentType(type)}
                  disabled={disabled}
                  className="eb-mt-0.5"
                />
                <div className="eb-flex-1 eb-space-y-1.5">
                  <div className="eb-flex eb-items-center eb-gap-2">
                    <span className="eb-text-sm eb-font-semibold">
                      {info.label}
                    </span>
                    {type === 'ACH' && (
                      <Badge variant="secondary" className="eb-text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="eb-text-xs eb-leading-relaxed eb-text-muted-foreground">
                    {info.description}
                  </p>
                </div>
              </label>
            );
          }
        )}
      </div>
    </div>
  );
};
