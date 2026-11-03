---
name: ux-testing
description: How UX review sessions for embedded-components are run and recorded in this repo - showcase fullscreen URLs per component, Storybook, dated reports under embedded-components/docs/ux-testing/, and BL- items in embedded-components/BACKLOG.md. Use when asked to UX test, visually review, or audit the components, or to update the backlog from testing results.
license: Apache-2.0
metadata:
  author: jpmorgan-payments
---

# UX testing

The detailed checklists, prompts, and browser commands are in [`embedded-components/docs/ux-testing/TESTING_PROMPT.md`](../../../embedded-components/docs/ux-testing/TESTING_PROMPT.md). This skill covers where to test and where results go.

## Where to test

Each component renders alone at `https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=<id>&theme=Empty` (mocked APIs, neutral theme). Use `theme=Empty+` to check the accessibility-focused theme.

| `component=` | Renders |
| --- | --- |
| `onboarding` | OnboardingFlow |
| `linked-accounts` | LinkedAccountWidget |
| `recipients` | RecipientsWidget |
| `payment-flow` (`make-payment` is a legacy alias) | PaymentFlow |
| `transactions` | TransactionsDisplay |
| `accounts` | Accounts |
| `client-details` | ClientDetails |

Storybook (https://storybook.embedded-finance-dev.com/, or `npm run storybook` in `embedded-components/`) covers states the demo doesn't reach, such as errors and edge-case data.

## Recording results

1. Read the latest folder in `embedded-components/docs/ux-testing/` first, so you report regressions and fixes, not repeat findings.
2. Write the session to `embedded-components/docs/ux-testing/YYYY-MM-DD/`: `UX_TESTING_REPORT.md` (findings per component, with file paths), and optionally `TESTING_SUMMARY.md` and `BACKLOG_VERIFICATION.md` (verdict per re-checked backlog item).
3. Update `embedded-components/BACKLOG.md`:
   - Add new issues under the matching priority section with the next free `BL-` number (check the highest existing ID).
   - Remove items you verified as fixed; the backlog keeps only open items.
   - Update the dated "Updated" note at the top with the session date, and link the report folder.
4. Say how each finding was verified: in the browser, or by reading code only.
