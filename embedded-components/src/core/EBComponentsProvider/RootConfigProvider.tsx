import { createContext, useContext } from 'react';

export interface onRegistrationProp {
  clientId: string;
}
export interface RootConfig {
  clientId?: string;
  jurisdictions?: string[];
  products?: string[];
  mockSteps?: any;
  onRegistration: ({ clientId }: onRegistrationProp) => void;
  isMockResponse?: boolean;
}

export const defaultRootConfig = {
  clientId: undefined,
  onRegistration: undefined,
  jurisdictions: undefined,
  products: undefined,
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
  return (
    <RootConfigContext.Provider value={clientOptions}>
      {children}
    </RootConfigContext.Provider>
  );
};
