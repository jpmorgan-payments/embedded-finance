# Comprehensive UX Testing & Backlog Update Command

**Purpose:** Run deep, detailed, thorough iteration of UX testing, code inspection, and backlog/roadmap updates.

**Date:** 2025-12-09  
**Session Folder:** `embedded-components/docs/ux-testing/2025-12-09/`

---

## Complete Cursor Command

Copy and paste this entire command to run comprehensive testing and updates:

````
Please conduct a comprehensive UX testing, code inspection, and backlog update session for the embedded finance components. Follow this detailed workflow:

## PHASE 1: GitHub Code & PR Inspection

1. **Inspect Recent Pull Requests:**
   - Navigate to: https://github.com/jpmorgan-payments/embedded-finance/pulls
   - Review all open PRs (especially #601, #550)
   - Review recently closed PRs (last 10-20 PRs)
   - For each PR:
     * Document PR number, title, author, status
     * Review PR description and changes
     * Identify components affected
     * Note any fixes or enhancements related to backlog items
     * Check if PR addresses any items from BACKLOG.md

2. **Code Inspection:**
   - Search codebase for recent changes to core components:
     * MakePayment component
     * LinkedAccountWidget component
     * Recipients component
     * TransactionsDisplay component
     * Accounts component
   - Review component implementations for:
     * Button styling consistency
     * Color usage (primary actions, footers)
     * Form patterns
     * Modal/dialog patterns
     * Status badge implementations
     * Account number masking patterns

3. **Compare with Previous Testing:**
   - Read previous testing report: embedded-components/docs/ux-testing/2025-12-02/UX_TESTING_REPORT.md
   - Identify which issues from previous testing have been addressed
   - Document new issues found in current code inspection
   - Note any regressions or new problems

## PHASE 2: Browser-Based UX Testing

Create new testing session folder: `embedded-components/docs/ux-testing/2025-12-09/`

For each component, conduct comprehensive testing:

### Component 1: Linked Accounts
URL: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=linked-accounts&theme=Empty

**Testing Steps:**
1. Navigate to URL and wait 3 seconds for page load
2. Take screenshot: `screenshots/linked-accounts-initial.png`
3. Capture accessibility snapshot
4. Collect console logs → `console-logs/linked-accounts-console.txt`
5. Monitor network requests → `network-requests/linked-accounts-network.json`
6. Collect performance metrics → `performance/linked-accounts-performance.json`
7. **Interactive Testing:**
   - Click "Link Account" button (if present)
   - Click "Manage" button (ellipsis) on any account card
   - Test all menu options
   - Click "View" button (if present)
   - Test any modals/dialogs that open
8. Take screenshots of all interactive states
9. Document: Button styles, colors, footer color, account number masking pattern

### Component 2: Recipients
URL: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=recipients&theme=Empty

**Testing Steps:**
1. Navigate to URL and wait 3 seconds
2. Take screenshot: `screenshots/recipients-initial.png`
3. Capture accessibility snapshot
4. Collect console logs → `console-logs/recipients-console.txt`
5. Monitor network requests → `network-requests/recipients-network.json`
6. Collect performance metrics → `performance/recipients-performance.json`
7. **Interactive Testing:**
   - Click "Add Recipient" button
   - Click "View" button on any recipient row
   - Test recipient details modal
   - Test filters (All Types, All Status)
   - Test pagination controls
   - Fill out any forms that appear
8. Take screenshots of all interactive states
9. Document: Button styles, colors, footer color, filter labels, pagination format, table responsiveness

### Component 3: Make Payment
URL: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=make-payment&theme=Empty

**Testing Steps:**
1. Navigate to URL and wait 3 seconds
2. Take screenshot: `screenshots/make-payment-initial.png`
3. Capture accessibility snapshot
4. Collect console logs → `console-logs/make-payment-console.txt`
5. Monitor network requests → `network-requests/make-payment-network.json`
6. Collect performance metrics → `performance/make-payment-performance.json`
7. **Interactive Testing:**
   - Click "Make Payment" button to open form
   - Test "Select existing" tab
   - Test "Enter details" tab
   - Fill out form fields in both tabs
   - Test tab switching behavior
   - Test form validation
   - Test review panel
   - Test fee display
   - Test date selection (if present)
   - Test modal accessibility (keyboard navigation, focus trap)
8. Take screenshots of all interactive states
9. Document: Form discoverability, field ordering, tab switching, fee display, footer color, button styles

### Component 4: Transactions
URL: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=transactions&theme=Empty

**Testing Steps:**
1. Navigate to URL and wait 3 seconds
2. Take screenshot: `screenshots/transactions-initial.png`
3. Capture accessibility snapshot
4. Collect console logs → `console-logs/transactions-console.txt`
5. Monitor network requests → `network-requests/transactions-network.json`
6. Collect performance metrics → `performance/transactions-performance.json`
7. **Interactive Testing:**
   - Click "View" button on any transaction row
   - Test transaction details modal
   - Test "Show all fields" toggle
   - Test filters (All statuses, All types)
   - Test pagination controls
   - Check for "$NaN" or "N/A" values
8. Take screenshots of all interactive states
9. Document: Button styles, filter labels, pagination format, data quality issues, Reference ID column

### Component 5: Accounts
URL: https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=accounts&theme=Empty

**Testing Steps:**
1. Navigate to URL and wait 3 seconds
2. Take screenshot: `screenshots/accounts-initial.png`
3. Capture accessibility snapshot
4. Collect console logs → `console-logs/accounts-console.txt`
5. Monitor network requests → `network-requests/accounts-network.json`
6. Collect performance metrics → `performance/accounts-performance.json`
7. **Interactive Testing:**
   - Click info icon next to "Account Details"
   - Test any action buttons
   - Check account number masking (verify 4 asterisks: ****1098)
   - Test responsive design
8. Take screenshots of all interactive states
9. Document: Account number masking pattern, button styles, redundant headings, tooltip accessibility

## PHASE 3: Cross-Component Analysis

Compare all components and document:

1. **Button Style Consistency:**
   - Primary button colors (purple vs blue vs white)
   - Secondary button styles
   - Icon button implementations
   - Status badge colors and styles

2. **Color Consistency:**
   - Primary action colors
   - Footer colors
   - Status colors (success, pending, error)

3. **Label & Text Consistency:**
   - Filter labels ("All Types" vs "All types" vs "All Status" vs "All statuses")
   - Pagination text formats
   - Date formatting

4. **Pattern Consistency:**
   - Header/title formats
   - Collection display patterns (table vs cards)
   - Modal/dialog patterns
   - Form patterns

5. **Data Quality:**
   - Account number masking consistency
   - Missing data handling ("N/A" vs hiding fields)
   - Number formatting issues ("$NaN")

6. **Accessibility:**
   - Tooltip presence and quality
   - ARIA labels
   - Keyboard navigation
   - Focus management

## PHASE 4: Technical Analysis

1. **Console Error Analysis:**
   - Document all console errors
   - Document all console warnings
   - Identify MSW initialization issues
   - Note any React warnings

2. **Network Request Analysis:**
   - Document all API endpoints called
   - Identify duplicate API calls
   - Note failed requests
   - Document request/response patterns

3. **Performance Analysis:**
   - Compare performance metrics across components
   - Identify slow resources
   - Note memory usage
   - Document load times

## PHASE 5: Comparison with Previous Testing

1. **Read Previous Report:**
   - embedded-components/docs/ux-testing/2025-12-02/UX_TESTING_REPORT.md
   - embedded-components/docs/ux-testing/2025-12-02/TESTING_SUMMARY.md

2. **Compare Findings:**
   - Which issues from 2025-12-02 have been fixed?
   - Which issues still exist?
   - What new issues have appeared?
   - What improvements have been made?

3. **Document Changes:**
   - Create comparison table
   - Note progress made
   - Identify regressions

## PHASE 6: Generate Testing Report

Create comprehensive report: `embedded-components/docs/ux-testing/2025-12-09/UX_TESTING_REPORT.md`

**Report Structure:**
1. Executive Summary
2. Component-by-Component Analysis
   - Visual Analysis
   - Interactive Testing Results
   - Technical Analysis
   - Issues Identified
3. Cross-Component Analysis
   - Inconsistencies Found
   - Pattern Analysis
4. Comparison with Previous Testing (2025-12-02)
   - Issues Resolved
   - Issues Still Present
   - New Issues Found
5. Technical Analysis Summary
   - Console Errors/Warnings
   - Network Request Patterns
   - Performance Metrics
6. Recommendations
   - Critical Issues
   - High Priority Issues
   - Medium Priority Issues

## PHASE 7: Update BACKLOG.md with Unique Tracking IDs

**IMPORTANT:** Replace all checkboxes `- [ ]` with unique tracking IDs in format: `BL-XXX`

**Tracking ID Format:**
- BL-001 through BL-999 for backlog items
- Use sequential numbering
- Group related items with sequential IDs
- Maintain existing priority structure

**Update Process:**
1. Read current BACKLOG.md
2. Assign unique tracking IDs to ALL items (including completed ones)
3. For completed items, keep ✅ but add tracking ID: `- [x] BL-XXX`
4. For new items found in testing, add with new tracking IDs
5. Create tracking ID index at top of BACKLOG.md
6. Link items to PRs where applicable (e.g., "BL-025 - Fixed in PR #583")

**Tracking ID Assignment Rules:**
- BL-001 to BL-099: Priority 1 (Critical) items
- BL-100 to BL-199: Priority 2 (High) items
- BL-200 to BL-299: Priority 3 (Medium) items
- BL-300 to BL-399: Priority 4 (Technical Debt) items
- BL-400 to BL-499: Priority 5 (Design System) items
- BL-500 to BL-599: Priority 6 (Roadmap Themes) items
- BL-600+: New items from current testing session

**Example Format:**
```markdown
### 1.1 Design System Standardization 🔴

**Tracking IDs:** BL-001 to BL-015
**Source:** UX Testing Report - Critical Inconsistencies Summary
**Theme Alignment:** Theme 6 (Atomic Design), Theme 7 (A11y & UX Testing)
**Components Affected:** All

#### Button Component Library

- [ ] BL-001: Create standardized button component system
  - [ ] BL-002: `ButtonPrimary` - Consistent primary action color (choose purple or blue)
  - [ ] BL-003: `ButtonSecondary` - White with border style
  - [ ] BL-004: `ButtonTertiary` - Text link style
  - [ ] BL-005: `ButtonIcon` - Icon-only with tooltip and ARIA labels
  - [ ] BL-006: `StatusBadge` - Consistent status indicator styling
- [ ] BL-007: Document button usage patterns in design system
- [ ] BL-008: Migrate all components to use standardized buttons
- [ ] BL-009: Update Storybook stories to showcase button variants
````

**Add Tracking Index:**
At the top of BACKLOG.md, add:

```markdown
## 📊 Tracking ID Index

### Critical Priority (BL-001 to BL-099)

- BL-001: Create standardized button component system
- BL-002: ButtonPrimary component
- ...

### High Priority (BL-100 to BL-199)

- BL-100: Standardize filter labels
- ...

### Completed Items

- BL-025: LinkedAccountWidget verification handling (PR #583 - Dec 2, 2025)
- BL-026: Enhanced test setup with ResizeObserver mock (PR #582 - Dec 3, 2025)
```

## PHASE 8: Update DEVELOPMENT_ROADMAP.md

1. **Review Current Roadmap:**
   - Read embedded-components/src/core/DEVELOPMENT_ROADMAP.md
   - Note current theme statuses

2. **Update Based on Findings:**
   - Mark completed items with ✅ and tracking IDs
   - Add new items from testing with tracking IDs
   - Update theme progress based on PR reviews
   - Link roadmap items to backlog tracking IDs

3. **Update Theme Statuses:**
   - Update "In Progress" themes with current status
   - Note any blockers or dependencies
   - Update timeline if needed

## PHASE 9: Create Testing Summary

Create: `embedded-components/docs/ux-testing/2025-12-09/TESTING_SUMMARY.md`

**Summary Should Include:**

1. Testing Date & Session Info
2. Components Tested
3. Key Findings (Top 10 issues)
4. Comparison with Previous Testing
5. Progress Made Since Last Testing
6. Critical Issues Requiring Immediate Attention
7. Recommendations for Next Steps

## PHASE 10: Final Validation

1. **Verify All Files Created:**
   - Testing report exists
   - All screenshots saved
   - All console logs saved
   - All network data saved
   - All performance metrics saved
   - BACKLOG.md updated with tracking IDs
   - DEVELOPMENT_ROADMAP.md updated

2. **Verify Tracking IDs:**
   - All items have unique IDs
   - No duplicate IDs
   - IDs follow numbering scheme
   - Index is complete

3. **Verify Cross-References:**
   - Backlog items reference PRs correctly
   - Roadmap items link to backlog IDs
   - Testing report references tracking IDs

## Output Requirements

1. **Testing Report:** Complete UX_TESTING_REPORT.md with all findings
2. **Updated BACKLOG.md:** All items have unique tracking IDs (BL-XXX format)
3. **Updated DEVELOPMENT_ROADMAP.md:** Reflects current state and links to backlog IDs
4. **Testing Summary:** Brief summary of key findings
5. **Asset Organization:** All screenshots, logs, and data in organized folder structure

## Notes

- Use browser automation tools for all testing
- Wait 2-3 seconds after navigation before capturing state
- Take screenshots at every key interaction point
- Document all findings, even minor ones
- Compare thoroughly with previous testing
- Ensure tracking IDs are unique and sequential
- Link all items to their sources (PRs, testing reports, etc.)

````

---

## Quick Reference: Testing URLs

- **Linked Accounts:** https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=linked-accounts&theme=Empty
- **Recipients:** https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=recipients&theme=Empty
- **Make Payment:** https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=make-payment&theme=Empty
- **Transactions:** https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=transactions&theme=Empty
- **Accounts:** https://embedded-finance-dev.com/sellsense-demo?fullscreen=true&component=accounts&theme=Empty

## Quick Reference: Tracking ID Ranges

- **BL-001 to BL-099:** Priority 1 (Critical)
- **BL-100 to BL-199:** Priority 2 (High)
- **BL-200 to BL-299:** Priority 3 (Medium)
- **BL-300 to BL-399:** Priority 4 (Technical Debt)
- **BL-400 to BL-499:** Priority 5 (Design System)
- **BL-500 to BL-599:** Priority 6 (Roadmap Themes)
- **BL-600+:** New items from current session

---

**Usage:** Copy the entire command from "## Complete Cursor Command" section above and paste into Cursor chat to execute comprehensive testing and updates.

