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
    { name: 'Hyungho Seo', commits: 899, avatar: '🥇', percentage: 52 },
    { name: 'Eugene Kontelev', commits: 723, avatar: '🥈', percentage: 42 },
    { name: 'Thomas Lukoma', commits: 88, avatar: '🥉', percentage: 5 },
    { name: 'dependabot[bot]', commits: 18, avatar: '🤖', percentage: 1 },
    { name: 'Maria McParland', commits: 7, avatar: '👏', percentage: 0 },
    { name: 'Di Sun', commits: 1, avatar: '👏', percentage: 0 },
  ],

  uxTesting: {
    sessions: [
      {
        date: '2025-12-02',
        componentsCount: 5,
        avgLoadTime: 214,
        findings: 'Baseline established',
      },
      {
        date: '2025-12-09',
        componentsCount: 5,
        avgLoadTime: 280,
        findings: 'Account masking verified',
      },
      {
        date: '2026-01-14',
        componentsCount: 5,
        avgLoadTime: 445,
        findings: 'Visual refresh verified',
      },
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

  // Simplified contribution heatmap data (52 weeks)
  contributionHeatmap: {
    weeks: Array.from({ length: 52 }, (_, i) => ({
      week: i + 1,
      commits: Math.floor(Math.random() * 20) + (i < 4 || i > 48 ? 15 : 5), // More commits in Jan and Dec
    })),
    busiestDay: 'Wednesday',
    totalDaysWithCommits: 248,
    longestStreak: 23,
  },

  featuresShipped: [
    {
      date: '2025-12-02',
      title: 'Verification Response Handling',
      component: 'LinkedAccountWidget',
      pr: 583,
    },
    {
      date: '2025-12-03',
      title: 'Test Setup Improvements',
      component: 'Infrastructure',
      pr: 582,
    },
    {
      date: '2025-12-08',
      title: 'i18n Enhancements',
      component: 'Recipients',
      pr: 599,
    },
    {
      date: '2025-12-08',
      title: 'SellSense Theme Consistency',
      component: 'All',
      pr: 600,
    },
    {
      date: '2025-12-09',
      title: 'Server-side Pagination',
      component: 'Recipients',
      pr: 601,
    },
    {
      date: '2025-12-09',
      title: 'Payment Method UI Overhaul',
      component: 'MakePayment',
      pr: 601,
    },
    {
      date: '2025-12-12',
      title: 'Virtual Scrollable Lists',
      component: 'LinkedAccountWidget',
      pr: 609,
    },
    {
      date: '2025-12-23',
      title: 'Storybook v10 Upgrade',
      component: 'Infrastructure',
      pr: 617,
    },
  ],

  funFacts: [
    { emoji: '📅', text: 'January was your busiest month with 244 commits' },
    {
      emoji: '🚀',
      text: 'You shipped a new version every 2.7 days on average',
    },
    { emoji: '📝', text: '+115,385 net lines of code added' },
    {
      emoji: '🔧',
      text: 'OnboardingFlow was the most-touched component',
    },
    { emoji: '🧪', text: '11.7% of commits mentioned "test"' },
    {
      emoji: '📚',
      text: '6.5% of commits were Storybook updates',
    },
    { emoji: '♿', text: '23 commits focused on accessibility' },
    { emoji: '🌍', text: '38 commits improved i18n' },
    {
      emoji: '🎯',
      text: '3 comprehensive UX testing sessions completed',
    },
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

  componentStatus: {
    stable: ['OnboardingFlow', 'LinkedAccountWidget', 'RecipientsWidget'],
    inTesting: ['Accounts', 'MakePayment', 'TransactionsDisplay'],
    deprecated: ['OnboardingWizardBasic', 'Recipients'],
  },
} as const;
