import { defaultResources } from '@/i18n/config';
import type { Decorator } from '@storybook/react';
import { Preview } from '@storybook/react-vite';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { themes } from 'storybook/theming';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { ThemeName, THEMES } from './themes';

import '@/index.css';

import { EBTheme } from '@/core/EBComponentsProvider/config.types';

// Prevents edge cases where the service worker is not ready when the preview is loaded
const mockWatcher = new Promise<void>((resolve) => {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'MOCKING_ENABLED') resolve();
  });
});

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
    <EBComponentsProvider
      apiBaseUrl={args.apiBaseUrl ?? '/'}
      apiBaseUrls={{
        clients: `${(args.apiBaseUrl ?? '/').split('/v1')[0]}/do/v1`,
      }}
      headers={args.headers}
      theme={theme}
      contentTokens={contentTokens as any}
      clientId={args.clientId ?? ''}
    >
      <Story />
    </EBComponentsProvider>
  );
};

const preview: Preview = {
  // Provide the MSW addon loader globally
  loaders: [mswLoader, async () => await mockWatcher],

  parameters: {
    darkMode: {
      stylePreview: true,
      dark: { ...themes.dark, appPreviewBg: 'dark' },
      light: { ...themes.normal },
    },

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

  // Set the initial entry to the introduction page
  initialGlobals: {
    sb_theme: 'light',
  },
};
export default preview;
