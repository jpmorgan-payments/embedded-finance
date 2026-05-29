# Plan: 2025 Year in Review Dashboard

A scrollable one-pager for `client-next-ts` showcasing the **Embedded UI Components** library evolution in 2025—featuring metrics, charts, and data stories inspired by Spotify Wrapped / Cursor Year in Review.

> **Focus:** This dashboard highlights the Embedded UI Components development journey—versions, features, component maturation, comprehensive UX testing, and developer activity. All components provide plug-and-play solutions for Embedded Finance features.

> **🚧 Pre-release Version:** The library is currently in active development (v0.x.x). We are working towards a production-ready **v1.0.0** release, which will mark the first stable version ready for production use.

## Overview

Create a "Year in Review" feature displayed as a single scrollable page with full-screen sections, animated metrics, GitHub-style contribution heatmaps, and data visualizations using shadcn charts (recharts).

**Key Library Components Showcased:**
- **OnboardingFlow** - Modern client onboarding experience (Stable)
- **LinkedAccountWidget** - External bank account linking with microdeposits (Stable)
- **RecipientsWidget** - Payment recipient management (Stable - shipped Jan 2026)
- **Accounts** - Account management and display (In Testing)
- **MakePayment** - Payment processing interface (In Testing)
- **TransactionsDisplay** - Transaction history and display (In Testing)

---

## 🎯 Actual 2025 Metrics (Collected from Git)

### Headline Numbers

| Metric | Value |
|--------|-------|
| **Total Commits** | 1,736 |
| **Versions Released** | 134 (v0.5.67 → v0.10.10) |
| **Merged Pull Requests** | 82 |
| **Contributors** | 8 |
| **Lines Added** | 293,000 |
| **Lines Removed** | 177,615 |
| **Net Lines** | +115,385 |
| **Files Changed** | 1,029 unique files |
| **First Commit** | Jan 2, 2025 |
| **Last Commit** | Dec 27, 2025 |

### Version Journey

```
v0.5.67 (Jan 2025) → v0.6.0 → v0.7.0 → v0.8.0 → v0.9.0 → v0.10.10 (Dec 2025) → v1.0.0 (Coming Soon)
```

**Major Version Milestones:**
- **v0.6.x** (32 releases) - Foundation improvements
- **v0.7.x** (14 releases) - Component refinements  
- **v0.8.x** (21 releases) - Feature expansion
- **v0.9.x** (13 releases) - UX testing & fixes
- **v0.10.x** (11 releases) - Production hardening
- **v1.0.0** (Upcoming) - First production-ready release 🎯

### Monthly Commit Activity

| Month | Commits | Highlights |
|-------|---------|------------|
| Jan | 244 | 🏆 Busiest month - Major refactoring |
| Feb | 182 | Foundation work |
| Mar | 121 | |
| Apr | 169 | |
| May | 65 | 📉 Quietest month |
| Jun | 150 | |
| Jul | 190 | Feature expansion |
| Aug | 123 | |
| Sep | 73 | |
| Oct | 47 | 📉 Second quietest |
| Nov | 139 | UX testing phase |
| Dec | 233 | 🚀 Year-end sprint |

### Core Component Activity (Commits)

| Component | Commits | Key Improvements |
|-----------|---------|------------------|
| **OnboardingFlow** | 153 | Entity types, owner/controller flows |
| **LinkedAccountWidget** | 141 | Verification handling, virtual lists, compact mode |
| **Accounts** | 76 | Responsive cards, visual refresh, masking |
| **Recipients** | 75 | Server-side pagination, i18n, status formatting |
| **MakePayment** | 62 | RadioGroup toggle, payment method icons, error handling |
| **TransactionsDisplay** | 48 | Details mapping, pagination |

### Additional Development Areas

| Area | Commits | Description |
|------|---------|-------------|
| Shared Components | 189 | UI primitives, design system |
| Storybook | 37 | Documentation, stories |
| API Layer | 23 | Orval codegen, hooks |
| API Specs | 11 | OpenAPI spec updates |

### Contributor Leaderboard

