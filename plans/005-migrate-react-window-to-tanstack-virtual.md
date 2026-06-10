# Plan 005: Migrate IndustryTypeSelect from react-window to @tanstack/react-virtual and drop react-window

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1663e9a3..HEAD -- embedded-components/src/core/OnboardingFlow/components/IndustryTypeSelect/ embedded-components/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (independent of plans 001-004)
- **Category**: tech-debt / migration
- **Planned at**: commit `1663e9a3`, 2026-06-10

## Why this matters

The library ships **two** list-virtualization dependencies: `@tanstack/react-virtual` (modern, actively maintained, used by `BaseRecipientsWidget`) and `react-window` v1.8.11 (legacy, maintenance-mode since ~2021, used by exactly **one** component: `IndustryTypeSelect`). Both libraries end up in consumer bundles. Migrating the single remaining usage to the library the codebase already standardized on removes a stale dependency from a published package and leaves one consistent virtualization pattern.

## Current state

- `embedded-components/package.json:146` — `"react-window": "^1.8.11",` (dependencies); `:176` — `"@types/react-window": "^1",` (devDependencies). `@tanstack/react-virtual` `^3.13.14` is already a dependency (line 120).
- **Sole usage**: `embedded-components/src/core/OnboardingFlow/components/IndustryTypeSelect/IndustryTypeSelect.tsx`
  - line 5: `import { VariableSizeList as List } from 'react-window';`
  - lines 397-411, inside a `CommandList` (cmdk) popover — the list renders only while open:

    ```tsx
    <div className="eb-relative" style={{ height: 300 }}>
      {internalOpen && items.length > 0 && (
        <List
          key={searchQuery} // Only re-render when search changes, not when open changes
          height={300}
          itemCount={items.length}
          itemSize={getItemHeight}
          width="100%"
          className="eb-scrollbar-none eb-overflow-y-auto"
          overscanCount={10}
          initialScrollOffset={searchQuery === '' ? initialScrollOffset : 0}
        >
          {({ index, style }) => {
            const item = items[index];
            ...
            // renders 'header' rows and selectable option rows with style={{...style}}
          }}
        </List>
      )}
    </div>
    ```

  - `items` is a flat array mixing `header` rows and option rows; `getItemHeight(index)` returns a per-row height (variable-size list); `initialScrollOffset` pre-scrolls to a section. Read the whole file before editing — there are more references to these helpers above line 397.
- **In-repo exemplar of the target pattern**: `embedded-components/src/core/RecipientWidgets/components/BaseRecipientsWidget/BaseRecipientsWidget.tsx`
  - line 5: `import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';`
  - lines 477-487:

    ```tsx
    const rowVirtualizer = useVirtualizer({
      count: recipients.length,
      getScrollElement: () => scrollContainerRef.current,
      estimateSize: () => 240,
      overscan: 2,
      enabled: scrollable,
      measureElement:
        typeof window !== 'undefined'
          ? (element: Element) => (element as HTMLElement).offsetHeight
          : undefined,
    });
    ```

- **Existing test**: `IndustryTypeSelect.test.tsx` sits next to the component — your safety net. Run it before and after.

API mapping (react-window → tanstack):

| react-window (`VariableSizeList`) | @tanstack/react-virtual (`useVirtualizer`) |
|---|---|
| `height={300}` on the List | a scroll container div with `style={{ height: 300, overflowY: 'auto' }}` and a ref passed via `getScrollElement` |
| `itemCount={items.length}` | `count: items.length` |
| `itemSize={getItemHeight}` (fn of index) | `estimateSize: (index) => getItemHeight(index)` — exact sizes known up front, so no `measureElement` needed |
| `overscanCount={10}` | `overscan: 10` |
| `initialScrollOffset={...}` | `initialOffset: ...` option, or `scrollToOffset(...)` in a layout effect when the popover opens |
| `key={searchQuery}` remount hack | keep the remount (`key` on the container) **or** call `virtualizer.measure()`/`scrollToOffset(0)` when `searchQuery` changes — prefer keeping `key` to minimize behavior change |
| children render-prop with `style` | map `virtualizer.getVirtualItems()`; inner sizer div `style={{ height: virtualizer.getTotalSize(), position: 'relative' }}`; each row absolutely positioned with `transform: translateY(${item.start}px)` and `data-index={item.index}` |

Conventions: `eb-` Tailwind prefix on all utility classes; `cn()` from `@/lib/utils`; keep the existing `data-testid` attributes (`industry-select-priority-header` etc.) intact — the test file selects on them.

## Commands you will need

All run from `C:\dev\code\embedded-finance\embedded-components` (PowerShell: chain with `;`, never `&&`).

| Purpose   | Command                                                          | Expected on success |
|-----------|------------------------------------------------------------------|---------------------|
| Install   | `yarn install`                                                   | exit 0              |
| Component tests | `yarn test:unit src/core/OnboardingFlow/components/IndustryTypeSelect` | all pass |
| Typecheck | `yarn typecheck`                                                 | exit 0              |
| Lint      | `yarn lint`                                                      | exit 0              |
| Full unit | `yarn test:unit`                                                 | all pass            |
| Build     | `yarn build`                                                     | exit 0              |
| Storybook | `yarn storybook`                                                 | dev server starts   |

## Scope

