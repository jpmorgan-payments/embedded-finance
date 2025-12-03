# Embedded Components - Development Backlog

**Last Updated:** December 3, 2025  
**Status:** Living Document - Updated as work progresses  
**Source:** UX Testing Report (2025-12-02), Development Roadmap, Recent PRs (#582, #583)

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

---

## 🎯 Priority 1: Critical UX & Design System Issues

### 1.1 Design System Standardization 🔴

**Source:** UX Testing Report - Critical Inconsistencies Summary  
**Theme Alignment:** Theme 6 (Atomic Design), Theme 7 (A11y & UX Testing)  
**Components Affected:** All

#### Button Component Library

- [ ] Create standardized button component system
  - [ ] `ButtonPrimary` - Consistent primary action color (choose purple or blue)
  - [ ] `ButtonSecondary` - White with border style
  - [ ] `ButtonTertiary` - Text link style
  - [ ] `ButtonIcon` - Icon-only with tooltip and ARIA labels
  - [ ] `StatusBadge` - Consistent status indicator styling
- [ ] Document button usage patterns in design system
- [ ] Migrate all components to use standardized buttons
- [ ] Update Storybook stories to showcase button variants

**Current State:**

- Linked Accounts: White bordered, green pill, gray buttons, text links
- Recipients: Purple primary, white secondary
- Make Payment: Purple primary
- Transactions: White buttons
- Accounts: Icon-only buttons

**Target:** Single consistent button system across all components

#### Primary Action Color Standardization

- [ ] Decide on single primary action color (purple vs blue)
- [ ] Apply consistently across all components
- [ ] Update design tokens to enforce primary color

**Current State:**

- Recipients: Purple
- Make Payment: Purple
- Linked Accounts: White with border
- **Issue:** No consistent primary color

#### Footer Color Standardization

- [ ] Standardize footer color across all pages
- [ ] Update Make Payment footer (currently teal, should match others)

**Current State:**

- Most pages: Blue
- Make Payment: Teal
- **Issue:** Inconsistent footer colors

---

### 1.2 Make Payment Form Discoverability & UX 🔴

**Source:** UX Testing Report - Make Payment Component Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements), Theme 7 (A11y & UX Testing)  
**Components Affected:** MakePayment

#### Form Discoverability

- [ ] Add visual hint that form opens on button click
  - [ ] Option A: Add text hint "Click to start payment"
  - [ ] Option B: Show form preview or inline form
  - [ ] Option C: Add icon/visual indicator on button
- [ ] Improve initial view to indicate comprehensive form exists

#### Form Field Ordering Consistency

- [ ] Standardize field order between "Select existing" and "Enter details" tabs
  - [ ] Recipient selection/details first
  - [ ] Payment method second
  - [ ] Amount third
  - [ ] Optional fields last
- [ ] Update "Enter details" tab to match "Select existing" tab order

#### Tab Switching Behavior

- [ ] Add confirmation when switching tabs with entered data, OR
- [ ] Preserve form data when switching tabs
- [ ] Clear review panel when switching tabs to avoid confusion
- [ ] Ensure review panel accurately reflects current form state

#### Fee Display Enhancement

- [ ] Make fee information more prominent
- [ ] Show fee breakdown earlier in the flow
- [ ] Consider showing estimated fees before amount entry
- [ ] Improve fee calculation display clarity

#### Form Validation & Feedback

- [ ] Add tooltip explaining why Confirm button is disabled
- [ ] Show validation errors for missing required fields
- [ ] Highlight incomplete sections
- [ ] Add inline field validation feedback

#### Date Selection

