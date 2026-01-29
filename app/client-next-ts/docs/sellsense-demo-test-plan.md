# SellSense Demo – Test Plan (Scenarios & Configuration Options)

Base URL: `https://embedded-finance-dev.com/sellsense-demo`

## Configuration dimensions

| Dimension    | Values |
|-------------|--------|
| **Scenarios** | New Seller - Onboarding, Onboarding - Seller with prefilled data, Onboarding - Docs Needed, Linked Bank Account, Seller with Limited DDA, Seller with Payments DDA |
| **Themes**   | Empty, Default Blue, Salt Theme, Create Commerce, SellSense, PayFicient, Custom |
| **Content tone** | Standard, Friendly |
| **View**     | onboarding, overview, wallet, transactions, linked-accounts, payout, catalog, pricing, orders, payments, performance, analytics, growth |
| **Fullscreen** | `fullscreen=true` |
| **Component** (fullscreen) | accounts, linked-accounts, recipients, make-payment, transactions, onboarding |

## Test batches (subagent-style)

1. **Scenarios** – For each scenario, load `?scenario=<name>` and assert: page loads, scenario-specific header/title, no runtime errors.
2. **Themes** – For each theme, load `?theme=<name>` and assert: page loads, theme reflected in UI.
3. **Content tone** – `?contentTone=Standard` and `?contentTone=Friendly`; assert copy/tone change where applicable.
4. **Views** – For active scenarios: `?view=wallet|overview|transactions|linked-accounts`; for onboarding scenarios: `?view=onboarding`.
5. **Fullscreen + component** – `?fullscreen=true&component=accounts|linked-accounts|recipients|make-payment|transactions|onboarding&theme=Empty`.

## URL encoding

- Scenario names with spaces: e.g. `New+Seller+-+Onboarding` or `New%20Seller%20-%20Onboarding`.
- Route schema uses display names: `New Seller - Onboarding`, `Onboarding - Docs Needed`, etc.

## Pass criteria

- HTTP 200, no uncaught console errors.
- Main content area visible; scenario/theme/view correspond to URL.
- Fullscreen URLs show only the requested component in fullscreen.

## Automated checks (subagent-style)

- **Live manual run:** Browser MCP navigation over https://embedded-finance-dev.com/sellsense-demo; all URL combinations exercised (see `docs/sellsense-demo-test-results.md`).
- **Playwright e2e:** `tests/e2e/sellsense-demo-urls.spec.ts` — 6 describe blocks (scenarios, themes, content tone, views, fullscreen+component, combined). Run after `npx playwright install`:
  - `npm run e2e:sellsense-urls` or `npx playwright test tests/e2e/sellsense-demo-urls.spec.ts`
  - Use `BASE_URL=https://...` to target a different origin/path.
