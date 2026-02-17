# RecipientWidgets — Functional Requirements

This document describes **all existing behaviours** of the RecipientWidgets component in functional terms (requirements and principles only). It is intended for future regeneration or reimplementation of the code.

---

## 1. Principles

- **Recipient-type agnostic base**: A single base widget supports multiple recipient types (e.g. LINKED_ACCOUNT, RECIPIENT). Type-specific behaviour is configured by recipient type (e.g. microdeposits only for LINKED_ACCOUNT).
- **Public API is two widgets**: Consumers use **LinkedAccountWidget** (linked bank accounts, with microdeposit verification) or **RecipientsWidget** (payment recipients, no microdeposits). Both are thin wrappers over the same base with fixed `recipientType` and appropriate callback names.
- **OAS as source of truth**: API contracts, types, and list/create/amend/verify behaviour align with the OpenAPI Specification (e.g. from the API portal). Type safety and consistent error handling follow the API contract.
- **Client ID from parent**: The component does not create clients; it requires client ID from the parent (e.g. provider). The parent is responsible for authentication and client context.
- **i18n by recipient type**: Each supported recipient type has an i18n namespace (e.g. `linked-accounts`, `recipients`). All user-facing strings are localisable via that namespace.
- **User journey events**: Key actions (view list, link started/completed, verify started/completed, edit started/completed, remove started/completed) are emit points for analytics when the parent supplies a handler; event names are derived from recipient type config.
- **No code snippets**: This document states what must hold and what the UI must do, not how to implement it.

---

## 2. Scope: What the Component Covers

- **LinkedAccountWidget**: List, add, edit, remove, and verify (microdeposits) linked bank accounts. Optional payment flow (e.g. “Pay”) and optional PaymentFlow integration.
- **RecipientsWidget**: List, add, edit, and remove payment recipients (no microdeposit verification). Same list/card/table and payment integration patterns as linked accounts where applicable.
- **Shared building blocks**: Base widget, create/edit form dialog, bank account form (with payment-method–aware validation), microdeposits form (LINKED_ACCOUNT only), remove confirmation and result dialogs, verification result dialog, detail view, status badges/alerts, empty state, pagination, table view, card view, error handling (including known-error interception).

---

## 3. Functional Requirements by Area

### 3.1 Widget Layout and Modes

- **Layout mode**  
  - **List (default)**: Show all recipients with pagination or “load more”; “Add” visible per rules below.  
  - **Single**: Show at most one recipient (e.g. for payment flows); “Add” is hidden when at least one active recipient exists.

- **View mode**  
  - **Cards**: Full cards with richer spacing and description.  
  - **Compact-cards (default)**: Compact rows, minimal spacing.  
  - **Table**: Sortable, server-side paginated table with configurable page size.

- **Scrollable list**  
  - When enabled: fixed-height scroll container, virtualized list, infinite scroll (load more when near the end).  
  - Optional configurable max height.

- **Create button visibility**  
  - Hidden if the widget is configured to hide the create button.  
  - In single mode, also hidden when there is at least one active recipient.  
  - Otherwise shown when there is at least one recipient; in empty state the same “add” action may appear in the empty state area.

- **Header**  
  - Title and optional description; title may show total count when not loading and not in error.  
  - “Link new account” / “Add” (or equivalent) when create is visible and list is non-empty.

### 3.2 Data Loading and Pagination

- **List data**  
  - Recipients are fetched by recipient type (e.g. LINKED_ACCOUNT or RECIPIENT).  
  - List API is called with type filter and pagination (page/limit or cursor-style) as defined by the API. Authentication and API base URL are provided by the parent (e.g. via provider).

- **Two pagination strategies**  
  - **Load-more (infinite)**: Fetch next page and append; “Load more” or infinite scroll.  
  - **Pages**: Page-based controls (first/prev/next/last, page size selector, “Showing X–Y of Z”).  
  - Table view always uses page-based, server-side pagination.

- **Loading state**  
  - While the list is loading, show a skeleton consistent with the current view (cards, compact-cards, or table).

- **Error state**  
  - On list fetch error, show an error message and a retry action.

- **Empty state**  
  - When the list has loaded successfully and there are zero recipients, show an empty state (icon, title, description) and optional primary action (e.g. “Link new account”).

### 3.3 Create and Edit Recipient (Form Dialog)

