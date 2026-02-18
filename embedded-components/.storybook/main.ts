import { dirname, resolve } from 'path';
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
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
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
      server: {
        fs: {
          allow: ['../'],
        },
      },
      optimizeDeps: {
        // Keep pre-bundling focused on packages that repeatedly impact startup.
        include: ['storybook/test', 'msw', '@mswjs/data'],
      },
    });
  },
  staticDirs: ['../public'],
};

export default config;
