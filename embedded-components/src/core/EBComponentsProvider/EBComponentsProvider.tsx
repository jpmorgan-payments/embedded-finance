import {
  createContext,
  lazy,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ErrorInfo,
} from 'react';
import { createI18nInstance } from '@/i18n/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Axios from 'axios';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { I18nextProvider } from 'react-i18next';

import { AxiosInstanceProvider } from '@/api/AxiosInstanceContext';
import { Toaster } from '@/components/ui/sonner';

import { EBConfig } from './config.types';
import { convertThemeToCssString } from './convert-theme-to-css-variables';

const ContentTokensContext = createContext<
  EBConfig['contentTokens'] | undefined
>(undefined);

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
  // Create a provider-scoped i18n instance
  // This prevents global state pollution when multiple providers exist or routes change
  const i18nInstance = useMemo(
    () => createI18nInstance(contentTokens),
    [contentTokens?.name, JSON.stringify(contentTokens?.tokens)]
  );

  // Stable JSON representations for deep comparison
  const headersJson = JSON.stringify(headers);
  const queryParamsJson = JSON.stringify(queryParams);
  const apiBaseUrlsJson = JSON.stringify(apiBaseUrls);

  // --- Provider-scoped QueryClient ---
  // Each provider gets its own QueryClient so query caches don't leak between
  // providers with different clientIds / base URLs.
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: reactQueryDefaultOptions,
    });
  }
  const queryClient = queryClientRef.current;

  // Update default options when they change
  useEffect(() => {
    queryClient.setDefaultOptions(reactQueryDefaultOptions);
  }, [JSON.stringify(reactQueryDefaultOptions)]);

  // --- Provider-scoped Axios instance (synchronous interceptor) ---
  // The interceptor is registered once and reads config from a mutable ref.
  // This means it's available from the very first render — no timing gap,
  // no need for `interceptorReady` gates on queries.
  const configRef = useRef({
    apiBaseUrl,
    apiBaseUrlTransforms,
    apiBaseUrls,
    headers,
    queryParams,
    clientId,
  });

  // Keep the config ref in sync with the latest props.
  // The interceptor reads from configRef.current at request time, so it
  // always sees the most recent values without needing to re-register.
  configRef.current = {
    apiBaseUrl,
    apiBaseUrlTransforms,
    apiBaseUrls,
    headers,
    queryParams,
    clientId,
  };

  // Create Axios instance with interceptors registered synchronously (once).
  const axiosInstanceRef = useRef<ReturnType<typeof Axios.create> | null>(null);
  if (!axiosInstanceRef.current) {
    const instance = Axios.create();

    // Main request interceptor — reads latest config from ref
    instance.interceptors.request.use((config: any) => {
      try {
        const {
          apiBaseUrl: baseUrl,
          apiBaseUrlTransforms: transforms,
          apiBaseUrls: legacyUrls,
          headers: hdr,
          queryParams: qp,
          clientId: cId,
        } = configRef.current;

        const urlPath =
          config.url?.replace(/^\/+/, '').split('?')[0].split('/')[0] || '';

        const isGetRequest = config.method?.toUpperCase() === 'GET';

        let finalBaseURL = baseUrl;

        if (transforms?.[urlPath]) {
          finalBaseURL = transforms[urlPath](baseUrl);
        } else if (legacyUrls?.[urlPath]) {
          finalBaseURL = legacyUrls[urlPath];
        }

        return {
          ...config,
          headers: {
            ...config.headers,
            ...hdr,
            ...(cId ? { client_id: cId } : {}),
          },
          params: {
            ...config.params,
            ...qp,
            ...(cId && isGetRequest ? { clientId: cId } : {}),
          },
          data:
            !isGetRequest &&
            cId &&
            config.data &&
            !(config.data instanceof FormData)
              ? {
                  ...config.data,
                  clientId: cId,
                }
              : config.data,
          baseURL: finalBaseURL,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error processing URL in interceptor:', error);
        return config;
      }
    });

    // File download interceptor (blob response for /file URLs)
    instance.interceptors.request.use(
      (config: any) => {
        if (config.url?.includes('/file')) {
          config.responseType = 'blob';
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axiosInstanceRef.current = instance;
  }

  // Reset queries when config changes (skip initial mount).
  // The interceptor itself doesn't need re-registration (it reads from configRef),
  // but stale cached responses should be invalidated when config changes.
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
          <AxiosInstanceProvider value={axiosInstanceRef.current}>
            <ClientIdContext.Provider value={clientId}>
              <I18nextProvider i18n={i18nInstance}>
                <ContentTokensContext.Provider value={contentTokens}>
                  {children}
                </ContentTokensContext.Provider>
              </I18nextProvider>
              <Toaster closeButton expand position="bottom-left" />
              {process.env.NODE_ENV === 'development' &&
                ReactQueryDevtoolsProduction && (
                  <ReactQueryDevtoolsProduction />
                )}
            </ClientIdContext.Provider>
          </AxiosInstanceProvider>
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

/**
 * @deprecated — With synchronous interceptor registration, readiness is
 * guaranteed from the first render. This hook exists solely for backwards
 * compatibility so existing `enabled: interceptorReady` guards still compile.
 * It always returns `{ interceptorReady: true }`.
 */
const INTERCEPTOR_ALWAYS_READY = { interceptorReady: true } as const;
export const useInterceptorStatus = () => INTERCEPTOR_ALWAYS_READY;

export const useClientId = () => {
  const context = useContext(ClientIdContext);

  return context;
};
