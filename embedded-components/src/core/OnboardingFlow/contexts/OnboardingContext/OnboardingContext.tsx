import { createContext, useContext } from 'react';

import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import {
  ClientResponse,
  OrganizationType,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { OnboardingConfigUsedInContext } from '@/core/OnboardingFlow/types/onboarding.types';

export type OnboardingContextType = OnboardingConfigUsedInContext &
  UserTrackingProps & {
    alertOnExit?: boolean;
    alertOnPreviousStep?: boolean;
    clientData: ClientResponse | undefined;
    clientGetStatus: 'error' | 'success' | 'pending';
    setClientId: (clientId: string) => void;
    organizationType: OrganizationType | undefined;
    /** When set, the flow operates in invite mode for a single party. */
    partyId?: string;
    /** Callback fired when invite-mode party data is successfully submitted. */
    onInviteSubmitSuccess?: (partyData: PartyResponse) => void;
    /** The party data fetched for invite mode (from GET /parties/:partyId). */
    invitePartyData?: PartyResponse;
  };

export const OnboardingContext = createContext<
  OnboardingContextType | undefined
>(undefined);

export const useOnboardingContext = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      'useOnboardingContext must be used within a OnboardingContext'
    );
  }
  return context;
};
