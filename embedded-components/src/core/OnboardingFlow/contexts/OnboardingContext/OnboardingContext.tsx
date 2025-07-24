import { createContext, useContext } from 'react';

import {
  ClientResponse,
  OrganizationType,
} from '@/api/generated/smbdo.schemas';
import { OnboardingConfigUsedInContext } from '@/core/OnboardingFlow/types/onboarding.types';

export type OnboardingContextType = OnboardingConfigUsedInContext & {
  clientData: ClientResponse | undefined;
  setClientId: (clientId: string) => void;
  organizationType: OrganizationType | undefined;
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
