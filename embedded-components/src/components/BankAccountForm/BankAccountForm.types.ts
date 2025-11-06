import type { ReactNode } from 'react';

import type {
  ApiError,
  PartyType,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';

/**
 * Payment method types supported across all use cases
 */
export type PaymentMethodType = 'ACH' | 'WIRE' | 'RTP';

/**
 * Bank account types
 */
export type BankAccountType = 'CHECKING' | 'SAVINGS';

/**
 * Contact type for recipient communications
 */
export type ContactType = 'EMAIL' | 'PHONE' | 'WEBSITE';

/**
 * Contact information structure
 */
export interface Contact {
  contactType: ContactType;
  value: string;
  countryCode?: string;
}

/**
 * Address information structure
 */
export interface Address {
  primaryAddressLine: string;
  secondaryAddressLine?: string;
  tertiaryAddressLine?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

/**
 * Configuration for a single payment method
 */
export interface PaymentMethodConfig {
  /** Whether this payment method is enabled */
  enabled: boolean;
  /** Display label for the payment method */
  label: string;
  /** Short label for compact display (e.g., badges, routing number labels) */
  shortLabel: string;
  /** Description text */
  description: string;
  /** Whether this payment method can be deselected (for linked accounts, ACH is locked) */
  locked?: boolean;
  /** Required fields when this payment method is selected */
  requiredFields: {
    accountNumber?: boolean;
    routingNumber?: boolean;
    bankAccountType?: boolean;
    address?: boolean;
    contacts?: ContactType[];
  };
  /** Validation rules for routing number */
  routingValidation?: {
    length: number;
    pattern: RegExp;
    errorMessage: string;
  };
  /** Helper text to show for this payment method */
  helperText?: string;
}

/**
 * Content/text configuration for customizing labels and messages
 */
export interface BankAccountFormContent {
  /** Dialog/form title */
  title: string;
  /** Dialog/form description */
  description: string;
  /** Success state title */
  successTitle?: string;
  /** Success state description */
  successDescription?: string;
  /** Submit button text */
  submitButtonText: string;
  /** Cancel button text */
  cancelButtonText?: string;
  /** Loading message */
  loadingMessage?: string;
  /** Section titles */
  sections?: {
    accountHolderType?: string;
    accountHolderInfo?: string;
    bankAccountDetails?: string;
    paymentMethods?: string;
    addressInfo?: string;
    contactInfo?: string;
    certification?: string;
  };
  /** Field labels (override defaults) */
  fieldLabels?: {
    accountType?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    routingNumber?: string;
    accountNumber?: string;
    bankAccountType?: string;
    primaryAddressLine?: string;
    secondaryAddressLine?: string;
    tertiaryAddressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  /** Certification text */
  certificationText?: string;
}

/**
 * Main configuration for the bank account form
 */
export interface BankAccountFormConfig {
  /** Use case type - determines default configurations */
  useCase: 'LINKED_ACCOUNT' | 'RECIPIENT' | 'SETTLEMENT_ACCOUNT';

  /** Payment methods configuration */
  paymentMethods: {
    /** Available payment methods */
    available: PaymentMethodType[];
    /** Configuration for each payment method */
    configs: Record<PaymentMethodType, PaymentMethodConfig>;
    /** Whether multiple payment methods can be selected */
    allowMultiple: boolean;
    /** Default selected payment methods */
    defaultSelected?: PaymentMethodType[];
  };

  /** Account holder type configuration */
  accountHolder: {
    /** Allow individual accounts */
    allowIndividual: boolean;
    /** Allow organization accounts */
    allowOrganization: boolean;
    /** Default type */
    defaultType?: PartyType;
  };

  /** Global required fields */
  requiredFields: {
    /** Always require address regardless of payment method */
    address?: boolean;
    /** Always require contacts regardless of payment method */
    contacts?: ContactType[];
    /** Require certification/authorization */
    certification?: boolean;
  };

  /** Content/text configuration */
  content: BankAccountFormContent;

  /** Validation configuration */
  validation?: {
    /** Custom validation function for account number */
    accountNumber?: (value: string) => boolean | string;
    /** Custom validation function for routing number */
    routingNumber?: (
      value: string,
      paymentMethod: PaymentMethodType
    ) => boolean | string;
  };
}

/**
 * Props for the BankAccountForm component
 */
export interface BankAccountFormProps {
  /** Configuration for the form behavior and validation */
  config: BankAccountFormConfig;
  /** Existing recipient data (for edit mode) */
  recipient?: Recipient;
  /** Callback when form is submitted successfully */
  onSubmit: (data: BankAccountFormData) => void;
  /** Callback when form submission succeeds (with created/updated recipient) */
  onSuccess?: (recipient: Recipient) => void;
  /** Callback when form submission fails */
  onError?: (error: ApiError) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether to show the form in a dialog */
  asDialog?: boolean;
  /** Dialog trigger element (only used when asDialog=true) */
  trigger?: ReactNode;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Whether to show form as a card */
  showCard?: boolean;
}

/**
 * Routing number configuration per payment method
 */
export interface PaymentMethodRoutingNumber {
  paymentType: PaymentMethodType;
  routingNumber: string;
}

/**
 * Form data structure (internal)
 */
export interface BankAccountFormData {
  // Account holder information
  accountType: PartyType;
  firstName?: string;
  lastName?: string;
  businessName?: string;

  // Bank account details
  routingNumbers: PaymentMethodRoutingNumber[];
  useSameRoutingNumber?: boolean; // UX helper to use same routing for all methods
  accountNumber: string;
  bankAccountType: BankAccountType;

  // Payment methods
  paymentTypes: PaymentMethodType[];

  // Address (conditional)
  address?: Address;

  // Contacts (conditional)
  contacts?: Contact[];

  // Certification
  certify?: boolean;
}

/**
 * Props for dialog wrapper component
 */
export interface BankAccountFormDialogProps
  extends Omit<BankAccountFormProps, 'asDialog' | 'trigger'> {
  /** Dialog trigger element */
  children: ReactNode;
  /** Callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Controlled dialog open state */
  open?: boolean;
}