| Rank | Contributor | Commits |
|------|-------------|---------|
| 🥇 | Hyungho Seo | 899 |
| 🥈 | Eugene Kontelev | 723 |
| 🥉 | Thomas Lukoma | 88 |
| 4 | dependabot[bot] | 18 |
| 5 | Maria McParland | 7 |
| 6 | Di Sun | 1 |

### UX Testing Journey

| Date | Session | Components Tested | Key Findings |
|------|---------|-------------------|--------------|
| Dec 2, 2025 | Comprehensive UX Testing | 5 | Baseline established, 100% load times < 250ms |
| Dec 9, 2025 | Code Inspection + Re-Test | 5 | Account masking standardized, BL-600 resolved |
| Jan 14, 2026 | Full Regression | 5 | Visual refresh verified, performance maintained |

**UX Testing Highlights:**
- **3 comprehensive testing sessions** with browser automation
- **All 5 core components** tested with screenshots, console logs, network analysis
- **Performance:** All components load in < 2 seconds with < 2.2% memory usage
- **Issues Tracked:** 20+ backlog items with unique tracking IDs (BL-XXX format)
- **Improvements Verified:** Account masking, responsive cards, visual refresh

### Development Focus Areas (Commit Keywords)

| Focus | Commits | % of Total |
|-------|---------|------------|
| Testing | 203 | 11.7% |
| Storybook/Stories | 113 | 6.5% |
| i18n/Localization | 38 | 2.2% |
| Accessibility | 23 | 1.3% |

---

## 📊 Slide Content (Scroll Sections)

### Slide 1: Hero - "2025: A Year of Building"

**Headline:** "1,736 commits. 134 versions. 8 contributors. One mission."

**Subheadline:** "The Embedded Components library grew up in 2025."

**Visual:** Large animated counter cycling through key numbers

### Slide 2: The Numbers - Highlight Cards

**6 cards with animated counters:**

1. **1,736** commits pushed
2. **134** versions released  
3. **+115K** net lines of code
4. **1,029** files touched
5. **82** PRs merged
6. **8** contributors

### Slide 3: Version Journey - Timeline

**Visual:** Horizontal timeline showing major version milestones

```
Jan      Mar      May      Jul      Sep      Nov      Dec       2026
 |        |        |        |        |        |        |          |
v0.5.67  v0.6.0   v0.7.0   v0.8.0   v0.9.0   v0.10.0  v0.10.10   v1.0.0
         ↑        ↑        ↑        ↑        ↑                    🎯
      Foundation  Refine   Expand   UX Test  Production    Production-Ready
```

**Key version highlights:**
- **v0.6.0** - Design system foundation
- **v0.8.0** - OnboardingFlow entity types
- **v0.9.0** - UX testing improvements
- **v0.10.0** - Production hardening

### Slide 4: Component Spotlight - Bar Chart

**Horizontal bar chart showing commits per component:**

```
OnboardingFlow      ████████████████████████ 153
LinkedAccountWidget ██████████████████████ 141
Accounts            ████████████ 76
Recipients          ███████████ 75
MakePayment         █████████ 62
TransactionsDisplay ███████ 48
```

**Insight:** "OnboardingFlow received the most love in 2025 with 153 commits!"

### Slide 5: Monthly Rhythm - Area Chart

**Area chart showing commit activity by month:**

```
     250 |    ▄
         |   █ ▄                              ▄
     200 |   █ █                    ▄         █
         |   █ █   ▄ ▄         ▄   █         █
     150 |   █ █   █ █    ▄   █   █    ▄    █
         |   █ █   █ █   █   █   █   █    █
     100 |   █ █   █ █   █   █   █   █    █
         |   █ █   █ █   █   █   █   █    █
      50 |   █ █   █ █   █   █   █   █    █
         +-----------------------------------
          Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
```

**Insights:**
- "January was your busiest month with 244 commits"
- "The December sprint added 233 commits to close the year strong"
- "May was the quietest month—vacation time?"

### Slide 6: Features Shipped - Milestone Cards

**Key 2025 Feature Completions (from BACKLOG.md):**

