import { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import { initialize, mswLoader } from 'msw-storybook-addon';

import '../src/index.css';

// Initialize MSW
initialize({
  onUnhandledRequest: 'bypass',
});

const preview: Preview = {
  // Provide the MSW addon loader globally
  loaders: [mswLoader],
  parameters: {
    darkMode: {
      stylePreview: true,
      dark: { ...themes.dark, appPreviewBg: 'dark' },
      light: { ...themes.normal },
    },
  },
};
export default preview;
