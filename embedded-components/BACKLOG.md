# Embedded Components - Development Backlog

**Last Updated:** April 8, 2026  
**Status:** Living Document - Updated as work progresses  
**Source:** UX Testing Report (2025-12-02, 2025-12-09, 2026-01-14, 2026-02-19, 2026-03-06), Development Roadmap, Recent PRs  
**Reference:** Deployed showcase https://embedded-finance-dev.com/sellsense-demo (onboarding, linked-accounts, recipients, transactions, accounts, make-payment, **client-details**); Storybook https://storybook.embedded-finance-dev.com/

**Re-tested:** February 19, 2026 — Each open item (Priority 1–5, BL-601, BL-723) was re-verified by **code inspection** (embedded-components and app/client-next-ts). All 7 showcase components were **browser-loaded**; UI-visible issues (e.g. filter labels, pagination, Dialog) were confirmed via code (i18n, component TSX). Full one-by-one in-browser click-through for every BL item was not done. See **`docs/ux-testing/2026-02-19/BACKLOG_VERIFICATION.md`** for item-level verdicts and evidence. Only **open** items are listed; completed/fixed items are not retained.

**Updated:** March 6, 2026 — Git analysis of 60+ commits (Feb 22 – Mar 6, 2026) and full browser UX testing session across all 7 components. Key changes this cycle: ClientDetails error/loading states, content tokens architecture, i18n expansion (es-US/fr-CA), ServerErrorAlert pattern, Mock API Editor enhancements, Empty+ a11y theme, session transfer multi-experience support. See **`docs/ux-testing/2026-03-06/`** for browser test results. New items: BL-800+.

**Note on Tracking IDs:** This backlog uses a hierarchical format (BL-001-1, BL-001-1a, etc.) for detailed task breakdown. New items from 2025-12-09 testing use simple sequential IDs (BL-600+). Future backlog updates may migrate to simpler format for consistency.

---

## 📑 Tracking ID Index

**ID Range Guidelines:**

- **BL-001 to BL-099:** Priority 1 (Critical UX & Design System Issues)
- **BL-060 to BL-199:** Priority 2 (High Impact UX Improvements)
- **BL-100 to BL-199:** Priority 3 (Medium Priority Improvements)
- **BL-200 to BL-299:** Priority 4 (Technical Debt & Performance)
- **BL-300 to BL-399:** Priority 5 (Design System Foundation)
- **BL-400 to BL-599:** Priority 6 (Roadmap Theme Alignment)
- **BL-500 to BL-599:** Theme 10 (Tech Debt & Dependency Hygiene)

### Quick Reference by Component

**MakePayment:**

- BL-020: Form field ordering consistency
- BL-030: Tab switching behavior
- BL-031: Fee display enhancement
- BL-032: Form validation & feedback
- BL-033: Date selection
- BL-040: Modal accessibility
- BL-403: Theme 0 enhancements (Recipient/method filtering, fee/time ETA, review/confirmation UX, cross-currency)

**Recipients (DEPRECATED - use RecipientsWidget):**

> ⚠️ The legacy Recipients component is deprecated. Use `RecipientsWidget` for new implementations.
> Backlog items below are retained for historical reference and ongoing maintenance.

- BL-060: Filter & label standardization
- BL-061: Pagination text format
- BL-062: Default rows per page
- BL-070: Tooltips & help text
- BL-080: Responsive design improvements
- BL-402: Theme 0 enhancements (Conditional attributes, edit flows, duplicate detection)

**TransactionsDisplay:**

- BL-050: Data quality & display issues
- BL-051: Reference ID column
- BL-052: Missing data handling
- BL-060: Filter & label standardization
- BL-070: Tooltips & help text
- BL-080: Responsive design improvements
- BL-404: Theme 0 enhancements (Pagination, details attribute mapping, PAYIN/PAYOUT derivation)
- BL-601: Dialog Description (TransactionDetailsSheet)
- BL-723: Form fields missing id/name (toolbar filter Selects)

**Accounts:**

- BL-090: Missing action buttons
- BL-091: UI improvements
- BL-092: Component review needed
- BL-405: Theme 0 enhancements (Responsive cards, balance types mapping, masking/toggle)

**LinkedAccountWidget:**

- BL-070: Tooltips & help text
- BL-401: Theme 0 enhancements (Parity with Recipients, status messaging, microdeposit flows)

**RecipientsWidget:**

- BL-406: Theme 0 enhancements (Compact/virtual list parity, table view refinements, success states)
- BL-070: Tooltips & help text
- BL-080: Responsive design improvements
- BL-310: Header/title consistency

**ClientDetails (fully available as of 2026-03-04):**

- Fullscreen URL: `?component=client-details&theme=Empty`
- Status updated to 'available' in showcase (Mar 2026)
- **Implemented:** error/loading states (ServerErrorAlert + useServerError hook), skeleton, content tokens (all 3 locales), improved styling
- Pending UX audit items: BL-810 (full UX audit), BL-070 (tooltips), BL-310 (header/title), BL-601-2 (dialog descriptions)

**All Components:**

- BL-001: Design system standardization (see re-assessed section below)
- BL-002: Primary action color standardization
- BL-009: Footer color standardization
- BL-070: Tooltips & help text
- BL-100: Status badge standardization
- BL-110: Date formatting standardization
- BL-120: Menu & dialog enhancements
- BL-200: Console errors & MSW issues
- BL-220: Performance optimization
- BL-300: Collection display patterns
- BL-310: Component header/title format standardization
- BL-320: Component library creation
- BL-330: Color palette standardization
- BL-340: Typography system
- BL-350: Spacing system

**Tech Debt & Dependencies:**

- BL-500: Dependency audit & security
- BL-501: TypeScript & toolchain updates
- BL-502: Build/test infrastructure (Vite 7.x, Vitest 4.x — see Theme 10 for pinned ranges)
- BL-503: Orval & API dependencies
- BL-505: ESLint upgrade to v9
- BL-506: Tailwind CSS upgrade to v4
- BL-507: React & UI library updates
- BL-508: Other dependency updates

Completed items are not listed in this document.

---

## 📋 Backlog Overview

This backlog consolidates findings from UX testing, development roadmap themes, and recent enhancements. Items are organized by priority and aligned with roadmap themes. This is a **living document** that should be updated as work progresses.

### Status Legend

- 🔴 **Critical** - Blocks user experience or functionality
- 🟠 **High** - Significant UX impact, should be addressed soon
- 🟡 **Medium** - Important but not blocking
- 🟢 **Low** - Nice to have, polish items
- 🚧 **In Progress** - Currently being worked on
- 📋 **Planned** - Scheduled for future work

_(Completed items are removed from this document and not listed.)_

---

## 🎯 Priority 1: Critical UX & Design System Issues

### 1.1 Design System Standardization 🟠 [BL-001] — Re-assessed January 2026

**Source:** UX Testing Report - Critical Inconsistencies Summary  
**Theme Alignment:** Theme 6 (Atomic Design), Theme 7 (A11y & UX Testing)  
**Components Affected:** All  
**Tracking ID:** BL-001  
**Reference:** Latest source and deployed showcase (https://embedded-finance-dev.com/sellsense-demo — onboarding, linked-accounts, recipients, transactions, accounts, make-payment)

#### Current State (as of January 2026)

Substantial progress has been made. Re-assessment against latest source and deployed components shows:

- **Button system:** A single shared `Button` component (`@/components/ui/button`) is used across core components. Variants: `default` (primary), `outline`, `secondary`, `ghost`, `link`, `destructive`, `warning`, `input`. All use `eb-` prefixed design tokens.
- **Theme & tokens:** `EBComponentsProvider` and `convert-theme-to-css-variables` drive primary, secondary, destructive, etc. from `EBTheme` / `EBThemeVariables`. Salt-aligned token naming is in use.
- **Component usage:** Onboarding, LinkedAccountWidget, RecipientsWidget, TransactionsDisplay, Accounts, MakePayment/PaymentFlow consistently import and use `Button` with semantic variants (e.g. primary submit = `default`, cancel = `outline`, icon actions = `ghost`).

#### Remaining work [BL-001]

- [ ] **BL-001-1:** Document button usage patterns (when to use default vs outline vs ghost vs link) in design system or component docs
- [ ] **BL-001-2:** Optionally extract `StatusBadge` as a first-class design-system component (Badge exists; status semantics could be standardized)
- [ ] **BL-001-3:** Ensure Storybook stories showcase button variants where relevant

#### Primary Action Color [BL-002]

- [ ] **BL-002-1:** Confirm single primary action color (theme-driven; ensure all themes define it consistently)
- [ ] **BL-002-2:** Document primary/secondary semantics in design tokens

#### Footer Color [BL-009]

- [ ] **BL-009-1:** In the **showcase app** (client-next-ts / SellSense), standardize footer color across fullscreen component views (onboarding, linked-accounts, recipients, transactions, accounts, make-payment) if any variance remains.

---

### 1.2 Make Payment Form UX 🟠 [BL-020+] — Re-assessed Jan 2026

**Source:** UX Testing Report - Make Payment Component Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements), Theme 7 (A11y & UX Testing)  
**Components Affected:** MakePayment / PaymentFlow  
**Tracking IDs:** BL-020, BL-030, BL-031, BL-032, BL-033, BL-040, BL-403

