import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import { ErrorType } from '@/api/axios-instance';
import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
  OrganizationType,
  PartyResponse,
  SchemasApiError,
} from '@/api/generated/smbdo.schemas';
import type { BankAccountFormData } from '@/core/RecipientWidgets/components/BankAccountForm/BankAccountForm.types';

export type Jurisdiction = 'US' | 'CA';

/**
 * Host-supplied values for the optional link-account step.
 * With `completionMode: 'editable'`, partial data is allowed and the user completes the form.
 * With `completionMode: 'readonly'`, supply a full {@link BankAccountFormData}-compatible payload
 * (including `certify: true` if certification is required) so POST /recipients can succeed on confirm.
 */
export type LinkAccountInitialValues = Partial<BankAccountFormData>;

export type LinkAccountStepCompletionMode = 'editable' | 'readonly';

export type LinkAccountStepOptions = {
  initialValues: LinkAccountInitialValues;
  completionMode: LinkAccountStepCompletionMode;
};

export type OnboardingConfigDefault = UserTrackingProps & {
  alertOnExit?: boolean;
  height?: string;
};

export type OnboardingConfigUsedInContext = {
  onGetClientSettled?: (
    clientData: ClientResponse | undefined,
    status: 'success' | 'pending' | 'error',
    error: ErrorType<SchemasApiError> | null
  ) => void;
  onPostClientSettled?: (response?: ClientResponse, error?: ApiError) => void;
  onPostPartySettled?: (response?: PartyResponse, error?: ApiError) => void;
  onPostClientVerificationsSettled?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<Jurisdiction>;
  availableOrganizationTypes?: Array<OrganizationType>;
  docUploadOnlyMode?: boolean;
  docUploadMaxFileSizeBytes?: number;
  showLinkAccountStep?: boolean;
  /**
   * Pre-populate the link-account step and control whether the user edits fields or only reviews and confirms.
   * Ignored when an active linked account already exists from the recipients API.
   */
  linkAccountStepOptions?: LinkAccountStepOptions;
  hideSidebar?: boolean;
  /** Whether to show the "Download Checklist" button on the Overview screen. Defaults to false. */
  showDownloadChecklist?: boolean;
};

export type OnboardingFlowProps = OnboardingConfigDefault &
  OnboardingConfigUsedInContext;
