import type { ReferrerRow } from './parse';

export type ReferrerCategory =
  | 'github'
  | 'search'
  | 'ai'
  | 'social'
  | 'jpm'
  | 'chat-email'
  | 'internal'
  | 'partner'
  | 'other';

/** `hidden` groups are shown as totals only so the public page never lists intranet host names. */
export const REFERRER_CATEGORIES: Record<
  ReferrerCategory,
  { label: string; hidden: boolean }
> = {
  github: { label: 'GitHub', hidden: false },
  jpm: { label: 'J.P. Morgan sites', hidden: false },
  search: { label: 'Search engines', hidden: false },
  ai: { label: 'AI assistants', hidden: false },
  social: { label: 'Social', hidden: false },
  'chat-email': { label: 'Chat & email', hidden: false },
  internal: { label: 'JPMC internal', hidden: true },
  partner: { label: 'Partner intranets', hidden: true },
  other: { label: 'Other sites', hidden: false },
};

const SEARCH =
  /^(google|bing|duckduckgo|yahoo|baidu|ecosia|yandex)$|(^|\.)(search\.brave\.com|sogou\.com|yandex\.[a-z]+|ecosia\.org|baidu\.com)$/;
const AI =
  /(^|\.)(chatgpt\.com|chat\.openai\.com|claude\.ai|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com|poe\.com|phind\.com)$/;
const CHAT_EMAIL =
  /(^|\.)(mail\.google\.com|com\.google\.android\.gm|outlook\.(live|office|office365)\.com|slack\.com|teams\.microsoft\.com|teams\.cdn\.office\.net|teams\.public\.onecdn\.static\.microsoft)$/;
const SOCIAL =
  /(^|\.)(linkedin\.com|com\.linkedin\.android|lnkd\.in|t\.co|x\.com|twitter\.com|threads\.com|threads\.net|facebook\.com|reddit\.com|news\.ycombinator\.com|youtube\.com|medium\.com|dev\.to)$/;
const JPM =
  /(^|\.)(jpmorgan\.com|jpmorganchase\.github\.io|embedded-finance-dev\.com|embedded-banking-dev\.com|online-payments-dev\.com)$/;
const INTERNAL = /(^|\.)(jpmchase\.net|jpmchase\.com)$/;
const PARTNER =
  /(^|\.)(confluence|jira|jiradc|wiki|intranet)\.|\.sharepoint\.com$|\.atlassian\.net$/;

export function categorizeReferrer(site: string): ReferrerCategory {
  const host = site.trim().toLowerCase();
  if (host === 'github.com') return 'github';
  if (INTERNAL.test(host)) return 'internal';
  if (AI.test(host)) return 'ai';
  if (CHAT_EMAIL.test(host)) return 'chat-email';
  if (SEARCH.test(host)) return 'search';
  if (SOCIAL.test(host)) return 'social';
  if (JPM.test(host)) return 'jpm';
  if (PARTNER.test(host)) return 'partner';
  return 'other';
}

export interface ReferrerSite {
  site: string;
  count: number;
  uniques: number;
}

export interface ReferrerGroup {
  category: ReferrerCategory;
  label: string;
  hidden: boolean;
  count: number;
  siteCount: number;
  /** Empty for hidden groups. */
  sites: ReferrerSite[];
}

export interface ReferrerSummary {
  /**
   * `latest-window`: GitHub's 14-day referrers as of `asOf`.
   * `last-seen`: the source keeps no dates, only each site's most recent 14-day count.
   */
  basis: 'latest-window' | 'last-seen';
  asOf: string | null;
  total: number;
  groups: ReferrerGroup[];
  sitesEverSeen: number;
}

export function summarizeReferrers(rows: ReferrerRow[]): ReferrerSummary {
  const dates = rows.map((r) => r.date).filter((d): d is string => d !== null);
  const asOf =
    dates.length > 0 ? dates.reduce((a, b) => (b > a ? b : a)) : null;
  const current = asOf ? rows.filter((r) => r.date === asOf) : rows;

  const bySite = new Map<string, ReferrerSite>();
  for (const r of current) {
    bySite.set(r.site, { site: r.site, count: r.count, uniques: r.uniques });
  }

  const groups = new Map<ReferrerCategory, ReferrerGroup>();
  for (const site of bySite.values()) {
    const category = categorizeReferrer(site.site);
    const meta = REFERRER_CATEGORIES[category];
    let group = groups.get(category);
    if (!group) {
      group = {
        category,
        label: meta.label,
        hidden: meta.hidden,
        count: 0,
        siteCount: 0,
        sites: [],
      };
      groups.set(category, group);
    }
    group.count += site.count;
    group.siteCount += 1;
    if (!meta.hidden) group.sites.push(site);
  }

  for (const group of groups.values()) {
    group.sites.sort(
      (a, b) => b.count - a.count || a.site.localeCompare(b.site)
    );
  }

  return {
    basis: asOf ? 'latest-window' : 'last-seen',
    asOf,
    total: [...bySite.values()].reduce((sum, s) => sum + s.count, 0),
    groups: [...groups.values()].sort((a, b) => b.count - a.count),
    sitesEverSeen: new Set(rows.map((r) => r.site)).size,
  };
}
