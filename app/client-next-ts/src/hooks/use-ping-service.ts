import { useEffect, useCallback } from 'react';
import { pingService } from '../lib/ping-service';

/**
 * React hook for controlling the MSW ping service
 * Provides methods to start/stop the service and check its status
 */
export function usePingService() {
  // Auto-start ping service when hook is used
  useEffect(() => {
    if (!pingService.isRunning) {
      pingService.start(30000); // 30 second interval
    }

    // Cleanup on unmount
    return () => {
      // Note: We don't stop the service here as it might be used by other components
      // The service will be stopped when the page unloads
    };
  }, []);

  const start = useCallback((intervalMs?: number) => {
    pingService.start(intervalMs);
  }, []);

  const stop = useCallback(() => {
    pingService.stop();
  }, []);

  const isRunning = useCallback(() => {
    return pingService.isRunning;
  }, []);

  const getInterval = useCallback(() => {
    return pingService.interval;
  }, []);

  return {
    start,
    stop,
    isRunning,
    getInterval,
  };
} 