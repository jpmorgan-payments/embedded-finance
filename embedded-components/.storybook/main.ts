import { withoutVitePlugins } from '@storybook/builder-vite';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

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
      build: {
        sourcemap: 'inline',
      },
      server: {
        fs: {
          allow: ['../'],
        },
      },
    });
  },
  staticDirs: ['../public'],
};

export default config;
