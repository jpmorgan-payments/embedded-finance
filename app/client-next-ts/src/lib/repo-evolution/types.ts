export type LineWeight = 'main' | 'support';
export type StationKind = 'express' | 'local' | 'planned';

export interface RepoLine {
  id: string;
  label: string;
  /** Route bullet letter. */
  bullet: string;
  /** MTA route colour. */
  color: string;
  bulletText: string;
  /** `support` lines are drawn thinner. */
  weight: LineWeight;
  blurb: string;
  /** Line this one branches off, or null when it opens with its own terminus. */
  branchFrom: string | null;
  /** ISO date (YYYY-MM-DD) the line opens. */
  start: string;
  month: number;
}

export interface RepoMonth {
  /** `YYYY-MM` */
  key: string;
  commits: number;
  prs: number;
  /** Library version at month end, if any. */
  version: string | null;
}

export interface RepoMilestone {
  id: string;
  /** express: captioned during playback · local: detail stop · planned: open roadmap item. */
  kind: StationKind;
  /** Line the station sits on; null draws a marker across the whole map. */
  line: string | null;
  /** Short station name on the map. */
  label: string;
  title: string;
  blurb: string;
  /** ISO date (YYYY-MM-DD); null for planned stations. */
  date: string | null;
  month: number | null;
  sha: string | null;
  /** Where a planned station is recorded in the repo. */
  source: { path: string; line: number } | null;
}

export interface RepoEvolutionData {
  repoUrl: string;
  head: { sha: string; date: string; version: string | null };
  /** Top-to-bottom lane order. */
  lines: RepoLine[];
  months: RepoMonth[];
  /** History sorted by date, then planned stations in roadmap order. */
  milestones: RepoMilestone[];
  totals: { commits: number; prs: number };
}
