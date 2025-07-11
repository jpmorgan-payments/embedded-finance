import { Preview } from '@storybook/react-vite';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { themes } from 'storybook/theming';

import '../src/index.css';

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
  },
};
export default preview;
