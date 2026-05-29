import { useCallback } from 'react';
import { AxiosError, AxiosRequestConfig } from 'axios';

import { useAxiosInstance } from './AxiosInstanceContext';

/**
 * Hook-based Orval mutator.
 *
 * Orval detects this as a hook (name starts with "use") and calls it at the
 * top of each generated React Query hook. The returned function is then used
 * as the HTTP request executor for that hook's queryFn / mutationFn.
 *
 * Because the AxiosInstance comes from React context (provided by the nearest
 * EBComponentsProvider), each provider subtree uses its own isolated instance
 * with its own interceptors, baseURL, headers, etc. This eliminates the
 * singleton-interceptor race condition that occurs with multiple providers.
 *
 * The returned function is memoized via useCallback — since axiosInstance is a
 * stable ref provided by the provider, this ensures downstream hooks (and their
 * useCallback wrappers) also produce stable references, preventing unnecessary
 * re-renders and useEffect re-fires.
 */
export const useEbInstance = <T>() => {
  const axiosInstance = useAxiosInstance();

  return useCallback(
    (config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
      const controller = new AbortController();

      const promise = axiosInstance({
        ...config,
        ...options,
        signal: config.signal ?? controller.signal,
      }).then(({ data }) => data as T);

      // @ts-ignore — cancel is used by React Query for query cancellation
      promise.cancel = () => {
        controller.abort('Query was cancelled');
      };

      return promise;
    },
    [axiosInstance]
  );
};

export type ErrorType<Error> = AxiosError<Error>;

export type BodyType<BodyData> = BodyData;
