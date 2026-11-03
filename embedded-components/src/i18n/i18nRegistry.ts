import { type i18n as I18nInstance } from 'i18next';

/**
 * Registry of mounted `EBComponentsProvider` i18n instances, most recently
 * activated last. Kept dependency-free so both `config.ts` (via the Zod error
 * map) and `activeI18n.ts` can use it without an import cycle.
 */
const activeInstances: I18nInstance[] = [];

// Instance created by a provider render that has not committed yet. A single
// slot (not a list) so discarded renders (StrictMode, concurrent rendering)
// can't accumulate instances; cleared once a provider commits.
let pendingInstance: I18nInstance | undefined;

/**
 * Lets the first render of a provider (before its effects run) translate with
 * its instance. Browser only: module state must not be shared across
 * server-rendered requests.
 */
export function setPendingI18nInstance(instance: I18nInstance): void {
  if (typeof window === 'undefined') return;
  pendingInstance = instance;
  // A render that never commits (it threw or suspended) mustn't outlive this task.
  setTimeout(() => {
    if (pendingInstance === instance) pendingInstance = undefined;
  }, 0);
}

/** Call from a provider effect once it has committed. */
export function activateI18nInstance(instance: I18nInstance): void {
  pendingInstance = undefined;
  deactivateI18nInstance(instance);
  activeInstances.push(instance);
}

export function deactivateI18nInstance(instance: I18nInstance): void {
  if (pendingInstance === instance) pendingInstance = undefined;
  const index = activeInstances.indexOf(instance);
  if (index !== -1) activeInstances.splice(index, 1);
}

/** The newest provider instance, or `undefined` outside a provider. */
export const getRegisteredI18n = (): I18nInstance | undefined =>
  pendingInstance ?? activeInstances[activeInstances.length - 1];
