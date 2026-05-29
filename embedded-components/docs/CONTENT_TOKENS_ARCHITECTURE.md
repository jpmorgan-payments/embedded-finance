# Content Tokens (i18n) Architecture Analysis & Reorganization Plan

**Author:** Embedded Components Architecture Team  
**Date:** February 2026  
**Status:** RFC (Request for Comments)  
**Version:** 3.1 - User-Customization-First Approach with Implementation Patterns

---

## Executive Summary

This document provides a **comprehensive analysis** of the content tokens (i18n) system in `embedded-components` with a reorganization plan focused on:

1. **User customization flexibility** - Users can customize each component independently
2. **Structural consistency** - Same key patterns across similar components
3. **Token discoverability** - Easy to find which token controls which text
4. **Maintainability** - Clear ownership and organization

### Core Philosophy Change

> **Duplicates are intentional, not problems.**
>
> Even when two components display the same default text (e.g., "Active"), users may want to customize them differently. The architecture should **enable independent customization per component** rather than force shared values.

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Implementation Patterns](#implementation-patterns)
3. [Complete Namespace Inventory](#complete-namespace-inventory)
4. [Structural Consistency Analysis](#structural-consistency-analysis)
5. [Proposed Reorganization](#proposed-reorganization)
6. [Token ID Visibility Feature](#token-id-visibility-feature)
7. [Implementation Plan](#implementation-plan)

---

## Architecture Principles

### What TO Consolidate (common.json)

Only truly universal tokens that users would **never** want different between components:

| Token Type     | Example                                | Reason                    |
| -------------- | -------------------------------------- | ------------------------- |
| Country names  | `countries.US: "United States"`        | Geographic fact           |
| Currency codes | `currencies.USD: "US Dollar"`          | Financial standard        |
| Universal UI   | `loading: "Loading..."`                | Consistent UX expectation |
| Basic actions  | `cancel: "Cancel"`, `submit: "Submit"` | Standard button labels    |

### What NOT to Consolidate

Tokens that users may want to customize **independently per component**:

| Token Type       | Example                      | Why Keep Separate                      |
| ---------------- | ---------------------------- | -------------------------------------- |
| Status labels    | `status.labels.ACTIVE`       | "Active" vs "Linked" vs "Verified"     |
| Component titles | `title`                      | "Recipients" vs "Payees" vs "Contacts" |
| Action buttons   | `actions.add`                | "Add Recipient" vs "Link Account"      |
| Error messages   | `errors.loadFailed`          | Context-specific messaging             |
| Empty states     | `emptyState.title`           | Different CTAs per component           |
| Field labels     | `fields.accountNumber.label` | "Account Number" vs "IBAN"             |

### Structural Consistency Principle

Even though tokens are duplicated, they should follow **consistent key patterns**:

```
✅ GOOD: Same structure, different values
linked-accounts.status.labels.ACTIVE = "Linked"
recipients.status.labels.ACTIVE = "Verified"

❌ BAD: Inconsistent structure
linked-accounts.status.labels.ACTIVE
recipients.statusLabels.active  // Different path!
```

---

## Implementation Patterns

### Pattern 1: useTranslationWithTokens Hook

Use the custom `useTranslationWithTokens` hook instead of the standard `useTranslation` from react-i18next:

```tsx
import { useTranslationWithTokens } from '@/components/i18n';

function MyComponent() {
  const { t } = useTranslationWithTokens('my-namespace');

  return <div>{t('my.key')}</div>;
}
```

**Benefits:**

- When `showTokenIds` is enabled, `t()` wraps output in `<span data-content-token="namespace:key">`
- Token IDs are visible in Storybook for easy discovery
- Users can customize via `contentTokens` prop

### Pattern 2: Derive Labels from IDs Using Template Literals

**DON'T pass labels through props or objects:**

```tsx
// ❌ BAD - Requires passing label around
const sections = [
  { id: 'identity', label: t('sectionLabels.identity') },
  { id: 'ownership', label: t('sectionLabels.ownership') },
];

// Component receives section and renders section.label
```

**DO derive labels from IDs at render time:**

```tsx
// ✅ GOOD - Derive label from ID using template literal
const sections = [
  { id: 'identity', icon: IdentityIcon },
  { id: 'ownership', icon: OwnershipIcon },
];

// Component renders using ID
function SectionList({ sections }) {
  const { t } = useTranslationWithTokens('client-details');

  return sections.map((section) => (
    <div key={section.id}>
      {t(`sectionLabels.${section.id}`)} {/* Derive from ID */}
    </div>
  ));
}
```

**Why this matters:**

1. **Single source of truth** - Token key derived from semantic ID
2. **Cleaner interfaces** - No need for `label` in data types
3. **Automatic token annotation** - `t()` adds data attributes for discovery
4. **Simpler data flow** - No passing translated strings around

### Pattern 3: Remove Redundant Props

**DON'T add props that can be customized via contentTokens:**

```tsx
// ❌ BAD - Redundant prop
interface ClientDetailsProps {
  title?: string; // Users can customize via contentTokens instead
}

const resolvedTitle = title ?? t('title');
```

**DO use contentTokens as the only customization path:**

```tsx
// ✅ GOOD - Single customization path via contentTokens
function ClientDetails({ clientId }) {
  const { t } = useTranslationWithTokens('client-details');

  return (
    <h1>{t('title')}</h1>  {/* Customizable via contentTokens */}
  );
}

// User customization:
<EBComponentsProvider
  contentTokens={{
    tokens: {
      'client-details': {
        title: 'My Custom Title'
      }
    }
  }}
>
  <ClientDetails clientId="123" />
</EBComponentsProvider>
```

### Pattern 4: Child Components Use Same Namespace

All child components within a feature should use the same i18n namespace as the parent:

```tsx
// Parent: ClientDetails.tsx
const { t } = useTranslationWithTokens('client-details');

// Child: SectionList.tsx (same namespace)
const { t } = useTranslationWithTokens('client-details');

// Child: SectionNavigation.tsx (same namespace)
const { t } = useTranslationWithTokens('client-details');
```

**Benefits:**

- All tokens for a feature in one JSON file
- Predictable token paths for users
- Easier documentation

### Pattern 5: Token Key Conventions

Follow these naming conventions for token keys:

```json
{
  "title": "Component Title",

  "errors": {
    "loadFailed": "Failed to load data.",
    "required": "This field is required."
  },

  "sectionLabels": {
    "identity": "Identity & Organization",
    "ownership": "Ownership"
  },

  "labels": {
    "businessName": "Business Name",
    "status": "Status"
  },

  "actions": {
    "save": "Save",
    "cancel": "Cancel"
  },

  "status": {
    "labels": {
      "ACTIVE": "Active",
      "INACTIVE": "Inactive"
    },
    "messages": {
      "ACTIVE": "This item is currently active."
    }
  }
}
```

---

## Complete Namespace Inventory

### Current Files (11 namespaces × 3 locales = 33 files)

| Namespace             | Lines | Primary Component     | Customization Scope       |
| --------------------- | ----- | --------------------- | ------------------------- |
| `common`              | 89    | All (shared)          | Universal only            |
| `validation`          | 119   | Form validation       | Error messages            |
| `accounts`            | 62    | AccountsWidget        | Account display           |
| `transactions`        | 167   | TransactionsDisplay   | Transaction UI            |
| `recipients`          | 247   | RecipientsWidget      | Recipient management      |
| `linked-accounts`     | 219   | LinkedAccountWidget   | Linked account management |
| `bank-account-form`   | 194   | BankAccountForm       | Form fields               |
| `make-payment`        | 76    | MakePayment           | Payment flow              |
| `onboarding-overview` | 965   | OnboardingFlow        | Onboarding UI             |
| `onboarding`          | 1385  | OnboardingWizardBasic | Onboarding fields         |
| `client-details`      | 94    | ClientDetails         | Client info display       |

---

## Structural Consistency Analysis

### Issue 1: Inconsistent Key Naming

#### Pagination Keys

| Namespace      | Current Key                       | Standardized Key       |
| -------------- | --------------------------------- | ---------------------- |
| `transactions` | `pagination.goToFirst.srOnly`     | `pagination.goToFirst` |
| `recipients`   | `pagination.goToFirstPage.srOnly` | `pagination.goToFirst` |

**Action:** Standardize key names (not values) across namespaces

#### Column Toggle Keys

| Namespace      | Current Key           | Standardized Key        |
| -------------- | --------------------- | ----------------------- |
| `transactions` | `viewOptions.button`  | `columnToggle.button`   |
| `recipients`   | `columnToggle.button` | `columnToggle.button` ✓ |

**Action:** Rename `transactions.viewOptions` → `transactions.columnToggle`

### Issue 2: Missing Parallel Structures

Some namespaces are missing tokens that their sibling has:

| Token Path           | linked-accounts | recipients | Action                 |
| -------------------- | --------------- | ---------- | ---------------------- |
| `status.labels.*`    | ✓               | ✓          | -                      |
| `status.messages.*`  | ✓               | ✓          | -                      |
| `pagination.*`       | ✗               | ✓          | Add to linked-accounts |
| `columns.*`          | ✗               | ✓          | Add to linked-accounts |
| `filters.*`          | ✗               | ✓          | Add to linked-accounts |
| `deactivateDialog.*` | ✗               | ✓          | Add to linked-accounts |

**Action:** Ensure parallel structure for components that share UI patterns

### Issue 3: Enum Duplication Without Customization Need

Some enums truly are constants (organization types, ID types) where users would NOT want different values per component. These can stay in their primary namespace but should be documented as "reference" tokens.

---

## Proposed Reorganization

### Phase 1: Structural Standardization (Non-Breaking)

Ensure consistent key structures WITHOUT moving tokens:

#### 1.1 Standardize Pagination Keys

```json
// ALL namespaces with pagination should use:
"pagination": {
  "rowsTotal": "{{count}} row(s) total",
  "rowsPerPage": "Rows per page",
  "pageInfo": "Page {{current}} of {{total}}",
  "pageInfoMobile": "{{current}} / {{total}}",
  "goToFirst": "Go to first page",
  "goToPrevious": "Go to previous page",
  "goToNext": "Go to next page",
  "goToLast": "Go to last page"
}
```

#### 1.2 Standardize Table UI Keys

```json
// ALL namespaces with tables should use:
"columnToggle": {
  "button": "Columns",
  "label": "Toggle columns"
},
"table": {
  "noResults": "No results.",
  "actions": "Actions"
}
```

#### 1.3 Standardize Status Keys

```json
// ALL namespaces with status should use:
"status": {
  "labels": {
    "ACTIVE": "...",
    "INACTIVE": "...",
    // ... enum values as keys
  },
  "messages": {
    "ACTIVE": "...",
    // ... longer descriptions
  }
}
```

### Phase 2: Fill Missing Parallel Structures

Add missing tokens to namespaces that need them:

#### linked-accounts.json additions:

```json
{
  // EXISTING tokens...

  // NEW: Add pagination (currently missing, uses recipients)
  "pagination": {
    "rowsTotal": "{{count}} account(s) total",
    "rowsPerPage": "Accounts per page",
    "pageInfo": "Page {{current}} of {{total}}",
    "pageInfoMobile": "{{current}} / {{total}}",
    "goToFirst": "Go to first page",
    "goToPrevious": "Go to previous page",
    "goToNext": "Go to next page",
    "goToLast": "Go to last page"
  },

  // NEW: Add columns (for table view)
  "columns": {
    "name": "Name",
    "type": "Type",
    "status": "Status",
    "accountNumber": "Account Number",
    "actions": "Actions"
  },

  // NEW: Add filters
  "filters": {
    "searchPlaceholder": "Search accounts...",
    "status": {
      "label": "Status",
      "all": "All Status"
    }
  }
}
```

### Phase 3: Slim Down common.json

Remove tokens from `common.json` that are better scoped elsewhere:

#### Keep in common.json:

```json
{
  "noTokenFallback": "NO CONTENT TOKEN FOUND: {{key}}",
  "warning": "Warning",
  "next": "Next",
  "previous": "Previous",
  "submit": "Submit",
  "loading": "Loading...",
  "submitting": "Submitting...",
  "noOptionFound": "No option found.",
  "optional": "optional",
  "yes": "Yes",
  "no": "No",
  "cancel": "Cancel",
  "start": "Start",
  "edit": "Edit",
  "continue": "Continue",
  "empty": "empty",
  "na": "N/A",

  "countries": {
    /* keep - geographic facts */
  },

  "validation": {
    "required": "This field is required",
    "minItems": "Minimum {{count}} items required",
    "maxItems": "Maximum {{count}} items allowed",
    "dateFormat": "Please enter a valid date in MM/DD/YYYY format",
    "dateInvalid": "Invalid date"
  },

  "errors": {
    "tryAgain": "Try Again",
    "showDetails": "Show Details",
    "hideDetails": "Hide Details"
  }
}
```

#### Move OUT of common.json to component namespaces:

- `phoneTypes` → keep in onboarding (or duplicate where needed)
- `addressTypes` → keep in onboarding (or duplicate where needed)

---

## Token ID Visibility Feature

### Problem Statement

Users customizing content tokens need to easily find which token ID controls which text in the UI.

### Solution: showTokenIds Mode

Add `showTokenIds` option to `EBComponentsProvider`:

```typescript
<EBComponentsProvider
  contentTokens={{
    name: 'enUS',
    showTokenIds: true,  // Development mode
    tokens: { ... }
  }}
/>
```

### Implementation: Data Attributes

Add `data-content-token` attributes to all translated text:

```tsx
// Component code
<span data-content-token="recipients:status.labels.ACTIVE">
  {t('status.labels.ACTIVE')}
</span>
```

### CSS Debug Mode

Provide a CSS snippet users can enable:

```css
/* Add to browser dev tools or Storybook */
[data-content-token]::after {
  content: ' [' attr(data-content-token) ']';
  font-size: 10px;
  color: #666;
  background: #ffeb3b;
  padding: 2px 4px;
  border-radius: 2px;
}
```

### Storybook Integration

Add a toolbar toggle in Storybook to show/hide token IDs:

```tsx
// .storybook/preview.tsx
export const globalTypes = {
  showTokenIds: {
    name: 'Show Token IDs',
    description: 'Display content token IDs for customization',
    defaultValue: false,
    toolbar: {
      icon: 'markup',
      items: [
        { value: false, title: 'Hide Token IDs' },
        { value: true, title: 'Show Token IDs' },
      ],
    },
  },
};
```

---

## Documentation Improvements

### Per-Component Token Reference

Create a token reference section in each component's Storybook docs:

````markdown
## Content Tokens

This component uses the `recipients` namespace.

### Customization Example

```tsx
<EBComponentsProvider
  contentTokens={{
    tokens: {
      recipients: {
        title: 'My Payees',
        status: {
          labels: {
            ACTIVE: 'Verified',
          },
        },
      },
    },
  }}
>
  <RecipientsWidget />
</EBComponentsProvider>
```
````

### Available Tokens

| Token Path             | Default Value | Description       |
| ---------------------- | ------------- | ----------------- |
| `title`                | "Recipients"  | Main heading      |
| `status.labels.ACTIVE` | "Active"      | Status badge text |
| ...                    | ...           | ...               |

````

### Interactive Token Explorer

Build a Storybook addon that:
1. Lists all tokens for the current component
2. Shows live preview as user edits values
3. Generates the `contentTokens` config code

---

## Implementation Plan

### Phase 1: Structural Consistency (Week 1-2)
- [ ] Audit all key naming inconsistencies
- [ ] Create standardized key structure documentation
- [ ] Add missing parallel tokens to namespaces

### Phase 2: Token Visibility (Week 3-4)
- [ ] Implement `data-content-token` attributes
- [ ] Create CSS debug snippet
- [ ] Add Storybook toolbar toggle

### Phase 3: Documentation (Week 5-6)
- [ ] Add token reference tables to Storybook
- [ ] Create per-component customization examples
- [ ] Build interactive token explorer addon

### Phase 4: Cleanup (Week 7-8)
- [ ] Remove misplaced tokens from common.json
- [ ] Add deprecation warnings for moved tokens
- [ ] Update all locale files (fr-CA, es-US)

---

## Summary

| Change | Impact |
|--------|--------|
| Keep duplicates scoped | Users can customize each component independently |
| Standardize key structures | Predictable patterns across namespaces |
| Add `showTokenIds` mode | Easy discovery of token IDs |
| Per-component documentation | Clear customization guidance |

**Key Takeaway:** The goal is not to reduce token count, but to make tokens **discoverable, consistent, and independently customizable** per component.

---

## Appendix A: Key Examples

### Example 1: Independent Customization

**Default (both components show "Active"):**
```tsx
// linked-accounts.json
"status": { "labels": { "ACTIVE": "Active" } }

// recipients.json
"status": { "labels": { "ACTIVE": "Active" } }
````

**User wants different labels per component:**

```tsx
<EBComponentsProvider
  contentTokens={{
    tokens: {
      'linked-accounts': {
        status: { labels: { ACTIVE: 'Linked' } },
      },
      recipients: {
        status: { labels: { ACTIVE: 'Verified' } },
      },
    },
  }}
/>
```

### Example 2: Finding Token IDs (with showTokenIds)

```tsx
// Development mode - enable token visibility
<EBComponentsProvider
  contentTokens={{
    showTokenIds: true,
  }}
>
  <RecipientsWidget /> {/* All text now shows token IDs */}
</EBComponentsProvider>
```

### Example 3: Structural Consistency Benefit

Even though tokens are duplicated, consistent key paths make it predictable:

```tsx
// User knows the pattern - same path in both namespaces
contentTokens={{
  tokens: {
    'linked-accounts': { status: { labels: { ACTIVE: "..." } } },
    recipients: { status: { labels: { ACTIVE: "..." } } },
    accounts: { status: { labels: { OPEN: "..." } } }  // Same pattern
  }
}}
```

---

## Appendix B: What Stays in common.json

Only truly universal values that users would **never** want different:

| Category     | Examples                         | Reason              |
| ------------ | -------------------------------- | ------------------- |
| Geographic   | Country names                    | Facts, not opinions |
| Universal UI | "Loading...", "Cancel", "Submit" | Consistent UX       |
| Validation   | "This field is required"         | Form patterns       |

---

## Appendix C: Full Token Inventory

See individual namespace files in [src/i18n/en-US/](../src/i18n/en-US/) for complete token listings.
