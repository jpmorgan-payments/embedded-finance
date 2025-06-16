import { createContext, useContext, useState } from 'react';

export interface onRegistrationProp {
  clientId: string;
  clientResponse?: any;
}
export interface RootConfig {
  clientId?: string;
  partyId?: string;
  jurisdictions?: string[];
  entityType?: string;
  products?: string[];
  setClientId?: any;
  setPartyId?: any;
  onPostClientsVerification: ({
    clientId,
    clientResponse,
  }: onRegistrationProp) => void;
  onGetClientSettledSettledsConfirmation: ({
    clientId,
    clientResponse,
  }: onRegistrationProp) => void;
}

export const defaultRootConfig = {
  clientId: undefined,
  onPostClientsVerification: undefined,
  jurisdictions: undefined,
  products: undefined,
  entityType: undefined,
  partyId: undefined,
};

export const RootConfigContext: any = createContext(defaultRootConfig);

export const useRootConfig = (): RootConfig => {
  const context: RootConfig = useContext(RootConfigContext);
  if (context === undefined) {
    throw new Error('useRootConfig must be used within RootConfigProvider');
  }
  return context;
};

export const RootConfigProvider: React.FC<{
  children: React.ReactNode;
  clientOptions: RootConfig;
}> = ({ children, clientOptions }) => {
  const [clientId, setClientId] = useState(clientOptions?.clientId);
  const [partyId, setPartyId] = useState(clientOptions?.partyId);

  //TODO: It maybe needed to have a state set up for trigering rerenders for clientOptions changes
  return (
    <RootConfigContext.Provider
      value={{ ...clientOptions, clientId, setClientId, partyId, setPartyId }}
    >
      {children}
    </RootConfigContext.Provider>
  );
};
