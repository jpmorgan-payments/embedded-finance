import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { loadContentTokens } from '@/lib/utils';
import { AXIOS_INSTANCE } from '@/api/axios-instance';
import { Toaster } from '@/components/ui/sonner';

import { EBConfig } from './config.types';
import { convertThemeToCssString } from './convert-theme-to-css-variables';

const queryClient = new QueryClient();

const ContentTokensContext = createContext<
  EBConfig['contentTokens'] | undefined
>(undefined);

export const EBComponentsProvider: React.FC<PropsWithChildren<EBConfig>> = ({
  children,
  apiBaseUrl,
  headers = {},
  theme = {},
  reactQueryDefaultOptions = {},
  contentTokens = {},
}) => {
  const { i18n } = useTranslation();
  const [currentInterceptor, setCurrentInterceptor] = useState(0);

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

  // Reset all queries when the interceptor changes
  useEffect(() => {
    if (currentInterceptor) {
      queryClient.resetQueries();
    }
  }, [currentInterceptor, queryClient]);

  // Set the default options for react-query
  useEffect(() => {
    queryClient.setDefaultOptions(reactQueryDefaultOptions);
  }, [JSON.stringify(reactQueryDefaultOptions)]);

  // Set the responseType to blob for file downloads
  useEffect(() => {
    AXIOS_INSTANCE.interceptors.request.use(
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

  // Set the language
  useEffect(() => {
    i18n.changeLanguage(contentTokens.name || 'enUS');
  }, [contentTokens.name, i18n]);

  // Set the global content tokens`for common.json only
  useEffect(() => {
    loadContentTokens(i18n.language, 'common', [contentTokens.tokens?.common]);
  }, [loadContentTokens, JSON.stringify(contentTokens.tokens), i18n.language]);

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
        <ContentTokensContext.Provider value={contentTokens}>
          {children}
        </ContentTokensContext.Provider>
        <Toaster closeButton expand />
      </QueryClientProvider>
    </>
  );
};

export const useContentTokens = () => {
  const context = useContext(ContentTokensContext);

  if (context === undefined) {
    throw new Error(
      'useContentTokens must be used within a ContentTokensProvider'
    );
  }

  return context;
};