**Re-assessed (Jan 2026):** PaymentFlow and MakePayment use shared Button, PayeeSelector, ReviewPanel, etc. Field order, tab behavior, fee display, validation, date, and modal a11y are still product/design choices; verify against latest source and deployed make-payment view (embedded-finance-dev.com) for current behavior.

#### Form Field Ordering Consistency [BL-020]

- [ ] **BL-020-1:** Standardize field order between "Select existing" and "Enter details" tabs
  - [ ] **BL-020-1a:** Recipient selection/details first
  - [ ] **BL-020-1b:** Payment method second
  - [ ] **BL-020-1c:** Amount third
  - [ ] **BL-020-1d:** Optional fields last
- [ ] **BL-020-2:** Update "Enter details" tab to match "Select existing" tab order

#### Tab Switching Behavior [BL-030]

- [ ] **BL-030-1:** Add confirmation when switching tabs with entered data, OR
- [ ] **BL-030-2:** Preserve form data when switching tabs
- [ ] **BL-030-3:** Clear review panel when switching tabs to avoid confusion
- [ ] **BL-030-4:** Ensure review panel accurately reflects current form state

#### Fee Display Enhancement [BL-031]

- [ ] **BL-031-1:** Make fee information more prominent
- [ ] **BL-031-2:** Show fee breakdown earlier in the flow
- [ ] **BL-031-3:** Consider showing estimated fees before amount entry
- [ ] **BL-031-4:** Improve fee calculation display clarity

#### Form Validation & Feedback [BL-032]

- [ ] **BL-032-1:** Add tooltip explaining why Confirm button is disabled
- [ ] **BL-032-2:** Show validation errors for missing required fields
- [ ] **BL-032-3:** Highlight incomplete sections
- [ ] **BL-032-4:** Add inline field validation feedback

#### Date Selection [BL-033]

- [ ] **BL-033-1:** Add date picker if scheduling future payments is needed, OR
- [ ] **BL-033-2:** Clarify that payments are immediate (if that's the case)
- [ ] **BL-033-3:** Make date selection explicit if it's a feature

#### Modal Accessibility [BL-040]

- [ ] **BL-040-1:** Ensure modal has focus trap
- [ ] **BL-040-2:** Add keyboard navigation support
- [ ] **BL-040-3:** Add visual indication if content is scrollable
- [ ] **BL-040-4:** Ensure responsive modal sizing

**Estimated Impact:** High - Improves user flow consistency

---

### 1.3 Data Quality & Display Issues 🟠 [BL-050] — Re-assessed Jan 2026

**Source:** UX Testing Report - Transaction Details Modal, Technical Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements), Theme 8 (Comprehensive Testing)  
**Components Affected:** TransactionsDisplay  
**Tracking ID:** BL-050

**Re-assessed (Jan 2026):** TransactionDetailsSheet uses `renderField` with `hideEmpty` and `naText`; ledger balance is formatted via `formatNumberToCurrency(transaction.ledgerBalance, ...)`. `formatNumberToCurrency` does not guard against `NaN` — `Intl.NumberFormat().format(NaN)` yields "NaN". Columns use `naText` and optional hiding. Reference ID is a column and filter; Transaction filters have id/name on inputs.

#### Transaction Details Modal [BL-050]

- [ ] **BL-050-1:** Harden Ledger Balance (and any currency) against NaN/undefined: validate before calling `formatNumberToCurrency`, or extend formatter to return `naText`/hide when not a valid number
- [ ] **BL-050-2:** Keep "N/A" vs hide approach consistent: `hideEmpty` plus `hasValue` already control visibility; ensure MSW/API provide realistic values where possible
- [ ] **BL-050-3:** Only show "Show all fields" when there are meaningful extra fields (logic exists; verify against real API shape)
- [ ] **BL-050-4:** Populate additional fields from API when available

#### Reference ID Column [BL-051]

- [ ] **BL-051-1:** Populate reference ID from API, or hide column when never available
- [ ] **BL-051-2:** Confirm behavior with real vs mock data

#### Missing Data Handling [BL-052]

- [ ] **BL-052-1:** Loading/empty: confirm TransactionsDisplay and TransactionDetailsSheet have clear loading and empty states (skeletons and empty messaging exist; validate in UI)
- [ ] **BL-052-2:** Standardize when to show "N/A" vs omit field (already driven by `hideEmpty` and `hasValue` in details sheet)

---

## 🎯 Priority 2: High Impact UX Improvements

### 2.1 Filter & Label Standardization 🟠 [BL-060] — Re-assessed Jan 2026

**Source:** UX Testing Report - Recipients & Transactions Components  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** Recipients (legacy), RecipientsWidget table (if filters added), TransactionsDisplay  
**Tracking ID:** BL-060

**Re-assessed (Jan 2026):** Source shows Transactions uses `transactions.json` "All statuses"/"All types" (lowercase); legacy Recipients uses `recipients.json` "All Types"/"All Status". RecipientsWidget table view (RecipientsTableView/BaseRecipientsWidget) does not expose status/type filters in code — filters apply to legacy Recipients and Transactions only.

#### Filter Labels [BL-060]

- [ ] **BL-060-1:** Standardize to "All Statuses" and "All Types" (title case, plural) across components
- [ ] **BL-060-2:** Update Transactions: `transactions.json` filters.status.all / filters.type.all (currently "All statuses", "All types")
- [ ] **BL-060-3:** Update legacy Recipients: `recipients.json` filters.status.all / filters.type.all (currently "All Status", "All Types")

**Current state:** Transactions: "All statuses", "All types". Legacy Recipients: "All Types", "All Status". **Remaining:** Pick one convention and apply in both i18n files.

#### Pagination Text Format [BL-061]

- [ ] **BL-061-1:** Standardize pagination copy: either "Showing X to Y of Z" or "X total"
- [ ] **BL-061-2:** Transactions and RecipientsWidget table use "Showing {{from}} to {{to}} of {{total}}" (DataTablePagination / RecipientsTableView). Legacy Recipients uses "{{count}} row(s) total" (RecipientsPagination).

**Current state:** Transactions + RecipientsWidget table: "Showing X to Y of Z". Legacy Recipients: "X row(s) total". **Remaining:** Decide single pattern and align legacy Recipients if still in use.

#### Default Rows Per Page [BL-062]

- [ ] **BL-062-1:** Standardize default page size (e.g. 10 or 25)
- [ ] **BL-062-2:** RecipientsWidget/BaseRecipientsWidget default `pageSize = 10`; Transactions default `pageSize: 25`.

**Current state:** RecipientsWidget 10, Transactions 25. **Remaining:** Document or standardize default; hide pagination when only one page exists (RecipientsWidget already does: `totalCount > pagination.pageSize`).

---

### 2.2 Tooltips & Help Text 🟠 [BL-070] — Re-assessed Jan 2026

**Source:** UX Testing Report - Multiple Components  
**Theme Alignment:** Theme 7 (A11y & UX Testing)  
**Components Affected:** All  
**Tracking ID:** BL-070

**Re-assessed (Jan 2026):** RecipientsWidget/RecipientCard and RecipientsTableView use `aria-label` (e.g. `actions.viewDetails`, `actions.moreActions`, `actions.makePayment`) and Tooltip where needed (e.g. edit-disabled, payment-disabled). Accounts AccountCard uses Popover + `aria-label` for balance-type info (`card.balanceTypeInfoAriaLabel`). Transactions "View" opens TransactionDetailsSheet; toolbar/columns use aria-labels.

- [ ] **BL-070-1:** Ensure every icon-only or ambiguous control has either a visible tooltip or an `aria-label` (and document pattern)
- [ ] **BL-070-2:** Audit remaining spots: Transactions "View" / columns button, RecipientsWidget "more actions" visibility of purpose (aria exists; add tooltip if UX needs it)
- [ ] **BL-070-3:** Add help text for complex features where still missing
- [ ] **BL-070-4:** Confirm all interactive elements have descriptive labels (many already do)

**Current state:** RecipientsWidget and Accounts use aria-labels and Popover/tooltips. **Remaining:** Targeted audit for any icon-only buttons still missing tooltip or aria-label; prefer aria-label as baseline.

---

### 2.3 Responsive Design Improvements 🟠 [BL-080] — Re-assessed Jan 2026

**Source:** UX Testing Report - Recipients Component  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** RecipientsWidget, TransactionsDisplay  
**Tracking ID:** BL-080

