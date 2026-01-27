'use client';

import React from 'react';
import { Building2, Link2 } from 'lucide-react';

interface PayeeTypeOption {
  type: 'link-account' | 'add-recipient';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const PAYEE_TYPE_OPTIONS: PayeeTypeOption[] = [
  {
    type: 'link-account',
    title: 'Link My Account',
    description: 'Transfer to another account you own at a different bank',
    icon: <Link2 className="eb-h-6 eb-w-6" />,
  },
  {
    type: 'add-recipient',
    title: 'Add a Recipient',
    description: 'Send money to someone else (person or business)',
    icon: <Building2 className="eb-h-6 eb-w-6" />,
  },
];

interface PayeeTypeSelectorProps {
  onSelect: (type: 'link-account' | 'add-recipient') => void;
  onCancel: () => void;
}

/**
 * PayeeTypeSelector component
 * Allows user to choose between linking their own account or adding a recipient
 */
export function PayeeTypeSelector({
  onSelect,
  onCancel,
}: PayeeTypeSelectorProps) {
  return (
    <div className="eb-space-y-6">
      <div>
        <h2 className="eb-text-lg eb-font-semibold">What type of payee?</h2>
      </div>

      <div className="eb-space-y-3">
        {PAYEE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => onSelect(option.type)}
            className="eb-flex eb-w-full eb-items-center eb-gap-4 eb-rounded-lg eb-border eb-border-border eb-p-4 eb-text-left eb-transition-colors hover:eb-border-primary hover:eb-bg-muted/50"
          >
            <div className="eb-flex eb-h-12 eb-w-12 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
              {option.icon}
            </div>
            <div className="eb-flex-1">
              <div className="eb-font-medium">{option.title}</div>
              <div className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
                {option.description}
              </div>
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
        ))}
      </div>

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
