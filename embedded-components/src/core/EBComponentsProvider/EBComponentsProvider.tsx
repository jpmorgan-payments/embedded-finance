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
import { i18n } from '@/i18n/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { v4 as uuidv4 } from 'uuid';

import { AXIOS_INSTANCE } from '@/api/axios-instance';
import { Toaster } from '@/components/ui/sonner';

import { EBConfig } from './config.types';
import { convertThemeToCssString } from './convert-theme-to-css-variables';

const queryClient = new QueryClient();

// Create a map to store scoped content tokens by provider ID
const scopedContentTokensMap = new Map<
  string,
  EBConfig['contentTokens'] | undefined
>();

// Create a type for the content tokens context
interface ContentTokensContextType {
  providerId: string;
  contentTokens: EBConfig['contentTokens'] | undefined;
}

const ContentTokensContext = createContext<
  ContentTokensContextType | undefined
>(undefined);

// Create a context to track interceptor ready state
const InterceptorContext = createContext<{
  interceptorReady: boolean;
}>({
  interceptorReady: false,
});

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
      {process.env.NODE_ENV === 'development' && (
        <pre className="eb-mt-4 eb-max-w-full eb-overflow-x-auto eb-rounded eb-bg-destructive/20 eb-p-4 eb-text-left eb-text-xs eb-text-destructive/90">
          {error.message}
        </pre>
      )}
    </div>
  );
}

const logError = (error: Error, info: ErrorInfo) => {
  // In production, you might want to send this to an error reporting service
  console.error('Caught by error boundary:', error, info);
};

export const EBComponentsProvider: React.FC<PropsWithChildren<EBConfig>> = ({
  children,
  apiBaseUrl,
  headers = {},
  queryParams = {},
  theme = {},
  reactQueryDefaultOptions = {},
  contentTokens = {},
}) => {
  const [currentInterceptor, setCurrentInterceptor] = useState(0);
  const [interceptorReady, setInterceptorReady] = useState(false);

  // Create a unique ID for this provider instance
  const providerId = useMemo(() => uuidv4(), []);

  // Store the content tokens in the map for this provider instance
  useEffect(() => {
    scopedContentTokensMap.set(providerId, contentTokens);

    return () => {
      scopedContentTokensMap.delete(providerId);
    };
  }, [providerId, JSON.stringify(contentTokens)]);

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
          return {
            ...config,
            headers: {
              ...config.headers,
              ...headers,
            },
            params: {
              ...config.params,
              ...queryParams,
            },
            baseURL: apiBaseUrl,
          };
        } catch (error) {
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
  }, [apiBaseUrl, JSON.stringify(headers), JSON.stringify(queryParams)]);

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

  // Set the global content tokens for common.json only
  useEffect(() => {
    const namespacePrefix = `${providerId}-`;
    Object.entries(contentTokens.tokens || {}).forEach(
      ([namespace, tokens]) => {
        // Use prefixed namespaces to isolate content tokens
        const scopedNamespace = `${namespacePrefix}${namespace}`;
        i18n.addResourceBundle(
          i18n.language,
          scopedNamespace,
          tokens,
          true,
          true
        );
        console.log('Added content tokens for namespace:', scopedNamespace);
      }
    );
    i18n.changeLanguage(i18n.language);
  }, [providerId, JSON.stringify(contentTokens.tokens), i18n.language]);

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
          <ContentTokensContext.Provider value={{ providerId, contentTokens }}>
            <InterceptorContext.Provider value={{ interceptorReady }}>
              {children}
            </InterceptorContext.Provider>
          </ContentTokensContext.Provider>
          <Toaster closeButton expand position="bottom-left" />
          {process.env.NODE_ENV === 'development' &&
            ReactQueryDevtoolsProduction && <ReactQueryDevtoolsProduction />}
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

  // Return the scoped content tokens for this provider
  return (
    context.contentTokens ?? {
      name: 'enUS',
      tokens: {},
    }
  );
};

// Add a new hook to access the provider ID and content tokens together
export const useScopedContentTokens = () => {
  const context = useContext(ContentTokensContext);

  if (context === undefined) {
    throw new Error(
      'useScopedContentTokens must be used within a ContentTokensProvider'
    );
  }

  // Get tokens for a specific namespace with the provider's prefix
  const getTokensForNamespace = (namespace: string) => {
    const { providerId } = context;
    const scopedNamespace = `${providerId}-${namespace}`;
    return i18n.getResourceBundle(i18n.language, scopedNamespace);
  };

  return {
    providerId: context.providerId,
    contentTokens: context.contentTokens,
    getTokensForNamespace,
  };
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