**Re-assessed (Jan 2026):** RecipientsWidget supports `viewMode: 'cards' | 'compact-cards' | 'table'` and `scrollable`; compact/table and card layouts exist. TransactionsDisplay has TransactionCard and table; DataTable is used. Accounts uses responsive grid (PR #629).

#### Table Responsiveness [BL-080]

- [ ] **BL-080-1:** If RecipientsWidget or Transactions table still shows horizontal scroll on small viewports, refine breakpoints or column visibility
- [ ] **BL-080-2:** Document when to use card vs table on small screens (RecipientsWidget already offers card/table by prop)
- [ ] **BL-080-3:** Test fullscreen component views (embedded-finance-dev.com) on mobile/tablet and fix any overflow or scroll issues
- [ ] **BL-080-4:** Ensure Transactions table has a usable small-screen pattern (e.g. card swap or responsive columns)

**Current state:** RecipientsWidget has compact-cards and table; Accounts has responsive cards. **Remaining:** Validate on real viewports and document responsive behavior.

---

### 2.4 Accounts Component Enhancements 🟡 [BL-090] — Re-assessed Jan 2026

**Source:** UX Testing Report - Accounts Component Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** Accounts  
**Tracking ID:** BL-090

**Re-assessed (Jan 2026):** Accounts uses `CardTitle` with `_title ?? t('accounts:titleSingle')` plus "s (N)" for multiple; parent can pass `title`. Balance-type info uses Popover + `card.balanceTypeInfoAriaLabel` and balance-type descriptions in i18n. Responsive layout and grid updated in PR #629.

#### Missing Action Buttons [BL-090]

- [ ] **BL-090-1:** Add "View Transactions" link/button (if product requirement)
- [ ] **BL-090-2:** Add "Transfer Funds" / "Manage Account" / "Download Statement" only if required by product

#### UI Improvements [BL-091]

- [ ] **BL-091-1:** Redundant "Accounts" heading is typically from **showcase app** (page title + card title). In component, card title is configurable via `title` prop and defaults to "Your account(s)". App can pass a different title to avoid redundancy.
- [ ] **BL-091-2:** Card title is already driven by prop/i18n; optional: use account category/name when showing a single account.
- [ ] **BL-091-3/4:** Info icon next to balance types uses Popover and aria-label; verify in showcase that it’s visible and accessible.

#### Component Review [BL-092]

- [ ] **BL-092-1:** Compare Accounts structure with LinkedAccountWidget/RecipientsWidget for consistency (e.g. empty state, loading, error, refs).
- [ ] **BL-092-2:** Confirm responsive behavior on embedded-finance-dev.com fullscreen views.

---

## 🎯 Priority 3: Medium Priority Improvements

### 3.1 Status Badge Standardization 🟡 [BL-100] — Re-assessed Jan 2026

**Source:** UX Testing Report - Multiple Components  
**Theme Alignment:** Theme 6 (Atomic Design)  
**Components Affected:** All  
**Tracking ID:** BL-100

**Re-assessed (Jan 2026):** Badge component exists (`@/components/ui/badge`); Transactions uses `getStatusVariant(status)` and Badge `variant={getStatusVariant(...)}`; direction uses `'default' | 'secondary'`. Recipients and LinkedAccountWidget use status styling. No single StatusBadge semantic wrapper yet.

- [ ] **BL-100-1:** Audit status badge styling (Transactions, RecipientsWidget, LinkedAccountWidget, Accounts) and align variants
- [ ] **BL-100-2:** Document status → color/variant mapping (e.g. Success/Completed, Pending, Error/Rejected) in design system or component docs
- [ ] **BL-100-3:** Add hover/contrast if needed for WCAG AA
- [ ] **BL-100-4:** Optional: introduce a StatusBadge wrapper that maps status to Badge variant + i18n label

---

### 3.2 Date Formatting Standardization 🟡 [BL-110] — Re-assessed Jan 2026

**Source:** UX Testing Report - Recipient Details Modal  
**Theme Alignment:** Theme 0 (Functional Enhancements), Theme 2 (i18n)  
**Components Affected:** All  
**Tracking ID:** BL-110

**Re-assessed (Jan 2026):** TransactionDetailsSheet uses `useLocale()` and `toLocaleDateString` / `toLocaleString` with locale. RecipientDetailsDialog and other detail views use various date formatting. Theme 2 (i18n) will drive locale-aware formatting.

- [ ] **BL-110-1:** Standardize date/datetime format (e.g. short date vs long, with/without time) and document in design system or i18n guide
- [ ] **BL-110-2:** Use a shared formatter (e.g. date-fns + locale or Intl + locale) everywhere; ensure Recipient details and Transaction details use same rules
- [ ] **BL-110-3:** Wire i18n/locale for dates (Theme 2) so format respects user locale

---

### 3.3 Menu & Dialog Enhancements 🟡 [BL-120] — Re-assessed Jan 2026

**Source:** UX Testing Report - Linked Account Manage Menu  
**Theme Alignment:** Theme 7 (A11y & UX Testing)  
**Components Affected:** LinkedAccountWidget, RecipientsWidget  
**Tracking ID:** BL-120

**Re-assessed (Jan 2026):** RecipientCard and RecipientsTableView use DropdownMenuTrigger with `aria-label={t('actions.moreActions', { name: displayName })}`. RemoveAccountDialog exists for remove flow. Radix DropdownMenu provides keyboard support (Enter, Escape, arrows) by default.

- [ ] **BL-120-1:** Add visible tooltip to "More actions" trigger (e.g. "Manage account" / "More actions") — aria-label already present
- [ ] **BL-120-2:** Confirm "Remove Account" uses confirmation (RemoveAccountDialog) before submit
- [ ] **BL-120-3:** Verify DropdownMenu keyboard behavior (Radix default); fix any custom handling that blocks it
- [ ] **BL-120-4:** Ensure menu positioning (align="end", collisionBoundary) avoids viewport cutoff on small screens
- [ ] **BL-120-5:** "View Details" exists where recipient/account details are implemented; add only if product requires it in menu

---

### 3.4 Timeline & Activity History 🟡 [BL-130] — Re-assessed Jan 2026

**Source:** UX Testing Report - Recipient Details Modal  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** RecipientsWidget (RecipientDetailsDialog), legacy Recipients  
**Tracking ID:** BL-130

**Re-assessed (Jan 2026):** Scope is RecipientDetailsDialog (and legacy Recipients detail view). Backlog is about naming and content of a "Timeline" section.

- [ ] **BL-130-1:** If RecipientDetailsDialog has a "Timeline" section with limited events, either add more events from API (e.g. last payment, last updated) or rename to "Created" / "Activity" so copy matches behavior
- [ ] **BL-130-2:** Extend activity/history to other detail views only if product specifies it

---

## 🎯 Priority 4: Technical Debt & Performance

### 4.1 Console Errors & MSW Issues 🟡 [BL-200] — Re-assessed Jan 2026

**Source:** UX Testing Report - Technical Analysis  
**Theme Alignment:** Theme 8 (Comprehensive Testing)  
**Components Affected:** All (MSW initialization)  
**Tracking ID:** BL-200  
**See also:** BL-603 (same MSW duplicate-party issue)

**Re-assessed (Jan 2026):** Duplicate party creation in MSW is a known init/seed issue; fix in handlers or seed (e.g. idempotent create or single client).

- [ ] **BL-200-1:** Fix duplicate party creation in MSW (parties 2200000111–2200000113; client 0030000134 vs 0030000132) — align with BL-603
- [ ] **BL-200-2:** Reduce console verbosity in production; optional log levels (debug/info/warn/error)
- [ ] **BL-200-3:** Minimize MSW logging in production builds

---

**Note:** Duplicate API calls observed in the development environment (e.g. tab-switch emulation, MSW) are dev-only behavior and are not tracked in this backlog.

---

### 4.2 Performance Optimization 🟢 [BL-220] — Re-assessed Jan 2026

**Source:** UX Testing Report - Performance Metrics  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All  
**Tracking ID:** BL-220

**Re-assessed (Jan 2026):** Metrics from mocked/showcase environment; production monitoring and bundle targets remain relevant. Virtualization and lazy patterns already used in RecipientsWidget/LinkedAccountWidget.

- [ ] **BL-220-1:** Monitor production performance (LCP, FID, CLS) on embedded-finance-dev.com and real host apps
- [ ] **BL-220-2:** Code-split / lazy-load non-critical routes or heavy components if bundles grow
- [ ] **BL-220-3:** Keep bundle size under target (e.g. 500KB) and set Core Web Vitals targets
- [ ] **BL-220-4:** Document current baseline (mocked load ~204ms, main chunk timing) and track over time

---

## 🎯 Priority 5: Design System Foundation

### 5.0 Collection Display Patterns 🟠 [BL-300] — Re-assessed Jan 2026

**Source:** User Feedback - Missing Consistent Pattern  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All components displaying collections  
**Tracking ID:** BL-300

**Re-assessed (Jan 2026):** RecipientsWidget and LinkedAccountWidget support `viewMode: 'cards' | 'compact-cards' | 'table'` and `scrollable`; choice is caller-driven. Accounts uses responsive card grid (PR #629). TransactionsDisplay uses table + TransactionCard. So table-vs-cards is often a product/config choice, not a single global rule.

#### Collection Display Rules [BL-300]

- [ ] **BL-300-1:** Document when to use cards vs table (e.g. by count, by viewport, or by product choice) and recommend defaults (e.g. 1–N cards, N+ table, or always table for transactions)
- [ ] **BL-300-2:** Capture current behavior: RecipientsWidget/LinkedAccountWidget = cards or table via prop; Accounts = cards; Transactions = table (and card in list?). Add to design system or component docs
- [ ] **BL-300-3:** If a single "collection display" rule is desired, define it and align components; otherwise treat as documented product options

#### Implementation [BL-301]

- [ ] **BL-301-1:** Optional: shared `CollectionDisplay` or layout utilities only if multiple components would reuse the same breakpoint/rule logic
- [ ] **BL-301-2:** Ensure card and table layouts are accessible and responsive; document patterns in Storybook

---

### 5.1 Component Header/Title Format Standardization 🟠 [BL-310] — Re-assessed Jan 2026

**Source:** User Feedback - Different Header/Title Formats  
**Theme Alignment:** Theme 6 (Atomic Design)  
**Components Affected:** All components  
**Tracking ID:** BL-310

**Re-assessed (Jan 2026):** Header/title patterns are partly component-owned and partly from the host (showcase app). Accounts accepts `title` and uses CardTitle; RecipientsWidget/LinkedAccountWidget/TransactionsDisplay typically receive or render a main title; OnboardingFlow uses StepLayout. Redundancy (e.g. "Accounts" twice) often comes from the host rendering both a page title and passing/defaulting the same text into the component.

#### Header/Title Pattern Analysis [BL-310]

- [ ] **BL-310-1:** Audit who renders H1 (host vs component) for onboarding, linked-accounts, recipients, transactions, accounts, make-payment in the showcase; document which components expose a `title` or slot
- [ ] **BL-310-2:** Document current patterns: Page title (H1), section/card title, modal title; recommend heading hierarchy (H1 → H2 → H3)
- [ ] **BL-310-3:** Define convention for page vs section vs card titles and document in design system or AGENTS/ARCHITECTURE
- [ ] **BL-310-4:** Optional: introduce PageHeader/SectionHeader/CardTitle/ModalTitle primitives if multiple components would share them

#### Implementation [BL-311]

- [ ] **BL-311-1:** Where redundancy exists (e.g. showcase "Accounts" + card "Accounts"), fix in **showcase** by varying page title or component `title` prop
- [ ] **BL-311-2:** Ensure components that render headings use semantic levels consistently; add spacing/typography tokens if needed

---

### 5.2 Component Library Creation 🟡 [BL-320] — Re-assessed Jan 2026

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All  
**Tracking ID:** BL-320

**Re-assessed (Jan 2026):** Button with variants (default, outline, secondary, ghost, link, destructive, warning) exists and is used; Card/CardHeader/CardTitle/CardContent/CardFooter exist; Table, Select, Input, Label, Form patterns exist. DataTable and pagination are used in Transactions and RecipientsWidget. See BL-001 for button system; BL-100 for StatusBadge.

#### Button Components [BL-320]

- **BL-320-1–4:** Covered by shared Button + variants (see BL-001). Optional: document "Primary/Secondary/Tertiary/Icon" as semantic aliases for default/outline/link/icon.
- [ ] **BL-320-5:** StatusBadge semantic wrapper (map status → Badge variant + label) — see BL-100.

#### Form / Table / Card [BL-321–323]

- [ ] **BL-321:** Standardize form primitives (Input, Select, DatePicker, FormField) and document usage; many exist in `@/components/ui` and StandardFormField.
- [ ] **BL-322:** DataTable and Pagination are in use; document table + pagination pattern and optional shared wrapper.
- [ ] **BL-323:** Card primitives exist; document CardHeader/CardTitle/CardBody/CardFooter usage.

---

### 5.2 Color Palette Standardization 🟡 [BL-330] — Re-assessed Jan 2026

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All  
**Tracking ID:** BL-330

**Re-assessed (Jan 2026):** EBThemeVariables and convert-theme-to-css-variables define primary, secondary, destructive, muted, etc.; Salt-aligned token names in use. Button and UI components consume these via `eb-` tokens. BL-002 and BL-009 cover primary and footer consistency.

- [ ] **BL-330-1:** Document token → color mapping (primary, secondary, tertiary, status, neutral) in design system
- [ ] **BL-330-2:** Align status colors (success/pending/error/warning) with Badge/StatusBadge usage (see BL-100)
- [ ] **BL-330-3:** Footer color consistency is showcase-app concern (BL-009)

---

### 5.3 Typography System 🟢 [BL-340] — Re-assessed Jan 2026

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All  
**Tracking ID:** BL-340

**Re-assessed (Jan 2026):** EBThemeVariables include contentFontFamily, textHeadingFontFamily; components use `eb-font-*`, `eb-text-*` and Title/Text. Full typography scale and heading hierarchy are not yet documented as tokens.

- [ ] **BL-340-1:** Define and document heading hierarchy (H1–H4) and body/label scales in design tokens or style guide
- [ ] **BL-340-2:** Ensure typography tokens are used consistently (or document current usage)

---

### 5.4 Spacing System 🟢 [BL-350] — Re-assessed Jan 2026

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All  
**Tracking ID:** BL-350

**Re-assessed (Jan 2026):** Spacing is applied via Tailwind `eb-*` utilities and component-level classes; no single spacing scale is documented as design tokens.

- [ ] **BL-350-1:** Define spacing scale (card, form, table) and document in design tokens or style guide
- [ ] **BL-350-2:** Optional: introduce spacing tokens and refactor high-traffic components to use them

---

## 🎯 Priority 6: Roadmap Theme Alignment

### 6.1 Theme 0: Functional Enhancements (In Progress) [BL-400]

**Source:** Development Roadmap  
**Status:** 🚧 In Progress  
**Tracking ID:** BL-400

#### OnboardingFlow [BL-400]

- [ ] **BL-400-1:** Add support for new entity types (publicly traded companies, government entities, non-profit entities)
- [ ] **BL-400-2:** Refine owner/controller flows
- **March 2026 Progress:** Server error handling added to `OperationalDetailsForm` (additional questions step) — uses `ServerErrorAlert` + `useServerError` pattern. Remaining onboarding forms still need the same treatment (see BL-800).

#### LinkedAccountWidget [BL-401]

- [ ] **BL-401-2:** Parity with Recipients payment methods
- [ ] **BL-401-3:** Better status messaging
- [ ] **BL-401-4:** Robust microdeposit flows (retry/lockout messaging)

#### Recipients [BL-402]

- [ ] **BL-402-1:** Conditional attributes per payment method (ACH/RTP/WIRE) — **Partial progress Mar 2026:** email removed as required field for RTP (`usePaymentMethodConfig.ts`); payment method content token display fix; further work needed for WIRE-specific fields and ACH-only validations
- [ ] **BL-402-2:** Edit flows parity + masking
- [ ] **BL-402-3:** Recipient duplicate detection UX

#### RecipientsWidget [BL-406]

- [ ] **BL-406-3:** Success confirmation/feedback after create/edit
- [ ] **BL-406-4:** Ref-based control (refresh, clear filters, export)

#### MakePayment [BL-403]

- [ ] **BL-403-1:** Recipient/method filtering logic
- [ ] **BL-403-2:** Review fee/time ETA display
- [ ] **BL-403-3:** Review/confirmation UX
- [ ] **BL-403-4:** Cross-currency payment support

#### TransactionsDisplay [BL-404]

- [ ] **BL-404-1:** Pagination (in progress)
- [ ] **BL-404-2:** Review details attribute mapping
- [ ] **BL-404-3:** Review PAYIN/PAYOUT derivation and counterpart display

#### Accounts [BL-405]

- [ ] **BL-405-2:** Review balance types mapping and tooltips

---

### 6.2 Theme 1: Security & Validation (In Progress) [BL-410]

**Source:** Development Roadmap  
**Status:** 🚧 In Progress  
**Tracking ID:** BL-410

- [ ] **BL-410-1:** OWASP hardening
  - [ ] **BL-410-1a:** XSS sanitization with dompurify
  - [ ] **BL-410-1b:** Sensitive-data masking
  - [ ] **BL-410-1c:** Idempotency keys
  - [ ] **BL-410-1d:** Auth/CSRF via axios interceptor
  - [ ] **BL-410-1e:** Throttling on verification flows
- [ ] **BL-410-2:** Client-side validation: centralize Zod schemas (superset of OAS)
- [ ] **BL-410-3:** Strict regex for routing/account numbers
- [ ] **BL-410-4:** Progressive and accessible errors
- [ ] **BL-410-5:** OAS alignment: verify against latest specs
- [ ] **BL-410-6:** Prefer generated hooks/types; no ad-hoc fetch clients

---

### 6.3 Theme 2: i18n & Design Tokens (In Progress) [BL-420]

**Source:** Development Roadmap  
**Status:** 🚧 In Progress  
**Tracking ID:** BL-420

**March 2026 Progress:**
- ✅ Content token architecture established: `ContentToken.tsx`, `useTranslationWithTokens.tsx`, new `EBContentTokens` type in `EBComponentsProvider`. Architecture documented in `docs/CONTENT_TOKENS_ARCHITECTURE.md`.
- ✅ i18n circular dependency removed; i18n files reorganized (moved `TransWithTokens`, `useTranslationWithTokens` to `src/i18n/`)
- ✅ es-US locale files added/expanded: onboarding, onboarding-overview, make-payment, linked-accounts, validation, common
- ✅ fr-CA locale files added/expanded: onboarding, onboarding-overview, validation
- ✅ All components updated to use new translation function (single pass)
- ✅ Content token coverage significantly expanded: onboarding, make-payment/PaymentFlow, client-details, accounts, transactions, linked-accounts

- [ ] **BL-420-1:** ~~Extract content tokens~~ → **Done** for most components. Remaining: verify complete coverage for TransactionsDisplay (see BL-802), and ensure Storybook preview reflects `contentTokens` prop.
- [ ] **BL-420-2:** Wire `react-i18next` + `zod-i18n-map`
- [ ] **BL-420-3:** Expand design tokens for full theming/private labeling
- [ ] **BL-420-4:** Ensure runtime overrides via `EBComponentsProvider`

---

### 6.4 Theme 3: Functional Testing (CAT) (In Progress) [BL-430]

**Source:** Development Roadmap  
**Status:** 🚧 In Progress  
**Tracking ID:** BL-430

- [ ] **BL-430-1:** Wire environment config for CAT endpoints/headers
- [ ] **BL-430-2:** Smoke and regression suites against CAT APIs using generated hooks
- [ ] **BL-430-3:** Record diffs, capture contract mismatches

---

### 6.5 Theme 4: React 19 Readiness [BL-440]

**Source:** Development Roadmap  
**Status:** 📋 Planned  
**Tracking ID:** BL-440

- [ ] **BL-440-1:** Verify peer compatibility
- [ ] **BL-440-2:** Incremental adoption plan
- [ ] **BL-440-3:** Guardrails
- [ ] **BL-440-4:** Migrate low-risk areas (test environment, Storybook, non-critical flows) first
- [ ] **BL-440-5:** Keep feature flags

---

### 6.6 Theme 5: RUM & Analytics [BL-450]

**Source:** Development Roadmap  
**Status:** 📋 Planned  
**Tracking ID:** BL-450

- [ ] **BL-450-1:** Standard event catalog per component
- [ ] **BL-450-2:** Configurable `userEventsHandler` hooks
- [ ] **BL-450-3:** Perf timing utilities

---

### 6.7 Theme 6: Atomic Design & Performance [BL-460]

**Source:** Development Roadmap  
**Status:** 📋 Planned  
**Tracking ID:** BL-460

- [ ] **BL-460-1:** Extract shared atoms/molecules/organisms and utilities
- [ ] **BL-460-2:** Core Web Vitals targets TBD
- [ ] **BL-460-3:** Apply memoization, virtualization, code-splitting

---

### 6.8 Theme 7: A11y & UX Testing [BL-470]

**Source:** Development Roadmap, UX Testing Report  
**Status:** 🚧 In Progress  
**Tracking ID:** BL-470

- [ ] **BL-470-2:** Mitigate found issues (see Priority 1-3 items)
- [ ] **BL-470-3:** WCAG 2.1 AA compliance
- [ ] **BL-470-4:** Axe automated tests
- [ ] **BL-470-5:** Keyboard/focus management
- [ ] **BL-470-6:** ARIA correctness

---

### 6.9 Theme 8: Comprehensive Testing [BL-480]

**Source:** Development Roadmap  
**Status:** 📋 Planned  
**Tracking ID:** BL-480

- [ ] **BL-480-1:** 90%+ coverage: unit (validators/hooks), component, integration (MSW), E2E for critical paths
- [ ] **BL-480-2:** Storybook scenarios: loading/error/empty/edge/i18n/theme/a11y

---

### 6.10 Theme 9: Documentation & AI Guides [BL-490]

**Source:** Development Roadmap  
**Status:** 📋 Planned  
**Tracking ID:** BL-490

- [ ] **BL-490-1:** Per-component docs (usage, configuration, validation, security, a11y, testing, performance)
- [ ] **BL-490-2:** Enhanced AI agent skills and codegen/dev templates

---

### 6.11 Theme 10: Tech Debt & Dependency Hygiene [BL-500]

**Source:** Development Roadmap  
**Status:** 📋 Planned  
**Tracking ID:** BL-500

#### Dependency Audit [BL-500]

- [ ] **BL-500-1:** Review and update all package dependencies (runtime and dev) with security-first allowlist
- [ ] **BL-500-2:** Remove obsolete or unused devDependencies
- [ ] **BL-500-3:** Consolidate eslint/prettier configs; drop overlapping/legacy rules
- [ ] **BL-500-4:** Run security audit: `yarn audit --level moderate` and address vulnerabilities
- [ ] **BL-500-5:** Verify package integrity after recent npm supply chain attacks (eslint-config-prettier, etc.)

#### ESLint Upgrade to v9 [BL-505]

**Current Version:** 8.53.0  
**Target Version:** 9.39.1 (latest stable, v10.0.0-alpha.1 available but not recommended for production)  
**Priority:** 🟠 High  
**Breaking Changes:** Flat config format (new default), removed legacy config support

- [ ] **BL-505-1:** Upgrade ESLint core and plugins to v9
  - [ ] **BL-505-1a:** Update `eslint` to v9.39.1 (latest stable)
  - [ ] **BL-505-1b:** Update `@typescript-eslint/eslint-plugin` to latest v8.x (compatible with ESLint 9)
  - [ ] **BL-505-1c:** Update `@typescript-eslint/parser` to latest v8.x
  - [ ] **BL-505-1d:** Update all ESLint plugins to ESLint 9 compatible versions
- [ ] **BL-505-2:** Migrate to ESLint flat config format
  - [ ] **BL-505-2a:** Convert `eslintrc` config to `eslint.config.js|ts` (flat config)
  - [ ] **BL-505-2b:** Update plugin imports and configurations
  - [ ] **BL-505-2c:** Remove deprecated `extends` and `parserOptions` patterns
- [ ] **BL-505-3:** Review and update ESLint rule configurations
  - [ ] **BL-505-3a:** Test all linting rules with new config format
  - [ ] **BL-505-3b:** Address any rule deprecations or changes
  - [ ] **BL-505-3c:** Update custom rules if applicable
- [ ] **BL-505-4:** Update CI/CD and development scripts
  - [ ] **BL-505-4a:** Verify `yarn lint` works with new config
  - [ ] **BL-505-4b:** Verify `yarn lint:fix` works correctly
  - [ ] **BL-505-4c:** Update pre-commit hooks if applicable
- [ ] **BL-505-5:** Consider ESLint v10 upgrade path (monitor for stable release)
  - [ ] **BL-505-5a:** Track ESLint v10.0.0 stable release
  - [ ] **BL-505-5b:** Plan v10 upgrade once stable (breaking changes expected)

**Migration Resources:**

- ESLint v9 migration guide: https://eslint.org/docs/latest/use/migrate-to-9.0.0
- Flat config documentation: https://eslint.org/docs/latest/use/configure/configuration-files-new

#### Tailwind CSS Upgrade to v4 [BL-506]

**Current Version:** 3.4.18  
**Target Version:** 4.x (latest stable)  
**Priority:** 🟠 High  
**Breaking Changes:** New CSS-first configuration, updated utility classes, improved performance

- [ ] **BL-506-1:** Upgrade Tailwind CSS and related packages
  - [ ] **BL-506-1a:** Update `tailwindcss` to latest v4.x
  - [ ] **BL-506-1b:** Update `autoprefixer` to latest compatible version
  - [ ] **BL-506-1c:** Update `postcss` to latest compatible version
  - [ ] **BL-506-1d:** Review `tailwindcss-animate` compatibility with v4
  - [ ] **BL-506-1e:** Review `@tailwindcss/container-queries` compatibility
- [ ] **BL-506-2:** Migrate Tailwind configuration to v4 format
  - [ ] **BL-506-2a:** Convert `tailwind.config.js` to v4 CSS-first configuration
  - [ ] **BL-506-2b:** Update custom theme variables and design tokens
  - [ ] **BL-506-2c:** Migrate `eb-` prefixed custom classes to v4 format
  - [ ] **BL-506-2d:** Update PostCSS configuration if needed
- [ ] **BL-506-3:** Review and update component styles
  - [ ] **BL-506-3a:** Test all components for style compatibility
  - [ ] **BL-506-3b:** Update any deprecated utility classes
  - [ ] **BL-506-3c:** Verify responsive design breakpoints
  - [ ] **BL-506-3d:** Test dark mode if applicable
- [ ] **BL-506-4:** Leverage Tailwind v4 improvements
  - [ ] **BL-506-4a:** Utilize improved build performance
  - [ ] **BL-506-4b:** Explore new utility classes and features
  - [ ] **BL-506-4c:** Optimize CSS output size
- [ ] **BL-506-5:** Update Storybook and development environment
  - [ ] **BL-506-5a:** Verify Tailwind works in Storybook after upgrade
  - [ ] **BL-506-5b:** Verify development server (`yarn dev`) works correctly
  - [ ] **BL-506-5c:** Test production build (`yarn build`)

**Migration Resources:**

- Tailwind CSS v4 migration guide: https://tailwindcss.com/docs/upgrade-guide
- Tailwind CSS v4 release notes: https://tailwindcss.com/docs/release-notes

#### TypeScript & Toolchain [BL-501]

- [ ] **BL-501-1:** Consider bumping TypeScript and related type utilities to latest compatible versions
  - [ ] **BL-501-1a:** Check latest TypeScript version (current: 5.9.3)
  - [ ] **BL-501-1b:** Update `typescript` to latest 5.x stable
  - [ ] **BL-501-1c:** Update `@types/react` and `@types/react-dom` to latest
  - [ ] **BL-501-1d:** Update other `@types/*` packages to latest
- [ ] **BL-501-2:** Validate build output and generated d.ts after bump
- [ ] **BL-501-3:** Fix any strictness regressions
- [ ] **BL-501-4:** Consider TypeScript 6.x upgrade path (when stable)

#### Build/Test Infrastructure [BL-502]

**Current (April 2026, `embedded-components/package.json`):** `vite` ^7.3.1, `vitest` ^4.0.18, `@vitest/ui` ^4.0.18, `@vitejs/plugin-react` ^5.1.4. The backlog previously listed Vite 6 / Vitest 2 — those upgrades are **done**; remaining work is **ongoing** minor bumps and CI baselines.

- [ ] **BL-502-1:** Keep Vite on latest compatible 7.x
  - [ ] **BL-502-1a:** Update `vite` to latest 7.x when safe (current: ^7.3.1)
  - [ ] **BL-502-1b:** Update `@vitejs/plugin-react` to latest compatible
  - [ ] **BL-502-1c:** Update `vite-plugin-dts` and other Vite plugins
- [ ] **BL-502-2:** Keep Vitest on latest compatible 4.x
  - [ ] **BL-502-2a:** Update `vitest` to latest 4.x (current: ^4.0.18)
  - [ ] **BL-502-2b:** Update `@vitest/ui` and `@vitest/coverage-v8` to match
  - [ ] **BL-502-2c:** Verify test compatibility after upgrade
- [ ] **BL-502-3:** Verify Vite/Storybook compatibility after bumps
- [ ] **BL-502-4:** Adjust configs if needed
- [ ] **BL-502-5:** Rebaseline CI (typecheck/lint/test/storybook build) performance and caching

#### React & UI Library Updates [BL-507]

- [ ] **BL-507-1:** Review React 19 upgrade readiness (Theme 4)
  - [ ] **BL-507-1a:** Current: React 18.3.1 (peer allows 18.2.0 || 19)
  - [ ] **BL-507-1b:** Test React 19 compatibility with all components
  - [ ] **BL-507-1c:** Plan React 19 upgrade timeline (see Theme 4)
- [ ] **BL-507-2:** Update Radix UI packages to latest versions
  - [ ] **BL-507-2a:** Audit all `@radix-ui/react-*` packages for updates
  - [ ] **BL-507-2b:** Update to latest compatible versions
  - [ ] **BL-507-2c:** Test all Radix-based components after updates
- [ ] **BL-507-3:** Update TanStack React Query to latest v5
  - [ ] **BL-507-3a:** Update `@tanstack/react-query` to latest 5.x (current: 5.90.5)
  - [ ] **BL-507-3b:** Update `@tanstack/react-query-devtools` to latest
  - [ ] **BL-507-3c:** Update `@tanstack/react-table` to latest 8.x (current: 8.21.3)
- [ ] **BL-507-4:** Update MSW to latest version
  - [ ] **BL-507-4a:** Update `msw` to latest 2.x (current: 2.11.6)
  - [ ] **BL-507-4b:** Update `@mswjs/data` to latest
  - [ ] **BL-507-4c:** Update `msw-storybook-addon` to latest
  - [ ] **BL-507-4d:** Test all MSW handlers after upgrade

#### Orval & Dependencies [BL-503]

- [ ] **BL-503-2:** Ensure React Query v5 generators and axios mutator are configured
- [ ] **BL-503-3:** Regenerate from latest OAS in `api-specs/`
- [ ] **BL-503-4:** Dependency policy: prioritize security patches
- [ ] **BL-503-5:** Keep React 18.3 baseline now, React 19 in Theme 4
- [ ] **BL-503-6:** Track axios/react-query/radix/msw/storybook/vite minors
- [ ] **BL-503-7:** Package manager: optional evaluation — **this repo uses Yarn** (`embedded-components` declares `packageManager: yarn@4.12.0`). pnpm migration is **low priority** unless team standardizes on pnpm; if pursued, update docs/CI accordingly
- [ ] **BL-503-8:** If migrating package managers, update docs/CI (currently Yarn/npm-style scripts per package)
- [ ] **BL-503-9:** Upgrade Orval to v8 when stable (tech task)
  - Orval v8 is a breaking change: ESM config (`.mjs` or `type: "module"`), Node 22.18+, default `httpClient` switched from axios to fetch, removed/renamed options. Current package: **orval ^7.21.0** — stay on 7.x until v8 ecosystem is stable; plan migration per [Orval migration guide v8](https://orval.dev/guides/migration-v8).

#### Other Dependency Updates [BL-508]

- [ ] **BL-508-1:** Update form libraries
  - [ ] **BL-508-1a:** Update `react-hook-form` to latest 7.x (current: 7.65.0)
  - [ ] **BL-508-1b:** Update `@hookform/resolvers` to latest
  - [ ] **BL-508-1c:** Update `zod` to latest 3.x (current: 3.25.76)
  - [ ] **BL-508-1d:** Update `zod-i18n-map` to latest
- [ ] **BL-508-2:** Update i18n libraries
  - [ ] **BL-508-2a:** Update `i18next` to latest (current: 24.2.1)
  - [ ] **BL-508-2b:** Update `react-i18next` to latest (current: 15.1.1)
- [ ] **BL-508-3:** Update utility libraries
  - [ ] **BL-508-3a:** Update `date-fns` to latest 3.x (current: 3.6.0)
  - [ ] **BL-508-3b:** Update `axios` to latest 1.x (current: 1.12.2)
  - [ ] **BL-508-3c:** Update `clsx` and `tailwind-merge` to latest
- [ ] **BL-508-4:** Update development tools
  - [ ] **BL-508-4a:** Update `prettier` to latest 3.x (current: 3.6.2)
  - [ ] **BL-508-4b:** Update `prettier-plugin-tailwindcss` to latest
  - [ ] **BL-508-4c:** Review and update other dev dependencies
- [ ] **BL-508-5:** Remove or replace deprecated packages
  - [ ] **BL-508-5a:** Audit for deprecated packages
  - [ ] **BL-508-5b:** Find alternatives for deprecated packages
  - [ ] **BL-508-5c:** Update or remove as needed

---

---

## 🆕 New Items from March 2026 Git Analysis & Testing

### BL-800+: Findings from Feb 22 – Mar 6, 2026 Development Cycle

---

#### BL-800: ServerErrorAlert Pattern — Extension to Remaining Components 🟠

**Source:** Git analysis (Mar 4, 2026 — `improve error and loading states`)  
**Components Affected:** MakePayment/PaymentFlow, TransactionsDisplay, OnboardingFlow (remaining forms), LinkedAccountWidget  
**Priority:** High  
**Status:** 📋 Planned

**Background:** A `ServerErrorAlert` component and `useServerError` hook were introduced and applied to `Accounts`, `ClientDetails`, and `BaseRecipientsWidget`. The pattern provides consistent server-error display with retry support and i18n-ready messages. Other components still use ad-hoc error patterns or show no error state.

**Actions:**

- [ ] **BL-800-1:** Apply `ServerErrorAlert` + `useServerError` pattern to `MakePayment`/`PaymentFlow` (all API calls: payment submit, recipient fetch, fee fetch)
- [ ] **BL-800-2:** Apply pattern to `TransactionsDisplay` (transaction list fetch, detail fetch)
- [ ] **BL-800-3:** Apply pattern to remaining `OnboardingFlow` forms (beyond `OperationalDetailsForm`)
- [ ] **BL-800-4:** Apply pattern to `LinkedAccountWidget` (bank account create/verify/remove calls)
- [ ] **BL-800-5:** Document `ServerErrorAlert` + `useServerError` in component implementation docs and create a Storybook story for the error state pattern

---

#### BL-801: Content Token Coverage Audit 🟡

**Source:** Git analysis (Feb 25 – Mar 5, 2026 — content token expansion commits)  
**Components Affected:** All  
**Priority:** Medium  
**Status:** 📋 Planned

**Background:** Content tokens were restructured with a formal architecture (`CONTENT_TOKENS_ARCHITECTURE.md`). Significant coverage was added to `ClientDetails`, `MakePayment/PaymentFlow`, `OnboardingFlow`, `Accounts`, `LinkedAccounts`, and `TransactionsDisplay`. However, coverage may be incomplete for edge-case strings, error messages, and some sub-components.

**Actions:**

- [ ] **BL-801-1:** Audit all i18n strings across components for content token completeness — identify strings still hardcoded that should be overridable via `contentTokens`
- [ ] **BL-801-2:** Verify `AccountCardSkeleton` content tokens (updated Mar 5 but were changed twice — confirm stable)
- [ ] **BL-801-3:** Ensure `StatusBadge` content token changes (Mar 5) don't break existing status label customization
- [ ] **BL-801-4:** Add Storybook stories demonstrating content token override for each component (see BL-420-1 remaining work)
- [ ] **BL-801-5:** Verify `EBContentTokens` type is exported and documented in component API docs

---

#### BL-802: i18n Locale Completion — es-US and fr-CA 🟡

**Source:** Git analysis (Feb 25 – Mar 5, 2026 — i18n expansion)  
**Components Affected:** All  
**Priority:** Medium  
**Status:** 📋 Planned

**Background:** Major i18n expansion in this cycle: es-US and fr-CA locale files were added for `onboarding`, `onboarding-overview`, `validation`, `make-payment`, `linked-accounts`, and `common`. However, coverage may still be incomplete for some components.

**Actions:**

- [ ] **BL-802-1:** Audit which i18n namespaces still lack complete es-US translations (check: `transactions.json`, `accounts.json`, `recipients.json` for es-US)
- [ ] **BL-802-2:** Audit fr-CA coverage — currently `onboarding`, `onboarding-overview`, `validation` added; check `make-payment`, `linked-accounts`, `transactions`, `accounts`, `client-details` for fr-CA
- [ ] **BL-802-3:** Verify no keys fall back to en-US in the es-US locale for the components now partially translated
- [ ] **BL-802-4:** Add a locale-switch story/control in Storybook to visually verify translated states (see BL-420)
- [ ] **BL-802-5:** Wire `zod-i18n-map` for validation messages in es-US/fr-CA so form errors are also translated (BL-420-2)

---

#### BL-803: Mock API Editor — Scenario Management UX 🟢

**Source:** Git analysis (Mar 1–2, 2026 — MockApiEditorDrawer enhancements)  
**Components Affected:** app/client-next-ts (showcase)  
**Priority:** Low  
**Status:** 📋 Planned

**Background:** The `MockApiEditorDrawer` in the showcase now supports scenario upload/download (`replaceOverrides` utility), `@visual-json/react` JSON editor, and `mock-overrides-storage`. This significantly improves QA and demo workflow.

**Actions:**

- [ ] **BL-803-1:** Document the mock scenario file format and upload/download workflow in `app/client-next-ts/AGENTS.md` or `MSW_SETUP.md`
- [ ] **BL-803-2:** Add a set of pre-built test scenario files (e.g. `error-state.json`, `empty-state.json`, `pending-payments.json`) as fixtures in the repo
- [ ] **BL-803-3:** Validate `replaceOverrides` behavior when uploaded JSON has unknown endpoints (should fail gracefully with validation)
- [ ] **BL-803-4:** Test the JSON editor in multiple browsers; confirm `@visual-json/react` renders correctly on mobile viewports

---

#### BL-804: Empty+ Theme — A11y Audit and Documentation 🟡

**Source:** Git analysis (Feb 25, 2026 — `feat: add 'Empty+' theme option`)  
**Components Affected:** app/client-next-ts (showcase)  
**Priority:** Medium  
**Status:** 📋 Planned

**Background:** An `Empty+` theme variant with enhanced accessibility features (higher contrast, improved focus indicators) was added to the showcase alongside a `ThemeA11yPanel` component that provides accessibility guidance within the `ThemeCustomizationDrawer`. Related Salt Design System token URLs were added for reference.

**Actions:**

- [ ] **BL-804-1:** Run automated a11y audit (axe) on the `Empty+` theme across all 7 components; confirm it passes WCAG 2.1 AA
- [ ] **BL-804-2:** Compare `Empty+` contrast ratios against base `Empty` theme using the new `ThemeA11yPanel` — document pass/fail per token group
- [ ] **BL-804-3:** Decide whether `Empty+` should graduate to the `embedded-components` library as a built-in accessible theme or remain showcase-only
- [ ] **BL-804-4:** Document `ThemeA11yPanel` usage and the Salt Design System token references in `embedded-components/docs/`
- [ ] **BL-804-5:** Add `BL-470-4` (axe automated tests) as a prerequisite tracker; coordinate a11y test suite with `Empty+` theme as the baseline

---

#### BL-805: Session Transfer — Client Creation & Multi-Experience Support 🟡

**Source:** Git analysis (Feb 26, 2026 — `feat: implement client creation feature` and `feat: add support for multiple experience types`)  
**Components Affected:** app/server-session-transfer  
**Priority:** Medium  
**Status:** 📋 Planned

**Background:** The session transfer demo app now supports client creation via API integration and handles multiple experience types (onboarding, linked-accounts, make-payment, etc.) in both `index.html` and `index-utility.html`. Documentation was also expanded.

**Actions:**

- [ ] **BL-805-1:** Test the new `index-utility.html` client creation flow end-to-end in the server-session-transfer demo (verify OAuth2 flow, client provisioning, and redirect to onboarding)
- [ ] **BL-805-2:** Test `index.html` with each experience type (onboarding, linked-accounts, make-payment) to confirm session handoff and component initialization
- [ ] **BL-805-3:** Verify error handling in `server.js` for failed client creation (network errors, 4xx/5xx from JPMC API)
- [ ] **BL-805-4:** Update `embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md` to reflect the new multi-experience patterns

---

#### BL-810: ClientDetails — Initial UX Audit 🟠

**Source:** Git analysis + browser testing (Mar 2026)  
**Components Affected:** ClientDetails  
**Priority:** High  
**Status:** 📋 Planned

**Background:** `ClientDetails` is now fully available in the showcase (status changed from 'testing' to 'available' Mar 2). Error/loading/skeleton states were implemented (Mar 4). The component still needs a systematic UX audit now that it's production-ready.

**Actions:**

- [ ] **BL-810-1:** Audit layout in all view modes: `accordion` view, `cards` view, drilldown dialogs — verify visual hierarchy and spacing
- [ ] **BL-810-2:** Test all interactive elements: expand/collapse sections, drilldown navigation, section dialogs, party detail panels
- [ ] **BL-810-3:** Verify loading skeleton matches real content layout (no layout shift when data loads)
- [ ] **BL-810-4:** Verify error state display and retry behavior using `ServerErrorAlert`
- [ ] **BL-810-5:** Audit tooltips and `aria-label` coverage for icon-only actions (align with BL-070)
- [ ] **BL-810-6:** Add `DialogDescription` to all `SectionDialog` instances (align with BL-601-2)
- [ ] **BL-810-7:** Test responsive behavior on mobile/tablet viewports (cards view vs accordion view breakpoints)
- [ ] **BL-810-8:** Verify content token overrides work end-to-end via `EBComponentsProvider` contentTokens prop

---

#### BL-812: Transactions — "View Details" Button Click Target Size 🟢

**Source:** Browser testing 2026-03-06  
**Component:** TransactionsDisplay (TransactionsTable rows)  
**Priority:** Low  
**Status:** 📋 Needs verification

**Issue:** During browser automation, the "View details" row button was intercepted. May indicate click target smaller than WCAG 2.5.5 minimum (44×44px), or automation scroll-to-view artifact. Needs manual verification.

**Actions:**

- [ ] **BL-812-1:** Measure "View details" button click target size in TransactionsTable rows; verify meets 44×44px (WCAG 2.5.5 AAA) or 24×24px (AA)
- [ ] **BL-812-2:** Ensure the button is scrolled into viewport before interaction in E2E tests
- [ ] **BL-812-3:** Consider making the entire row clickable for improved discoverability

---

#### BL-811: Onboarding — Server Error Handling Completeness 🟡

**Source:** Git analysis (Mar 4, 2026 — `onboarding-flow: add server error handling for additional questions`)  
**Components Affected:** OnboardingFlow (OperationalDetailsForm + remaining forms)  
**Priority:** Medium  
**Status:** 📋 Planned

**Background:** Server error handling was added to `OperationalDetailsForm` (the "additional questions" step). Other onboarding forms may still lack server error display.

**Actions:**

- [ ] **BL-811-1:** Audit all onboarding form steps for server error handling coverage — identify forms that lack `ServerErrorAlert` or equivalent
- [ ] **BL-811-2:** Test `OperationalDetailsForm` server error state in the showcase using MSW error scenario (or Mock API Editor)
- [ ] **BL-811-3:** Ensure all `OnboardingFlow` API calls display user-friendly errors, not silent failures or unhandled promise rejections

---

## 📊 Backlog Statistics

**Total Items:** ~215+  
**Critical Priority:** Design system (re-assessed), Make Payment form UX, data quality  
**High Priority:** Filter/label/tooltips/responsive, Accounts enhancements, ServerErrorAlert extension (BL-800), ClientDetails UX audit (BL-810)  
**Medium Priority:** Status badge, date formatting, menu/dialog, timeline, i18n locale completion (BL-802), Empty+ a11y (BL-804), session transfer (BL-805), onboarding error handling (BL-811)  
**Low Priority:** Performance optimization, Mock API Editor scenario mgmt (BL-803)  
**Tech Debt:** ESLint v9, Tailwind v4, TypeScript, Vite 7 / Vitest 4 maintenance, React/UI libraries, Orval 7→8 path, other dependencies

**In Progress:**

- Theme 0: Functional Enhancements
- Theme 1: Security & Validation
- Theme 2: i18n & Design Tokens (**significant progress** this cycle)
- Theme 3: Functional Testing (CAT)
- Theme 7: A11y & UX Testing (mitigation in progress, Empty+ theme added)

**Recently Resolved (Mar 2026 — removed from backlog):**

- Recipients: email not required for RTP (was a product correctness bug — fixed `usePaymentMethodConfig.ts`)
- Linked Accounts: text wrapping in BankAccountForm (layout bug — fixed)
- Accounts: name display bug in AccountCard (fixed `AccountCard.tsx`)
- i18n circular dependency in config (fixed — relative import)
- ClientDetails test failures after component refactor (fixed)

---

## 🔄 How to Use This Backlog

### For Agents

1. **Check Status First:** Review item status (🔴 Critical, 🟠 High, etc.) before starting work
2. **Update Status:** Mark items as 🚧 In Progress when starting
3. **Reference Sources:** Check UX Testing Report and Development Roadmap for context
4. **When complete:** **Remove** the item from the backlog. This document keeps **only currently open** items; do not retain completed/fixed items.

### For Product/Design

1. **Review Priorities:** Focus on Critical and High priority items first
2. **Design System:** Review Priority 5 items for design system decisions
3. **UX Testing:** Reference UX Testing Report for detailed findings

### For Engineering

1. **Theme Alignment:** Work items align with roadmap themes
2. **Component Scope:** Items specify which components are affected
3. **Technical Details:** Technical items include implementation notes

---

## 📝 Notes for Future Updates

- This backlog should be updated after each sprint/iteration
- Do not include completed items; remove them when work is done
- Add new items from future UX testing or roadmap updates
- Keep priority levels current based on user feedback and business needs

---

---

## 🆕 New Issues from 2025-12-09 Testing Session

### BL-600+: New Findings from December 9, 2025 Testing

#### BL-601: Dialog Accessibility Warning 🟡 — Re-assessed Jan 2026

**Source:** UX Testing Report 2025-12-09  
**Component:** TransactionsDisplay (TransactionDetailsSheet)  
**Priority:** Medium  
**Status:** 📋 Planned

**Re-assessed (Jan 2026):** TransactionDetailsSheet uses `DialogContent` without `DialogDescription` or `aria-describedby`. Radix Dialog recommends a description for screen readers. Other dialogs (RecipientDetailsDialog, RemoveAccountDialog, etc.) should be audited.

**Issue:** Console warning: "Missing `Description` or `aria-describedby={undefined}` for {DialogContent}"; affects a11y.

**Actions:**

- [ ] **BL-601-1:** Add `DialogDescription` (or `aria-describedby`) to TransactionDetailsSheet — e.g. short summary of transaction details
- [ ] **BL-601-2:** Audit all dialogs (Transaction, Recipient, RemoveAccount, VerificationResult, etc.) for missing description
- [ ] **BL-601-3:** Optionally make description required in shared Dialog usage guidelines

**Tracking:** BL-601 (Note: Different from PR #601)

---

#### BL-603: MSW Initialization Errors 🟡 — Same as BL-200-1

**Source:** UX Testing Report 2025-12-09  
**Components:** All (MSW initialization)  
**Priority:** Medium  
**Status:** 📋 Planned — **Resolve via BL-200-1** (single fix for duplicate party creation).

**Issue:** Duplicate party creation during MSW init (parties 2200000111–2200000113; client 0030000134 vs 0030000132). Same root cause as BL-200-1.

**Actions:** See **BL-200-1** and **BL-200-2**. No separate work; close BL-603 when BL-200-1 is done.

**Tracking:** BL-603 (alias of BL-200-1)

---

---

## 🆕 New Issues from 2026-01-14 Testing Session

### BL-700+: New Findings from January 14, 2026 Testing

#### BL-723: Transactions Form Fields Missing id/name 🟡 — Open

**Source:** UX Testing Report 2026-01-14  
**Component:** TransactionsDisplay (TransactionsTableToolbar)  
**Priority:** Medium  
**Status:** 📋 Planned

**Issue:** Two form field elements (status and type filter Selects) lack `id`/`name` attributes, affecting accessibility (WCAG 2.1 AA). The counterpart filter Input has `id="transactions-filter-counterpart"` and `name="transactions-filter-counterpart"`; the two Select components do not.

**Actions:**

- [ ] **BL-723-1:** Add `id` and `name` (or `aria-label` where appropriate) to the status filter Select/SelectTrigger in TransactionsTableToolbar
- [ ] **BL-723-2:** Add `id` and `name` (or `aria-label`) to the type filter Select/SelectTrigger

**Tracking:** BL-723

---

### 2026-02-19 Full Re-Test (All 7 Components + Backlog Re-Verification)

- **Session:** Full re-test of **all core components** and **backlog re-verification**. TESTING_PROMPT updated to include Onboarding and Client Details (7 components). Storybook and all 7 showcase URLs verified via browser automation.
- **Showcase components tested:** Onboarding, Linked Accounts, Recipients, Make Payment, Transactions, Accounts, **Client Details**. All loaded successfully.
- **Storybook:** https://storybook.embedded-finance-dev.com/ — confirmed live.
- **Backlog re-test:** Each open item (P1–P5, BL-601, BL-723) re-tested by **code inspection**; all 7 components **browser-loaded**. Item-level verdicts and evidence: **`docs/ux-testing/2026-02-19/BACKLOG_VERIFICATION.md`**. All re-tested items remain OPEN; no fixed items removed. Summary: BL-050-1 (formatNumberToCurrency no NaN guard), BL-060 (filter labels inconsistent), BL-061 (pagination formats differ), BL-601 (TransactionDetailsSheet no DialogDescription), BL-723 (toolbar Selects missing id/name), plus all other P1–P5 items verified open via code.
- **BL-723** added to backlog (form fields missing id/name in Transactions). **BL-603** consolidated with BL-200-1 (single fix).
- **Report:** `embedded-components/docs/ux-testing/2026-02-19/UX_TESTING_REPORT.md`
- **Action:** Future full UX runs should test all 7 components per prompt; remove items from this backlog when fixed.

---

### 2026-03-06 Git Analysis + Full Browser Re-Test (All 7 Components)

- **Session:** Git analysis of ~60 commits (Feb 22 – Mar 6, 2026) and full browser UX testing of all 7 components.
- **Git analysis findings:** Major development activity this cycle: ClientDetails stabilized (error/loading states, content tokens, skeleton — now 'available'), i18n expansion (es-US/fr-CA for 6+ namespaces), ServerErrorAlert pattern introduced, content tokens architecture formalized (`CONTENT_TOKENS_ARCHITECTURE.md`), Mock API Editor enhancements (`@visual-json/react`, upload/download), Empty+ a11y theme added to showcase, session transfer multi-experience support.
- **Browser test results (all 7 components loaded):**
  - ✅ Onboarding: Radio selection, Get Started flow, multi-step form — working
  - ✅ Client Details: Expandable sections, EIN masking/reveal, drawer content — working. No regressions from content token restructure.
  - ✅ Accounts: Show/hide account details, copy buttons, balance info — working. Name display fix confirmed.
  - ⚠️ Transactions: All filters and table present; "View details" button click intercepted in automation (new **BL-812** — low priority). Filter label casing inconsistency **BL-060** confirmed in UI.
  - ✅ Make Payment: "Make Payment" CTA opens modal; 3-step flow, recipient tabs, payment summary — working.
  - ✅ Linked Accounts: Table, account number reveal, action buttons — working. Text wrapping fix confirmed.
  - ✅ Recipients: Table, account number reveal, action buttons — working. RTP email fix verified via config review.
- **Bugs fixed this cycle (removed from backlog):** Recipients email not required for RTP, Linked Accounts text wrapping, Accounts name display bug, i18n circular dependency.
- **New backlog items added:** BL-800 (ServerErrorAlert extension), BL-801 (content token audit), BL-802 (i18n locale completion), BL-803 (Mock API Editor), BL-804 (Empty+ a11y), BL-805 (session transfer), BL-810 (ClientDetails UX audit), BL-811 (onboarding server error completeness), BL-812 (transactions view details click target).
- **Backlog items re-verified open:** BL-060 (filter casing), BL-601 (DialogDescription), BL-723 (Select id/name), BL-040 (modal a11y — not fully tested).
- **Report:** `embedded-components/docs/ux-testing/2026-03-06/UX_TESTING_REPORT.md`
- **Action:** Prioritize BL-800 (ServerErrorAlert extension) and BL-810 (ClientDetails UX audit) as high-impact items; address BL-802 (i18n gaps) in parallel with BL-420 roadmap work.

---

**Document Maintainers:** Development Team  
**Review Frequency:** Weekly during active development, bi-weekly during maintenance  
**Last Major Update:** March 6, 2026 (git analysis of Feb 22–Mar 6 commits + full browser UX re-test; BL-800–BL-811 added; fixed items removed; i18n and ClientDetails progress noted)
