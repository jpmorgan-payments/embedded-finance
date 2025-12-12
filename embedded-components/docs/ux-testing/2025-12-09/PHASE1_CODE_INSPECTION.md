# Phase 1: GitHub Code & PR Inspection Summary

**Date:** December 9, 2025  
**Scope:** Code inspection for MakePayment, LinkedAccountWidget, Recipients, TransactionsDisplay, and Accounts components

---

## PR Review Summary

### Recently Merged PRs (December 2025)

#### PR #601: "Feature/latest component enhancements" (Merged Dec 9, 2025)

**Author:** kontel  
**Status:** ✅ Merged  
**Impact:** Significant - 30 files changed, 1272 additions, 611 deletions

**Key Changes:**

- **MakePayment Component:**
  - Added recipient creation functionality with "Save recipient" checkbox
  - Improved error handling for account balance API failures
  - Enhanced PaymentMethodSelector with icons (BanknoteIcon, ArrowRightLeftIcon, ZapIcon)
  - Updated RecipientModeToggle to use RadioGroup instead of buttons
  - Improved form section headers (using h3 instead of FormLabel)
  - Added balance error handling with retry functionality
  - Updated tests to handle new payment method display patterns

- **Recipients Component:**
  - Implemented server-side pagination (OAS-aligned with page 0-based, limit max 25)
  - Enhanced i18n support with type assertions
  - Updated status text formatting (no longer translates API status values)
  - Improved pagination controls (reduced page size options to 10, 20, 25)
  - Updated MSW handlers to support server-side pagination

- **AccountSelector:**
  - Added balance error handling with retry button
  - Improved accessibility (aria-label on SelectTrigger)
  - Better error state display

- **PaymentMethodSelector:**
  - Added payment method icons matching LinkedAccountWidget pattern
  - Improved layout (horizontal with icons and labels)
  - Better error messaging when no payment methods available

**Relevance to Backlog:**

- Addresses Make Payment form improvements (recipient creation)
- Improves error handling (addresses technical debt)
- Enhances payment method display consistency

#### PR #602: "fix test warnings and and fix msw handlers for onboarding" (Merged Dec 9, 2025)

**Author:** hyunghoseo  
**Status:** ✅ Merged  
**Impact:** Test improvements and MSW handler fixes

#### PR #600: "refactor: update SellSense themes with new editable properties and adjust color values for better consistency" (Merged Dec 8, 2025)

**Author:** kontel  
**Status:** ✅ Merged  
**Impact:** Theme consistency improvements

#### PR #599: "refactor: enhance i18n support in Recipients components by implementing type assertions and improving translation handling" (Merged Dec 8, 2025)

**Author:** kontel  
**Status:** ✅ Merged  
**Impact:** i18n improvements in Recipients component

#### PR #583: "update LinkedAccountWidget to handle verification responses and add interaction stories" (Merged Dec 3, 2025)

**Author:** hyunghoseo  
**Status:** ✅ Merged  
**Impact:** LinkedAccountWidget verification handling improvements

---

## Code Inspection Findings

### 1. Account Number Masking Consistency ✅

**Status:** Code is consistent - all components use 4 asterisks pattern

**Implementation Review:**

1. **AccountCard.tsx** (line 67-69):

   ```typescript
   const maskedAccountNumber = account.paymentRoutingInformation?.accountNumber
     ? `****${account.paymentRoutingInformation.accountNumber.slice(-4)}`
     : naText;
   ```

   ✅ Uses 4 asterisks: `****1098`

2. **getMaskedAccountNumber()** in `recipientHelpers.ts` (line 18):

   ```typescript
   export function getMaskedAccountNumber(recipient: Recipient): string {
     if (!recipient.account?.number) return 'N/A';
     return `****${recipient.account.number.slice(-4)}`;
   }
   ```

   ✅ Uses 4 asterisks: `****1234`

3. **RecipientCard.tsx** (line 87):
   ```typescript
   {
     recipient.account?.number
       ? `****${recipient.account.number.slice(-4)}`
       : naText;
   }
   ```
   ✅ Uses 4 asterisks: `****1234`

**Conclusion:** All code uses consistent 4 asterisk pattern. **Browser verification needed** to confirm rendering matches code (BACKLOG item 1.3).

---

### 2. Button Styling Consistency Analysis

**Current Implementation:**

All components use the shared `Button` component from `@/components/ui/button.tsx` with variants:

- `default` - Primary action (uses `eb-bg-primary`)
- `outline` - Secondary action (white with border)
- `secondary` - Alternative secondary
- `ghost` - Tertiary action
- `link` - Text link style
- `destructive` - Error/destructive actions

**Component-Specific Usage:**

1. **MakePayment:**
   - Primary button: `variant="default"` (purple primary color)
   - Trigger button: Uses `triggerButtonVariant` prop (defaults to 'default')
   - Payment method selector: RadioGroup with custom label styling

2. **Recipients:**
   - "+ Add Recipient": `variant="default"` (purple primary)
   - Action buttons: Mix of `outline` and `default` variants

3. **LinkedAccountWidget:**
   - "Link A New Account": `variant="outline"` (white with border)
   - Status badges: Uses Badge component, not Button

4. **TransactionsDisplay:**
   - Action buttons: `variant="outline"` (white with border)
   - Status badges: Uses Badge component with status variants