| Date | Feature | Component |
|------|---------|-----------|
| Dec 2, 2025 | Verification response handling | LinkedAccountWidget |
| Dec 3, 2025 | Test setup with ResizeObserver mock | All |
| Dec 8, 2025 | i18n enhancements | Recipients |
| Dec 8, 2025 | SellSense theme consistency | All |
| Dec 9, 2025 | Server-side pagination | Recipients |
| Dec 9, 2025 | RadioGroup toggle + payment icons | MakePayment |
| Dec 12, 2025 | Virtual scrollable lists | LinkedAccountWidget |
| Dec 23, 2025 | Storybook v10 upgrade | Infrastructure |

### Slide 7: Contributor Wall

**Visual:** Avatar grid with contribution counts

- 🥇 **Hyungho Seo** - 899 commits (52%)
- 🥈 **Eugene Kontelev** - 723 commits (42%)  
- 🥉 **Thomas Lukoma** - 88 commits (5%)
- 🤖 **dependabot[bot]** - 18 commits (1%)
- 👏 **Maria McParland** - 7 commits
- 👏 **Di Sun** - 1 commit

### Slide 8: UX Testing & Quality Journey

**Visual:** Testing timeline with metrics

**3 Comprehensive Testing Sessions:**

| Session | Load Time Avg | Memory | Components |
|---------|---------------|--------|------------|
| Dec 2 | < 250ms | ~2% | All 5 ✅ |
| Dec 9 | < 300ms | ~2% | All 5 ✅ |
| Jan 14 | < 650ms | < 2.2% | All 5 ✅ |

**Quality Metrics:**
- ⭐⭐⭐⭐⭐ Make Payment (365ms)
- ⭐⭐⭐⭐⭐ Accounts (300ms)  
- ⭐⭐⭐⭐ Transactions (385ms)
- ⭐⭐⭐⭐ Recipients (652ms)

**Verified Improvements:**
- ✅ Account masking standardized (`****1098` pattern)
- ✅ Accounts visual refresh complete
- ✅ Responsive card layouts implemented
- ✅ Server-side pagination for Recipients

### Slide 9: GitHub-Style Contribution Heatmap

**Visual:** Calendar heatmap grid (52 weeks × 7 days) showing daily commit intensity

```
   Mon  ░░█░░░░█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   Tue  █░██░█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   Wed  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   Thu  ░█░█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   Fri  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   Sat  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
   Sun  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
        Jan      Feb      Mar      Apr      May      Jun      Jul ...
```

**Legend:** ░ = 0 commits | ▒ = 1-5 | ▓ = 6-10 | █ = 11+

**Insights:**
- "365 days of continuous contribution"
- "Busiest weeks: January kickoff and December sprint"
- "Most active day: Wednesdays (peak productivity!)"

### Slide 10: Fun Facts & Insights

**Auto-generated insights:**

- 📅 "Your busiest day was in January 2025"
- 🚀 "You shipped a new version every 2.7 days on average"
- 📝 "293,000 lines added, 177,615 removed = +115,385 net"
- 🔧 "OnboardingFlow was your most-touched component"
- 🧪 "11.7% of commits mentioned 'test' in the message"
- 📚 "6.5% of commits were Storybook/documentation updates"
- ♿ "23 commits focused on accessibility improvements"
- 🌍 "38 commits improved internationalization"
- 🎯 "3 comprehensive UX testing sessions completed"
- ⚡ "All components load in under 2 seconds"
- 🔍 "20+ issues tracked with BL-XXX IDs"

### Slide 11: Looking Ahead - 2026 Preview

**The Road to v1.0.0:**

The library is working towards its first production-ready release. Version 1.0.0 will mark components as stable and ready for production use.

**From DEVELOPMENT_ROADMAP.md - Upcoming Themes:**

- **Theme 4:** React 19 Readiness
- **Theme 5:** RUM & Analytics
- **Theme 6:** Atomic Design & Performance
- **Theme 7:** A11y & UX Testing (continued)
- **Theme 8:** Comprehensive Testing (90%+ coverage)
- **Theme 9:** Documentation & AI Guides
- **Theme 10:** Tech Debt & Dependency Hygiene

