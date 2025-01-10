import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

import { Jurisdiction } from '../utils/types';

export type OnboardingProps = {
  initialClientId?: string;
  onSetClientId?: (clientId: string) => Promise<void>;
  onPostClientResponse?: (response?: ClientResponse, error?: ApiError) => void;
  onPostPartyResponse?: (response?: PartyResponse, error?: ApiError) => void;
  onPostClientVerificationsResponse?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<Jurisdiction>;
  usePartyResource?: boolean;
  blockPostVerification?: boolean;
};

type OnboardingContextType = OnboardingProps & {
  clientId: string;
  setClientId: (clientId: string) => Promise<void>;
  wasClientIdCreated: boolean;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const OnboardingContextProvider: FC<
  PropsWithChildren<OnboardingProps>
> = ({ children, ...props }) => {
  const [clientId, setClientId] = useState(props.initialClientId ?? '');
  const [wasClientIdCreated, setWasClientIdCreated] = useState(false);

  useEffect(() => {
    setClientId(props.initialClientId ?? '');
    setWasClientIdCreated(false);
  }, [props.initialClientId]);

  const handleSetClientId = async (id: string) => {
    setClientId(id);
    setWasClientIdCreated(true);
    if (props.onSetClientId) {
      await props.onSetClientId('');
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        ...props,
        clientId,
        setClientId: handleSetClientId,
        wasClientIdCreated,
      }}
    >
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
