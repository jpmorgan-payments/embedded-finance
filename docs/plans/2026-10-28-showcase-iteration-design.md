# Showcase Iteration (Oct 28, 2026) — Design

Source: "FW: Showcase Updates" (Melody Browne / Lucy Rand mockup) plus team review.
App: `app/client-next-ts`.

## Goals

1. `/demos`: add Prosperity Bay and Fintech Fortress with thumbnails; remove "Coming Soon" demos.
2. New `/spotlight` route for client stories and thought leadership ("Featured Content" from the mockup).
3. `/components`: align statuses with the real library state; add missing exported components.
4. `/stories`: add recent recipes and show when a recipe was updated.

## 1. `/demos`

- Three live cards: SellSense Marketplace, Prosperity Bay (`/prosperity-bay`), Fintech Fortress (`/fortress-game`).
- Remove the `coming-soon` status branch; every card has a Launch button. Add a type pill
  (Marketplace demo / Interactive story / Game).
- Thumbnails: one-off Playwright capture (1280×720) saved to `public/demos/`.
  Prosperity Bay is captured at the end of chapter 6 (`?chapter=6&t=<end>&pause=1`); Fortress at its title screen.
- Keep `ecommerce-platform-concept.png` and `modern-finance-platform.png`: the legacy `demo-carousel` still uses them.

## 2. `/spotlight` (layout A, editorial)

- Data: `src/data/spotlight-content.ts`, typed entries `{ id, kind: 'client-story' | 'thought-leadership', title, org, publisher, date, description, url }`, sorted newest first.
- Layout: hero header, a large "Latest" card for the newest item, a Client Stories grid, and a Thought Leadership 2-up with an accent bar.
- Cards use a gradient monogram tile (no third-party logos), publisher, date, type pill, description, and an external "Read" link (`target="_blank" rel="noopener noreferrer"`).
- Header nav gets a SPOTLIGHT link (desktop and mobile). No other home page layout changes.
- URLs, dates, and descriptions are verified against the public pages.

## 3. `/components`

| Card                        | Before      | After             |
| --------------------------- | ----------- | ----------------- |
| Client Onboarding           | Available   | Available         |
| Link External Bank Account  | Testing     | Available         |
| Recipients Management       | Testing     | Available         |
| Make Payouts                | Testing     | Testing           |
| Transactions                | Testing     | Testing           |
| Accounts                    | Testing     | Testing           |
| Client Details              | In Progress | Testing           |
| Cross-border FX Payouts     | —           | Beta (new)        |
| Approved Client Maintenance | —           | In Progress (new) |

- New `Beta` status style.
- FX demo uses the SellSense "Seller with FX Payments" scenario.
- Add code examples for the two new cards in `code-examples-modal.tsx`.
- Align the status tables in `embedded-components/README.md` and `embedded-components/src/core/README.md`.
- Update `experiences-section.test.tsx`.
- Fix the stale counts on the default home page (`CompactHomepage`).

## 4. `/stories`

- Consolidate story metadata into `src/lib/stories-catalog.ts` (single source for the list, the detail header, and param validation).
- New stories: UX Atlas, Publicly Traded Companies (Draft), Approved Client Maintenance (Draft), List Transactions, Digital Onboarding (Draft).
- Optional `updated` date shows an "Updated <date>" pill when the source doc changed a month or more after publication.
- UX Atlas card gets a secondary link to the interactive `/ux-atlas`.

## Verification

`yarn format`, `npx tsc --noEmit`, `yarn test`, `yarn build`; DOM checks of all four routes on the dev server; HTTP check of new external links.
