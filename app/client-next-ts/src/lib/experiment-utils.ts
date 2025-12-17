/**
 * Experiment Utilities
 *
 * Generic utilities for managing experiment state via URL and localStorage.
 */

const EXPERIMENT_STORAGE_KEY = 'landing-page-experiment';

/**
 * Extract experiment parameter from URL search params
 */
export function getExperimentFromUrl(
  searchParams: URLSearchParams | Record<string, string | undefined>,
): string | null {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get('experiment');
  }
  return searchParams.experiment || null;
}

/**
 * Get experiment value from localStorage
 */
export function getExperimentFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(EXPERIMENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist experiment value to localStorage
 */
export function setExperimentInStorage(experiment: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(EXPERIMENT_STORAGE_KEY, experiment);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get active experiment (URL takes precedence over localStorage)
 */
export function getActiveExperiment(
  searchParams: URLSearchParams | Record<string, string | undefined>,
): string | null {
  const urlExperiment = getExperimentFromUrl(searchParams);
  if (urlExperiment) {
    // Sync to localStorage when URL has experiment
    setExperimentInStorage(urlExperiment);
    return urlExperiment;
  }
  // Fallback to localStorage
  return getExperimentFromStorage();
}

/**
 * Clear experiment from localStorage
 */
export function clearExperimentFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