- [ ] Add date picker if scheduling future payments is needed, OR
- [ ] Clarify that payments are immediate (if that's the case)
- [ ] Make date selection explicit if it's a feature

#### Modal Accessibility

- [ ] Ensure modal has focus trap
- [ ] Add keyboard navigation support
- [ ] Add visual indication if content is scrollable
- [ ] Ensure responsive modal sizing

**Estimated Impact:** High - Improves discoverability and user flow consistency

---

### 1.3 Account Number Masking Standardization ✅

**Source:** UX Testing Report - Accounts Component Analysis  
**Theme Alignment:** Theme 1 (Security & Validation)  
**Components Affected:** Accounts, LinkedAccountWidget  
**Status:** ✅ Code updated (Dec 3, 2025) - Browser verification needed

- [x] Standardize account number masking pattern
  - [x] Always show last 4 digits
  - [x] Use consistent number of asterisks (4: `****1098`)
  - [x] Code updated in AccountCard.tsx (line 61-64) to use `****${accountNumber.slice(-4)}`
  - [x] Code updated in RecipientAccountDisplayCard uses `getMaskedAccountNumber()` which returns `****${number.slice(-4)}`
  - [x] Code updated in Recipients components to use `****${number.slice(-4)}`
- [ ] **VERIFY:** Test in browser to confirm Accounts component displays `****1098` (4 asterisks) not `********1098` (8 asterisks)
  - [ ] If browser still shows 8 asterisks, investigate data source or rendering issue
  - [ ] Verify all components display consistent 4 asterisk pattern
- [ ] Document masking rules in design system

**Current State:**

- **Code:** All components use `****${number.slice(-4)}` pattern (4 asterisks) ✅
- **Linked Accounts:** `****6677` (4 asterisks) ✅ Verified in browser
- **Accounts:** Code shows 4 asterisks, but browser may show 8 - needs verification
- **Recipients:** Uses `****${number.slice(-4)}` pattern ✅

---

### 1.4 Data Quality & Display Issues 🟠

**Source:** UX Testing Report - Transaction Details Modal, Technical Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements), Theme 8 (Comprehensive Testing)  
**Components Affected:** TransactionsDisplay

**Note:** Some issues may be related to mock data (MSW) rather than actual API responses. However, these should be fixed regardless to ensure proper handling of real data.

#### Transaction Details Modal

- [ ] Fix "$NaN" display for Ledger Balance (data formatting bug)
  - [ ] Check if this is mock data issue or actual formatting bug
  - [ ] Add proper number formatting/validation
  - [ ] Handle null/undefined values gracefully
- [ ] Replace "N/A" values with meaningful data or hide fields
  - [ ] Determine if "N/A" values are due to mock data or missing API fields
  - [ ] If mock data: update MSW handlers to provide realistic data
  - [ ] If API data: hide fields that consistently show "N/A" or add proper empty state handling
- [ ] Only show "Show all fields" toggle if there are meaningful additional fields
- [ ] Populate additional fields with actual data if available

#### Reference ID Column

- [ ] Populate Reference ID data, OR
- [ ] Hide column when data is not available
- [ ] Check if this is mock data limitation or actual API response

#### Missing Data Handling

- [ ] Add loading states for data fetching
- [ ] Add empty states for no data scenarios
- [ ] Standardize "N/A" vs hiding fields approach
- [ ] Ensure proper handling of both mock and real API data

---

## 🎯 Priority 2: High Impact UX Improvements

### 2.1 Filter & Label Standardization 🟠

**Source:** UX Testing Report - Recipients & Transactions Components  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** Recipients, TransactionsDisplay

#### Filter Labels

- [ ] Standardize filter labels to "All Statuses" (title case, plural)
- [ ] Standardize filter labels to "All Types" (title case, plural)
- [ ] Update Recipients component (currently "All Types", "All Status")
- [ ] Update Transactions component (currently "All statuses", "All types")

**Current State:**

- Recipients: "All Types", "All Status"
- Transactions: "All statuses", "All types"
- **Issue:** Inconsistent capitalization and pluralization

#### Pagination Text Format

- [ ] Standardize pagination text format
  - [ ] Option A: "Showing 1-3 of 3"
  - [ ] Option B: "3 total"
- [ ] Update Recipients (currently "Showing 1 to 3 of 3 recipients")
- [ ] Update Transactions (currently "4 row(s) total")

