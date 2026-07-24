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
  viteFinal: async (config) => {
    // Library-mode plugins/externals from vite.config.mjs must not apply here.
    // Leaving react externalized produces bare `import "react"` in the static
    // build and the browser throws "Failed to resolve module specifier \"react\"".
    config.plugins = await withoutVitePlugins(config.plugins, [
      'unplugin-dts', // vite-plugin-dts 5 (was 'vite:dts')
      'builtin:esm-external-require',
      'vite:lib-inject-css',
    ]);

    // Clear any leaked library externals (Vite 8 uses rolldownOptions).
    if (config.build?.rolldownOptions) {
      config.build.rolldownOptions.external = [];
    }
    if (config.build?.rollupOptions) {
      config.build.rollupOptions.external = [];
    }
    // Storybook is an app build — never use library mode.
    if (config.build) {
      delete config.build.lib;
    }

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