- **Create**  
  - Opens a dialog with the bank account form in “create” mode.  
  - On success: optional callback to parent, cache invalidation for that recipient type, dialog shows success (e.g. confirmation card) then user can close.  
  - On error: show error in-dialog (e.g. friendly error or server error alert).

- **Edit**  
  - Opens the same form in “edit” mode with the selected recipient’s data pre-filled.  
  - Edit is only offered for recipients in ACTIVE status; otherwise the action is disabled with an explanatory tooltip.  
  - On success: optional callback, cache invalidation, dialog can show success state.  
  - On error: show error in-dialog.

- **Dialog behaviour**  
  - Create/edit dialogs are “lifted” (controlled by the parent widget) so they survive list updates.  
  - On close, form state is reset so the next open is clean.  
  - Dialog title/description may reflect step (e.g. “Link account” vs “Edit account”) and after submit may reflect result (e.g. status-based success title).

- **Form configuration by type**  
  - LINKED_ACCOUNT: certification required; ACH locked (required); WIRE/RTP optional; address/contacts required when selected payment methods require them; prefill from client when available.  
  - RECIPIENT: type-specific config (payment methods, required fields, certification, prefill) as defined for that type.  
  - Form must support account holder type (Individual / Organization), account holder details, bank account details (routing, account number, account type), payment method selection, conditional address and contacts, and certification checkbox when required.

### 3.4 Bank Account Form (Create/Edit)

- **Account holder**  
  - Type: Individual or Organization.  
  - Individual: first name, last name (required); max lengths apply.  
  - Organization: business name (required); max length applies.  
  - Optional prefill from client data when config says so.

- **Bank account**  
  - Account number: required, digits only (format/length per API or validation rules).  
  - Bank account type: e.g. Checking / Savings (required).  
  - Routing: per selected payment method(s). Routing number required for each selected method that requires it; format (e.g. 9 digits) and any method-specific rules must be enforced.

- **Payment methods**  
  - User selects one or more of ACH, WIRE, RTP according to config.  
  - Some methods may be locked (e.g. ACH for linked accounts).  
  - When multiple methods are selected, UX may offer “use same routing number for all” and show one or multiple routing fields accordingly.

- **Address**  
  - Required when any selected payment method (or global config) requires it.  
  - When required: street (e.g. line 1), city, state, postal code required; postal code format (e.g. US ZIP) validated.

- **Contacts**  
  - Required types (e.g. EMAIL, PHONE) driven by selected payment methods and config.  
  - When a contact type is required, at least one value must be provided and validated.

- **Certification**  
  - When config requires certification, a checkbox (or equivalent) must be checked to certify ownership/authority; form cannot submit until checked.

- **Validation**  
  - All validations run before submit; errors shown per field/section.  
  - Known API error codes may be intercepted and shown with friendly title, description, and suggestion; unknown errors fall back to a generic server error display with optional technical details.

### 3.5 Microdeposit Verification (LINKED_ACCOUNT Only)

- **When shown**  
  - Verify action is only shown for recipients in READY_FOR_VALIDATION status.  
  - Not shown for RECIPIENT type (no microdeposit support).

- **Verification dialog**  
  - User provides two microdeposit amounts (e.g. amount1, amount2).  
  - Amounts must be positive, within allowed range (e.g. 0.01–0.99), and decimal format (e.g. at most two decimal places).  
  - Submit calls the verification API with the two amounts.

- **After submit**  
  - On VERIFIED: show success result dialog; optional callback and event; cache invalidation.  
  - On FAILED_MAX_ATTEMPTS_EXCEEDED: show max-attempts-exceeded result dialog; optional callback.  
  - On other failure: show error in-dialog (e.g. message and retry).  
  - Dialog closes when result is terminal (success or max attempts).

### 3.6 Remove (Deactivate) Recipient

- **Confirmation**  
  - Remove is offered from card or table (e.g. menu).  
  - Before deactivating, a confirmation dialog is shown with a clear warning and the recipient name.

- **Action**  
  - Confirm triggers amend to set status to INACTIVE (or equivalent “remove” semantics per API).  
  - On success: confirmation dialog closes; a separate “remove result” success dialog may be shown at widget level so it persists after the row/card disappears; cache invalidation; optional callback and event.  
  - On error: error shown in the confirmation dialog with retry/cancel.

### 3.7 Payment and PaymentFlow Integration