#### Default Rows Per Page

- [ ] Standardize default rows per page (recommend 10 or 25 consistently)
- [ ] Update Recipients (currently 10)
- [ ] Update Transactions (currently 25)
- [ ] Hide pagination controls when only one page exists

---

### 2.2 Tooltips & Help Text 🟠

**Source:** UX Testing Report - Multiple Components  
**Theme Alignment:** Theme 7 (A11y & UX Testing)  
**Components Affected:** All

- [ ] Add tooltips to all icon-only buttons
  - [ ] "View" button in Recipients (purpose unclear)
  - [ ] "View" button in Transactions (purpose unclear)
  - [ ] Info icon in Accounts (purpose unclear)
  - [ ] "Manage" button (ellipsis) in Linked Accounts
- [ ] Add ARIA labels for accessibility
- [ ] Add help text for complex features
- [ ] Ensure all interactive elements have descriptive labels

**Components Needing Tooltips:**

- Recipients: "View" button
- Transactions: "View" button
- Accounts: Info icon
- Linked Accounts: "Manage" button (ellipsis)

---

### 2.3 Responsive Design Improvements 🟠

**Source:** UX Testing Report - Recipients Component  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** Recipients, TransactionsDisplay

#### Table Responsiveness

- [ ] Remove horizontal scrollbar in Recipients table
- [ ] Implement responsive table design
- [ ] Add card view for tables on small screens
- [ ] Test all components on mobile/tablet viewports
- [ ] Ensure tables are fully responsive on smaller screens

**Current State:**

- Recipients table has horizontal scrollbar
- Suggests table may not be fully responsive

---

### 2.4 Accounts Component Enhancements 🟡

**Source:** UX Testing Report - Accounts Component Analysis  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** Accounts

#### Missing Action Buttons

- [ ] Add "View Transactions" button/link
- [ ] Add "Transfer Funds" button
- [ ] Add "Manage Account" button
- [ ] Add "Download Statement" button

#### UI Improvements

- [ ] Remove redundant "Accounts" heading (appears as both page title and card title)
  - [ ] Review Accounts.tsx to see if card title can be made more specific
  - [ ] Consider using account category or account name instead of generic "Accounts"
- [ ] Make card title more specific (e.g., "My Checking Account" or use account category)
- [ ] Add tooltip for info icon next to "Account Details" heading, OR
- [ ] Remove info icon if decorative
  - [ ] Current tooltip exists: "Account can be funded from external sources and is externally addressable via routing/account numbers here"
  - [ ] Verify tooltip is visible/accessible

#### Component Review Needed

- [ ] Review Accounts component structure and compare with other components
- [ ] Check if Accounts component follows same patterns as LinkedAccountWidget and Recipients
- [ ] Verify responsive design works correctly
- [ ] Review Accounts.tsx implementation for consistency with other components

---

## 🎯 Priority 3: Medium Priority Improvements

### 3.1 Status Badge Standardization 🟡

**Source:** UX Testing Report - Multiple Components  
**Theme Alignment:** Theme 6 (Atomic Design)  
**Components Affected:** All

- [ ] Ensure consistent status badge styling across components
- [ ] Document status color system
  - [ ] Success/Completed: Blue
  - [ ] Pending: Beige/Light Brown
  - [ ] Error/Rejected: Red
- [ ] Add hover states to status badges
- [ ] Improve contrast for accessibility (WCAG AA)
- [ ] Create StatusBadge component in design system

---

### 3.2 Date Formatting Standardization 🟡

**Source:** UX Testing Report - Recipient Details Modal  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** All

- [ ] Standardize date formatting across all components
- [ ] Update Recipient Details modal (currently "1/15/2024, 5:30:00 AM")
- [ ] Ensure consistent date format in all modals and detail views
- [ ] Consider using i18n for date formatting (Theme 2)

---

### 3.3 Menu & Dialog Enhancements 🟡

**Source:** UX Testing Report - Linked Account Manage Menu  
**Theme Alignment:** Theme 7 (A11y & UX Testing)  
**Components Affected:** LinkedAccountWidget

