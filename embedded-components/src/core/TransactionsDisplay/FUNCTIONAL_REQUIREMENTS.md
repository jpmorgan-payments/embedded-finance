# TransactionsDisplay — Functional Requirements

This document describes **all existing behaviours** of the TransactionsDisplay component in functional terms (requirements and principles only). It is intended for future regeneration or reimplementation of the code.

---

## 1. Principles

- **Account-scoped**: Transactions are fetched for a set of account IDs. When no account IDs are provided, the component may use a default set (e.g. from context, such as LIMITED_DDA and LIMITED_DDA_PAYMENTS). The parent or provider is responsible for authentication and client context.
- **Single list**: One combined list of transactions across the selected accounts; no per-account tabs required by default.
- **i18n**: All user-facing strings use the `transactions` i18n namespace. Date and number formatting respect locale.
- **User journey events**: View list action is emitted for analytics when the parent supplies a handler.
- **Ref API**: The component exposes a ref with `refresh()` to refetch the transactions list.
- **No code snippets**: This document states what must hold and what the UI must do, not how to implement it.

---

## 2. Scope: What the Component Covers

- **Transactions widget**: Header with title and optional description, loading state, error state with retry, empty state, and either a table (desktop) or card list (mobile) with toolbar and pagination.
- **Table view**: Sortable columns, column visibility controls, filters, page size selector, and first/prev/next/last pagination.
- **Card view**: One card per transaction (mobile or when configured), with key fields and consistent ordering.
- **Transaction details**: Optional drill-down (e.g. sheet or dialog) for a single transaction; behaviour may be specified in a separate section or doc.

---

## 3. Functional Requirements by Area

### 3.1 Data Loading

- **Fetch**: Transactions are fetched for the given (or default) account IDs when the component is mounted and dependencies (e.g. interceptor) are ready. API contract and parameters follow the transactions API (e.g. list by account IDs).
- **Loading state**: While the list is loading, show a loading message (from i18n) in the content area. No skeleton is required for the table/cards.
- **Error state**: On fetch error, show an error area with title and body (from i18n, with optional per-status messages e.g. 400, 401, 403, 404, 500, 503) and a retry action that refetches.
- **Empty state**: When the list has loaded successfully and there are zero transactions, show an empty message (from i18n). When there are transactions but filters return no rows, show a “no results” message.

### 3.2 Header

- **Title**: Header shows a fixed title (e.g. “Transactions”). When load is successful, the count of transactions (filtered count) may be shown next to the title (e.g. “Transactions (42)”).
- **Description**: Optional description text may be shown below the title when provided by the parent.

### 3.3 Table and Card Views

- **Table (desktop)**: Sortable columns (e.g. date, amount, status, counterparty, memo, reference). Default sort (e.g. payment date descending). Column visibility configurable (some columns hidden by default, e.g. reference ID, effective date, memo). Toolbar for filters and column visibility.
- **Cards (mobile)**: When viewport is mobile (or when configured), show one card per transaction with the same data as the table row, in a consistent order. Pagination applies to the same dataset.
- **Pagination**: Page-based; configurable page size (e.g. 25 default). Controls: first, previous, next, last, and “Showing X–Y of Z” (or equivalent). Page size selector when supported.

### 3.4 Toolbar and Filtering

- **Toolbar**: A toolbar is present when there is data, offering column visibility and optionally global or per-column filters. Filtering is client-side (in-memory) on the fetched list unless otherwise specified.
- **Filter behaviour**: When filters are applied, the table/cards show only matching rows; count and pagination reflect the filtered set.

### 3.5 Transaction Data and Formatting

- **Fields**: Displayed fields align with the API (e.g. payment date, amount, currency, status, memo, transaction reference ID, counterparty, type). Formatted per locale (dates, numbers, currency).
- **Row/card click**: Optional: clicking a row or card opens a detail view (sheet or dialog) for that transaction. If not implemented, no requirement.

### 3.6 Error Handling

- **List error**: One error block with retry; no partial list. Same known-error mapping approach as other components (friendly message for known codes, generic plus optional details).
- **No account IDs**: If the resolved account ID list is empty and the component does not fetch, show empty or a specific message as defined by product (e.g. “Select accounts” or empty state).

### 3.7 Accessibility and UX

- **Table**: Sortable column headers have accessible names and state (sorted, direction). Pagination controls have accessible names.
- **Responsive**: Layout switches to cards on small viewports; table may scroll horizontally if needed on medium viewports.

### 3.8 Callbacks and Events

- **Parent callbacks**: Optional user-events handler for view list (when transactions load with count).
- **Ref**: Parent can call `refresh()` on the component ref to refetch transactions.

---

## 4. Out of Scope for This Document

- Implementation plan, phases, or technology choices.
- Code snippets, file structure, or naming.
- Test strategy or coverage targets (see project testing docs).
- Design tokens or visual specs (see styling/design docs).
- API request/response schemas (see API/OpenAPI documentation).
