# Embedded Components - Development Backlog

**Last Updated:** January 27, 2026  
**Status:** Living Document - Updated as work progresses  
**Source:** UX Testing Report (2025-12-02, 2025-12-09), Development Roadmap, Recent PRs  
**Reference:** Deployed showcase https://embedded-finance-dev.com/sellsense-demo (onboarding, linked-accounts, recipients, transactions, accounts, make-payment)

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
- BL-502: Build/test infrastructure (Vite, Vitest)
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

#### LinkedAccountWidget [BL-401]

- [ ] **BL-401-2:** Parity with Recipients payment methods
- [ ] **BL-401-3:** Better status messaging
- [ ] **BL-401-4:** Robust microdeposit flows (retry/lockout messaging)

#### Recipients [BL-402]

- [ ] **BL-402-1:** Conditional attributes per payment method (ACH/RTP/WIRE)
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

- [ ] **BL-420-1:** Extract content tokens
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

- [ ] **BL-502-1:** Upgrade Vite to latest version
  - [ ] **BL-502-1a:** Update `vite` to latest 6.x (current: 6.4.1)
  - [ ] **BL-502-1b:** Update `@vitejs/plugin-react` to latest
  - [ ] **BL-502-1c:** Update `vite-plugin-dts` and other Vite plugins
- [ ] **BL-502-2:** Upgrade Vitest to latest version
  - [ ] **BL-502-2a:** Update `vitest` to latest 2.x (current: 2.1.9)
  - [ ] **BL-502-2b:** Update `@vitest/ui` to latest
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

- [ ] **BL-503-1:** Review and update Orval codegen to latest 7.x
- [ ] **BL-503-2:** Ensure React Query v5 generators and axios mutator are configured
- [ ] **BL-503-3:** Regenerate from latest OAS in `api-specs/`
- [ ] **BL-503-4:** Dependency policy: prioritize security patches
- [ ] **BL-503-5:** Keep React 18.3 baseline now, React 19 in Theme 4
- [ ] **BL-503-6:** Track axios/react-query/radix/msw/storybook/vite minors
- [ ] **BL-503-7:** Package manager: migrate to pnpm (workspaces) for speed and content-addressable store
- [ ] **BL-503-8:** Update docs/CI to use `pnpm -w` equivalents

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

## 📊 Backlog Statistics

**Total Items:** ~200+  
**Critical Priority:** Design system (re-assessed), Make Payment form UX, data quality  
**High Priority:** Filter/label/tooltips/responsive, Accounts enhancements  
**Medium Priority:** Status badge, date formatting, menu/dialog, timeline  
**Low Priority:** Performance optimization  
**Tech Debt:** ESLint v9, Tailwind v4, TypeScript, Vite/Vitest, React/UI libraries, Orval, other dependencies

**In Progress:**

- Theme 0: Functional Enhancements
- Theme 1: Security & Validation
- Theme 2: i18n & Design Tokens
- Theme 3: Functional Testing (CAT)
- Theme 7: A11y & UX Testing (mitigation in progress)

---

## 🔄 How to Use This Backlog

### For Agents

1. **Check Status First:** Review item status (🔴 Critical, 🟠 High, etc.) before starting work
2. **Update Status:** Mark items as 🚧 In Progress when starting
3. **Reference Sources:** Check UX Testing Report and Development Roadmap for context
4. **When complete:** Remove the item from the backlog (do not retain completed items in this document)

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

#### BL-603: MSW Initialization Errors 🟡 — Re-assessed Jan 2026

**Source:** UX Testing Report 2025-12-09  
**Components:** All (MSW initialization)  
**Priority:** Medium  
**Status:** 📋 Planned

**Re-assessed (Jan 2026):** Same as BL-200-1 (duplicate party creation). Resolve in one place; keep one tracking id.

**Issue:** Duplicate party creation during MSW init: "Failed to create a 'party' entity: an entity with the same primary key already exists" (parties 2200000111–2200000113). Client 0030000134 creates parties that already exist from 0030000132.

**Actions:**

- [ ] **BL-603-1:** Fix duplicate party creation in MSW handlers/seed (e.g. check existing before create, or single client seed)
- [ ] **BL-603-2:** Reduce console verbosity in production/dev as in BL-200

**Tracking:** BL-603 (duplicate of BL-200-1 for same MSW issue)

---

---

## 🆕 New Issues from 2026-01-14 Testing Session

### BL-700+: New Findings from January 14, 2026 Testing

_(Open items only.)_

---

**Document Maintainers:** Development Team  
**Review Frequency:** Weekly during active development, bi-weekly during maintenance  
**Last Major Update:** January 27, 2026 (full re-assessment of open backlog items)
