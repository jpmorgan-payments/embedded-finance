import type { ReactNode } from 'react';

import type {
  AccountType,
  PartyType,
  Recipient,
  RecipientAddress,
  RecipientContact,
  RecipientContactContactType,
  RoutingInformationTransactionType,
} from '@/api/generated/ep-recipients.schemas';
import type { ClientResponse } from '@/api/generated/smbdo.schemas';

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
    contacts?: RecipientContactContactType[];
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
    available: RoutingInformationTransactionType[];
    /** Configuration for each payment method */
    configs: Record<RoutingInformationTransactionType, PaymentMethodConfig>;
    /** Whether multiple payment methods can be selected */
    allowMultiple: boolean;
    /** Default selected payment methods */
    defaultSelected?: RoutingInformationTransactionType[];
  };

  /** Account holder type configuration */
  accountHolder: {
    /** Allow individual accounts */
    allowIndividual: boolean;
    /** Allow organization accounts */
    allowOrganization: boolean;
    /** Default type */
    defaultType?: PartyType;
    /**
     * Whether to pre-fill account holder details from client data.
     * When true, individual names and business names will be auto-populated
     * from the client's party information.
     * @default false
     */
    prefillFromClient?: boolean;
  };

  /** Global required fields */
  requiredFields: {
    /** Always require address regardless of payment method */
    address?: boolean;
    /** Always require contacts regardless of payment method */
    contacts?: RecipientContactContactType[];
    /** Require certification/authorization */
    certification?: boolean;
  };

  /** Readonly fields (for edit mode) */
  readonlyFields?: {
    accountType?: boolean;
    firstName?: boolean;
    lastName?: boolean;
    businessName?: boolean;
    accountNumber?: boolean;
    bankAccountType?: boolean;
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
      paymentMethod: RoutingInformationTransactionType
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
  /** Client data fetched from API */
  client?: ClientResponse;
  /** Callback when form is submitted - handle success/error in parent */
  onSubmit: (data: BankAccountFormData) => void;
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
  /** Custom alert/message to show above the form */
  alert?: ReactNode;
  /**
   * Skip step 1 (payment method selection) and go directly to step 2.
   * Useful when payment method is pre-selected and step 1 would be redundant.
   * @default false
   */
  skipStepOne?: boolean;
  /**
   * Render in embedded mode (inside another flow, not a dialog).
   * When true, cancel button does not use DialogClose wrapper.
   * @default false
   */
  embedded?: boolean;
}

/**
 * Routing number configuration per payment method
 */
export interface PaymentMethodRoutingNumber {
  paymentType: RoutingInformationTransactionType;
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
  bankAccountType: AccountType;

  // Payment methods
  paymentTypes: RoutingInformationTransactionType[];

  // Address (conditional)
  address?: RecipientAddress;

  // Contacts (conditional)
  contacts?: RecipientContact[];

  // Certification
  certify?: boolean;
}
