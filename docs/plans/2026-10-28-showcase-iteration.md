# Showcase Iteration (Oct 28, 2026) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `/demos`, `/components`, and `/stories`, and add a new `/spotlight` route in the showcase app, per [the design](./2026-10-28-showcase-iteration-design.md).

**Architecture:** Each page gets a typed data module (`src/data/*` or `src/lib/*`) that a thin TanStack route renders. Story metadata moves into one catalog that the list page, detail page, and param validation all read. Thumbnails are captured once with Playwright and committed as static JPEGs.

**Tech Stack:** React 18, TypeScript 5.7, TanStack Router (file routes), Tailwind (plain classes, **no `eb-` prefix**), Vitest + Testing Library, Zod v4, Playwright (one-off capture).

All commands run from `app/client-next-ts/` unless noted. PowerShell: use `;`, never `&&`.

---

### Task 1: Shared ISO date formatter

**Files:**
- Modify: `src/lib/utils.ts`
- Test: `src/lib/utils.test.ts`

**Step 1: Write the failing test** (append to `src/lib/utils.test.ts`)

```ts
import { formatIsoDate } from './utils';

describe('formatIsoDate', () => {
  it('formats YYYY-MM-DD without timezone drift', () => {
    expect(formatIsoDate('2026-04-15')).toBe('April 15, 2026');
    expect(formatIsoDate('2026-01-01')).toBe('January 1, 2026');
  });

  it('supports short month names', () => {
    expect(formatIsoDate('2026-10-15', 'short')).toBe('Oct 15, 2026');
  });
});
```

**Step 2: Run it and confirm it fails**

Run: `yarn vitest run src/lib/utils.test.ts`
Expected: FAIL, `formatIsoDate` is not exported.

**Step 3: Implement** (append to `src/lib/utils.ts`)

```ts
/** Formats a `YYYY-MM-DD` date. Uses UTC so the day never shifts in US time zones. */
export function formatIsoDate(
  isoDate: string,
  month: 'long' | 'short' = 'long'
): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone: 'UTC',
  });
}
```

**Step 4: Run it and confirm it passes.** Same command, expected PASS.

---

### Task 2: Stories catalog (single source of truth)

**Files:**
- Create: `src/lib/stories-catalog.ts`
- Test: `src/lib/stories-catalog.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { STORIES, STORY_IDS } from './stories-catalog';

describe('stories catalog', () => {
  it('has unique ids', () => {
    expect(new Set(STORY_IDS).size).toBe(STORIES.length);
  });

  it('is sorted newest first by publish date', () => {
    const dates = STORIES.map((s) => s.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('only sets updated when it is after the publish date', () => {
    for (const story of STORIES) {
      if (story.updated) expect(story.updated > story.date).toBe(true);
    }
  });

  it('includes the October 2026 recipes', () => {
    expect(STORY_IDS).toEqual(
      expect.arrayContaining([
        'ux-atlas',
        'publicly-traded-companies-recipe',
        'approved-client-maintenance-recipe',
        'list-transactions-recipe',
        'digital-onboarding-recipe',
      ])
    );
  });
});
```

**Step 2: Run it and confirm it fails.** `yarn vitest run src/lib/stories-catalog.test.ts`, expected FAIL (module not found).

**Step 3: Implement `src/lib/stories-catalog.ts`**

The entries are listed newest first by `date`. `updated` is set only where the source doc had a substantive change at least a month after publication:

| id | date | updated | read time | tags |
| --- | --- | --- | --- | --- |
| ux-atlas | 2026-10-14 | — | 14 min | Onboarding, Linked Accounts, Interactive (+ `interactiveLink` → `/ux-atlas`) |
| publicly-traded-companies-recipe | 2026-10-05 | — | 10 min | DRAFT, Onboarding, PTC |
| approved-client-maintenance-recipe | 2026-08-31 | 2026-10-22 | 40 min | DRAFT, Client Maintenance, KYC |
| cross-border-fx-payout-client-recipe | 2026-07-20 | — | 15 min | (existing) |
| core-functional-requirements-index | 2026-04-15 | — | 5 min | (existing) |
| list-transactions-recipe | 2026-04-07 | — | 11 min | Transactions, API, Pagination |
| partially-hosted-onboarding | 2026-03-12 | 2026-10-27 | 25 min | (existing) |
| webhook-integration-recipe | 2026-01-08 | 2026-04-04 | 12 min | (existing) |
| important-date-selector-component | 2025-06-12 | — | 10 min | (existing) |
| date-selector-challenges | 2025-04-28 | — | 6 min | (existing) |
| digital-onboarding-recipe | 2024-07-31 | 2026-10-22 | 17 min | DRAFT, Onboarding, UX |