#### Manage Menu Improvements

- [ ] Add tooltip to "Manage" button: "Manage account" or "More actions"
- [ ] Add confirmation dialog for "Remove Account" action
- [ ] Add keyboard navigation support (arrow keys, Enter, Escape)
- [ ] Ensure menu doesn't get cut off on smaller screens or near viewport edges
- [ ] Consider adding "View Details" option if account details modal exists

---

### 3.4 Timeline & Activity History 🟡

**Source:** UX Testing Report - Recipient Details Modal  
**Theme Alignment:** Theme 0 (Functional Enhancements)  
**Components Affected:** Recipients

- [ ] Enhance Timeline section in Recipient Details modal
  - [ ] Add more timeline events if available (e.g., "Last payment", "Last updated")
  - [ ] OR rename section to "Created" if timeline functionality isn't implemented
- [ ] Consider adding activity history to other detail views

---

## 🎯 Priority 4: Technical Debt & Performance

### 4.1 Console Errors & MSW Issues 🟡

**Source:** UX Testing Report - Technical Analysis  
**Theme Alignment:** Theme 8 (Comprehensive Testing)  
**Components Affected:** All (MSW initialization)

- [ ] Fix duplicate party creation logic in MSW initialization
  - [ ] Error: "Failed to create a 'party' entity: an entity with the same primary key already exists"
  - [ ] Occurrences: 3 errors for parties 2200000111, 2200000112, 2200000113
  - [ ] Root Cause: Client 0030000134 attempts to create parties that already exist from Client 0030000132
- [ ] Consider reducing console.log verbosity in production builds
- [ ] Implement log levels (debug, info, warn, error)
- [ ] Minimize MSW logging in production

---

### 4.2 Duplicate API Calls 🟡

**Source:** UX Testing Report - Network Requests Analysis  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All

- [ ] Investigate why API calls are duplicated (called twice)
- [ ] Implement request deduplication
- [ ] Review React Query refetching logic
- [ ] Check tab switch emulation causing duplicate calls
- [ ] Monitor actual network performance in production (not just mocked)

**Current State:**

- `/ping` called 2 times
- `/ef/do/v1/accounts` called 2 times
- `/ef/do/v1/transactions` called 2 times
- **Issue:** Likely due to React Query refetching or tab switch emulation

---

### 4.3 Performance Optimization 🟢

**Source:** UX Testing Report - Performance Metrics  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All

- [ ] Monitor actual production performance (not just mocked)
- [ ] Consider code splitting for large JavaScript bundles
- [ ] Implement lazy loading for non-critical resources
- [ ] Optimize bundle sizes if they exceed 500KB
- [ ] Set Core Web Vitals targets

**Current State:**

- Load time: ~204ms (excellent, but from mocked environment)
- Largest resource: `sellsense-demo-DHwOlM2K.js` (160.1ms load time)
- Memory usage: Good (2.2% of limit used)

---

## 🎯 Priority 5: Design System Foundation

### 5.0 Collection Display Patterns 🔴

**Source:** User Feedback - Missing Consistent Pattern  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All components displaying collections

#### Collection Display Rules

- [ ] Define consistent pattern for displaying collections:
  - [ ] **3+ items:** Use data grid/table layout
  - [ ] **1-3 items:** Use card layout
    - [ ] **TBD:** Decide on card layout for 1-3 items:
      - [ ] Option A: Stacked cards (vertical layout)
      - [ ] Option B: Grid layout (2\*n for large viewports, stacked on mobile)
      - [ ] Option C: Single column on mobile, 2 columns on tablet, 3+ on desktop
- [ ] Document collection display rules in design system
- [ ] Apply pattern consistently across:
  - [ ] LinkedAccountWidget (currently uses cards)
  - [ ] Recipients (currently uses table)
  - [ ] TransactionsDisplay (currently uses table)
  - [ ] Accounts (currently uses cards)
  - [ ] Any future collection components

