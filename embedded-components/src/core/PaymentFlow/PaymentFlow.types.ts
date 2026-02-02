import type React from 'react';

import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import type {
  AccountResponse as ApiAccountResponse,
  ListAccountsResponse as ApiListAccountsResponse,
} from '@/api/generated/ep-accounts.schemas';
import type { Recipient as ApiRecipient } from '@/api/generated/ep-recipients.schemas';
import type {
  ApiErrorV2,
  TransactionResponseV2,
} from '@/api/generated/ep-transactions.schemas';

/**
 * Extended AccountResponse with balance information for UI display
 */
export interface AccountResponse extends ApiAccountResponse {
  balance?: {
    available: number;
    current?: number;
    currency?: string;
    /** Indicates if fetching the balance failed */
    hasError?: boolean;
    /** Indicates if the balance is still being fetched */
    isLoading?: boolean;
  };
}

/**
 * Extended ListAccountsResponse with AccountResponse that includes balance
 */
export interface ListAccountsResponse
  extends Omit<ApiListAccountsResponse, 'items'> {
  items: AccountResponse[];
}

/**
 * Payment method types supported by the system
 */
export type PaymentMethodType = 'ACH' | 'RTP' | 'WIRE';

/**
 * Payee type distinguishing between recipients and linked accounts
 */
export type PayeeType = 'RECIPIENT' | 'LINKED_ACCOUNT';

/**
 * Recipient type for individuals vs businesses
 */
export type RecipientType = 'INDIVIDUAL' | 'BUSINESS';

/**
 * Payment method configuration
 */
export interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  description: string;
  /** Fee for this payment method (optional - only show if explicitly provided) */
  fee?: number;
  estimatedDelivery: string;
  icon?: React.ReactNode;
}

/**
 * Fields required to enable a specific payment method
 */
export interface PaymentMethodFieldRequirement {
  field: string;
  label: string;
  required: boolean;
}

/**
 * Payee model - can be a recipient or linked account
 */
export interface Payee {
  id: string;
  type: PayeeType;
  name: string;
  accountNumber: string;
  routingNumber: string;
  bankName?: string;
  enabledPaymentMethods: PaymentMethodType[];
  recipientType?: RecipientType;
  details?: PayeeDetails;
}

/**
 * Additional details for a payee (required for certain payment methods)
 */
export interface PayeeDetails {
  // Wire-specific
  beneficiaryAddress?: string;
  beneficiaryCity?: string;
  beneficiaryState?: string;
  beneficiaryZip?: string;
  bankAddress?: string;
  swiftBic?: string;
  // Contact info
  email?: string;
  phone?: string;
}

/**
 * Flow view identifiers
 */
export type PaymentFlowView =
  | 'main'
  | 'payee-type'
  | 'link-account'
  | 'add-recipient-method'
  | 'add-recipient-form'
  | 'enable-payment-method'
  | 'success';

/**
 * Form data for the payment flow
 */
export interface PaymentFlowFormData {
  // Selected payee
  payeeId?: string;
  payee?: Payee;

  // Payment method
  paymentMethod?: PaymentMethodType;

  // From account
  fromAccountId?: string;
  /** Available balance from the selected account (for validation) */
  availableBalance?: number;

  // Amount
  amount: string;
  currency: string;

  // Memo
  memo?: string;

  // For new recipient creation
  newRecipient?: {
    type: RecipientType;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    email?: string;
    phone?: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    selectedPaymentMethods: PaymentMethodType[];
    // Wire details
    beneficiaryAddress?: string;
    beneficiaryCity?: string;
    beneficiaryState?: string;
    beneficiaryZip?: string;
    bankAddress?: string;
    swiftBic?: string;
  };
}

/**
 * Flow state for navigation and context
 */
export interface FlowState {
  currentView: PaymentFlowView;
  viewStack: PaymentFlowView[];
  formData: PaymentFlowFormData;
  expandedPanels: string[];
}

/**
 * Flow navigation actions
 */
export type FlowAction =
  | {
      type: 'PUSH_VIEW';
      view: PaymentFlowView;
      data?: Partial<PaymentFlowFormData>;
    }
  | { type: 'POP_VIEW' }
  | {
      type: 'REPLACE_VIEW';
      view: PaymentFlowView;
      data?: Partial<PaymentFlowFormData>;
    }
  | { type: 'TOGGLE_PANEL'; panelId: string }
  | { type: 'SET_FORM_DATA'; data: Partial<PaymentFlowFormData> }
  | { type: 'RESET' };

