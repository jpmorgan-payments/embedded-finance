export type RepoId = 'embedded-finance' | 'unicorn-finance' | 'ai';

/**
 * How a repository's collector stores GitHub traffic:
 * - `daily`: one row per day (views that day), merged across runs.
 * - `rolling14`: one snapshot per run of GitHub's 14-day totals; rows overlap
 *   and must never be summed.
 */
export type SeriesKind = 'daily' | 'rolling14';

export interface RepoSource {
  id: RepoId;
  label: string;
  githubUrl: string;
  metricsUrl: string;
  kind: SeriesKind;
  files: { views: string; clones: string; referrers: string };
}

const RAW = 'https://raw.githubusercontent.com/jpmorgan-payments';
const GITHUB = 'https://github.com/jpmorgan-payments';

export const REPO_SOURCES: readonly RepoSource[] = [
  {
    id: 'embedded-finance',
    label: 'embedded-finance',
    githubUrl: `${GITHUB}/embedded-finance`,
    metricsUrl: `${GITHUB}/embedded-finance/tree/metrics/metrics`,
    kind: 'daily',
    files: {
      views: `${RAW}/embedded-finance/metrics/metrics/traffic-stats-sorted.csv`,
      clones: `${RAW}/embedded-finance/metrics/metrics/clone-stats-sorted.csv`,
      referrers: `${RAW}/embedded-finance/metrics/metrics/referrer-stats-sorted.csv`,
    },
  },
  {
    id: 'unicorn-finance',
    label: 'unicorn-finance',
    githubUrl: `${GITHUB}/unicorn-finance`,
    metricsUrl: `${GITHUB}/unicorn-finance/tree/metrics/metrics`,
    kind: 'rolling14',
    files: {
      views: `${RAW}/unicorn-finance/metrics/metrics/view_count.csv`,
      clones: `${RAW}/unicorn-finance/metrics/metrics/clone_count.csv`,
      referrers: `${RAW}/unicorn-finance/metrics/metrics/referrer_stats.csv`,
    },
  },
  {
    id: 'ai',
    label: 'ai',
    githubUrl: `${GITHUB}/ai`,
    metricsUrl: `${GITHUB}/ai/tree/metrics/metrics`,
    kind: 'rolling14',
    files: {
      views: `${RAW}/ai/metrics/metrics/traffic-stats.csv`,
      clones: `${RAW}/ai/metrics/metrics/clone-stats.csv`,
      referrers: `${RAW}/ai/metrics/metrics/referrer-stats.csv`,
    },
  },
];

export const REPO_IDS = REPO_SOURCES.map((s) => s.id) as [RepoId, ...RepoId[]];