Shape:

```ts
export interface StoryCatalogEntry {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  updated?: string;
  readTime: string;
  tags: readonly string[];
  interactiveLink?: { to: string; label: string };
}

const STORY_ENTRIES = [/* rows above */] as const satisfies readonly StoryCatalogEntry[];

export type StoryId = (typeof STORY_ENTRIES)[number]['id'];
export type Story = StoryCatalogEntry & { id: StoryId };
export const STORIES: readonly Story[] = STORY_ENTRIES;
export const STORY_IDS = STORY_ENTRIES.map((s) => s.id) as [StoryId, ...StoryId[]];
export function getStory(id: StoryId): Story | undefined { ... }
```

**Step 4: Run it and confirm it passes.**

---

### Task 3: Story content modules and LLM sources for the 5 new recipes

**Files:**
- Create: `src/content/stories/{ux-atlas,publicly-traded-companies-recipe,approved-client-maintenance-recipe,list-transactions-recipe,digital-onboarding-recipe}.tsx`
- Modify: `src/lib/story-llm-sources.ts` (tighten the type to `Record<StoryId, StoryRecipeLlmSource>` so a missing entry fails `tsc`)

Each content module follows the existing pattern:

```tsx
import uxAtlas from '@ef-docs/UX_ATLAS.md?raw';

import { EmbeddedDocStory } from '@/components/embedded-doc-story';

export default function UxAtlasArticle() {
  return <EmbeddedDocStory markdown={uxAtlas} docPath="UX_ATLAS.md" />;
}
```

---

### Task 4: `/stories` list and detail read from the catalog

**Files:**
- Modify: `src/routes/stories.index.tsx`: render `STORIES`; add the "Updated <date>" pill and the optional interactive link.
- Modify: `src/routes/stories.$storyId.tsx`: replace `storyMeta` and the zod enum with `STORY_IDS` and `getStory`; type `storyComponents` as `Record<StoryId, LazyExoticComponent<ComponentType>>`; add the Updated pill to the header.

Verify: `npx tsc --noEmit` passes.

---

### Task 5: `/demos` data and page

**Files:**
- Create: `src/data/demo-apps.ts`
- Test: `src/data/demo-apps.test.ts`
- Modify: `src/routes/demos.tsx`

Data:

| id | title | kind | link | image |
| --- | --- | --- | --- | --- |
| sellsense | SellSense Marketplace | Marketplace demo | `/sellsense-demo` | `/marketplace-dashboard.png` |
| prosperity-bay | Prosperity Bay | Interactive story | `/prosperity-bay` | `/demos/prosperity-bay.jpg` |
| fintech-fortress | Fintech Fortress | Game | `/fortress-game` | `/demos/fintech-fortress.jpg` |

Test: ids are unique; each image file exists under `public/`. This test fails until Task 6 creates the thumbnails.

Page: remove the status and Coming Soon branches; show a kind pill; every card gets a Launch button that is a `Link` to `demo.link`.

---

### Task 6: Capture thumbnails (one-off)

Script in the session folder only (not committed). It starts `yarn dev` and uses `chromium` from `@playwright/test` at a 1280×720 viewport:

- `http://localhost:3000/prosperity-bay?chapter=6&t=999&pause=1`: wait for the scene to render, then capture.
- `http://localhost:3000/fortress-game`: hide the fixed `DemoNotice` element before capture.
- Save as JPEG (quality 82) to `public/demos/`.

Verify: both files exist, are larger than 30 KB, and Task 5's test passes. Image viewing is disabled for the agent, so a human must eyeball the result.

---

