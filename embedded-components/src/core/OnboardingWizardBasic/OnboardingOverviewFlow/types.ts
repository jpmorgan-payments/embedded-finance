import { defaultResources } from '@/i18n/config';
import { DeepPartial } from 'react-hook-form';

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

import { Jurisdiction } from '../utils/types';

export type OnboardingConfigDefault = {
  initialClientId?: string;
  onboardingContentTokens?: DeepPartial<
    (typeof defaultResources)['enUS']['onboarding']
  >;
  alertOnExit?: boolean;
  userEventsToTrack?: string[];
  userEventsHandler?: ({ actionName }: { actionName: string }) => void;
  height?: string;
};

export type OnboardingConfigUsedInContext = {
  onGetClientSettledSettled?: (
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
};
