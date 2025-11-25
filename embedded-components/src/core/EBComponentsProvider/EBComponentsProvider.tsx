import {
  createContext,
  lazy,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ErrorInfo,
} from 'react';
import { createI18nInstance } from '@/i18n/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { I18nextProvider } from 'react-i18next';

import { AXIOS_INSTANCE } from '@/api/axios-instance';
import { Toaster } from '@/components/ui/sonner';

import { EBConfig } from './config.types';
import { convertThemeToCssString } from './convert-theme-to-css-variables';

const queryClient = new QueryClient();

const ContentTokensContext = createContext<
  EBConfig['contentTokens'] | undefined
>(undefined);

// Create a context to track interceptor ready state
const InterceptorContext = createContext<{
  interceptorReady: boolean;
}>({
  interceptorReady: false,
});

const ClientIdContext = createContext<string | undefined>(undefined);

// Only import devtools in development
const ReactQueryDevtoolsProduction =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import(
          // eslint-disable-next-line import/extensions
          '@tanstack/react-query-devtools/build/modern/production.js'
        ).then((d) => ({
          default: d.ReactQueryDevtools,
        }))
      )
    : null;

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="eb-flex eb-min-h-[200px] eb-w-full eb-flex-col eb-items-center eb-justify-center eb-rounded-lg eb-border eb-border-destructive/50 eb-bg-destructive/10 eb-p-6 eb-text-center">
      <AlertCircle className="eb-h-12 eb-w-12 eb-text-destructive" />
      <h2 className="eb-mt-4 eb-text-lg eb-font-semibold eb-text-destructive">
        Something went wrong
      </h2>
      <p className="eb-mt-2 eb-text-sm eb-text-destructive/80">
        An error occurred in the embedded components. Please try refreshing the
        page or contact support if the issue persists.
      </p>
      {(process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test') && (
        <pre className="eb-mt-4 eb-max-w-full eb-overflow-x-auto eb-rounded eb-bg-destructive/20 eb-p-4 eb-text-left eb-text-xs eb-text-destructive/90">
          {error.message}
        </pre>
      )}
    </div>
  );
}

const logError = (error: Error, info: ErrorInfo) => {
  // In production, you might want to send this to an error reporting service
  // eslint-disable-next-line no-console
  console.error('Caught by error boundary:', error, info);
};

export const EBComponentsProvider: React.FC<PropsWithChildren<EBConfig>> = ({
  children,
  apiBaseUrl,
  apiBaseUrls,
  headers = {},
  queryParams = {},
  theme = {},
  reactQueryDefaultOptions = {},
  contentTokens = {},
  clientId,
}) => {
  const [currentInterceptor, setCurrentInterceptor] = useState(0);
  const [interceptorReady, setInterceptorReady] = useState(false);

  // Create a provider-scoped i18n instance
  // This prevents global state pollution when multiple providers exist or routes change
  const i18nInstance = useMemo(
    () => createI18nInstance(contentTokens),
    [contentTokens?.name, JSON.stringify(contentTokens?.tokens)]
  );

  // Set default headers and base URL in the axios interceptor
  useEffect(() => {
    // Remove the previous interceptor
    if (currentInterceptor) {
      AXIOS_INSTANCE.interceptors.request.eject(currentInterceptor);
    }

    // Add the new interceptor
    const ebInterceptor = AXIOS_INSTANCE.interceptors.request.use(
      (config: any) => {
        try {
          // Extract the first path segment from the URL, ignoring query parameters
          const urlPath =
            config.url
              ?.replace(/^\/+/, '') // Remove leading slashes
              .split('?')[0] // Remove query params first
              .split('/')[0] || ''; // Then get first segment

          // Check if this is a GET request
          const isGetRequest = config.method?.toUpperCase() === 'GET';

          return {
            ...config,
            headers: {
              ...config.headers,
              ...headers,
            },
            params: {
              ...config.params,
              ...queryParams,
              ...(clientId && isGetRequest ? { clientId } : {}),
            },
            data:
              !isGetRequest && clientId && config.data
                ? {
                    ...config.data,
                    clientId,
                  }
                : config.data,
            baseURL: apiBaseUrls?.[urlPath] ?? apiBaseUrl,
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error processing URL in interceptor:', error);
          return config; // Return original config if URL processing fails
        }
      }
    );

    // Save the interceptor ID to remove it on unmount
    setCurrentInterceptor(ebInterceptor);

    // Mark interceptor as ready
    setInterceptorReady(true);

    return () => {
      AXIOS_INSTANCE.interceptors.request.eject(ebInterceptor);
      setInterceptorReady(false);
    };
  }, [
    apiBaseUrl,
    JSON.stringify(headers),
    JSON.stringify(queryParams),
    clientId,
  ]);

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

      <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
        <QueryClientProvider client={queryClient}>
          <ClientIdContext.Provider value={clientId}>
            <InterceptorContext.Provider value={{ interceptorReady }}>
              <I18nextProvider i18n={i18nInstance}>
                <ContentTokensContext.Provider value={contentTokens}>
                  {children}
                </ContentTokensContext.Provider>
              </I18nextProvider>
            </InterceptorContext.Provider>
            <Toaster closeButton expand position="bottom-left" />
            {process.env.NODE_ENV === 'development' &&
              ReactQueryDevtoolsProduction && <ReactQueryDevtoolsProduction />}
          </ClientIdContext.Provider>
        </QueryClientProvider>
      </ErrorBoundary>
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

export const useInterceptorStatus = () => {
  const context = useContext(InterceptorContext);

  if (context === undefined) {
    throw new Error(
      'useInterceptorStatus must be used within an EBComponentsProvider'
    );
  }

  return context;
};

export const useClientId = () => {
  const context = useContext(ClientIdContext);

  if (context === undefined) {
    throw new Error('useClientId must be used within a ClientIdProvider');
  }

  return context;
};
