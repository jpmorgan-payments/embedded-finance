import { createContext, FC, PropsWithChildren, useContext } from 'react';

import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import { Jurisdiction } from '../utils/types';

export type OnboardingContextType = {
  clientId?: string;
  setClientId?: (clientId: string) => void;
  onPostClientResponse?: (response?: ClientResponse, error?: ApiError) => void;
  onPostPartyResponse?: (response?: PartyResponse, error?: ApiError) => void;
  onPostClientVerificationsResponse?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<Jurisdiction>;
  usePartyResource?: boolean;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const OnboardingContextProvider: FC<
  PropsWithChildren<OnboardingContextType>
> = ({ children, ...props }) => {
  return (
    <OnboardingContext.Provider value={props}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      'useOnboardingContext must be used within a OnboardingContextProvider'
    );
  }
  return context;
};
