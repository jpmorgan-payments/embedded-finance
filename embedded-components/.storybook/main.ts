import { resolve } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { withoutVitePlugins } from '@storybook/builder-vite';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../src/Introduction.mdx',
    '../src/**/*.mdx',
    '../src/**/*.story.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config, { configType }) => {
    config.plugins = await withoutVitePlugins(config.plugins, ['vite:dts']);
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': resolve(__dirname, '../src'),
          '@storybook-themes': resolve(__dirname, './themes'),
        },
      },
      build: {
        sourcemap: 'inline',
      },
      server: {
        fs: {
          allow: ['../'],
        },
      },
      optimizeDeps: {
        include: [
          'storybook/test',
          'msw',
          '@radix-ui/react-slot',
          'class-variance-authority',
          '@mswjs/data',
          'clsx',
          'dompurify',
          'tailwind-merge',
          'react-day-picker',
          '@radix-ui/react-alert-dialog',
          '@radix-ui/react-dialog',
          '@radix-ui/react-checkbox',
          'react-hook-form',
          '@radix-ui/react-select',
          'cmdk',
          '@radix-ui/react-separator',
          '@radix-ui/react-popover',
          '@radix-ui/react-radio-group',
          '@radix-ui/react-label',
          '@radix-ui/react-scroll-area',
          '@radix-ui/react-tooltip',
          '@radix-ui/react-dropdown-menu',
          '@hookform/resolvers/zod',
          '@radix-ui/react-collapsible',
        ],
      },
    });
  },
  staticDirs: ['../public'],
};

export default config;
