import { defaultResources } from '@/i18n/config';
import { DeepPartial } from 'react-hook-form';

import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
  OrganizationType,
  PartyResponse,
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
  onSetClientId?: (clientId: string) => Promise<void>;
};

export type OnboardingConfigUsedInContext = {
  onPostClientResponse?: (response?: ClientResponse, error?: ApiError) => void;
  onPostPartyResponse?: (response?: PartyResponse, error?: ApiError) => void;
  onPostClientVerificationsResponse?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<Jurisdiction>;
  availableOrganizationTypes?: Array<OrganizationType>;
};
