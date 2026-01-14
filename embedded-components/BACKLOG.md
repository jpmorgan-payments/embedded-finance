# Embedded Components - Development Backlog

**Last Updated:** January 14, 2026  
**Status:** Living Document - Updated as work progresses  
**Source:** UX Testing Report (2025-12-02, 2025-12-09), Development Roadmap, Recent PRs (#609, #620-#629)

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

- BL-010: Form discoverability & UX
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

- BL-003: Account number masking (✅ Code complete, verification done)
- BL-090: Missing action buttons
- BL-091: UI improvements
- BL-092: Component review needed
- BL-405: Theme 0 enhancements (Responsive cards, balance types mapping, masking/toggle)

**LinkedAccountWidget:**

- BL-003: Account number masking (✅ Code complete)
- BL-070: Tooltips & help text
- BL-401: Theme 0 enhancements (Parity with Recipients, status messaging, microdeposit flows)

**RecipientsWidget:**

- BL-406: Theme 0 enhancements (Compact/virtual list parity, table view refinements, success states)
- BL-070: Tooltips & help text
- BL-080: Responsive design improvements
- BL-310: Header/title consistency

**All Components:**

- BL-001: Design system standardization (Button library, primary color, footer color)
- BL-002: Primary action color standardization
- BL-009: Footer color standardization
- BL-070: Tooltips & help text
- BL-100: Status badge standardization
- BL-110: Date formatting standardization
- BL-120: Menu & dialog enhancements
- BL-200: Console errors & MSW issues
- BL-210: Duplicate API calls
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
- BL-504: Storybook upgrade to v10+
- BL-505: ESLint upgrade to v9
- BL-506: Tailwind CSS upgrade to v4
- BL-507: React & UI library updates
- BL-508: Other dependency updates

### Completed Items

- ✅ **BL-003**: Account Number Masking Standardization - Code updated (Dec 3, 2025), browser verified (Dec 9, 2025) - Pattern `****1098` confirmed
- ✅ **BL-582**: Test setup improvements (PR #582 - Dec 3, 2025) - Enhanced ResizeObserver mock, improved test reliability
- ✅ **BL-583**: LinkedAccountWidget verification handling (PR #583 - Dec 2, 2025) - Verification response handling and interaction stories
- ✅ **BL-601**: MakePayment enhancements (PR #601 - Dec 9, 2025) - Recipient creation, error handling, UI improvements, h3 headings, RadioGroup toggle
- ✅ **BL-599**: Recipients i18n enhancements (PR #599 - Dec 8, 2025)
- ✅ **BL-600**: Recipients data inconsistency - RESOLVED (Dec 9, 2025 - Re-test confirmed table and pagination now match)
- ✅ **BL-600-PR**: SellSense theme consistency (PR #600 - Dec 8, 2025)
- ✅ **BL-401-5**: LinkedAccountWidget compact/virtualized list + scrollable mode (PR #609 - Dec 12, 2025)
- ✅ **BL-406-1**: RecipientsWidget compact cards + table view + virtual scroll (PR #622 - Jan 8, 2026)
- ✅ **BL-405-1**: Accounts responsive cards + visual refresh (PR #629 - Jan 13, 2026)
- ✅ **BL-504**: Storybook upgrade to v10 (PR #617 - Dec 23, 2025)
- ✅ **MakePayment**: Preselected recipient fetch + UUID-based reference IDs (PR #621, #626 - Jan 7-12, 2026)

---

## 📋 Backlog Overview

This backlog consolidates findings from UX testing, development roadmap themes, and recent enhancements. Items are organized by priority and aligned with roadmap themes. This is a **living document** that should be updated as work progresses.

### Status Legend

- 🔴 **Critical** - Blocks user experience or functionality
- 🟠 **High** - Significant UX impact, should be addressed soon
- 🟡 **Medium** - Important but not blocking
- 🟢 **Low** - Nice to have, polish items
- ✅ **Completed** - Work finished (date completed)
- 🚧 **In Progress** - Currently being worked on
- 📋 **Planned** - Scheduled for future work

### Recent Completions

- ✅ **PR #582** (Dec 3, 2025): Enhanced test setup with ResizeObserver mock, improved test reliability
- ✅ **PR #583** (Dec 2, 2025): LinkedAccountWidget verification response handling and interaction stories
- ✅ **PR #609** (Dec 12, 2025): LinkedAccountWidget/RecipientsWidget scrollable virtual list + compact cards
- ✅ **PR #621** (Jan 7, 2026): MakePayment reference IDs + payment-eligible account filtering
- ✅ **PR #622** (Jan 8, 2026): RecipientsWidget added with compact/table views
- ✅ **PR #624** (Jan 8, 2026): RecipientWidgets form config alignment for linked accounts vs recipients
- ✅ **PR #626** (Jan 12, 2026): MakePayment preselected recipient fetch + layout spacing update
- ✅ **PR #629** (Jan 13, 2026): Accounts visual refresh and responsive grid

---

## 🎯 Priority 1: Critical UX & Design System Issues

### 1.1 Design System Standardization 🔴 [BL-001]

**Source:** UX Testing Report - Critical Inconsistencies Summary  
**Theme Alignment:** Theme 6 (Atomic Design), Theme 7 (A11y & UX Testing)  
**Components Affected:** All  
**Tracking ID:** BL-001

#### Button Component Library [BL-001]

- [ ] **BL-001-1:** Create standardized button component system
  - [ ] **BL-001-1a:** `ButtonPrimary` - Consistent primary action color (choose purple or blue)
  - [ ] **BL-001-1b:** `ButtonSecondary` - White with border style
  - [ ] **BL-001-1c:** `ButtonTertiary` - Text link style
  - [ ] **BL-001-1d:** `ButtonIcon` - Icon-only with tooltip and ARIA labels
  - [ ] **BL-001-1e:** `StatusBadge` - Consistent status indicator styling
- [ ] **BL-001-2:** Document button usage patterns in design system
- [ ] **BL-001-3:** Migrate all components to use standardized buttons
- [ ] **BL-001-4:** Update Storybook stories to showcase button variants

**Current State:**

- Linked Accounts: White bordered, green pill, gray buttons, text links
- Recipients: Purple primary, white secondary
- Make Payment: Purple primary
- Transactions: White buttons
- Accounts: Icon-only buttons

**Target:** Single consistent button system across all components

#### Primary Action Color Standardization [BL-002]

- [ ] **BL-002-1:** Decide on single primary action color (purple vs blue)
- [ ] **BL-002-2:** Apply consistently across all components
- [ ] **BL-002-3:** Update design tokens to enforce primary color

**Current State:**

- Recipients: Purple
- Make Payment: Purple
- Linked Accounts: White with border
- **Issue:** No consistent primary color

#### Footer Color Standardization [BL-009]

- [ ] **BL-009-1:** Standardize footer color across all pages
- [ ] **BL-009-2:** Update Make Payment footer (currently teal, should match others)

**Current State:**

- Most pages: Blue
- Make Payment: Teal
- **Issue:** Inconsistent footer colors

---

### 1.2 Make Payment Form Discoverability & UX 🔴 [BL-010]

**Source:** UX Testing Report - Make Payment Component Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements), Theme 7 (A11y & UX Testing)  
**Components Affected:** MakePayment  
**Tracking ID:** BL-010

#### Form Discoverability [BL-010]

- [ ] **BL-010-1:** Add visual hint that form opens on button click
  - [ ] **BL-010-1a:** Option A: Add text hint "Click to start payment"
  - [ ] **BL-010-1b:** Option B: Show form preview or inline form
  - [ ] **BL-010-1c:** Option C: Add icon/visual indicator on button
- [ ] **BL-010-2:** Improve initial view to indicate comprehensive form exists

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

**Estimated Impact:** High - Improves discoverability and user flow consistency

---

### 1.3 Account Number Masking Standardization ✅ [BL-003]

**Source:** UX Testing Report - Accounts Component Analysis  
**Theme Alignment:** Theme 1 (Security & Validation)  
**Components Affected:** Accounts, LinkedAccountWidget  
**Status:** ✅ Code updated (Dec 3, 2025) - Browser verification completed (Dec 9, 2025)  
**Tracking ID:** BL-003  
**Related PRs:** Code updates completed, PR #601 (Dec 9, 2025) - No changes to masking

- [x] **BL-003-1:** Standardize account number masking pattern ✅
  - [x] **BL-003-1a:** Always show last 4 digits ✅
  - [x] **BL-003-1b:** Use consistent number of asterisks (4: `****1098`) ✅
  - [x] **BL-003-1c:** Code updated in AccountCard.tsx (line 67-69) to use `****${accountNumber.slice(-4)}` ✅
  - [x] **BL-003-1d:** Code updated in RecipientAccountDisplayCard uses `getMaskedAccountNumber()` which returns `****${number.slice(-4)}` ✅
  - [x] **BL-003-1e:** Code updated in Recipients components to use `****${number.slice(-4)}` ✅
- [x] **BL-003-2:** **VERIFY:** Test in browser to confirm Accounts component displays `****1098` (4 asterisks) not `********1098` (8 asterisks) ✅
  - [x] **BL-003-2a:** If browser still shows 8 asterisks, investigate data source or rendering issue ✅
  - [x] **BL-003-2b:** Verify all components display consistent 4 asterisk pattern ✅
- [ ] **BL-003-3:** Document masking rules in design system

**Current State:**

- **Code:** All components use `****${number.slice(-4)}` pattern (4 asterisks) ✅
- **Linked Accounts:** `****6677` (4 asterisks) ✅ Verified in browser
- **Accounts:** `****1098` (4 asterisks) ✅ Verified in browser
- **Recipients:** Uses `****${number.slice(-4)}` pattern ✅

---

### 1.4 Data Quality & Display Issues 🟠 [BL-050]

**Source:** UX Testing Report - Transaction Details Modal, Technical Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements), Theme 8 (Comprehensive Testing)  
**Components Affected:** TransactionsDisplay  
**Tracking ID:** BL-050

**Note:** Some issues may be related to mock data (MSW) rather than actual API responses. However, these should be fixed regardless to ensure proper handling of real data.

#### Transaction Details Modal [BL-050]

- [ ] **BL-050-1:** Fix "$NaN" display for Ledger Balance (data formatting bug)
  - [ ] **BL-050-1a:** Check if this is mock data issue or actual formatting bug
  - [ ] **BL-050-1b:** Add proper number formatting/validation
  - [ ] **BL-050-1c:** Handle null/undefined values gracefully
- [ ] **BL-050-2:** Replace "N/A" values with meaningful data or hide fields
  - [ ] **BL-050-2a:** Determine if "N/A" values are due to mock data or missing API fields
  - [ ] **BL-050-2b:** If mock data: update MSW handlers to provide realistic data
  - [ ] **BL-050-2c:** If API data: hide fields that consistently show "N/A" or add proper empty state handling
- [ ] **BL-050-3:** Only show "Show all fields" toggle if there are meaningful additional fields
- [ ] **BL-050-4:** Populate additional fields with actual data if available

#### Reference ID Column [BL-051]

- [ ] **BL-051-1:** Populate Reference ID data, OR
- [ ] **BL-051-2:** Hide column when data is not available
- [ ] **BL-051-3:** Check if this is mock data limitation or actual API response

#### Missing Data Handling [BL-052]

- [ ] **BL-052-1:** Add loading states for data fetching
- [ ] **BL-052-2:** Add empty states for no data scenarios
- [ ] **BL-052-3:** Standardize "N/A" vs hiding fields approach
- [ ] **BL-052-4:** Ensure proper handling of both mock and real API data

---

## 🎯 Priority 2: High Impact UX Improvements

### 2.1 Filter & Label Standardization 🟠 [BL-060]

**Source:** UX Testing Report - Recipients & Transactions Components  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** Recipients, TransactionsDisplay  
**Tracking ID:** BL-060

#### Filter Labels [BL-060]

- [ ] **BL-060-1:** Standardize filter labels to "All Statuses" (title case, plural)
- [ ] **BL-060-2:** Standardize filter labels to "All Types" (title case, plural)
- [ ] **BL-060-3:** Update Recipients component (currently "All Types", "All Status")
- [ ] **BL-060-4:** Update Transactions component (currently "All statuses", "All types")

**Current State:**

- Recipients: "All Types", "All Status"
- Transactions: "All statuses", "All types"
- **Issue:** Inconsistent capitalization and pluralization

#### Pagination Text Format [BL-061]

- [ ] **BL-061-1:** Standardize pagination text format
  - [ ] **BL-061-1a:** Option A: "Showing 1-3 of 3"
  - [ ] **BL-061-1b:** Option B: "3 total"
- [ ] **BL-061-2:** Update Recipients (currently "Showing 1 to 3 of 3 recipients")
- [ ] **BL-061-3:** Update Transactions (currently "4 row(s) total")

#### Default Rows Per Page [BL-062]

- [ ] **BL-062-1:** Standardize default rows per page (recommend 10 or 25 consistently)
- [ ] **BL-062-2:** Update Recipients (currently 10)
- [ ] **BL-062-3:** Update Transactions (currently 25)
- [ ] **BL-062-4:** Hide pagination controls when only one page exists

---

### 2.2 Tooltips & Help Text 🟠 [BL-070]

**Source:** UX Testing Report - Multiple Components  
**Theme Alignment:** Theme 7 (A11y & UX Testing)  
**Components Affected:** All  
**Tracking ID:** BL-070

- [ ] **BL-070-1:** Add tooltips to all icon-only buttons
  - [ ] **BL-070-1a:** "View" button in Recipients (purpose unclear)
  - [ ] **BL-070-1b:** "View" button in Transactions (purpose unclear)
  - [ ] **BL-070-1c:** Info icon in Accounts (purpose unclear)
  - [ ] **BL-070-1d:** "Manage" button (ellipsis) in Linked Accounts
- [ ] **BL-070-2:** Add ARIA labels for accessibility
- [ ] **BL-070-3:** Add help text for complex features
- [ ] **BL-070-4:** Ensure all interactive elements have descriptive labels

**Components Needing Tooltips:**

- Recipients: "View" button
- Transactions: "View" button
- Accounts: Info icon
- Linked Accounts: "Manage" button (ellipsis)

---

### 2.3 Responsive Design Improvements 🟠 [BL-080]

**Source:** UX Testing Report - Recipients Component  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** Recipients, TransactionsDisplay  
**Tracking ID:** BL-080

#### Table Responsiveness [BL-080]

- [ ] **BL-080-1:** Remove horizontal scrollbar in Recipients table
- [ ] **BL-080-2:** Implement responsive table design
- [ ] **BL-080-3:** Add card view for tables on small screens
- [ ] **BL-080-4:** Test all components on mobile/tablet viewports
- [ ] **BL-080-5:** Ensure tables are fully responsive on smaller screens

**Current State:**

- Recipients table has horizontal scrollbar
- Suggests table may not be fully responsive

---

### 2.4 Accounts Component Enhancements 🟡 [BL-090]

**Source:** UX Testing Report - Accounts Component Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** Accounts  
**Tracking ID:** BL-090

#### Missing Action Buttons [BL-090]

- [ ] **BL-090-1:** Add "View Transactions" button/link
- [ ] **BL-090-2:** Add "Transfer Funds" button
- [ ] **BL-090-3:** Add "Manage Account" button
- [ ] **BL-090-4:** Add "Download Statement" button

#### UI Improvements [BL-091]

- [ ] **BL-091-1:** Remove redundant "Accounts" heading (appears as both page title and card title)
  - [ ] **BL-091-1a:** Review Accounts.tsx to see if card title can be made more specific
  - [ ] **BL-091-1b:** Consider using account category or account name instead of generic "Accounts"
- [ ] **BL-091-2:** Make card title more specific (e.g., "My Checking Account" or use account category)
- [ ] **BL-091-3:** Add tooltip for info icon next to "Account Details" heading, OR
- [ ] **BL-091-4:** Remove info icon if decorative
  - [ ] **BL-091-4a:** Current tooltip exists: "Account can be funded from external sources and is externally addressable via routing/account numbers here"
  - [ ] **BL-091-4b:** Verify tooltip is visible/accessible

#### Component Review Needed [BL-092]

- [ ] **BL-092-1:** Review Accounts component structure and compare with other components
- [ ] **BL-092-2:** Check if Accounts component follows same patterns as LinkedAccountWidget and Recipients
- [ ] **BL-092-3:** Verify responsive design works correctly
- [ ] **BL-092-4:** Review Accounts.tsx implementation for consistency with other components

---

## 🎯 Priority 3: Medium Priority Improvements

### 3.1 Status Badge Standardization 🟡 [BL-100]

**Source:** UX Testing Report - Multiple Components  
**Theme Alignment:** Theme 6 (Atomic Design)  
**Components Affected:** All  
**Tracking ID:** BL-100

- [ ] **BL-100-1:** Ensure consistent status badge styling across components
- [ ] **BL-100-2:** Document status color system
  - [ ] **BL-100-2a:** Success/Completed: Blue
  - [ ] **BL-100-2b:** Pending: Beige/Light Brown
  - [ ] **BL-100-2c:** Error/Rejected: Red
- [ ] **BL-100-3:** Add hover states to status badges
- [ ] **BL-100-4:** Improve contrast for accessibility (WCAG AA)
- [ ] **BL-100-5:** Create StatusBadge component in design system

---

### 3.2 Date Formatting Standardization 🟡 [BL-110]

**Source:** UX Testing Report - Recipient Details Modal  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** All  
**Tracking ID:** BL-110

- [ ] **BL-110-1:** Standardize date formatting across all components
- [ ] **BL-110-2:** Update Recipient Details modal (currently "1/15/2024, 5:30:00 AM")
- [ ] **BL-110-3:** Ensure consistent date format in all modals and detail views
- [ ] **BL-110-4:** Consider using i18n for date formatting (Theme 2)

---

### 3.3 Menu & Dialog Enhancements 🟡 [BL-120]

**Source:** UX Testing Report - Linked Account Manage Menu  
**Theme Alignment:** Theme 7 (A11y & UX Testing)  
**Components Affected:** LinkedAccountWidget  
**Tracking ID:** BL-120

#### Manage Menu Improvements [BL-120]

- [ ] **BL-120-1:** Add tooltip to "Manage" button: "Manage account" or "More actions"
- [ ] **BL-120-2:** Add confirmation dialog for "Remove Account" action
- [ ] **BL-120-3:** Add keyboard navigation support (arrow keys, Enter, Escape)
- [ ] **BL-120-4:** Ensure menu doesn't get cut off on smaller screens or near viewport edges
- [ ] **BL-120-5:** Consider adding "View Details" option if account details modal exists

---

### 3.4 Timeline & Activity History 🟡 [BL-130]

**Source:** UX Testing Report - Recipient Details Modal  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** Recipients  
**Tracking ID:** BL-130

- [ ] **BL-130-1:** Enhance Timeline section in Recipient Details modal
  - [ ] **BL-130-1a:** Add more timeline events if available (e.g., "Last payment", "Last updated")
  - [ ] **BL-130-1b:** OR rename section to "Created" if timeline functionality isn't implemented
- [ ] **BL-130-2:** Consider adding activity history to other detail views

---

## 🎯 Priority 4: Technical Debt & Performance

### 4.1 Console Errors & MSW Issues 🟡 [BL-200]

**Source:** UX Testing Report - Technical Analysis  
**Theme Alignment:** Theme 8 (Comprehensive Testing)  
**Components Affected:** All (MSW initialization)  
**Tracking ID:** BL-200

- [ ] **BL-200-1:** Fix duplicate party creation logic in MSW initialization
  - [ ] **BL-200-1a:** Error: "Failed to create a 'party' entity: an entity with the same primary key already exists"
  - [ ] **BL-200-1b:** Occurrences: 3 errors for parties 2200000111, 2200000112, 2200000113
  - [ ] **BL-200-1c:** Root Cause: Client 0030000134 attempts to create parties that already exist from Client 0030000132
- [ ] **BL-200-2:** Consider reducing console.log verbosity in production builds
- [ ] **BL-200-3:** Implement log levels (debug, info, warn, error)
- [ ] **BL-200-4:** Minimize MSW logging in production

---

### 4.2 Duplicate API Calls 🟡 [BL-210]

**Source:** UX Testing Report - Network Requests Analysis  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All  
**Tracking ID:** BL-210

- [ ] **BL-210-1:** Investigate why API calls are duplicated (called twice)
- [ ] **BL-210-2:** Implement request deduplication
- [ ] **BL-210-3:** Review React Query refetching logic
- [ ] **BL-210-4:** Check tab switch emulation causing duplicate calls
- [ ] **BL-210-5:** Monitor actual network performance in production (not just mocked)

**Current State:**

- `/ping` called 2 times
- `/ef/do/v1/accounts` called 2 times
- `/ef/do/v1/transactions` called 2 times
- **Issue:** Likely due to React Query refetching or tab switch emulation

---

### 4.3 Performance Optimization 🟢 [BL-220]

**Source:** UX Testing Report - Performance Metrics  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All  
**Tracking ID:** BL-220

- [ ] **BL-220-1:** Monitor actual production performance (not just mocked)
- [ ] **BL-220-2:** Consider code splitting for large JavaScript bundles
- [ ] **BL-220-3:** Implement lazy loading for non-critical resources
- [ ] **BL-220-4:** Optimize bundle sizes if they exceed 500KB
- [ ] **BL-220-5:** Set Core Web Vitals targets

**Current State:**

- Load time: ~204ms (excellent, but from mocked environment)
- Largest resource: `sellsense-demo-DHwOlM2K.js` (160.1ms load time)
- Memory usage: Good (2.2% of limit used)

---

## 🎯 Priority 5: Design System Foundation

### 5.0 Collection Display Patterns 🔴 [BL-300]

**Source:** User Feedback - Missing Consistent Pattern  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All components displaying collections  
**Tracking ID:** BL-300

#### Collection Display Rules [BL-300]

- [ ] **BL-300-1:** Define consistent pattern for displaying collections:
  - [ ] **BL-300-1a:** **3+ items:** Use data grid/table layout
  - [ ] **BL-300-1b:** **1-3 items:** Use card layout
    - [ ] **BL-300-1b-i:** **TBD:** Decide on card layout for 1-3 items:
      - [ ] **BL-300-1b-i-A:** Option A: Stacked cards (vertical layout)
      - [ ] **BL-300-1b-i-B:** Option B: Grid layout (2\*n for large viewports, stacked on mobile)
      - [ ] **BL-300-1b-i-C:** Option C: Single column on mobile, 2 columns on tablet, 3+ on desktop
- [ ] **BL-300-2:** Document collection display rules in design system
- [ ] **BL-300-3:** Apply pattern consistently across:
  - [ ] **BL-300-3a:** LinkedAccountWidget (currently uses cards)
  - [ ] **BL-300-3b:** Recipients (currently uses table)
  - [ ] **BL-300-3c:** TransactionsDisplay (currently uses table)
  - [ ] **BL-300-3d:** Accounts (currently uses cards)
  - [ ] **BL-300-3e:** Any future collection components

#### Implementation [BL-301]

- [ ] **BL-301-1:** Create reusable `CollectionDisplay` component or utility
- [ ] **BL-301-2:** Add responsive breakpoints for card/grid transitions
- [ ] **BL-301-3:** Ensure accessibility for both grid and card layouts
- [ ] **BL-301-4:** Update Storybook stories to showcase collection patterns

**Current State:**

- Recipients: Always uses table (even for 1-3 items)
- TransactionsDisplay: Always uses table
- LinkedAccountWidget: Uses cards
- Accounts: Uses cards
- **Issue:** No consistent rule for when to use table vs cards

---

### 5.1 Component Header/Title Format Standardization 🔴 [BL-310]

**Source:** User Feedback - Different Header/Title Formats  
**Theme Alignment:** Theme 6 (Atomic Design)  
**Components Affected:** All components  
**Tracking ID:** BL-310

#### Header/Title Pattern Analysis [BL-310]

- [ ] **BL-310-1:** Audit all component header/title formats:
  - [ ] **BL-310-1a:** Accounts: "Accounts" (H1) + "Accounts" (card title) - redundant
  - [ ] **BL-310-1b:** LinkedAccountWidget: "Linked Accounts" (H1) + "Linked Accounts (1)" (section header)
  - [ ] **BL-310-1c:** Recipients: "Recipients" (H1) + table with no card title
  - [ ] **BL-310-1d:** TransactionsDisplay: "Transactions" (H1) + table with no card title
  - [ ] **BL-310-1e:** MakePayment: "Make Payment" (H1) + modal title
  - [ ] **BL-310-1f:** OnboardingFlow: Uses StepLayout with title, subtitle, description pattern
- [ ] **BL-310-2:** Document current header/title patterns
- [ ] **BL-310-3:** Define standard header/title format:
  - [ ] **BL-310-3a:** Page title (H1) format
  - [ ] **BL-310-3b:** Section header format
  - [ ] **BL-310-3c:** Card title format
  - [ ] **BL-310-3d:** Modal/dialog title format
  - [ ] **BL-310-3e:** Subtitle/description format
- [ ] **BL-310-4:** Create Header/Title component library:
  - [ ] **BL-310-4a:** `PageHeader` - Main page title with optional description
  - [ ] **BL-310-4b:** `SectionHeader` - Section title with optional count/badge
  - [ ] **BL-310-4c:** `CardTitle` - Card title format
  - [ ] **BL-310-4d:** `ModalTitle` - Modal/dialog title format

#### Implementation [BL-311]

- [ ] **BL-311-1:** Standardize all component headers to use consistent format
- [ ] **BL-311-2:** Remove redundant titles (e.g., Accounts component)
- [ ] **BL-311-3:** Ensure proper heading hierarchy (H1 → H2 → H3)
- [ ] **BL-311-4:** Add consistent spacing and typography
- [ ] **BL-311-5:** Update all components to use standardized header components

**Current State:**

- **Inconsistent patterns:**
  - Some use H1 + card title
  - Some use H1 + section header with count
  - Some use H1 only
  - OnboardingFlow uses different StepLayout pattern
- **Issue:** No consistent header/title format across components

---

### 5.2 Component Library Creation 🟡 [BL-320]

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All  
**Tracking ID:** BL-320

#### Button Components [BL-320]

- [ ] **BL-320-1:** `ButtonPrimary` - Main action button (consistent color)
- [ ] **BL-320-2:** `ButtonSecondary` - Secondary action (white with border)
- [ ] **BL-320-3:** `ButtonTertiary` - Text link style
- [ ] **BL-320-4:** `ButtonIcon` - Icon-only with tooltip
- [ ] **BL-320-5:** `StatusBadge` - Status indicator with consistent colors

#### Form Components [BL-321]

- [ ] **BL-321-1:** `InputText` - Text input with validation
- [ ] **BL-321-2:** `InputNumber` - Number input with formatting
- [ ] **BL-321-3:** `Select` - Dropdown with search
- [ ] **BL-321-4:** `DatePicker` - Date selection
- [ ] **BL-321-5:** `FormField` - Wrapper with label and error handling

#### Table Components [BL-322]

- [ ] **BL-322-1:** `DataTable` - Responsive table with sorting
- [ ] **BL-322-2:** `TableRow` - Table row with actions
- [ ] **BL-322-3:** `Pagination` - Consistent pagination controls

#### Card Components [BL-323]

- [ ] **BL-323-1:** `Card` - Base card component
- [ ] **BL-323-2:** `CardHeader` - Card header with title
- [ ] **BL-323-3:** `CardBody` - Card content area
- [ ] **BL-323-4:** `CardFooter` - Card footer with actions

---

### 5.2 Color Palette Standardization 🟡 [BL-330]

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All  
**Tracking ID:** BL-330

#### Primary Colors [BL-330]

- [ ] **BL-330-1:** Choose single Primary Action color (Purple or Blue)
- [ ] **BL-330-2:** Define Secondary Action: White with border
- [ ] **BL-330-3:** Define Tertiary Action: Text link (blue)

#### Status Colors [BL-331]

- [ ] **BL-331-1:** Success/Completed: Blue (#0066CC or similar)
- [ ] **BL-331-2:** Pending: Beige/Light Brown (#D4A574 or similar)
- [ ] **BL-331-3:** Error/Rejected: Red (#DC3545 or similar)
- [ ] **BL-331-4:** Warning: Orange/Yellow (if needed)
- [ ] **BL-331-5:** Info: Blue (if needed)

#### Neutral Colors [BL-332]

- [ ] **BL-332-1:** Text Primary: Dark Gray (#1A1A1A or similar)
- [ ] **BL-332-2:** Text Secondary: Medium Gray (#666666 or similar)
- [ ] **BL-332-3:** Text Tertiary: Light Gray (#999999 or similar)
- [ ] **BL-332-4:** Background: White (#FFFFFF)
- [ ] **BL-332-5:** Border: Light Gray (#E5E5E5 or similar)

#### Footer [BL-333]

- [ ] **BL-333-1:** Background: Consistent color (Blue or Teal)
- [ ] **BL-333-2:** Text: White

---

### 5.3 Typography System 🟢 [BL-340]

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All  
**Tracking ID:** BL-340

- [ ] **BL-340-1:** Define heading hierarchy (H1-H4)
- [ ] **BL-340-2:** Define body text sizes (Large, Medium, Small)
- [ ] **BL-340-3:** Define label styles (form labels, table headers)
- [ ] **BL-340-4:** Document typography system in design tokens

---

### 5.4 Spacing System 🟢 [BL-350]

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All  
**Tracking ID:** BL-350

- [ ] **BL-350-1:** Define card spacing (padding, margin, border radius)
- [ ] **BL-350-2:** Define form spacing (field spacing, label spacing, button spacing)
- [ ] **BL-350-3:** Define table spacing (cell padding, row spacing, header spacing)
- [ ] **BL-350-4:** Document spacing system in design tokens

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

- [x] **BL-401-1:** Handle verification responses (PR #583 - Dec 2, 2025) ✅
- [x] **BL-401-5:** Compact/virtualized list + scrollable mode (PR #609 - Dec 12, 2025) ✅
- [ ] **BL-401-2:** Parity with Recipients payment methods
- [ ] **BL-401-3:** Better status messaging
- [ ] **BL-401-4:** Robust microdeposit flows (retry/lockout messaging)

#### Recipients [BL-402]

- [ ] **BL-402-1:** Conditional attributes per payment method (ACH/RTP/WIRE)
- [ ] **BL-402-2:** Edit flows parity + masking
- [ ] **BL-402-3:** Recipient duplicate detection UX

#### RecipientsWidget [BL-406]

- [x] **BL-406-1:** Compact cards + table view + virtualized scroll (PR #622 - Jan 8, 2026) ✅
- [x] **BL-406-2:** Config-driven create/edit flows aligned to recipient types (PR #624 - Jan 8, 2026) ✅
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

- [x] **BL-405-1:** Responsive cards (PR #629 - Jan 13, 2026) ✅
- [ ] **BL-405-2:** Review balance types mapping and tooltips
- [x] **BL-405-3:** Masking/toggle for sensitive routing/account info ✅

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
**Status:** 🚧 In Progress (UX Testing completed Dec 2, 2025)  
**Tracking ID:** BL-470

- [x] **BL-470-1:** UX scenarios per component (completed Dec 2, 2025) ✅
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
- [x] **BL-480-3:** Enhanced test setup with ResizeObserver mock (PR #582 - Dec 3, 2025) ✅
- [x] **BL-480-4:** Improved test reliability (PR #582 - Dec 3, 2025) ✅

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

#### Storybook Upgrade to v10+ [BL-504]

**Current Version:** 10.1.11  
**Target Version:** 10.x (achieved)  
**Priority:** ✅ Completed  
**Status:** ✅ Completed (PR #617 - Dec 23, 2025)  
**Breaking Changes:** ESM-only distribution, requires Node.js 20.19+ or 22.12+

> Checklist retained for reference.

- [ ] **BL-504-1:** Upgrade Storybook core and all addons to v10+
  - [ ] **BL-504-1a:** Update `storybook` to latest v10.x
  - [ ] **BL-504-1b:** Update `@storybook/react-vite` to latest v10.x
  - [ ] **BL-504-1c:** Update `@storybook/addon-*` packages to latest v10.x
  - [ ] **BL-504-1d:** Update `@storybook/blocks` to latest v10.x (if used)
- [ ] **BL-504-2:** Convert Storybook configuration to ESM format
  - [ ] **BL-504-2a:** Update `.storybook/main.js|ts` to valid ESM
  - [ ] **BL-504-2b:** Update `.storybook/preview.js|ts` to valid ESM
  - [ ] **BL-504-2c:** Convert all presets and addon configs to ESM
- [ ] **BL-504-3:** Verify Node.js version compatibility (20.19+ or 22.12+)
  - [ ] **BL-504-3a:** Update CI/CD to use compatible Node.js version
  - [ ] **BL-504-3b:** Update local development documentation
- [ ] **BL-504-4:** Leverage new Storybook 10 features
  - [ ] **BL-504-4a:** Implement module automocking for easier testing
  - [ ] **BL-504-4b:** Use typesafe CSF factories for React
  - [ ] **BL-504-4c:** Explore improved UI editing and sharing capabilities
- [ ] **BL-504-5:** Test Storybook build and all stories after upgrade
  - [ ] **BL-504-5a:** Verify `yarn storybook` runs successfully
  - [ ] **BL-504-5b:** Verify `yarn storybook:build` completes without errors
  - [ ] **BL-504-5c:** Test all component stories for compatibility
- [ ] **BL-504-6:** Update Storybook migration documentation

**Migration Resources:**

- Official migration guide: https://storybook.js.org/docs/releases/migration-guide
- Run automatic upgrade: `npx storybook@latest upgrade`

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
**Critical Priority:** 6 major areas (including new collection patterns and header standardization)  
**High Priority:** 5 major areas (including Storybook, ESLint, Tailwind upgrades)  
**Medium Priority:** 4 major areas  
**Low Priority:** 3 major areas  
**Tech Debt:** 8 major upgrade areas (Storybook v10+, ESLint v9, Tailwind v4, TypeScript, Vite/Vitest, React/UI libraries, Orval, other dependencies)

**Completed Recently:**

- LinkedAccountWidget verification handling (PR #583)
- Test setup improvements (PR #582)

**In Progress:**

- Theme 0: Functional Enhancements
- Theme 1: Security & Validation
- Theme 2: i18n & Design Tokens
- Theme 3: Functional Testing (CAT)
- Theme 7: A11y & UX Testing (UX testing completed, mitigation in progress)

---

## 🔄 How to Use This Backlog

### For Agents

1. **Check Status First:** Review item status (🔴 Critical, 🟠 High, etc.) before starting work
2. **Update Status:** Mark items as 🚧 In Progress when starting, ✅ Completed when done
3. **Reference Sources:** Check UX Testing Report and Development Roadmap for context
4. **Link PRs:** Reference PR numbers when completing items
5. **Update Dates:** Add completion dates to completed items

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
- Mark completed items with ✅ and completion date
- Add new items from future UX testing or roadmap updates
- Remove or archive items that are no longer relevant
- Keep priority levels current based on user feedback and business needs

---

---

## 🆕 New Issues from 2025-12-09 Testing Session

### BL-600+: New Findings from December 9, 2025 Testing

#### BL-600: Recipients Data Inconsistency ✅

**Source:** UX Testing Report 2025-12-09  
**Component:** Recipients  
**Priority:** Critical  
**Status:** ✅ **RESOLVED** (Dec 9, 2025 - Re-test)

**Issue:**

- Table displays "No recipients found" but pagination shows "4 row(s) total"
- Data inconsistency between table display and pagination count

**Actions:**

- [x] **BL-600-1:** Investigate root cause (data filtering, rendering, or API response issue) ✅
- [x] **BL-600-2:** Fix data consistency between table and pagination ✅
- [x] **BL-600-3:** Verify fix in browser ✅ (Dec 9, 2025 - Re-test confirmed)

**Resolution:**

- Table now correctly displays 4 rows of recipient data
- Pagination correctly shows "4 row(s) total" matching table content
- Data consistency verified in browser re-test (Dec 9, 2025)

**Tracking:** BL-600

---

#### BL-601: Dialog Accessibility Warning 🟡

**Source:** UX Testing Report 2025-12-09  
**Component:** Transactions  
**Priority:** Medium  
**Status:** 📋 Planned

**Issue:**

- Console warning: "Missing `Description` or `aria-describedby={undefined}` for {DialogContent}"
- Affects accessibility compliance

**Actions:**

- [ ] **BL-601-1:** Add `Description` or `aria-describedby` to Transaction details dialog
- [ ] **BL-601-2:** Audit all dialogs for missing descriptions
- [ ] **BL-601-3:** Update dialog component to require description by default

**Tracking:** BL-601 (Note: Different from PR #601)

---

#### BL-602: Duplicate API Calls Across All Components 🟠

**Source:** UX Testing Report 2025-12-09  
**Components:** All  
**Priority:** High  
**Status:** 🚧 Needs Investigation

**Issue:**

- All components make duplicate API calls (endpoints called twice)
- Common endpoints: `/ping`, `/ef/do/v1/recipients`, `/ef/do/v1/accounts`, `/ef/do/v1/transactions`
- Likely due to React Query refetching or tab switch emulation

**Actions:**

- [ ] **BL-602-1:** Investigate React Query refetching logic
- [ ] **BL-602-2:** Check tab switch emulation causing duplicate calls
- [ ] **BL-602-3:** Implement request deduplication if needed
- [ ] **BL-602-4:** Monitor actual network performance in production

**Tracking:** BL-602

---

#### BL-603: MSW Initialization Errors 🟡

**Source:** UX Testing Report 2025-12-09  
**Components:** All (MSW initialization)  
**Priority:** Medium  
**Status:** 📋 Planned

**Issue:**

- 3 duplicate party creation errors during MSW initialization
- Error: "Failed to create a 'party' entity: an entity with the same primary key already exists"
- Parties affected: 2200000111, 2200000112, 2200000113
- Root cause: Client 0030000134 attempts to create parties that already exist from Client 0030000132

**Actions:**

- [ ] **BL-603-1:** Fix duplicate party creation logic in MSW initialization
- [ ] **BL-603-2:** Add check for existing parties before creation
- [ ] **BL-603-3:** Reduce console.log verbosity in production builds

**Tracking:** BL-603

---

**Document Maintainers:** Development Team  
**Review Frequency:** Weekly during active development, bi-weekly during maintenance  
**Last Major Update:** December 9, 2025
