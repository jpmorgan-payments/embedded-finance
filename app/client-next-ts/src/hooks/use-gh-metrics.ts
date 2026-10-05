import { useCallback, useEffect, useState } from 'react';

import { parseCountCsv, parseReferrerCsv } from '@/lib/gh-metrics/parse';
import { buildRepoView, type RepoView } from '@/lib/gh-metrics/repo-view';
import {
  REPO_SOURCES,
  type RepoId,
  type RepoSource,
} from '@/lib/gh-metrics/sources';

export type RepoLoad =
  { status: 'ready'; view: RepoView } | { status: 'error'; message: string };

export interface GhMetricsState {
  loading: boolean;
  repos: Partial<Record<RepoId, RepoLoad>>;
}

async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal, cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} – ${url}`);
  }
  return response.text();
}

async function loadRepo(
  source: RepoSource,
  signal: AbortSignal
): Promise<RepoView> {
  const [views, clones, referrers] = await Promise.all([
    fetchText(source.files.views, signal),
    fetchText(source.files.clones, signal),
    fetchText(source.files.referrers, signal),
  ]);
  return buildRepoView(
    source,
    parseCountCsv(views),
    parseCountCsv(clones),
    parseReferrerCsv(referrers)
  );
}

/** Loads every repository's metrics on mount; one failing repo doesn't block the others. */
export function useGhMetrics() {
  const [state, setState] = useState<GhMetricsState>({
    loading: true,
    repos: {},
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true }));

    Promise.allSettled(
      REPO_SOURCES.map((s) => loadRepo(s, controller.signal))
    ).then((results) => {
      if (controller.signal.aborted) return;
      const repos: GhMetricsState['repos'] = {};
      results.forEach((result, i) => {
        repos[REPO_SOURCES[i].id] =
          result.status === 'fulfilled'
            ? { status: 'ready', view: result.value }
            : {
                status: 'error',
                message:
                  result.reason instanceof Error
                    ? result.reason.message
                    : String(result.reason),
              };
      });
      setState({ loading: false, repos });
    });

    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}
