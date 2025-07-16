import type {
  Recipient,
  RecipientRequest,
  RecipientType,
  UpdateRecipientRequest,
} from '@/api/generated/ep-recipients.schemas';

import type { RecipientsConfig } from '../../types/paymentConfig';
import type { FormData } from './RecipientForm.schema';

export interface RecipientFormProps {
  mode: 'create' | 'edit';
  recipient?: Recipient;
  onSubmit: (data: RecipientRequest | UpdateRecipientRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  config?: RecipientsConfig;
  // Control whether to render the Card wrapper (false for dialog usage)
  showCardWrapper?: boolean;
  recipientType: RecipientType;
}

export interface FormSectionProps {
  control: any;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
}

export interface PaymentMethodsSectionProps extends FormSectionProps {
  availablePaymentMethods: string[];
  multipleMethodsAllowed: boolean;
}

export interface RoutingNumbersSectionProps {
  control: any;
  errors: any;
  selectedPaymentMethods: string[];
  setValue: (name: string, value: any) => void;
  watch: (name: string) => any;
}

export interface AccountDetailsSectionProps extends FormSectionProps {
  // Account details specific props can be added here
}

export interface PersonalDetailsSectionProps extends FormSectionProps {
  partyType: 'INDIVIDUAL' | 'ORGANIZATION';
}

export interface AddressSectionProps extends FormSectionProps {
  // Address specific props can be added here
}

export interface ContactsSectionProps extends FormSectionProps {
  // Contacts specific props can be added here
}

export type { FormData };
