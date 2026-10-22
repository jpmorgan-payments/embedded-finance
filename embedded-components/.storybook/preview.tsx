import { useEffect } from 'react';
import { defaultResources } from '@/i18n/config';
import type { Decorator } from '@storybook/react';
import { Preview } from '@storybook/react-vite';
import { DefaultOptions, useQueryClient } from '@tanstack/react-query';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { createRoot } from 'react-dom/client';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { mswHealthHandler, startMswHealthMonitor } from './mswHealth';
import { MswHealthIndicator } from './MswHealthIndicator';
import { ThemeName, THEMES } from './themes';

import '@/index.css';

import { EBContentTokens } from '@/i18n/config';

import { EBTheme } from '@/core/EBComponentsProvider/config.types';

// ============================================================================
// MSW Initialization
// ============================================================================

// One-time MSW + global listener setup (guarded to run only once).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (!g.__EB_MSW_INITIALIZED__) {
  g.__EB_MSW_INITIALIZED__ = true;

  // Prevents edge cases where the service worker is not ready when the preview is loaded
  g.__EB_MOCK_WATCHER__ = new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener('message', (event) => {
      // Only trust same-origin service worker messages (postMessage validation).
      if (event.origin !== '' && event.origin !== window.location.origin)
        return;
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

  // Initialize MSW; the health route is an initial handler so story resets keep it.
  initialize(
    {
      onUnhandledRequest: 'bypass',
    },
    [mswHealthHandler]
  );

  // One monitor and one indicator per preview, independent of how many stories render.
  startMswHealthMonitor(g.__EB_MOCK_WATCHER__);
  const indicatorRoot = document.createElement('div');
  indicatorRoot.id = 'eb-msw-health-indicator';
  document.body.appendChild(indicatorRoot);
  createRoot(indicatorRoot).render(<MswHealthIndicator />);
}
const mockWatcher: Promise<void> = g.__EB_MOCK_WATCHER__;

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
  /** Locale preset for content tokens, or `custom` to edit `contentTokens` in Controls */
  contentTokensPreset?: keyof typeof defaultResources | 'custom';
  /** Custom content tokens object (only used when contentTokensPreset is 'custom') */
  contentTokens?: EBContentTokens;
  /**
   * Show content token IDs for easy discovery during customization.
   * When enabled, hovering over translated text shows the token ID.
   */
  showTokenIds?: boolean;
  /** Client ID for API requests */
  clientId?: string;
  /** React Query default options (e.g., to disable retries) */
  reactQueryDefaultOptions?: DefaultOptions;
}

/**
 * Clears the React Query cache whenever a new story mounts.
 * This prevents stale data from leaking between stories.
 */
function QueryCacheResetter() {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.clear();
  }, [queryClient]);
  return null;
}

/**
 * Global decorator that wraps all stories with EBComponentsProvider.
 * This allows stories to render components directly without wrapper components.
 */
const withEBComponentsProvider: Decorator<BaseStoryArgs> = (Story, context) => {
  const { args } = context;

  // Resolve theme from args (with proper typing)
  const theme = resolveTheme(args.themePreset, args.theme);
  const preset = args.contentTokensPreset ?? 'enUS';
  const localeKey: keyof typeof defaultResources =
    preset === 'custom'
      ? ((args.contentTokens?.name as
          | keyof typeof defaultResources
          | undefined) ?? 'enUS')
      : (preset as keyof typeof defaultResources);
  const contentTokens = {
    ...(args.contentTokens ?? {
      tokens: {},
    }),
    name: localeKey,
    showTokenIds: args.showTokenIds ?? true,
  };

  return (
    <EBComponentsProvider
      apiBaseUrl={args.apiBaseUrl ?? '/'}
      apiBaseUrlTransforms={{
        clients: (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
        parties: (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
        recommendations: (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
        questions: (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
        'document-requests': (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
        documents: (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
        transactions: (baseUrl) => baseUrl.replace('/v1', '/v2'),
        'maintenance-requests': (baseUrl) => baseUrl.replace('/v1', '/do/v1'),
      }}
      headers={args.headers}
      theme={theme}
      contentTokens={contentTokens}
      clientId={args.clientId ?? ''}
      reactQueryDefaultOptions={args.reactQueryDefaultOptions}
    >
      <QueryCacheResetter />
      <Story />
    </EBComponentsProvider>
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
    clientId: '',
    themePreset: 'custom',
    contentTokensPreset: 'enUS',
    showTokenIds: true,
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
        defaultValue: { summary: '' },
      },
    },
    themePreset: {
      control: { type: 'radio' },
      options: ['custom', ...Object.keys(THEMES)],
      description:
        'Select a theme preset or choose "custom" to edit the theme object',
      table: {
        category: 'Provider',
        defaultValue: { summary: 'custom' },
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
      description:
        'Merged into default locale JSON (deep). Shown when **contentTokens preset** is `custom`. Keep `name` (e.g. `enUS`) for the base locale; only `tokens` overrides are required.',
      table: {
        category: 'Provider',
      },
      if: { arg: 'contentTokensPreset', eq: 'custom' },
    },
    showTokenIds: {
      control: { type: 'boolean' },
      description:
        'Show content token IDs on hover. Enable this to discover token IDs for customization.',
      table: {
        category: 'Provider',
        defaultValue: { summary: 'true' },
      },
    },
  },

  decorators: [withEBComponentsProvider],
};
export default preview;
