import {
  createContext,
  lazy,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

// Shared QueryClient — kept as a singleton to preserve cache across renders.
const queryClient: QueryClient = (() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (g.__EB_QUERY_CLIENT__) return g.__EB_QUERY_CLIENT__ as QueryClient;
  const client = new QueryClient();
  g.__EB_QUERY_CLIENT__ = client;
  return client;
})();

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
  apiBaseUrlTransforms,
  apiBaseUrls, // deprecated
  headers = {},
  queryParams = {},
  theme = {},
  reactQueryDefaultOptions = {},
  contentTokens = {},
  clientId,
}) => {
  const [interceptorReady, setInterceptorReady] = useState(false);

  // Keep a ref to the current interceptor ID so cleanup always ejects the
  // right one, even when the effect re-fires before the previous state
  // update has been processed.
  const interceptorIdRef = useRef<number | null>(null);
  const fileInterceptorIdRef = useRef<number | null>(null);

  // Create a provider-scoped i18n instance
  // This prevents global state pollution when multiple providers exist or routes change
  const i18nInstance = useMemo(
    () => createI18nInstance(contentTokens),
    [contentTokens?.name, JSON.stringify(contentTokens?.tokens)]
  );

  // Stable references for objects that are compared by JSON.stringify.
  // This avoids tearing down / recreating the interceptor when the parent
  // passes a new object literal with the same content on every render.
  const headersJson = JSON.stringify(headers);
  const queryParamsJson = JSON.stringify(queryParams);
  const apiBaseUrlsJson = JSON.stringify(apiBaseUrls);

  // Set default headers and base URL in the axios interceptor
  useEffect(() => {
    // Remove the previous interceptor via the ref (always current)
    if (interceptorIdRef.current !== null) {
      AXIOS_INSTANCE.interceptors.request.eject(interceptorIdRef.current);
    }

    // Parse once — the JSON strings are stable across renders with same content
    const parsedHeaders = JSON.parse(headersJson) as Record<string, string>;
    const parsedQueryParams = JSON.parse(queryParamsJson) as Record<
      string,
      string
    >;

    // Add the new interceptor
    const id = AXIOS_INSTANCE.interceptors.request.use((config: any) => {
      try {
        // Extract the first path segment from the URL, ignoring query parameters
        const urlPath =
          config.url
            ?.replace(/^\/+/, '') // Remove leading slashes
            .split('?')[0] // Remove query params first
            .split('/')[0] || ''; // Then get first segment

        // Check if this is a GET request
        const isGetRequest = config.method?.toUpperCase() === 'GET';

        // Determine the final URL based on base URL transforms or deprecated base URLs
        let finalBaseURL = apiBaseUrl;

        // New behavior: apiBaseUrlTransforms transforms the base URL for specific paths
        if (apiBaseUrlTransforms?.[urlPath]) {
          finalBaseURL = apiBaseUrlTransforms[urlPath](apiBaseUrl);
        }
        // Deprecated behavior: apiBaseUrls overrides the entire base URL
        else if (apiBaseUrls?.[urlPath]) {
          finalBaseURL = apiBaseUrls[urlPath];
        }

        return {
          ...config,
          headers: {
            ...config.headers,
            ...parsedHeaders,
            ...(clientId ? { client_id: clientId } : {}),
          },
          params: {
            ...config.params,
            ...parsedQueryParams,
            ...(clientId && isGetRequest ? { clientId } : {}),
          },
          data:
            !isGetRequest &&
            clientId &&
            config.data &&
            !(config.data instanceof FormData)
              ? {
                  ...config.data,
                  clientId,
                }
              : config.data,
          baseURL: finalBaseURL,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error processing URL in interceptor:', error);
        return config; // Return original config if URL processing fails
      }
    });

    interceptorIdRef.current = id;

    // Mark interceptor as ready
    setInterceptorReady(true);

    return () => {
      AXIOS_INSTANCE.interceptors.request.eject(id);
      interceptorIdRef.current = null;
      setInterceptorReady(false);
    };
  }, [
    apiBaseUrl,
    apiBaseUrlTransforms,
    apiBaseUrlsJson,
    headersJson,
    queryParamsJson,
    clientId,
  ]);

  // Reset all queries when the interceptor config changes (skip initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    queryClient.resetQueries();
  }, [
    apiBaseUrl,
    apiBaseUrlTransforms,
    apiBaseUrlsJson,
    headersJson,
    queryParamsJson,
    clientId,
  ]);

  // Set the default options for react-query
  useEffect(() => {
    queryClient.setDefaultOptions(reactQueryDefaultOptions);
  }, [JSON.stringify(reactQueryDefaultOptions)]);

  // Set the responseType to blob for file downloads.
  // Only register once and clean up on unmount.
  useEffect(() => {
    if (fileInterceptorIdRef.current !== null) {
      AXIOS_INSTANCE.interceptors.request.eject(fileInterceptorIdRef.current);
    }
    const id = AXIOS_INSTANCE.interceptors.request.use(
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
    fileInterceptorIdRef.current = id;

    return () => {
      AXIOS_INSTANCE.interceptors.request.eject(id);
      fileInterceptorIdRef.current = null;
    };
  }, []);

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

  // Return undefined if used outside provider (allows optional usage)
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

  return context;
};
