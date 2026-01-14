# Plan: 2025 Year in Review Dashboard

A scrollable one-pager for `client-next-ts` showcasing embedded-components evolution in 2025, featuring metrics, charts, and data stories—inspired by Spotify Wrapped / Cursor Year in Review.

## Overview

Create a "Year in Review" feature similar to Spotify Wrapped / Cursor's Year in Review, displayed as a single scrollable page with full-screen sections, animated metrics, and data visualizations using shadcn charts (recharts).

## Architecture

```
src/
├── routes/
│   └── year-in-review.tsx              # Route definition
│
├── components/
│   └── year-in-review/
│       ├── YearInReviewDashboard.tsx   # Main scrollable container
│       ├── HeroSection.tsx             # "2025: A Year in Review" header
│       ├── HighlightCards.tsx          # Key metrics summary (4-6 cards)
│       ├── GrowthChart.tsx             # Traffic/clones time series
│       ├── MilestoneTimeline.tsx       # Major releases/events
│       ├── TopReferrersChart.tsx       # Top traffic sources bar chart
│       ├── CommunityInsights.tsx       # Auto-generated text insights
│       └── index.ts                    # Barrel export
│
├── hooks/
│   └── use-year-in-review-data.ts      # Data fetching hook
│
└── data/
    └── year-in-review-milestones.ts    # Static milestone/release data
```

## Implementation Steps

### Step 1: Create Route

Create `src/routes/year-in-review.tsx` using TanStack Router file-based routing pattern:

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { YearInReviewDashboard } from '@/components/year-in-review';

export const Route = createFileRoute('/year-in-review')({
  component: YearInReviewPage,
});

function YearInReviewPage() {
  return <YearInReviewDashboard />;
}
```

### Step 2: Build Component Structure

#### HeroSection.tsx
- "2025: A Year in Review" animated header
- Headline metric with animated counter (e.g., "1.2M+ API Calls")
- Scroll-down indicator

#### HighlightCards.tsx
- Grid of 4-6 key metrics:
  - Total commits
  - Releases/versions shipped
  - Page views
  - Repository clones
  - Contributors
  - Components added

#### GrowthChart.tsx
- Time series chart using existing `Chart` component with recharts
- Toggle between Area/Line/Bar views
- Monthly traffic + clones overlay
- Highlight peak months

#### MilestoneTimeline.tsx
- Vertical timeline of major 2025 events:
  - Version releases (v0.8.x → v0.10.x)
  - Major features added
  - Community milestones (stars, forks)

#### TopReferrersChart.tsx
- Horizontal bar chart
- Top 10 traffic sources
- Year-over-year comparison if data available

#### CommunityInsights.tsx
- AI-style auto-generated insights (pattern from RUMInsights.tsx):
  - "Your busiest month was August with 15,234 views"
  - "Traffic grew 127% compared to 2024"
  - "The LinkedAccounts component was the most popular"

### Step 3: Create Data Hook

`use-year-in-review-data.ts`:
- Fetch from existing metrics CSVs:
  - `traffic-stats-sorted.csv`
  - `clone-stats-sorted.csv`
  - `referrer-stats-sorted.csv`
- Filter for 2025 calendar year (Jan 1 - Dec 31, 2025)
- Calculate aggregates and trends

### Step 4: Add Milestone Data

Static JSON with key 2025 events:
```typescript
export const MILESTONES_2025 = [
  { date: '2025-01-15', type: 'release', title: 'v0.9.0', description: 'Major refactor' },
  { date: '2025-03-22', type: 'feature', title: 'LinkedAccounts', description: 'New component' },
  // ...
];
```

### Step 5: Styling

- Full-screen scroll-snap sections for Wrapped-style experience:
  ```css
  .scroll-container {
    scroll-snap-type: y mandatory;
    overflow-y: scroll;
    height: 100vh;
  }
  .section {
    scroll-snap-align: start;
    min-height: 100vh;
  }
  ```
- Animated number counters (CSS or framer-motion)
- Progressive reveal animations on scroll
- Use existing shadcn components: Card, Badge, Chart
- Theme colors: jpm-blue, jpm-brown, chart-1 through chart-5

## Data Sources

| Source | Location | Fields |
|--------|----------|--------|
| Traffic stats | `metrics/traffic-stats-sorted.csv` | date, views, unique_views |
| Clone stats | `metrics/clone-stats-sorted.csv` | date, clones, unique_clones |
| Referrer stats | `metrics/referrer-stats-sorted.csv` | date, referrer, views |
| Git metrics | GitHub API / local git | commits, contributors, PRs |
| npm downloads | npm registry API | downloads per day/week/month |
| Release data | npm versions API + git tags | version, date, highlights |

---

## Data Collection Methods

### 1. Git CLI Commands (Local Repository)

Run these from the `embedded-components/` directory:

```bash
# Total commits in 2025
git log --oneline --after="2025-01-01" --before="2026-01-01" | wc -l

