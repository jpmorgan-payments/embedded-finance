import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

import './styles.css';
import reportWebVitals from './reportWebVitals.ts';
import { pingService } from './lib/ping-service';

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Initialize MSW
async function enableMocking() {
  try {
    const { worker } = await import('./msw/browser');

    // `worker.start()` returns a Promise that resolves
    // once the Service Worker is up and ready to intercept requests.
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
    console.log('MSW started successfully');

    // Start ping service to keep service worker alive
    pingService.start(30000); // 30 second interval
  } catch (error) {
    console.warn('MSW failed to start:', error);
    // Continue anyway - app should work without MSW in development
  }
}

// Render the app
const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  const renderApp = () => {
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
  };

  // Cleanup function to stop ping service when app unmounts
  const cleanup = () => {
    pingService.stop();
  };

  // Add cleanup on page unload
  window.addEventListener('beforeunload', cleanup);

  // Initialize everything in proper order
  const initializeApp = async () => {
    // 1. Start MSW first (wait for it to be ready)
    await enableMocking();

    // 2. Render the app after MSW is ready
    renderApp();
  };

  initializeApp();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
