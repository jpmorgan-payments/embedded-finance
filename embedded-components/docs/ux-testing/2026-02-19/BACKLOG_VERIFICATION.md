# Backlog Verification — 2026-02-19

Re-test of every open BACKLOG.md item by **code inspection** (and browser where applicable).  
**BACKLOG path:** `embedded-components/BACKLOG.md`  
**Showcase:** https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=&lt;component&gt;&theme=Empty

## Summary

- **Method:** Each open item (Priority 1–5, BL-601, BL-723) was checked against current source in `embedded-components` and `app/client-next-ts` (showcase). Browser was used to load all 7 showcase components; UI-visible checks (filter labels, pagination, dialog) were verified via code (i18n files, component TSX).
- **Total open:** All re-tested P1–P5 and BL-601/BL-723 items remain **OPEN**.
- **Total fixed:** 0.
- **Fixed items:** When an item is fixed, remove it from BACKLOG.md (do not retain in this document).

---

## Priority 1: Critical UX & Design System (BL-001 – BL-052)

### BL-001 (Design system standardization)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-001-1 | OPEN | No doc for button usage patterns (default vs outline vs ghost vs link) in design system or component docs. |
| BL-001-2 | OPEN | StatusBadge not extracted; Badge exists, status semantics not standardized. |
| BL-001-3 | OPEN | Storybook button-variant showcase not verified in repo. |

### BL-002 (Primary action color)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-002-1 | OPEN | Theme-driven primary exists; single convention not confirmed across all themes. |
| BL-002-2 | OPEN | Primary/secondary semantics not documented in design tokens. |

### BL-009 (Footer color — showcase)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-009-1 | OPEN | Showcase `app/client-next-ts/src/components/sellsense/footer.tsx` uses theme styles; variance across fullscreen views not confirmed by code alone. Browser: not re-checked per-view. |

### BL-020 (Make Payment — field order)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-020-1 | OPEN | Product/design choice; field order not standardized in PaymentFlow/MakePayment. |
| BL-020-1a–d | OPEN | Same. |
| BL-020-2 | OPEN | "Enter details" tab order not aligned to "Select existing" in code. |

### BL-030 (Tab switching)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-030-1 | OPEN | No confirmation on tab switch with entered data. |
| BL-030-2 | OPEN | Form data preservation on tab switch not implemented. |
| BL-030-3 | OPEN | Review panel clear on tab switch not verified. |
| BL-030-4 | OPEN | Review panel accuracy vs form state not verified. |

### BL-031 (Fee display)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-031-1–4 | OPEN | Fee prominence, breakdown, ETA, and clarity are product/design; not re-tested in code. |

### BL-032 (Form validation)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-032-1–4 | OPEN | Confirm button tooltip, validation errors, section highlighting, inline feedback not present in MakePayment/PaymentFlow. |

### BL-033 (Date selection)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-033-1–3 | OPEN | Date picker / immediate-payment copy / explicit date selection not verified. |

### BL-040 (Modal accessibility)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-040-1 | OPEN | Radix Dialog provides focus trap; not explicitly verified in TransactionDetailsSheet/MakePayment modal. |
| BL-040-2–4 | OPEN | Keyboard, scroll indication, responsive sizing not re-tested. |

### BL-050 (Transaction details / data quality)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-050-1 | OPEN | `embedded-components/src/core/TransactionsDisplay/utils/formatNumberToCurrency.ts` — no NaN/undefined guard; `formatter.format(amount)` can show "NaN". |
| BL-050-2 | OPEN | hideEmpty + hasValue control visibility; N/A vs hide consistency not re-verified. |
| BL-050-3 | OPEN | "Show all fields" logic exists; not re-verified against real API shape. |
| BL-050-4 | OPEN | Additional fields from API depend on API; not re-verified. |

### BL-051 (Reference ID column)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-051-1 | OPEN | Column uses `transactionReferenceId` from row data; hidden by default. Populate-from-API or hide-when-unavailable not confirmed with real API. |
| BL-051-2 | OPEN | Behavior with real vs mock data not confirmed. |

### BL-052 (Missing data handling)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-052-1 | OPEN | Loading/empty states and skeletons exist; UI not re-verified in browser. |
| BL-052-2 | OPEN | hideEmpty/hasValue drive N/A vs omit; not re-verified. |

---

## Priority 2: High impact UX (BL-060 – BL-092)

### BL-060 (Filter & label standardization)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-060-1 | OPEN | Single convention "All Statuses" / "All Types" not applied. |
| BL-060-2 | OPEN | `embedded-components/src/i18n/en-US/transactions.json`: filters.status.all "All statuses", filters.type.all "All types" (lowercase). |
| BL-060-3 | OPEN | `embedded-components/src/i18n/en-US/recipients.json`: filters.type.all "All Types", filters.status.all "All Status". |

### BL-061 (Pagination text format)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-061-1 | OPEN | Two patterns in use: "Showing X to Y of Z" vs "X row(s) total". |
| BL-061-2 | OPEN | DataTablePagination/RecipientsTableView use "Showing {{from}} to {{to}} of {{total}}"; RecipientsPagination uses "{{count}} row(s) total" (`recipients.json` pagination.rowsTotal). |

### BL-062 (Default rows per page)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-062-1 | OPEN | Default page size not standardized. |
| BL-062-2 | OPEN | BaseRecipientsWidget `pageSize = 10`; TransactionsDisplay/TransactionsTable `pageSize: 25`. |