#### Implementation

- [ ] Create reusable `CollectionDisplay` component or utility
- [ ] Add responsive breakpoints for card/grid transitions
- [ ] Ensure accessibility for both grid and card layouts
- [ ] Update Storybook stories to showcase collection patterns

**Current State:**

- Recipients: Always uses table (even for 1-3 items)
- TransactionsDisplay: Always uses table
- LinkedAccountWidget: Uses cards
- Accounts: Uses cards
- **Issue:** No consistent rule for when to use table vs cards

---

### 5.1 Component Header/Title Format Standardization 🔴

**Source:** User Feedback - Different Header/Title Formats  
**Theme Alignment:** Theme 6 (Atomic Design)  
**Components Affected:** All components

#### Header/Title Pattern Analysis

- [ ] Audit all component header/title formats:
  - [ ] Accounts: "Accounts" (H1) + "Accounts" (card title) - redundant
  - [ ] LinkedAccountWidget: "Linked Accounts" (H1) + "Linked Accounts (1)" (section header)
  - [ ] Recipients: "Recipients" (H1) + table with no card title
  - [ ] TransactionsDisplay: "Transactions" (H1) + table with no card title
  - [ ] MakePayment: "Make Payment" (H1) + modal title
  - [ ] OnboardingFlow: Uses StepLayout with title, subtitle, description pattern
- [ ] Document current header/title patterns
- [ ] Define standard header/title format:
  - [ ] Page title (H1) format
  - [ ] Section header format
  - [ ] Card title format
  - [ ] Modal/dialog title format
  - [ ] Subtitle/description format
- [ ] Create Header/Title component library:
  - [ ] `PageHeader` - Main page title with optional description
  - [ ] `SectionHeader` - Section title with optional count/badge
  - [ ] `CardTitle` - Card title format
  - [ ] `ModalTitle` - Modal/dialog title format

#### Implementation

- [ ] Standardize all component headers to use consistent format
- [ ] Remove redundant titles (e.g., Accounts component)
- [ ] Ensure proper heading hierarchy (H1 → H2 → H3)
- [ ] Add consistent spacing and typography
- [ ] Update all components to use standardized header components

**Current State:**

- **Inconsistent patterns:**
  - Some use H1 + card title
  - Some use H1 + section header with count
  - Some use H1 only
  - OnboardingFlow uses different StepLayout pattern
- **Issue:** No consistent header/title format across components

---

### 5.2 Component Library Creation 🟡

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 6 (Atomic Design & Performance)  
**Components Affected:** All

#### Button Components

- [ ] `ButtonPrimary` - Main action button (consistent color)
- [ ] `ButtonSecondary` - Secondary action (white with border)
- [ ] `ButtonTertiary` - Text link style
- [ ] `ButtonIcon` - Icon-only with tooltip
- [ ] `StatusBadge` - Status indicator with consistent colors

#### Form Components

- [ ] `InputText` - Text input with validation
- [ ] `InputNumber` - Number input with formatting
- [ ] `Select` - Dropdown with search
- [ ] `DatePicker` - Date selection
- [ ] `FormField` - Wrapper with label and error handling

#### Table Components

- [ ] `DataTable` - Responsive table with sorting
- [ ] `TableRow` - Table row with actions
- [ ] `Pagination` - Consistent pagination controls

#### Card Components

- [ ] `Card` - Base card component
- [ ] `CardHeader` - Card header with title
- [ ] `CardBody` - Card content area
- [ ] `CardFooter` - Card footer with actions

---

### 5.2 Color Palette Standardization 🟡

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All

#### Primary Colors

- [ ] Choose single Primary Action color (Purple or Blue)
- [ ] Define Secondary Action: White with border
- [ ] Define Tertiary Action: Text link (blue)

#### Status Colors

