import { createContext, FC, PropsWithChildren, useContext } from 'react';

import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
  CountryCodeIsoAlpha2,
} from '@/api/generated/smbdo.schemas';

export type OnboardingContextType = {
  clientId?: string;
  setClientId?: (clientId: string) => void;
  onPostClientResponse?: (response?: ClientResponse, error?: ApiError) => void;
  onPostClientVerificationsResponse?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<CountryCodeIsoAlpha2>;
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