# Commits per month in 2025
git log --after="2025-01-01" --before="2026-01-01" --format="%ad" --date=format:"%Y-%m" | sort | uniq -c

# Unique contributors in 2025
git log --after="2025-01-01" --before="2026-01-01" --format="%ae" | sort -u | wc -l

# List of contributors with commit counts
git shortlog -sn --after="2025-01-01" --before="2026-01-01"

# Lines of code added/removed in 2025
git log --after="2025-01-01" --before="2026-01-01" --numstat --pretty=format:"" | awk 'NF==3 {plus+=$1; minus+=$2} END {print "+"plus" -"minus}'

# Files changed in 2025
git log --after="2025-01-01" --before="2026-01-01" --name-only --pretty=format:"" | sort -u | wc -l

# First and last commit of 2025
git log --oneline --after="2025-01-01" --before="2026-01-01" --reverse | head -1  # First
git log --oneline --after="2025-01-01" --before="2026-01-01" | head -1            # Last

# Tags/releases in 2025
git tag -l --sort=-creatordate | while read tag; do
  date=$(git log -1 --format="%ai" "$tag" 2>/dev/null)
  echo "$tag $date"
done | grep "2025-"

# Most changed files in 2025
git log --after="2025-01-01" --before="2026-01-01" --name-only --pretty=format:"" | sort | uniq -c | sort -rn | head -20
```

### 2. GitHub REST API

```bash
# Repository stats (stars, forks, watchers)
curl -s "https://api.github.com/repos/jpmorgan-payments/embedded-finance" | jq '{stars: .stargazers_count, forks: .forks_count, watchers: .watchers_count}'

# Contributors list
curl -s "https://api.github.com/repos/jpmorgan-payments/embedded-finance/contributors" | jq '.[].login'

# Commits in 2025 (paginated, up to 100 per page)
curl -s "https://api.github.com/repos/jpmorgan-payments/embedded-finance/commits?since=2025-01-01T00:00:00Z&until=2025-12-31T23:59:59Z&per_page=100" | jq 'length'

# Releases/tags
curl -s "https://api.github.com/repos/jpmorgan-payments/embedded-finance/releases" | jq '.[] | {tag: .tag_name, date: .published_at, name: .name}'

# Issues closed in 2025
curl -s "https://api.github.com/repos/jpmorgan-payments/embedded-finance/issues?state=closed&since=2025-01-01T00:00:00Z&per_page=100" | jq 'length'

# Pull requests merged in 2025
curl -s "https://api.github.com/repos/jpmorgan-payments/embedded-finance/pulls?state=closed&per_page=100" | jq '[.[] | select(.merged_at != null and .merged_at >= "2025-01-01")] | length'
```

### 3. npm Registry API

Fetch package info and download stats from npm:

```bash
# Package metadata (latest version, all versions)
curl -s "https://registry.npmjs.org/@jpmorgan-payments/embedded-finance-components" | jq '{
  latest: .["dist-tags"].latest,
  versions: [.versions | keys[] | select(. != null)] | sort
}'

# All versions with publish dates
curl -s "https://registry.npmjs.org/@jpmorgan-payments/embedded-finance-components" | jq '.time | to_entries | map(select(.key != "created" and .key != "modified")) | map({version: .key, date: .value})'

# Versions published in 2025
curl -s "https://registry.npmjs.org/@jpmorgan-payments/embedded-finance-components" | jq '[.time | to_entries[] | select(.value >= "2025-01-01" and .value < "2026-01-01" and .key != "modified")] | map({version: .key, date: .value})'

# Download counts (last month)
curl -s "https://api.npmjs.org/downloads/point/last-month/@jpmorgan-payments/embedded-finance-components" | jq '.downloads'

# Download counts (specific date range - 2025)
curl -s "https://api.npmjs.org/downloads/range/2025-01-01:2025-12-31/@jpmorgan-payments/embedded-finance-components" | jq '{
  total: [.downloads[].downloads] | add,
  daily: .downloads
}'

# Weekly downloads for 2025
curl -s "https://api.npmjs.org/downloads/range/2025-01-01:2025-12-31/@jpmorgan-payments/embedded-finance-components" | jq '.downloads | group_by(.day[0:7]) | map({week: .[0].day, downloads: map(.downloads) | add})'
```

### 4. Fetch Existing Metrics CSVs

Already collected in `metrics/` folder and hosted on GitHub:

```typescript
// In use-year-in-review-data.ts
const DATA_URLS = {
  traffic: 'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/metrics/metrics/traffic-stats-sorted.csv',
  clones: 'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/metrics/metrics/clone-stats-sorted.csv',
  referrers: 'https://raw.githubusercontent.com/jpmorgan-payments/embedded-finance/metrics/metrics/referrer-stats-sorted.csv',
};