/**
 * Flow context value exposed to child components
 */
export interface FlowContextValue {
  // Navigation
  currentView: PaymentFlowView;
  pushView: (
    view: PaymentFlowView,
    data?: Partial<PaymentFlowFormData>
  ) => void;
  popView: () => void;
  replaceView: (
    view: PaymentFlowView,
    data?: Partial<PaymentFlowFormData>
  ) => void;
  canGoBack: boolean;

  // Form state
  formData: PaymentFlowFormData;
  setFormData: (data: Partial<PaymentFlowFormData>) => void;

  // Panel expansion
  expandedPanels: string[];
  togglePanel: (panelId: string) => void;
  isPanelExpanded: (panelId: string) => boolean;

  // Validation
  isComplete: boolean;
}

/**
 * Mobile review panel configuration
 */
export interface MobileReviewConfig {
  requireReviewBeforeSubmit: boolean;
  onReviewViewed?: () => void;
  legalDisclosure?: React.ReactNode;
  collapsedPreview: {
    title: string;
    subtitle: string;
    summary: string;
  };
}

/**
 * Props for the main PaymentFlow component
 */
export interface PaymentFlowProps extends UserTrackingProps {
  /** Client ID for fetching accounts and recipients */
  clientId: string;

  /** Trigger element to open the payment flow */
  trigger?: React.ReactNode;

  /** Available payment methods */
  paymentMethods?: PaymentMethod[];

  /** Initial account ID to pre-select */
  initialAccountId?: string;

  /** Initial payee ID to pre-select */
  initialPayeeId?: string;

  /** Initial payment method to pre-select */
  initialPaymentMethod?: PaymentMethodType;

  /** Initial amount to pre-fill */
  initialAmount?: string;

  /** Whether to show fees in the review panel (default: false) */
  showFees?: boolean;

  /** Callback when transaction is completed */
  onTransactionComplete?: (
    response?: TransactionResponseV2,
    error?: ApiErrorV2
  ) => void;

  /** Callback when flow is closed */
  onClose?: () => void;

  /** Whether the flow is open (controlled mode) */
  open?: boolean;

  /** Callback when open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;

  /** Key to force reset of flow state. Change this to reset the flow. */
  resetKey?: string | number;
}

/**
 * Props for the FlowContainer component
 */
export interface FlowContainerProps {
  /** Whether to render as a Dialog (default: true) or standalone container */
  asDialog?: boolean;
  /** Whether the dialog is open (only used when asDialog is true) */
  open?: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  reviewPanel: React.ReactNode;
  reviewPanelWidth?: 'sm' | 'md' | 'lg';
  mobileReviewConfig?: MobileReviewConfig;
}

/**
 * Props for the FlowView component
 */
export interface FlowViewProps {
  viewId: PaymentFlowView;
  title?: string;
  children: React.ReactNode;
}

/**
 * Props for the ReviewPanel component
 * Note: formData and isComplete are obtained from FlowContext
 */
export interface ReviewPanelProps {
  accounts?: ListAccountsResponse;
  payees?: Payee[];
  paymentMethods?: PaymentMethod[];
  onSubmit: (formData: PaymentFlowFormData) => void;
  isSubmitting?: boolean;
  mobileConfig?: MobileReviewConfig;
  /** Whether to show fees in the review panel (default: false) */
  showFees?: boolean;
  /** Callback when validation fails, receives array of missing field names */
  onValidationFail?: (missingFields: string[]) => void;
  /** Whether accounts data is still loading - shows skeletons for from section */
  isLoading?: boolean;
  /** Whether payees data is still loading - shows skeletons for to section */
  isPayeesLoading?: boolean;
}

/**
 * Props for the PayeeSelector component
 */
export interface PayeeSelectorProps {
  selectedPayeeId?: string;
  onSelect: (payee: Payee) => void;
  /** @deprecated Use onAddRecipient and onLinkAccount instead */
  onAddNew?: () => void;
  /** Callback to add a new recipient */
  onAddRecipient?: () => void;
  /** Callback to link a new account */
  onLinkAccount?: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * Props for the PaymentMethodSelector component
 */
export interface PaymentMethodSelectorProps {
  payee?: Payee;
  selectedMethod?: PaymentMethodType;
  availableMethods: PaymentMethod[];
  onSelect: (method: PaymentMethodType) => void;
  onEnableMethod: (method: PaymentMethodType) => void;
  disabled?: boolean;
}

// Re-export API types for convenience
export type { ApiRecipient as Recipient };
