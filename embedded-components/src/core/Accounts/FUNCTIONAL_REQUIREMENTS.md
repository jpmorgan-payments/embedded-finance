# Accounts — Functional Requirements

This document describes **all existing behaviours** of the Accounts component in functional terms (requirements and principles only). It is intended for future regeneration or reimplementation of the code.

---

## 1. Principles

- **Client-scoped**: The component requires client ID from the parent (e.g. provider). The parent is responsible for authentication and client context. When client ID is not provided, the list is not fetched.
- **Category filtering**: Only accounts whose category is in the allowed list (e.g. DDA, LIMITED_DDA) are shown. Filtering is applied client-side after fetch.
- **i18n**: All user-facing strings use the `accounts` (and where needed `common`) i18n namespace.
- **User journey events**: View and refresh actions are emit points for analytics when the parent supplies a handler.
- **Ref API**: The component exposes a ref with `refresh()` to refetch accounts and all account card balances. Parent may use this for sync or toolbar actions.
- **No code snippets**: This document states what must hold and what the UI must do, not how to implement it.

---

## 2. Scope: What the Component Covers

- **Accounts widget**: List of bank accounts for a client, with optional title, loading skeleton, error state with retry, empty state, and one or more account cards.
- **Account card**: Per-account display (label, category, state, masked account number with show/hide, balance with loading/error, copy and optional info). Ref exposes `refreshBalance()`.
- **Layout**: Single-account layout (no gap, no border on card) when exactly one account after filtering; otherwise grid of cards with responsive columns.

---

## 3. Functional Requirements by Area

### 3.1 Data Loading and Dependencies

- **List fetch**: Accounts are fetched via the accounts API when client ID is set and the interceptor (e.g. auth) is ready. No fetch when client ID is missing.
- **Filtering**: Only accounts whose `category` is in the `allowedCategories` prop are displayed.
- **Loading state**: While loading (or interceptor not ready), a skeleton consistent with account cards is shown.
- **Error state**: On list fetch error, show an error message (title and body from i18n), optional per-status messages (e.g. 400), and a retry action that refetches.

### 3.2 Header and Title

- **Title**: Header shows a configurable title (default from i18n, e.g. "Your account"). When not loading and not in error and there is more than one account, the title includes the count (e.g. "Your accounts (3)").
- **Heading level**: The main title uses the configured heading level (default 2); child content (e.g. empty state heading) uses the next level down for accessibility.

### 3.3 Empty State

- When the list has loaded successfully, interceptor is ready, and there are zero accounts after filtering: show an empty state with icon, title, and description (from i18n). No primary action button is required by default.

### 3.4 Account List and Layout

- **Single account**: When exactly one account remains after filtering, use single-account layout: no padding on list container, card without border so it reads as one block.
- **Multiple accounts**: Grid of account cards with gap; at larger breakpoints, two columns when appropriate. Cards animate in with staggered delay.
- **Refs**: Each account card may receive a ref so the parent Accounts component can call `refreshBalance()` on each when the widget ref’s `refresh()` is invoked.

### 3.5 Account Card Behaviour

- **Content**: Display account label (or fallback), category, state (e.g. OPEN, CLOSED, PENDING_CLOSE), masked account number with show/hide toggle, and balance (fetched separately per account).
- **Balance**: Balance is loaded per card via balance API. Loading and error states for balance are shown per card; balance fetch failure does not remove the card. Ref exposes `refreshBalance()` to refetch that account’s balance.
- **Sensitive data**: Account number can be toggled between masked and full (or last four). Copy-to-clipboard for account number (and optionally other fields) with visual feedback (e.g. “Copied”).
- **Status**: Visual distinction (e.g. icon, badge) for account state (OPEN, CLOSED, PENDING_CLOSE).
- **Accessibility**: Semantic heading for each card, ARIA where needed, and accessible names for actions (show/hide, copy).

### 3.6 Error Handling

- **List error**: Single error area with retry; no partial list. Same known-error mapping approach as other components where applicable (friendly message for known codes, generic plus optional details otherwise).
- **Per-card balance error**: Shown inline on the card; does not block the rest of the list.

### 3.7 Accessibility and UX

- **Headings**: Heading hierarchy respects the configured level and child level.
- **Responsive**: Layout and spacing adapt to container/viewport (single column, then multi-column where configured).

### 3.8 Callbacks and Events

- **Parent callbacks**: Optional user-events handler for view (when accounts load with count) and refresh (when ref `refresh()` is called).
- **Tracking**: View and refresh actions are reported when the parent supplies the handler.

---

## 4. Out of Scope for This Document

- Implementation plan, phases, or technology choices.
- Code snippets, file structure, or naming.
- Test strategy or coverage targets (see project testing docs).
- Design tokens or visual specs (see styling/design docs).
- API request/response schemas (see API/OpenAPI documentation).