- [ ] Success/Completed: Blue (#0066CC or similar)
- [ ] Pending: Beige/Light Brown (#D4A574 or similar)
- [ ] Error/Rejected: Red (#DC3545 or similar)
- [ ] Warning: Orange/Yellow (if needed)
- [ ] Info: Blue (if needed)

#### Neutral Colors

- [ ] Text Primary: Dark Gray (#1A1A1A or similar)
- [ ] Text Secondary: Medium Gray (#666666 or similar)
- [ ] Text Tertiary: Light Gray (#999999 or similar)
- [ ] Background: White (#FFFFFF)
- [ ] Border: Light Gray (#E5E5E5 or similar)

#### Footer

- [ ] Background: Consistent color (Blue or Teal)
- [ ] Text: White

---

### 5.3 Typography System 🟢

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All

- [ ] Define heading hierarchy (H1-H4)
- [ ] Define body text sizes (Large, Medium, Small)
- [ ] Define label styles (form labels, table headers)
- [ ] Document typography system in design tokens

---

### 5.4 Spacing System 🟢

**Source:** UX Testing Report - Design System Recommendations  
**Theme Alignment:** Theme 2 (i18n & Design Tokens)  
**Components Affected:** All

- [ ] Define card spacing (padding, margin, border radius)
- [ ] Define form spacing (field spacing, label spacing, button spacing)
- [ ] Define table spacing (cell padding, row spacing, header spacing)
- [ ] Document spacing system in design tokens

---

## 🎯 Priority 6: Roadmap Theme Alignment

### 6.1 Theme 0: Functional Enhancements (In Progress)

**Source:** Development Roadmap  
**Status:** 🚧 In Progress

#### OnboardingFlow

- [ ] Add support for new entity types (publicly traded companies, government entities, non-profit entities)
- [ ] Refine owner/controller flows

#### LinkedAccountWidget

- [x] Handle verification responses (PR #583 - Dec 2, 2025)
- [ ] Parity with Recipients payment methods
- [ ] Better status messaging
- [ ] Robust microdeposit flows (retry/lockout messaging)

#### Recipients

- [ ] Conditional attributes per payment method (ACH/RTP/WIRE)
- [ ] Edit flows parity + masking
- [ ] Recipient duplicate detection UX

#### MakePayment

- [ ] Recipient/method filtering logic
- [ ] Review fee/time ETA display
- [ ] Review/confirmation UX
- [ ] Cross-currency payment support

#### TransactionsDisplay

- [ ] Pagination (in progress)
- [ ] Review details attribute mapping
- [ ] Review PAYIN/PAYOUT derivation and counterpart display

#### Accounts

- [ ] Responsive cards
- [ ] Review balance types mapping and tooltips
- [ ] Masking/toggle for sensitive routing/account info

---

### 6.2 Theme 1: Security & Validation (In Progress)

**Source:** Development Roadmap  
**Status:** 🚧 In Progress

- [ ] OWASP hardening
  - [ ] XSS sanitization with dompurify
  - [ ] Sensitive-data masking
  - [ ] Idempotency keys
  - [ ] Auth/CSRF via axios interceptor
  - [ ] Throttling on verification flows
- [ ] Client-side validation: centralize Zod schemas (superset of OAS)
- [ ] Strict regex for routing/account numbers
- [ ] Progressive and accessible errors
- [ ] OAS alignment: verify against latest specs
- [ ] Prefer generated hooks/types; no ad-hoc fetch clients

---

### 6.3 Theme 2: i18n & Design Tokens (In Progress)

**Source:** Development Roadmap  
**Status:** 🚧 In Progress

- [ ] Extract content tokens
- [ ] Wire `react-i18next` + `zod-i18n-map`
- [ ] Expand design tokens for full theming/private labeling
- [ ] Ensure runtime overrides via `EBComponentsProvider`

---

### 6.4 Theme 3: Functional Testing (CAT) (In Progress)

**Source:** Development Roadmap  
**Status:** 🚧 In Progress

- [ ] Wire environment config for CAT endpoints/headers
- [ ] Smoke and regression suites against CAT APIs using generated hooks
- [ ] Record diffs, capture contract mismatches

---

### 6.5 Theme 4: React 19 Readiness

**Source:** Development Roadmap  
**Status:** 📋 Planned

- [ ] Verify peer compatibility
- [ ] Incremental adoption plan
- [ ] Guardrails
- [ ] Migrate low-risk areas (test environment, Storybook, non-critical flows) first
- [ ] Keep feature flags

---

### 6.6 Theme 5: RUM & Analytics

**Source:** Development Roadmap  
**Status:** 📋 Planned

- [ ] Standard event catalog per component
- [ ] Configurable `userEventsHandler` hooks
- [ ] Perf timing utilities

---

### 6.7 Theme 6: Atomic Design & Performance

**Source:** Development Roadmap  
**Status:** 📋 Planned

- [ ] Extract shared atoms/molecules/organisms and utilities
- [ ] Core Web Vitals targets TBD
- [ ] Apply memoization, virtualization, code-splitting

---

### 6.8 Theme 7: A11y & UX Testing

**Source:** Development Roadmap, UX Testing Report  
**Status:** 🚧 In Progress (UX Testing completed Dec 2, 2025)

- [x] UX scenarios per component (completed Dec 2, 2025)
- [ ] Mitigate found issues (see Priority 1-3 items)
- [ ] WCAG 2.1 AA compliance
- [ ] Axe automated tests
- [ ] Keyboard/focus management
- [ ] ARIA correctness

---

### 6.9 Theme 8: Comprehensive Testing

**Source:** Development Roadmap  
**Status:** 📋 Planned

- [ ] 90%+ coverage: unit (validators/hooks), component, integration (MSW), E2E for critical paths
- [ ] Storybook scenarios: loading/error/empty/edge/i18n/theme/a11y
- [x] Enhanced test setup with ResizeObserver mock (PR #582 - Dec 3, 2025)
- [x] Improved test reliability (PR #582 - Dec 3, 2025)

---

### 6.10 Theme 9: Documentation & AI Guides

**Source:** Development Roadmap  
**Status:** 📋 Planned

- [ ] Per-component docs (usage, configuration, validation, security, a11y, testing, performance)
- [ ] Enhanced Cursor rules and codegen/dev templates for AI agents

---

### 6.11 Theme 10: Tech Debt & Dependency Hygiene

**Source:** Development Roadmap  
**Status:** 📋 Planned

#### Dependency Audit

- [ ] Review and update all package dependencies (runtime and dev) with security-first allowlist
- [ ] Remove obsolete or unused devDependencies
- [ ] Consolidate eslint/prettier configs; drop overlapping/legacy rules

#### TypeScript & Toolchain

- [ ] Consider bumping TypeScript and related type utilities to latest compatible versions
- [ ] Validate build output and generated d.ts after bump
- [ ] Fix any strictness regressions

#### Build/Test Infrastructure

- [ ] Verify Vite/Storybook compatibility after bumps
- [ ] Adjust configs if needed
- [ ] Rebaseline CI (typecheck/lint/test/storybook build) performance and caching

#### Orval & Dependencies

- [ ] Review and update Orval codegen to latest 7.x
- [ ] Ensure React Query v5 generators and axios mutator are configured
- [ ] Regenerate from latest OAS in `api-specs/`
- [ ] Dependency policy: prioritize security patches
- [ ] Keep React 18.3 baseline now, React 19 in Theme 4
- [ ] Track axios/react-query/radix/msw/storybook/vite minors
- [ ] Package manager: migrate to pnpm (workspaces) for speed and content-addressable store
- [ ] Update docs/CI to use `pnpm -w` equivalents

---

## 📊 Backlog Statistics

**Total Items:** ~160+  
**Critical Priority:** 6 major areas (including new collection patterns and header standardization)  
**High Priority:** 5 major areas  
**Medium Priority:** 4 major areas  
**Low Priority:** 3 major areas

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

**Document Maintainers:** Development Team  
**Review Frequency:** Weekly during active development, bi-weekly during maintenance  
**Last Major Update:** December 3, 2025
