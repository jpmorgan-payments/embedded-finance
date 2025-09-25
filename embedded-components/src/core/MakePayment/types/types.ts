import type React from 'react';

import {
  AccountResponse,
  ListAccountsResponse,
  PageMetaData,
} from '@/api/generated/ep-accounts.schemas';
import { Recipient as ApiRecipient } from '@/api/generated/ep-recipients.schemas';
import {
  ApiErrorV2,
  TransactionResponseV2,
} from '@/api/generated/ep-transactions.schemas';

export interface Account {
  id: string;
  name: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  fee: number;
  description?: string;
}

export interface PaymentComponentProps {
  triggerButton?: React.ReactNode;
  triggerButtonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  accounts?: Account[];
  paymentMethods?: PaymentMethod[];
  icon?: React.ReactNode;
  recipientId?: string; // Optional recipient ID to pre-select
  onTransactionSettled?: (
    response?: TransactionResponseV2,
    error?: ApiErrorV2
  ) => void;
}

export type Recipient = ApiRecipient;
export type { ListAccountsResponse, AccountResponse, PageMetaData };
export type { AccountResponse as AccountResponseType };

export interface PaymentFormData {
  from: string;
  to: string;
  amount: string;
  method: string;
  currency: string;
  memo?: string;
}

export interface PaymentValidation {
  isAmountValid: boolean;
  totalAmount: number;
  fee: number;
  availableBalance: number;
}

export interface PaymentData {
  accounts: ListAccountsResponse | undefined;
  recipients: Recipient[];
  selectedAccount: AccountResponse | undefined;
  selectedRecipient: Recipient | undefined;
  filteredRecipients: Recipient[];
  dynamicPaymentMethods: PaymentMethod[];
  availableBalance: number;
}

export interface AccountBalance {
  balanceTypes?: Array<{
    typeCode: string;
    amount: number;
  }>;
  currency?: string;
}