5. **Accounts:**
   - Icon-only buttons for show/hide and copy actions
   - No primary action buttons visible in AccountCard

**Issues Identified:**

1. **Primary Color Inconsistency:**
   - Recipients: Purple primary
   - Make Payment: Purple primary
   - Linked Accounts: White outline (no primary color used)
   - **Issue:** No consistent primary color application

2. **Button Variant Usage:**
   - Components use appropriate variants, but primary color theme may vary
   - Need to verify if `eb-bg-primary` token is consistent across themes

**Recommendation:**

- Verify primary color token consistency in browser
- Document expected button variant usage patterns
- Ensure all primary actions use `variant="default"` with consistent primary color

---

### 3. Status Badge Consistency ✅

**Implementation:** Consistent use of `getStatusVariant()` functions

1. **TransactionsDisplay:**
   - Uses `getStatusVariant()` from `utils/getStatusVariant.ts`
   - Maps: COMPLETED→success, PENDING→warning, REJECTED→destructive, default→informative

2. **Recipients:**
   - Uses `getStatusVariant()` from `utils/getStatusVariant.ts`
   - Maps: ACTIVE→success, PENDING→warning, REJECTED→destructive, INACTIVE→outline

**Conclusion:** Status badge implementation is consistent and follows Salt Design System patterns.

---

### 4. Form Patterns Analysis

**MakePayment Component:**

**Recent Changes (PR #601):**

- Section headers now use `<h3>` instead of `<FormLabel>` for better semantic structure
- RecipientModeToggle changed from buttons to RadioGroup for better accessibility
- PaymentMethodSelector improved with icons and better layout
- AccountSelector enhanced with error handling and retry functionality

**Form Structure:**

1. Recipient section (with mode toggle)
2. Account selector
3. Amount input
4. Payment method selector (conditional on recipient selection)
5. Additional information (optional)

**Issues to Verify in Browser:**

- Field ordering consistency between "Select existing" and "Enter details" tabs
- Review panel accuracy when switching tabs
- Form validation feedback clarity

---

### 5. Modal/Dialog Patterns

**Implementation:**

- All components use Radix UI Dialog primitives
- Consistent DialogContent, DialogTitle, DialogDescription structure
- MakePayment uses Card within DialogContent for form layout

**Accessibility:**

- DialogTitle uses `eb-sr-only` in MakePayment (screen reader only)
- Need to verify focus trap and keyboard navigation

---

## Comparison with Previous Testing (2025-12-02)

### Issues Resolved ✅

1. **LinkedAccountWidget Verification Handling:**
   - ✅ PR #583 addressed verification response handling
   - Status: Resolved

2. **Account Number Masking Code:**
   - ✅ Code updated to use 4 asterisks consistently
   - Status: Code complete, browser verification pending

### Issues Still Pending ⚠️

1. **Button Style Inconsistency:**
   - Still no standardized button component library
   - Primary color varies across components
   - Status: Unchanged

2. **Make Payment Form Discoverability:**
   - Form still hidden behind button click
   - No visual hints added
   - Status: Unchanged

3. **Data Quality Issues:**
   - "$NaN" display for Ledger Balance (needs browser verification)
   - "N/A" values in detail modals (may be mock data issue)
   - Status: Needs verification

4. **Footer Color Inconsistency:**
   - Make Payment footer color (teal vs blue)
   - Status: Unchanged

### New Issues from PR #601

1. **PaymentMethodSelector Layout Change:**
   - Changed from vertical card layout to horizontal with icons
   - Need to verify this improves UX in browser

2. **RecipientModeToggle Change:**
   - Changed from buttons to RadioGroup
   - Need to verify accessibility and UX

---

## Recommendations

### Immediate Actions

1. **Browser Verification:**
   - Verify account number masking displays 4 asterisks (not 8) in Accounts component
   - Test new PaymentMethodSelector layout and icons
   - Verify RecipientModeToggle RadioGroup UX
   - Check for "$NaN" display in Transactions details modal

2. **Code Review:**
   - Verify primary color token consistency across themes
   - Document button variant usage patterns
   - Review form field ordering in MakePayment tabs

### Future Enhancements

1. **Design System:**
   - Create standardized button component library
   - Establish primary color standard
   - Document button usage patterns

2. **Testing:**
   - Add visual regression tests for button styles
   - Add tests for account number masking
   - Add tests for status badge variants

---

## Files Inspected

- `embedded-components/src/core/MakePayment/MakePayment.tsx`
- `embedded-components/src/core/LinkedAccountWidget/LinkedAccountWidget.tsx`
- `embedded-components/src/core/Accounts/components/AccountCard/AccountCard.tsx`
- `embedded-components/src/lib/recipientHelpers.ts`
- `embedded-components/src/components/ui/button.tsx`
- `embedded-components/src/core/TransactionsDisplay/utils/getStatusVariant.ts`
- `embedded-components/src/core/Recipients/utils/getStatusVariant.ts`
- `embedded-components/src/core/MakePayment/components/PaymentMethodSelector/PaymentMethodSelector.tsx`
- `embedded-components/src/core/MakePayment/components/AccountSelector/AccountSelector.tsx`
- `embedded-components/src/core/MakePayment/components/recipient-mode/RecipientModeToggle.tsx`

---

**Next Steps:** Proceed to Phase 2 (Browser-Based UX Testing) to verify code findings and identify any rendering discrepancies.





