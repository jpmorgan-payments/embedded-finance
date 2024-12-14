import React from 'react';
import ReactDOMClient from 'react-dom/client';
import './index.css';
import App from './App';
import { worker } from 'mockServiceWorker/browser';

async function prepare() {
  return  worker.start({
    onUnhandledRequest: 'warn', // Temporarily set to 'warn' to debug
    serviceWorker: {
      url: '/mockServiceWorker.js',
      options: {
        scope: '/', // Ensure the scope covers all paths
      }
    }
  })
}

prepare().then(() => {
  const container = document.getElementById('root');
  const root = ReactDOMClient.createRoot(container as Element);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
