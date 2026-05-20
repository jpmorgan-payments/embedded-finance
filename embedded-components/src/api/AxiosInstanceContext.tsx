import { createContext, useContext } from 'react';
import type { AxiosInstance } from 'axios';

/**
 * React context providing a provider-scoped Axios instance.
 *
 * Each EBComponentsProvider creates its own AxiosInstance with its own
 * interceptors. This ensures that multiple providers on the same page
 * do not conflict — each subtree uses the correct baseURL, headers,
 * clientId, etc.
 */
const AxiosInstanceContext = createContext<AxiosInstance | null>(null);

export const AxiosInstanceProvider = AxiosInstanceContext.Provider;

/**
 * Returns the provider-scoped Axios instance from the nearest
 * EBComponentsProvider ancestor.
 *
 * @throws if called outside of an EBComponentsProvider
 */
export function useAxiosInstance(): AxiosInstance {
  const instance = useContext(AxiosInstanceContext);
  if (!instance) {
    throw new Error(
      'useAxiosInstance must be used within an EBComponentsProvider'
    );
  }
  return instance;
}
