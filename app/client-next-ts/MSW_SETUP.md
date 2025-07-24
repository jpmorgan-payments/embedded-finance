# MSW Setup for Client-Next-TS

This document describes the Mock Service Worker (MSW) setup for the
client-next-ts project.

## Overview

MSW is configured to intercept HTTP requests during development and provide mock
responses. This allows for development without requiring a backend server.

## Files Created/Modified

1. **`src/data/constants.ts`** - Contains API_URL and other constants
2. **`src/msw/handlers.js`** - Updated import paths for constants and mocks
3. **`src/msw/browser.js`** - Already existed, imports updated
4. **`src/main.tsx`** - Added MSW initialization
5. **`public/mockServiceWorker.js`** - MSW service worker file
6. **`package.json`** - Added MSW and lodash dependencies

## Environment Variables

Create a `.env` file in the root of the client-next-ts project with:

```
VITE_API_URL=http://localhost:3000
```

Or set the environment variable when running the development server:

```bash
VITE_API_URL=http://localhost:3000 npm run dev
```

## Installation

Install the new dependencies:

```bash
npm install
# or
yarn install
```

## Usage

1. Start the development server:

   ```bash
   npm run dev
   ```

2. MSW will automatically start in development mode and intercept API requests.

3. Check the browser console for MSW activation messages.

## Available Mock Endpoints

The handlers include mocks for:

- `/api/transactions` - Transaction data
- `/api/recipients` - Recipient data
- `/api/accounts` - Account data
- `/api/debit-cards` - Debit card data
- `/api/cases` - Case data
- `/ef/do/v1/clients/*` - Client management endpoints
- `/ef/do/v1/parties/*` - Party management endpoints
- `/ef/do/v1/questions` - Question endpoints
- `/ef/do/v1/documents/*` - Document endpoints
- And more...

## Database Simulation

The MSW setup includes a simulated database (`src/msw/db.js`) that maintains
state across requests, allowing for realistic CRUD operations during
development.

## Troubleshooting

1. **MSW not starting**: Check that the `mockServiceWorker.js` file exists in
   the `public` directory
2. **Import errors**: Ensure all dependencies are installed with `npm install`
3. **API_URL not defined**: Set the `VITE_API_URL` environment variable
4. **Console errors**: Check the browser console for MSW-related messages

## Service Worker Keep-Alive

To prevent the MSW service worker from being terminated due to inactivity, the project includes a ping service that periodically sends requests to keep the service worker alive.

### Ping Service Implementation

1. **Ping Handler**: Added `/ping` endpoint in `src/msw/handlers.js`
2. **Ping Service**: `src/lib/ping-service.ts` - Manages periodic ping requests
3. **React Hook**: `src/hooks/use-ping-service.ts` - React integration
4. **Debug Component**: `src/components/PingStatus.tsx` - Visual status indicator

### How It Works

- The ping service starts automatically when MSW initializes
- Sends a GET request to `/ping` every 30 seconds (configurable)
- Includes retry logic with exponential backoff for failed requests
- Automatically stops when the page unloads
- Provides visual feedback in development mode

### Configuration

```typescript
// Default interval: 30 seconds
pingService.start(30000);

// Custom interval: 15 seconds
pingService.start(15000);
```

### Manual Control

```typescript
import { usePingService } from '../hooks/use-ping-service';

function MyComponent() {
  const { start, stop, isRunning } = usePingService();
  
  return (
    <div>
      <button onClick={() => start(30000)}>Start Ping</button>
      <button onClick={() => stop()}>Stop Ping</button>
      <span>Status: {isRunning() ? 'Active' : 'Inactive'}</span>
    </div>
  );
}
```

### Debug Interface

In development mode, a small status widget appears in the bottom-right corner showing:
- Current ping service status
- Ping interval
- Last successful ping time
- Manual start/stop controls

## Production

MSW is configured to only run in development mode
(`process.env.NODE_ENV !== 'development'`). It will not interfere with
production builds.
