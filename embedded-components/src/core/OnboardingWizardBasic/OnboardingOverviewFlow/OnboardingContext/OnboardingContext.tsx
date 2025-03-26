import { createContext, useContext } from 'react';

import { OnboardingConfigUsedInContext } from '../types';

type OnboardingContextType = OnboardingConfigUsedInContext & {
  clientId: string;
  setClientId: (clientId: string) => Promise<void>;
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
