import { createContext, useContext } from 'react';

import {
  ClientResponse,
  DocumentRequestResponse,
  OrganizationType,
} from '@/api/generated/smbdo.schemas';

import { OnboardingConfigUsedInContext } from '../types';

export type OnboardingContextType = OnboardingConfigUsedInContext & {
  clientData: ClientResponse | undefined;
  setClientId: (clientId: string) => void;
  organizationType: OrganizationType | undefined;
  documentRequests: DocumentRequestResponse[] | undefined;
};

export const OnboardingOverviewContext = createContext<
  OnboardingContextType | undefined
>(undefined);

export const useOnboardingOverviewContext = (): OnboardingContextType => {
  const context = useContext(OnboardingOverviewContext);
  if (context === undefined) {
    throw new Error(
      'useOnboardingOverviewContext must be used within a OnboardingOverviewContext'
    );
  }
  return context;
};