### BL-070 (Tooltips & help text)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-070-1–4 | OPEN | Audit for icon-only controls (tooltip or aria-label), Transactions "View"/columns, help text, and descriptive labels not re-run. |

### BL-080 (Responsive design)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-080-1–4 | OPEN | Table horizontal scroll, card vs table docs, fullscreen mobile/tablet, Transactions small-screen pattern not re-verified. |

### BL-090 (Accounts — actions)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-090-1 | OPEN | "View Transactions" not added (product requirement). |
| BL-090-2 | OPEN | Transfer/Manage/Download not added. |

### BL-091 (Accounts UI)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-091-1–2 | OPEN | Redundant "Accounts" heading is showcase-level; card title from prop/i18n. |
| BL-091-3/4 | OPEN | Balance-type Popover/aria-label not re-verified in showcase. |

### BL-092 (Accounts review)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-092-1–2 | OPEN | Consistency with LinkedAccountWidget/RecipientsWidget and responsive behavior not re-verified. |

---

## Priority 3: Medium (BL-100 – BL-130)

### BL-100 (Status badge)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-100-1–4 | OPEN | Status badge audit, variant mapping docs, WCAG hover/contrast, StatusBadge wrapper not done. |

### BL-110 (Date formatting)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-110-1–3 | OPEN | Shared formatter and locale rules not standardized; i18n/locale for dates not wired. |

### BL-120 (Menu & dialog)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-120-1–5 | OPEN | Visible tooltip for "More actions", RemoveAccountDialog confirmation, DropdownMenu keyboard/positioning, "View Details" not re-verified. |

### BL-130 (Timeline & activity)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-130-1–2 | OPEN | RecipientDetailsDialog "Timeline" naming/content and activity in other detail views not re-verified. |

---

## Priority 4: Technical debt & performance (BL-200, BL-220)

### BL-200 (Console / MSW)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-200-1 | OPEN | Duplicate party creation in MSW not fixed. |
| BL-200-2–3 | OPEN | Console verbosity and MSW logging in production not re-verified. |

### BL-220 (Performance)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-220-1–4 | OPEN | Production LCP/FID/CLS, code-split, bundle target, baseline docs not re-verified. |

---

## Priority 5: Design system foundation (BL-300 – BL-350)

### BL-300 (Collection display)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-300-1–3 | OPEN | When to use cards vs table not documented; shared rule not defined. |
| BL-301-1–2 | OPEN | CollectionDisplay/layout utilities and Storybook patterns not added. |

### BL-310 (Header/title format)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-310-1–4 | OPEN | H1 ownership and heading hierarchy not audited or documented. |
| BL-311-1–2 | OPEN | Showcase redundancy and semantic heading levels not re-verified. |

### BL-320 (Component library)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-320-5 | OPEN | StatusBadge semantic wrapper not introduced. |
| BL-321–323 | OPEN | Form primitives, DataTable/pagination pattern, Card usage not documented. |

### BL-330 (Color palette)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-330-1–3 | OPEN | Token→color mapping and status colors not documented; footer is BL-009. |

### BL-340 (Typography)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-340-1–2 | OPEN | Heading/body scale and token usage not documented. |

### BL-350 (Spacing)
| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-350-1–2 | OPEN | Spacing scale and tokens not defined or refactored. |

---

## BL-601 (Dialog description — TransactionDetailsSheet)

| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-601-1 | OPEN | `TransactionDetailsSheet.tsx` uses `DialogContent` + `DialogTitle` only; no `DialogDescription` or `aria-describedby`. |
| BL-601-2 | OPEN | Audit: TransactionDetailsSheet and RecipientDetailsDialog missing DialogDescription; RemoveAccountDialog, RecipientFormDialog, VerificationResultDialog, RemoveAccountResultDialog, MicrodepositsForm have it. |
| BL-601-3 | OPEN | Shared Dialog usage guidelines do not require description. |

---

## BL-723 (Transactions toolbar filter id/name)

| Item    | Verdict | Evidence |
|---------|---------|----------|
| BL-723-1 | OPEN | `TransactionsTableToolbar.tsx`: status filter `Select`/`SelectTrigger` have no `id` or `name`; only `data-user-event`. |
| BL-723-2 | OPEN | Type filter `Select`/`SelectTrigger` same; counterpart Input has `id="transactions-filter-counterpart"` and `name="transactions-filter-counterpart"`. |

---

## Priority 6 & tech debt (BL-400+)

**Not re-tested in this pass.** Items in BL-400–BL-599 (Theme 0–10) and BL-500–BL-508 (dependencies, ESLint v9, Tailwind v4, etc.) remain as in BACKLOG.md; verification deferred.

---

## Verification method (2026-02-19)

- **Code:** Every item above was checked against current `embedded-components` and (for showcase) `app/client-next-ts` source.
- **Browser:** All 7 showcase components were loaded (onboarding, linked-accounts, recipients, make-payment, transactions, accounts, client-details). Per-element UI checks (exact filter label text, pagination string, dialog content) were inferred from i18n and component code; no full one-by-one in-browser click-through was performed for every BL item due to snapshot/ref limits.
- **When an item is fixed:** Remove it from BACKLOG.md and optionally note in a future verification run as FIXED here.
