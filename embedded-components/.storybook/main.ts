import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.story.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-toolbars',
    '@storybook/addon-essentials',
    'storybook-dark-mode',
    'msw-storybook-addon',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-designs',
    {
      name: '@storybook/addon-storysource',
      options: {
        loaderOptions: {
          injectStoryParameters: false,
        },
      },
    },
    '@storybook/addon-actions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config, { configType }) => {
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
