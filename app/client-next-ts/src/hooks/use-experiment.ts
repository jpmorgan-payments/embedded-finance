/**
 * useExperiment Hook
 *
 * React hook for managing experiment state from route search params
 * with automatic localStorage synchronization.
 */

import { useEffect } from 'react';
import {
  getActiveExperiment,
  setExperimentInStorage,
} from '../lib/experiment-utils';

/**
 * Hook to get and manage experiment state from route search params
 *
 * @param search - Search params from Route.useSearch()
 * @returns Current experiment value or null
 */
export function useExperiment(
  search: Record<string, string | undefined>,
): string | null {
  const experiment = getActiveExperiment(search);

  // Sync to localStorage when experiment changes
  useEffect(() => {
    if (experiment) {
      setExperimentInStorage(experiment);
    }
  }, [experiment]);

  return experiment;
}
