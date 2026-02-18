import React, { useEffect, useState } from 'react';
import { defaultResources } from '@/i18n/config';
import type { Decorator } from '@storybook/react';
import { Preview } from '@storybook/react-vite';
import { DefaultOptions } from '@tanstack/react-query';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { createPortal } from 'react-dom';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { ThemeName, THEMES } from './themes';

import '@/index.css';

import { EBTheme } from '@/core/EBComponentsProvider/config.types';

// ============================================================================
// MSW Status Indicator Component
// ============================================================================

type MswStatus = 'checking' | 'active' | 'stale';

/**
 * MSW Status Indicator - shows in top-left corner when MSW becomes unresponsive.
 * Click to hard refresh the page when stale.
 */
function MswStatusIndicator() {
  const [status, setStatus] = useState<MswStatus>('active');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [failureCount, setFailureCount] = useState(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const checkMswHealth = async () => {
      try {
        // Check if service worker is registered and active
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration?.active) {
          setFailureCount((prev) => prev + 1);
          // Only mark as stale after 3 consecutive failures
          if (failureCount >= 2) {
            setStatus('stale');
          }
          return;
        }

        // Check service worker state
        if (registration.active.state !== 'activated') {
          setFailureCount((prev) => prev + 1);
          if (failureCount >= 2) {
            setStatus('stale');
          }
          return;
        }

        // Try to make a test request that MSW should intercept
        // Use a unique URL that won't be cached
        const testUrl = `/__msw_health_check__?t=${Date.now()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          // If MSW is working, it will either handle this or pass it through
          // The key is that fetch itself works - if SW is broken, fetch may hang
          await fetch(testUrl, {
            signal: controller.signal,
            method: 'HEAD',
          });
        } catch (fetchError) {
          // 404 is expected - we just want to know fetch completes
          // AbortError means timeout
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error('Fetch timeout');
          }
        } finally {
          clearTimeout(timeoutId);
        }

        // If we got here, service worker is responsive
        setStatus('active');
        setLastCheck(new Date());
        setFailureCount(0);
      } catch {
        setFailureCount((prev) => prev + 1);
        // Only mark as stale after 3 consecutive failures
        if (failureCount >= 2) {
          setStatus('stale');
        }
      }
    };

    // Initial check after a longer delay to let MSW initialize
    const initialTimeout = setTimeout(checkMswHealth, 5000);

    // Periodic health checks every 30 seconds
    intervalId = setInterval(checkMswHealth, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [failureCount]);

  const handleClick = () => {
    if (status === 'stale') {
      window.location.reload();
    }
  };

  // Only show when stale
  if (status !== 'stale') {
    return null;
  }

  // Use portal to render outside of React tree (bypasses dialog overlays)
  return createPortal(
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '8px',
        left: '8px',
        padding: '6px 10px',
        fontSize: '11px',
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 500,
        color: '#b91c1c',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        pointerEvents: 'auto', // Ensure clickability
      }}
      title={`MSW service worker is not responding. Last successful check: ${lastCheck?.toLocaleTimeString() ?? 'never'}. Click to refresh.`}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#dc2626',
        }}
      />
      MSW Stale - Click to Refresh
    </button>,
    document.body
  );
}

// ============================================================================
// MSW Initialization
// ============================================================================

// Prevents edge cases where the service worker is not ready when the preview is loaded
const mockWatcher = new Promise<void>((resolve) => {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'MOCKING_ENABLED') resolve();
  });
});

// Suppress unhandled promise rejections from MSW service worker
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    // Suppress MSW deserialization errors
    if (
      error?.message?.includes('Cannot read properties of undefined') &&
      error?.stack?.includes('deserializeRequest')
    ) {
      event.preventDefault();
      return;
    }
  });
}

// Initialize MSW
initialize({
  onUnhandledRequest: 'bypass',
});

/**
 * Resolves the theme based on themePreset selection.
 *
 * This helper function handles the logic of selecting between preset themes
 * and custom themes, making it easy to implement theme switching in stories.
 *
 * @param themePreset - The preset name or 'custom' for custom themes
 * @param customTheme - Custom theme object (used when themePreset is 'custom')
 * @returns The resolved theme object or undefined
 *
 * @example
 * ```tsx
 * const theme = resolveTheme(themePreset, customTheme);
 * ```
 */
export const resolveTheme = (
  themePreset?: ThemeName | 'custom',
  customTheme?: EBTheme
): EBTheme | undefined => {
  if (themePreset === 'custom') {
    return customTheme;
  }
  if (themePreset === undefined) {
    return undefined;
  }
  return THEMES[themePreset as ThemeName];
};

/**
 * Base props that are common to all component stories.
 * These correspond to the EBComponentsProvider props and global Storybook controls.
 *
 * All component story props should extend this interface to maintain consistency
 * across the storybook.
 */
export interface BaseStoryArgs {
  /** Base URL for API requests */
  apiBaseUrl?: string;
  /** Additional headers to pass to API requests */
  headers?: Record<string, string>;
  /** Theme preset name (from THEMES) or 'custom' to use the theme object */
  themePreset?: ThemeName | 'custom';
  /** Custom theme object (only used when themePreset is 'custom') */
  theme?: EBTheme;
  /** Locale/language for content tokens */
  contentTokensPreset?: keyof typeof defaultResources;
  /** Custom content tokens object (only used when contentTokensPreset is 'custom') */
  contentTokens?: Record<string, any>;
  /** Client ID for API requests */
  clientId?: string;
  /** React Query default options (e.g., to disable retries) */
  reactQueryDefaultOptions?: DefaultOptions;
}

/**
 * Global decorator that wraps all stories with EBComponentsProvider.
 * This allows stories to render components directly without wrapper components.
 */
const withEBComponentsProvider: Decorator<BaseStoryArgs> = (Story, context) => {
  const { args } = context;

  // Resolve theme from args (with proper typing)
  const theme = resolveTheme(args.themePreset, args.theme);
  const contentTokens = args.contentTokens ?? {
    name: args.contentTokensPreset ?? 'enUS',
  };

  return (
    <>
      <MswStatusIndicator />
      <EBComponentsProvider
        apiBaseUrl={args.apiBaseUrl ?? '/'}
        apiBaseUrlTransforms={{
          clients: (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
          questions: (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
          transactions: (baseUrl) => baseUrl.replace('/v1', '/v2'),
        }}
        headers={args.headers}
        theme={theme}
        contentTokens={contentTokens as any}
        clientId={args.clientId ?? ''}
        reactQueryDefaultOptions={args.reactQueryDefaultOptions}
      >
        <Story />
      </EBComponentsProvider>
    </>
  );
};

const preview: Preview = {
  // Provide the MSW addon loader globally
  loaders: [mswLoader, async () => await mockWatcher],

  parameters: {
    docs: {
      codePanel: true,
    },

    // Set the introduction page as the default
    viewMode: 'docs',

    // Configure the initial story to show
    options: {
      storySort: {
        order: ['Introduction', '*'],
      },
    },
  },

  // Global default args - automatically applied to all stories
  args: {
    apiBaseUrl: '/',
    themePreset: 'Salt',
    contentTokensPreset: 'enUS',
  },

  // Args enhancer to override defaults for specific story names
  argsEnhancers: [
    (context) => {
      // Only apply to stories named "Default"
      if (context.name === 'Default') {
        return {
          apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/',
          headers: {
            platform_id: import.meta.env.VITE_API_PLATFORM_ID ?? '',
          },
          clientId: import.meta.env.VITE_API_CLIENT_ID ?? '',
        };
      }
      return {};
    },
  ],

  // Global argTypes - automatically available in all stories
  argTypes: {
    apiBaseUrl: {
      control: { type: 'text' },
      description: 'Base URL for API requests',
      table: {
        category: 'Provider',
      },
    },
    headers: {
      control: { type: 'object' },
      description: 'Additional headers for API requests',
      table: {
        category: 'Provider',
      },
    },
    clientId: {
      control: { type: 'text' },
      description: 'Client ID for API requests',
      table: {
        category: 'Provider',
      },
    },
    themePreset: {
      control: { type: 'radio' },
      options: ['custom', ...Object.keys(THEMES)],
      description:
        'Select a theme preset or choose "custom" to edit the theme object',
      table: {
        category: 'Provider',
        defaultValue: { summary: 'Salt' },
      },
    },
    theme: {
      control: { type: 'object' },
      description:
        'Theme configuration object (editable when themePreset is "custom")',
      table: {
        category: 'Provider',
      },
      if: { arg: 'themePreset', eq: 'custom' },
    },
    contentTokensPreset: {
      control: { type: 'select' },
      options: ['custom', ...Object.keys(defaultResources)],
      description: 'Content token preset',
      table: {
        category: 'Provider',
        defaultValue: { summary: 'enUS' },
      },
    },
    contentTokens: {
      control: { type: 'object' },
      description: 'Content tokens object',
      table: {
        category: 'Provider',
      },
      if: { arg: 'contentTokensPreset', eq: 'custom' },
    },
  },

  decorators: [withEBComponentsProvider],
};
export default preview;