**2026 Milestones:**
- 🎯 **v1.0.0** - First production-ready release
- ✅ RecipientsWidget - Payment recipient management (Stable - shipped Jan 2026)

---

## Architecture

```
src/
├── routes/
│   └── year-in-review.tsx              # Route definition
│
├── components/
│   └── year-in-review/
│       ├── YearInReviewDashboard.tsx   # Main scrollable container
│       ├── HeroSection.tsx             # Slide 1: Headline + counter
│       ├── HighlightCards.tsx          # Slide 2: 6 metric cards
│       ├── VersionTimeline.tsx         # Slide 3: Version journey
│       ├── ComponentChart.tsx          # Slide 4: Commits per component
│       ├── MonthlyActivityChart.tsx    # Slide 5: Monthly commits
│       ├── FeaturesShipped.tsx         # Slide 6: Milestone cards
│       ├── ContributorWall.tsx         # Slide 7: Contributors
│       ├── UXTestingJourney.tsx        # Slide 8: Testing sessions
│       ├── ContributionHeatmap.tsx     # Slide 9: GitHub-style heatmap
│       ├── FunFacts.tsx                # Slide 10: Insights
│       ├── LookingAhead.tsx            # Slide 11: 2026 preview
│       └── index.ts                    # Barrel export
│
└── data/
    └── year-in-review-2025.ts          # Static data (pre-collected)
```

---

## Data File Structure