### Task 7: `/spotlight` data, page, route, and nav

**Files:**
- Create: `src/data/spotlight-content.ts`, `src/data/spotlight-content.test.ts`
- Create: `src/components/spotlight/spotlight-page.tsx`, `src/components/spotlight/spotlight-page.test.tsx`
- Create: `src/routes/spotlight.tsx`
- Modify: `src/components/landing/landing-header.tsx`: add SPOTLIGHT (desktop and mobile) between RECIPES and GITHUB.

Data (each entry verified against the live page on 2026-10-28):

| id | kind | org | date | url |
| --- | --- | --- | --- | --- |
| mercado-libre | client-story | Mercado Libre | 2026-10-15 | jpmorgan.com/payments/newsroom/mercado-libre-global-selling-embedded-payments |
| ai-fraud | thought-leadership | J.P. Morgan Payments | 2026-09-30 | jpmorgan.com/insights/payments/embedded-finance-baas/embedded-finance-ai-fraud-prevention |
| dream-payments | client-story | Dream Payments | 2026-08-11 | dreampayments.com/post/dream-payments-launches-dream-payouts |
| bill | client-story | BILL | 2026-05-20 | jpmorgan.com/insights/payments/embedded-finance-baas/bill-embedded-payments-api-sub-ledger |
| saas-growth-ai | thought-leadership | J.P. Morgan Payments | 2026-04-30 | jpmorgan.com/insights/payments/embedded-finance-baas/embedded-payments-saas-growth-ai |
| walmart | client-story | Walmart Marketplace | 2025-03-26 | jpmorgan.com/payments/newsroom/embedded-finance-walmart-marketplace-sellers |

Tests:
- Data: unique ids; https URLs only; `getSpotlightSections()` returns the newest item as `latest` and excludes it from both groups.
- Page: renders the heading; MELI appears as Latest; client stories appear in date order (Dream, BILL, Walmart); every external link has `target="_blank"` and `rel="noopener noreferrer"`.

---

### Task 8: `/components` statuses and new cards

**Files:**
- Modify: `src/components/landing/experiences-section.tsx`
- Modify: `src/components/landing/code-examples-modal.tsx`: add `payments-fx` and `client-maintenance` examples.
- Test: `src/components/landing/experiences-section.test.tsx`

Changes:
- Replace the nested status ternaries with a `STATUS_STYLES` map, and add `beta` (purple).
- `link-account` and `recipients` → `available`; `client-details` → `testing`.
- Insert `payments-fx` after `payments`:
  - demo: `/sellsense-demo?fullscreen=true&component=recipients&scenario=Seller%20with%20FX%20Payments&theme=Empty`
  - docs: PDP `.../transactions/payouts/how-to/cross-border-fx-payout`
- Append `client-maintenance`:
  - demo: Storybook `draft-approvedclientmaintenance--default`
  - recipe: `APPROVED_CLIENT_MAINTENANCE_RECIPE.md`

Test updates: 9 cards; badge counts (Available 3, Testing 4, Beta 1, In Progress 1); docs URL order; the Accounts index shifts from 5 to 6; both new code-example modals open; the ACM demo opens Storybook.

---

### Task 9: Home page counts and library READMEs

- `src/experiments/landing-page/compact-homepage/CompactHomepage.tsx`: demos count = `DEMO_APPS.length`, components = 9, guides = `STORIES.length`.
- `embedded-components/README.md` status table: add PaymentFlow (In Testing), PaymentFlowFX (Beta), and ApprovedClientMaintenance / ClientExperience (In Progress).
- `embedded-components/src/core/README.md`: add ApprovedClientMaintenance and ClientExperience rows, and mark PaymentFlow as In testing.

---

### Task 10: Verify

1. Regenerate the route tree: `Remove-Item src\routeTree.gen.ts; yarn build`
2. `yarn format`
3. `npx tsc --noEmit`
4. `yarn test`
5. Start the dev server and run a Playwright DOM check on `/demos`, `/spotlight`, `/components`, `/stories`, and `/stories/ux-atlas` (text present, link targets correct, no console errors).
6. HTTP 200 check for every new external URL.
7. Commit.
