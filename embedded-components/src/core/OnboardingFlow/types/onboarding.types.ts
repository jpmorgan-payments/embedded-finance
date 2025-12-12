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

export type Jurisdiction = 'US' | 'CA';

export type OnboardingConfigDefault = UserTrackingProps & {
  initialClientId?: string;
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
  hideLinkAccountSection?: boolean;
  enableSidebar?: boolean;
};

export type OnboardingFlowProps = OnboardingConfigDefault &
  OnboardingConfigUsedInContext;