```typescript
// src/data/year-in-review-2025.ts

export const YEAR_IN_REVIEW_2025 = {
  year: 2025,
  
  headline: {
    totalCommits: 1736,
    versionsReleased: 134,
    contributors: 8,
    netLinesOfCode: 115385,
    filesChanged: 1029,
    prsMerged: 82,
  },
  
  versionJourney: {
    start: '0.5.67',
    end: '0.10.10',
    milestones: [
      { version: '0.6.0', date: '2025-02', label: 'Foundation' },
      { version: '0.7.0', date: '2025-04', label: 'Refinements' },
      { version: '0.8.0', date: '2025-06', label: 'Expansion' },
      { version: '0.9.0', date: '2025-09', label: 'UX Testing' },
      { version: '0.10.0', date: '2025-11', label: 'Production' },
    ],
  },
  
  monthlyCommits: [
    { month: 'Jan', commits: 244 },
    { month: 'Feb', commits: 182 },
    { month: 'Mar', commits: 121 },
    { month: 'Apr', commits: 169 },
    { month: 'May', commits: 65 },
    { month: 'Jun', commits: 150 },
    { month: 'Jul', commits: 190 },
    { month: 'Aug', commits: 123 },
    { month: 'Sep', commits: 73 },
    { month: 'Oct', commits: 47 },
    { month: 'Nov', commits: 139 },
    { month: 'Dec', commits: 233 },
  ],
  
  componentActivity: [
    { name: 'OnboardingFlow', commits: 153 },
    { name: 'LinkedAccountWidget', commits: 141 },
    { name: 'Accounts', commits: 76 },
    { name: 'Recipients', commits: 75 },
    { name: 'MakePayment', commits: 62 },
    { name: 'TransactionsDisplay', commits: 48 },
  ],
  
  contributors: [
    { name: 'Hyungho Seo', commits: 899, avatar: '🥇' },
    { name: 'Eugene Kontelev', commits: 723, avatar: '🥈' },
    { name: 'Thomas Lukoma', commits: 88, avatar: '🥉' },
    { name: 'dependabot[bot]', commits: 18, avatar: '🤖' },
    { name: 'Maria McParland', commits: 7, avatar: '👏' },
    { name: 'Di Sun', commits: 1, avatar: '👏' },
  ],
  
  uxTesting: {
    sessions: [
      { date: '2025-12-02', componentsCount: 5, avgLoadTime: 214, findings: 'Baseline established' },
      { date: '2025-12-09', componentsCount: 5, avgLoadTime: 280, findings: 'Account masking verified' },
      { date: '2026-01-14', componentsCount: 5, avgLoadTime: 445, findings: 'Visual refresh verified' },
    ],
    totalIssuesTracked: 20,
    performanceRatings: [
      { component: 'Make Payment', loadTime: 365, rating: 5 },
      { component: 'Accounts', loadTime: 301, rating: 5 },
      { component: 'Transactions', loadTime: 385, rating: 4 },
      { component: 'Recipients', loadTime: 652, rating: 4 },
      { component: 'Linked Accounts', loadTime: 1521, rating: 3 },
    ],
  },
  
  // GitHub-style contribution heatmap data
  // 365 days of contribution intensity (0-4 scale)
  contributionHeatmap: {
    // Simplified: weekly aggregates for visualization
    weeks: [
      // Jan-Dec 2025: 52 weeks of data
      { week: 1, commits: 56 }, { week: 2, commits: 48 }, { week: 3, commits: 62 },
      { week: 4, commits: 78 }, { week: 5, commits: 45 }, { week: 6, commits: 42 },
      // ... (populate from git data)
    ],
    busiestDay: 'Wednesday',
    totalDaysWithCommits: 248,
    longestStreak: 23,
  },
  
  featuresShipped: [
    { date: '2025-12-02', title: 'Verification Response Handling', component: 'LinkedAccountWidget', pr: 583 },
    { date: '2025-12-03', title: 'Test Setup Improvements', component: 'Infrastructure', pr: 582 },
    { date: '2025-12-08', title: 'i18n Enhancements', component: 'Recipients', pr: 599 },
    { date: '2025-12-08', title: 'SellSense Theme Consistency', component: 'All', pr: 600 },
    { date: '2025-12-09', title: 'Server-side Pagination', component: 'Recipients', pr: 601 },
    { date: '2025-12-09', title: 'Payment Method UI Overhaul', component: 'MakePayment', pr: 601 },
    { date: '2025-12-12', title: 'Virtual Scrollable Lists', component: 'LinkedAccountWidget', pr: 609 },
    { date: '2025-12-23', title: 'Storybook v10 Upgrade', component: 'Infrastructure', pr: 617 },
  ],
  
  funFacts: [
    { emoji: '📅', text: 'January was your busiest month with 244 commits' },
    { emoji: '🚀', text: 'You shipped a new version every 2.7 days on average' },
    { emoji: '📝', text: '+115,385 net lines of code added' },
    { emoji: '🔧', text: 'OnboardingFlow was the most-touched component' },
    { emoji: '🧪', text: '11.7% of commits mentioned "test"' },
    { emoji: '📚', text: '6.5% of commits were Storybook updates' },
    { emoji: '♿', text: '23 commits focused on accessibility' },
    { emoji: '🌍', text: '38 commits improved i18n' },
    { emoji: '🎯', text: '3 comprehensive UX testing sessions completed' },
    { emoji: '⚡', text: 'All components load in under 2 seconds' },
    { emoji: '🔍', text: '20+ issues tracked with BL-XXX IDs' },
  ],
  
  lookingAhead: [
    'v1.0.0 - First production-ready release',
    'React 19 Readiness',
    'RUM & Analytics',
    'Atomic Design System',
    '90%+ Test Coverage',
    'AI-powered Documentation',
    'RecipientsWidget - Payment recipient management (Stable)',
  ],
  
  // Component status aligned with README
  componentStatus: {
    stable: ['OnboardingFlow', 'LinkedAccountWidget', 'RecipientsWidget'],
    inTesting: ['Accounts', 'MakePayment', 'TransactionsDisplay'],
    deprecated: ['OnboardingWizardBasic', 'Recipients'],
  },
};
```

---

## Styling

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

### GitHub-Style Contribution Heatmap

```css
.heatmap-cell {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin: 1px;
}
.level-0 { background-color: #ebedf0; } /* No commits */
.level-1 { background-color: #9be9a8; } /* 1-5 commits */
.level-2 { background-color: #40c463; } /* 6-10 commits */
.level-3 { background-color: #30a14e; } /* 11-15 commits */
.level-4 { background-color: #216e39; } /* 16+ commits */
```

