import { ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AXIOS_INSTANCE } from '@/api/axios-instance';
import { Toaster } from '@/components/ui/sonner';

import { EBConfig } from './config.types';
import { convertThemeToCssString } from './convert-theme-to-css-variables';

import '@/i18n/config';

export interface EBComponentsProviderProps extends EBConfig {
  children: ReactNode;
}

const queryClient = new QueryClient();

export const EBComponentsProvider: React.FC<EBComponentsProviderProps> = ({
  children,
  apiBaseUrl,
  headers = {},
  theme = {},
  reactQueryDefaultOptions = {},
}) => {
  const [currentInterceptor, setCurrentInterceptor] = useState(0);

  // Set the responseType to blob for file downloads
  useEffect(() => {
    const e = AXIOS_INSTANCE.interceptors.request.use(
      (config: any) => {
        if (config.url.includes('/file')) {
          config.responseType = 'blob';
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }, [AXIOS_INSTANCE]);

  // Set default headers and base URL in the axios interceptor
  useEffect(() => {
    // Remove the previous interceptor
    if (currentInterceptor) {
      AXIOS_INSTANCE.interceptors.request.eject(currentInterceptor);
    }

    // Add the new interceptor
    const ebInterceptor = AXIOS_INSTANCE.interceptors.request.use(
      (config: any) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            ...headers,
          },
          baseURL: apiBaseUrl,
        };
      }
    );

    // Save the interceptor ID to remove it on unmount
    setCurrentInterceptor(ebInterceptor);

    return () => {
      AXIOS_INSTANCE.interceptors.request.eject(ebInterceptor);
    };
  }, [JSON.stringify(headers), apiBaseUrl]);

  useEffect(() => {
    if (currentInterceptor) {
      queryClient.resetQueries();
    }
  }, [currentInterceptor, queryClient]);

  useEffect(() => {
    queryClient.setDefaultOptions(reactQueryDefaultOptions);
  }, [JSON.stringify(reactQueryDefaultOptions)]);

  // Add color scheme class to the root element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('eb-light', 'eb-dark');

    if (
      theme.colorScheme === 'dark' ||
      (theme.colorScheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('eb-dark');
    } else {
      root.classList.add('eb-light');
    }
  }, [theme.colorScheme]);

  const css = useMemo(
    () => convertThemeToCssString(theme),
    [JSON.stringify(theme)]
  );

  return (
    <>
      <style
        data-eb-styles
        dangerouslySetInnerHTML={{
          __html: css,
        }}
      />

      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster closeButton expand />
      </QueryClientProvider>
    </>
  );
};