// Fetch and parse CSV
async function fetchCSV(url: string) {
  const response = await fetch(url);
  const text = await response.text();
  return parseCSV(text); // Use existing csv-parser.ts
}

// Filter for 2025
function filterFor2025(data: DataRow[]) {
  return data.filter(row => 
    row.date >= '2025-01-01' && row.date <= '2025-12-31'
  );
}
```

### 5. Scraping npm Versions Page (Alternative)

If API doesn't provide enough detail, scrape versions page:

```
URL: https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components?activeTab=versions
```

This page shows:
- All published versions
- Publish dates
- Deprecation status
- Size information

Can use `fetch_webpage` tool or browser automation to extract this data.

### 6. Pre-Generated Data Script

Create a script to collect all metrics and save as JSON:

```typescript
// scripts/collect-year-in-review-data.ts
import { execSync } from 'child_process';

interface YearInReviewData {
  year: number;
  git: {
    totalCommits: number;
    contributors: { name: string; commits: number }[];
    linesAdded: number;
    linesRemoved: number;
    filesChanged: number;
    commitsByMonth: { month: string; count: number }[];
  };
  npm: {
    versionsPublished: { version: string; date: string }[];
    totalDownloads: number;
    downloadsByMonth: { month: string; count: number }[];
  };
  github: {
    stars: number;
    forks: number;
    issuesClosed: number;
    prsMerged: number;
  };
  traffic: {
    totalViews: number;
    uniqueVisitors: number;
    topReferrers: { source: string; views: number }[];
  };
}

// Run git commands and parse output
function getGitMetrics(year: number) {
  const commits = execSync(
    `git log --oneline --after="${year}-01-01" --before="${year + 1}-01-01" | wc -l`
  ).toString().trim();
  
  // ... more git commands
  
  return { totalCommits: parseInt(commits) };
}

// Fetch npm data
async function getNpmMetrics(packageName: string, year: number) {
  const response = await fetch(
    `https://api.npmjs.org/downloads/range/${year}-01-01:${year}-12-31/${packageName}`
  );
  const data = await response.json();
  return {
    totalDownloads: data.downloads.reduce((sum, d) => sum + d.downloads, 0),
    downloadsByMonth: aggregateByMonth(data.downloads),
  };
}

// Save to JSON file
async function main() {
  const data: YearInReviewData = {
    year: 2025,
    git: getGitMetrics(2025),
    npm: await getNpmMetrics('@jpmorgan-payments/embedded-finance-components', 2025),
    // ... more data sources
  };
  
  fs.writeFileSync(
    'src/data/year-in-review-2025.json',
    JSON.stringify(data, null, 2)
  );
}
```

Run this script to generate static data file:
```bash
cd embedded-components
npx ts-node scripts/collect-year-in-review-data.ts
```

---

## Questions for Refinement

1. **Data availability**: Use real 2025 metrics data + mock data for missing metrics?
   - **Recommendation**: Yes, real data where available, mock placeholders for demo

2. **Scroll experience**: Full-screen scroll-snap (Wrapped-style) or continuous scroll?
   - **Recommendation**: Full-screen scroll-snap for immersive feel

3. **Additional metrics to include?**
   - npm downloads
   - GitHub stars/forks growth
   - Contributor count
   - Lines of code added
   - PR merge rate
   - Issue resolution time
   - Top components by usage

4. **Git data collection**: Should we add a script to extract git metrics, or use mock data?
   - Could create `scripts/collect-git-metrics.ts` to generate JSON from git log

5. **Animation library**: Use CSS animations or add framer-motion for smoother effects?

## Section Layout (Scroll Order)

1. **Hero** - "2025: A Year in Review" with headline metric
2. **Highlights** - Grid of 4-6 key metrics with animated counters
3. **Growth Story** - Traffic/clones chart with monthly breakdown
4. **Milestones** - Timeline of releases and features
5. **Community** - Referrers, stars, contributors
6. **Insights** - Auto-generated fun facts and trends
7. **Looking Ahead** - 2026 preview teaser

## Dependencies

Already available (no new installs needed):
- `recharts` v2.15.4 - Charts
- `@radix-ui/*` - UI primitives
- `lucide-react` - Icons
- `class-variance-authority` - Styling variants

Optional additions:
- `framer-motion` - Smooth scroll animations
- `react-countup` - Animated number counters

## Next Steps

1. [ ] Finalize section content and metrics to display
2. [ ] Confirm data sources and mock data strategy
3. [ ] Create route and component structure
4. [ ] Implement data hook with CSV parsing
5. [ ] Build each section component
6. [ ] Add scroll-snap and animations
7. [ ] Test and refine responsive design