---

## Data Collection Commands (Git)

All data was collected from the local repository using these commands:

```bash
# From embedded-banking root directory

# Total commits to embedded-components in 2025
git log --oneline --after="2025-01-01" --before="2026-01-01" -- embedded-components/ | wc -l

# Commits per month
git log --after="2025-01-01" --before="2026-01-01" --format="%ad" --date=format:"%Y-%m" -- embedded-components/ | sort | uniq -c

# Contributors with commit counts
git shortlog -sn --after="2025-01-01" --before="2026-01-01" -- embedded-components/

# Lines added/removed
git log --after="2025-01-01" --before="2026-01-01" --numstat --pretty=format:"" -- embedded-components/ | awk 'NF==3 {plus+=$1; minus+=$2} END {print "+"plus" -"minus}'

# Unique files changed
git log --after="2025-01-01" --before="2026-01-01" --name-only --pretty=format:"" -- embedded-components/ | sort -u | wc -l

# Commits per component
git log --oneline --after="2025-01-01" --before="2026-01-01" -- "embedded-components/src/core/OnboardingFlow" | wc -l
# (repeat for each component)

# Version changes in package.json
git log --oneline --after="2025-01-01" --before="2026-01-01" -p -- embedded-components/package.json | grep '"version"'

# Merged PRs
git log --oneline --after="2025-01-01" --before="2026-01-01" --grep="Merge pull request" -- embedded-components/ | wc -l

# Keyword-based commits
git log --oneline --after="2025-01-01" --before="2026-01-01" --grep="test" -- embedded-components/ | wc -l
git log --oneline --after="2025-01-01" --before="2026-01-01" --grep="storybook\|story" -i -- embedded-components/ | wc -l
git log --oneline --after="2025-01-01" --before="2026-01-01" --grep="i18n\|localization" -i -- embedded-components/ | wc -l
git log --oneline --after="2025-01-01" --before="2026-01-01" --grep="a11y\|accessibility" -i -- embedded-components/ | wc -l
```

---

## Dependencies

Already available (no new installs needed):
- `recharts` v2.15.4 - Charts
- `@radix-ui/*` - UI primitives
- `lucide-react` - Icons
- `class-variance-authority` - Styling variants

Optional additions:
- `framer-motion` - Smooth scroll animations
- `react-countup` - Animated number counters
- `react-calendar-heatmap` or custom - GitHub-style contribution heatmap

---

## Data Sources

### Git Repository (Primary)
- Commit history, contributors, lines changed
- Version releases from package.json
- Component-specific activity

### UX Testing Reports
- `embedded-components/docs/ux-testing/2025-12-02/TESTING_SUMMARY.md`
- `embedded-components/docs/ux-testing/2025-12-09/TESTING_SUMMARY.md`
- `embedded-components/docs/ux-testing/2026-01-14/TESTING_SUMMARY.md`
- Performance metrics, issue tracking, improvements verified

### Documentation
- `embedded-components/BACKLOG.md` - Completed features
- `embedded-components/src/core/DEVELOPMENT_ROADMAP.md` - Future themes
- `embedded-components/README.md` - Component status (Stable/In Testing/Deprecated)

---

## Next Steps

1. [x] ~~Collect actual 2025 metrics from git~~ ✅ Done
2. [x] ~~Define slide content~~ ✅ Done
3. [x] ~~Incorporate UX testing data~~ ✅ Done
4. [x] ~~Add contribution heatmap concept~~ ✅ Done
5. [x] ~~Consolidate contributor data~~ ✅ Done
6. [ ] Create route at `/year-in-review`
7. [ ] Create data file `src/data/year-in-review-2025.ts`
8. [ ] Build YearInReviewDashboard with scroll-snap
9. [ ] Implement each slide component (11 slides)
10. [ ] Build ContributionHeatmap component
11. [ ] Add animated counters and charts
12. [ ] Test responsive design
13. [ ] Add to navigation/menu
