import { useQuery } from '@tanstack/react-query';

import { API_URL } from '../data/constants';

/**
 * Interface for the ping API response
 */
interface PingResponse {
  status: string;
  timestamp: string;
  message: string;
}

/**
 * Function to fetch ping status from the API
 * This is used by the React Query hook in use-ping-service.ts
 *
 * @returns Promise with ping response data
 */
async function fetchPing(): Promise<PingResponse> {
  const response = await fetch(`${API_URL}/ping`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Prevent caching to ensure fresh requests
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(`Ping failed with status: ${response.status}`);
  }

  return response.json();
}

/**
 * Default interval for pinging the server (30 seconds)
 */
const DEFAULT_PING_INTERVAL = 30000;

/**
 * React hook for controlling the MSW ping service using React Query
 * Provides methods to start/stop the service and check its status
 */
export function usePingService() {
  // Setup the query with auto-refetching
  return useQuery<PingResponse, Error>({
    queryKey: ['msw-ping'],
    queryFn: fetchPing,
    refetchInterval: DEFAULT_PING_INTERVAL,
    refetchIntervalInBackground: true,
    retry: 3,
  });
}