- **When client ID is provided**  
  - Widget may show a “Pay” (or equivalent) action per recipient when the recipient is ACTIVE.  
  - Parent may supply a custom renderer for the payment action; otherwise the widget may render a default (e.g. button that opens PaymentFlow).

- **PaymentFlow**  
  - If the widget integrates with PaymentFlow: one shared PaymentFlow instance; opening pay for a recipient sets the payee and opens the flow; optional payment methods, fee display, and transaction-complete callback.  
  - Pay button is hidden for recipients in MICRODEPOSITS_INITIATED (or equivalent) when verification is the primary next step.

- **Disabled pay**  
  - When the recipient is not ACTIVE, the pay action is disabled and a tooltip explains why (e.g. “Verify account first”, “Account inactive”).

### 3.8 Card and Table Behaviour

- **Recipient card (list/card views)**  
  - Shows: display name, masked account number (with optional show/hide full number), account holder type, status badge, supported payment methods, and optionally created date.  
  - Status-based styling: e.g. visual distinction for READY_FOR_VALIDATION, MICRODEPOSITS_INITIATED/PENDING, REJECTED, INACTIVE.  
  - Actions: Pay (if applicable), Verify (if READY_FOR_VALIDATION and type supports it), View details, Edit (if ACTIVE), Remove.  
  - If the recipient is ACTIVE but missing WIRE or RTP routing, an “Add Wire/RTP” (or similar) action may be shown that opens edit.

- **Table view**  
  - Columns: account holder (name + type), account number (with show/hide toggle), status, payment methods, created date, actions.  
  - Actions column: Pay, Verify (when applicable), View details, Edit, Remove (same rules as card).  
  - Server-side pagination: page size selector (e.g. 5, 10, 20, 30, 50), first/prev/next/last, “Showing X–Y of Z”, “Page N of M”.

- **View details**  
  - Opens a read-only detail view (dialog or panel) with: account info (number with show/hide, type, country), payment methods and routing per method, contact info (email, phone, website, address), and optional technical details (IDs, created/updated).  
  - Account validation response (if present) may be shown in a dedicated section.

### 3.9 Status and Alerts

- **Status badge**  
  - Each recipient status (e.g. ACTIVE, PENDING, MICRODEPOSITS_INITIATED, READY_FOR_VALIDATION, REJECTED, INACTIVE) has a consistent label and optional icon/variant for badges.

- **Status alert**  
  - For non-ACTIVE statuses, an alert may show the status message and, for READY_FOR_VALIDATION, an action (e.g. “Verify account”).  
  - ACTIVE recipients do not show a status alert unless custom content is provided.

### 3.10 Error Handling and Known Errors

- **List/load errors**  
  - Display a clear message and a retry action.

- **Form and mutation errors**  
  - Known error codes (e.g. RTP_UNAVAILABLE) are mapped to friendly title, description, and suggestion; unknown errors use a generic server error display with optional “show details”.

- **Consistency**  
  - Same known-error mapping and messaging approach across create, edit, and (where applicable) verification.

### 3.11 Accessibility and UX

- **Dialogs**  
  - Focus management and keyboard support (e.g. focus trap, Escape to close).  
  - Labels and descriptions so screen readers understand purpose and result.

- **Actions**  
  - Buttons and menu items have accessible names (e.g. “Pay”, “Verify account for [name]”, “View details for [name]”).

- **Responsive behaviour**  
  - Layout adapts to container/viewport (e.g. stacked vs inline header, single vs two-column cards, table actions inline vs in menu at different widths).  
  - Table may hide or simplify some controls on small screens (e.g. first/last page buttons).

### 3.12 Callbacks and Events

- **Parent callbacks**  
  - LinkedAccountWidget: onAccountLinked (create/edit/remove outcome), onVerificationComplete (microdeposit result).  
  - RecipientsWidget: onRecipientAdded (create/edit/remove outcome).  
  - Shared (when used): onPaymentComplete (transaction result), and user-event handler for analytics (view, link started/completed, verify started/completed, edit started/completed, remove started/completed).

- **Cache invalidation**  
  - After create, edit, remove, or successful verification, all list (and relevant detail) queries for that recipient type are invalidated so the UI refreshes.

---

## 4. Out of Scope for This Document

- Implementation plan, phases, or technology choices.  
- Code snippets, file structure, or naming.  
- Test strategy or coverage targets (see project testing docs).  
- Design tokens or visual specs (see styling/design docs).