**In scope**:
- `embedded-components/src/core/OnboardingFlow/components/IndustryTypeSelect/IndustryTypeSelect.tsx`
- `embedded-components/src/core/OnboardingFlow/components/IndustryTypeSelect/IndustryTypeSelect.test.tsx` (only if selectors must adapt to the new DOM; assertions' meaning must not change)
- `embedded-components/package.json` (remove `react-window`, `@types/react-window`)
- `yarn.lock` (regenerated)

**Out of scope** (do NOT touch):
- `BaseRecipientsWidget.tsx` — the exemplar; already correct.
- `naics-codes.json`, the priority-grouping logic, search/filter logic in IndustryTypeSelect — recently changed (commit `8fd6ac90`, "priority grouping for stock exchange dropdown"); only the rendering layer migrates.
- Any other component; `react-window` has exactly one usage site at `1663e9a3`.

## Git workflow

- Branch: `advisor/005-migrate-react-window`
- Commit style: `refactor(industry-select): migrate virtualization to @tanstack/react-virtual`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run the existing component tests and record the result.

**Verify**: `yarn test:unit src/core/OnboardingFlow/components/IndustryTypeSelect` → all pass (if not, STOP — broken baseline).

### Step 2: Migrate the rendering

In `IndustryTypeSelect.tsx`: replace the `react-window` import with `import { useVirtualizer } from '@tanstack/react-virtual';`, introduce a `scrollParentRef` on the 300px container (give it `eb-overflow-y-auto` and keep `eb-scrollbar-none`), configure `useVirtualizer` per the mapping table, and convert the render-prop children into a `getVirtualItems().map(...)` loop preserving: header vs option row branches, all classNames, all `data-testid`s, the `key={searchQuery}` remount (move it to the scroll container), and the initial-scroll-to-section behavior (`initialOffset` when `searchQuery === ''`). The hook must be called unconditionally (top of component, `enabled: internalOpen && items.length > 0`) — hooks can't live behind the current `{internalOpen && ...}` guard.

**Verify**: `yarn typecheck` → exit 0.

### Step 3: Re-run component tests

**Verify**: `yarn test:unit src/core/OnboardingFlow/components/IndustryTypeSelect` → all pass. jsdom note: tanstack-virtual measures nothing in jsdom; since sizes come from `estimateSize` (exact, not measured), rows should render. If the test environment renders zero rows because the scroll container reports height 0, mock `getBoundingClientRect`/`offsetHeight` on the scroll container in the test setup — pattern: see how other suites in this repo handle jsdom layout gaps (search `embedded-components/src` for `getBoundingClientRect` mocks) — and note it in your report.

### Step 4: Remove the dependency

Delete `"react-window"` (package.json:146) and `"@types/react-window"` (package.json:176); run `yarn install`.

**Verify**: `grep -rn "react-window" embedded-components/src embedded-components/package.json` → no matches; `yarn install` → exit 0.

### Step 5: Behavioral check in Storybook

`yarn storybook`; open an OnboardingFlow story that reaches the industry-type dropdown (business-details step), then check: (a) the dropdown opens with the priority section pinned at top, (b) scrolling through ~1000 NAICS rows is smooth, (c) typing in the search filters and resets scroll to top, (d) selecting an item works and closes.

**Verify**: all four behaviors observed. If you cannot reach the dropdown in any story, run the consumer app instead (`app/client-next-ts`: `npm run dev`, sellsense-demo onboarding) or report that manual verification was not possible.

### Step 6: Full quality gate

`yarn format` ; `yarn build` ; `yarn test`.

**Verify**: all exit 0.

## Test plan

The existing `IndustryTypeSelect.test.tsx` is the characterization suite — it must pass **unmodified** if possible; selector-only adjustments are acceptable, assertion semantics are not. Add one new test: with the popover open, assert that more than 0 and fewer than `items.length` option rows are in the DOM (proves virtualization is active, guards against accidentally rendering all ~1000 rows).

Verification: `yarn test:unit src/core/OnboardingFlow/components/IndustryTypeSelect` → all pass including 1 new test.

## Done criteria

ALL must hold:

- [ ] `grep -rn "react-window" embedded-components/src embedded-components/package.json` → no matches
- [ ] `yarn typecheck`, `yarn lint`, `yarn test:unit`, `yarn build` all exit 0
- [ ] Existing IndustryTypeSelect assertions unchanged in meaning; 1 new virtualization test passes
- [ ] Storybook (or app) manual check from step 5 done, or its impossibility reported
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 baseline tests fail before any change.
- `grep` finds a second `react-window` usage site (drift since `1663e9a3`).
- The popover's open/close animation breaks because the hook's `enabled` gating differs from the old conditional render — if you cannot preserve the "list stays mounted during close animation" comment's intent (line 398), report the trade-off rather than guessing.
- Step 3 requires changing what existing tests assert (not just how they select).

## Maintenance notes

- After this lands, `@tanstack/react-virtual` is the only virtualization library; reviewers should reject new `react-window` imports.
- The `estimateSize`-from-`getItemHeight` approach assumes row heights stay statically computable. If rows later get dynamic content (wrapping text), switch to `measureElement` like `BaseRecipientsWidget.tsx:483-486` does.
- The `key={searchQuery}` remount is preserved as-is; a future optimization could replace it with `scrollToOffset` + `measure()` calls, but that's behavior-neutral polish, deliberately deferred.
