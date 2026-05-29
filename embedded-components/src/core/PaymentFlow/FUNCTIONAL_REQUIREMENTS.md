# PaymentFlow — Functional Requirements (UI and Flow Behaviour)

This document describes **all existing behaviours** of the PaymentFlow component in functional terms (requirements and principles only). It focuses on UI, flow steps, and user-visible behaviour. Business rules, API contracts, and validation details are in **REQUIREMENTS.md**; this document references them where needed and does not duplicate code or schemas.

---

## 1. Principles

- **Inline flow**: The component renders a linear (or stepped) payment flow: select source account, select or add payee, select payment method, enter amount (and optional memo), review, submit. It may be used as a full-page flow or inside a dialog/panel.
- **API as source of truth**: Account list, balances, recipients, payment method availability, and transaction creation follow the API. LIMITED_DDA accounts only pay to LINKED_ACCOUNT; payment methods are per-recipient; balance validation uses available balance when loaded. See REQUIREMENTS.md for full rules.
- **Client ID from parent**: Authentication and API base URL (and client context) are provided by the parent (e.g. provider). The flow does not create clients.
- **i18n**: All user-facing strings are localisable. No code snippets in this document.
- **State reset**: When the flow is closed and reopened, or user chooses “Make another payment”, form and result state are reset so the next use starts fresh.
- **No code snippets**: This document states what must hold and what the UI must do, not how to implement it.

---

## 2. Scope: What the Component Covers

- **Flow steps**: Source account selection; payee selection (recipient or linked account, with optional inline “add recipient” or “enable payment method”); payment method selection; amount (and optional memo); review panel; submit.
- **Account selector**: List or dropdown of usable accounts (OPEN or PENDING_CLOSE). Balance shown per account when loaded; loading/error state per account. When only one account, it may be auto-selected.
- **Payee selector**: List or dropdown of payees (RECIPIENT and LINKED_ACCOUNT). Filtering by selected account when LIMITED_DDA (only LINKED_ACCOUNT). Optional pre-selected payee (e.g. recipientId); if not found, clear selection and optionally show message.
- **Payment method selector**: Only methods enabled for the selected payee. When payee changes and current method is not supported by new payee, clear method selection.
- **Amount and memo**: Amount input (positive, decimal); optional memo. Balance validation when balance is loaded: warn or block when amount exceeds available balance (see REQUIREMENTS.md); backend performs final check.
- **Review panel**: Summary of account, payee, method, amount, fee (if any), memo. User confirms and submits.
- **Inline add recipient**: If supported, user can add a new recipient from within the flow; after success, new recipient is available for selection without closing the flow. Optional “enable payment method” for existing recipient (collect extra fields, PATCH recipient).
- **Success and error**: After submit, show success (e.g. confirmation, transaction reference) or error (friendly message from known codes, generic plus details otherwise). “Make another payment” resets form; close exits flow.
- **Ref or callbacks**: Optional ref or callbacks for reset, or for parent to open/close the flow.

---

## 3. Functional Requirements by Area

### 3.1 Data Loading and Dependencies

- **Accounts**: Fetched when flow is used and client/interceptor is ready. Only OPEN and PENDING_CLOSE shown. Filter LIMITED_DDA to LINKED_ACCOUNT-only when that rule applies (see REQUIREMENTS.md).
- **Recipients**: Fetched (RECIPIENT and LINKED_ACCOUNT as needed). Only ACTIVE shown. Pagination or infinite list when supported.
- **Balances**: Fetched per account when account is selected (or for all visible accounts). Loading and error states shown; validation only when balance is loaded successfully.
- **Pre-selected payee/account**: When initial payee or account ID is provided, validate against fetched data. If not found, clear selection and optionally show a short message.

### 3.2 Source Account Step

- **Display**: List or dropdown of accounts with label, last-four or masked number, and balance (when loaded). Disabled or hidden when not usable (e.g. CLOSED).
- **Selection**: User selects one account. Single account may be auto-selected. When selection changes, clear payee if new account is LIMITED_DDA and current payee is RECIPIENT; clear payment method if method is not supported for new account.
- **Balance**: Show available balance; loading/error state. Do not validate amount against balance until balance is loaded.

### 3.3 Payee Step

- **Display**: Payees grouped or labeled by type (RECIPIENT vs LINKED_ACCOUNT). Show name and optional masked account. When LIMITED_DDA account is selected, only LINKED_ACCOUNT payees are shown (or RECIPIENT disabled with tooltip).
- **Selection**: User selects one payee. When selection changes, clear payment method if current method is not supported for new payee.
- **Add recipient**: If “Add recipient” (or “Pay to someone new”) is offered, opening it may show a form or open RecipientWidgets create flow. On success, new recipient appears in list and can be selected; flow does not close.
- **Enable payment method**: If payee is selected but does not support the desired method, “Enable WIRE/RTP” (or similar) may open a form to add routing/address; on success, method becomes available for that payee.

### 3.4 Payment Method Step

- **Display**: Only methods that the selected payee supports (from routing information). Optional fee and estimated delivery per method.
- **Selection**: User selects one method. If payee changes and current method is not supported, selection is cleared.
- **Persistence**: When payee changes to one that supports the current method, keep method selected.

### 3.5 Amount and Memo Step

- **Amount**: Required; positive number; decimal allowed (e.g. two decimal places for USD). Non-numeric input prevented. When balance is loaded and amount exceeds available balance, show message and optionally block submit (see REQUIREMENTS.md).
- **Memo**: Optional text; may have max length.
- **Fee**: If fee is shown for the selected method, display it and optionally total (amount + fee).

### 3.6 Review and Submit

- **Review panel**: Shows source account, payee, payment method, amount, currency, fee (if any), memo. User can go back to edit or confirm.
- **Submit**: On confirm, build transaction payload (amount, currency, debtorAccountId, recipientId, method, memo, transactionReferenceId). Submit via API. Disable submit while request is in progress.
- **Transaction reference ID**: Unique per transaction (e.g. max 35 chars); generated by client or as per API.

### 3.7 Success and Error After Submit

- **Success**: Show confirmation with transaction reference and status. Options: “Make another payment” (reset form, stay in flow) and “Close” (or “Done”) to exit.
- **Error**: Show error message. Known codes (e.g. 10104) map to friendly title and message; others use generic message with optional “Show details”. User can dismiss and correct inputs, then retry. Error is cleared on next submit attempt or when flow is closed.

### 3.8 State Reset

- **When**: On flow close and reopen; on “Make another payment”. Clear: account, payee, method, amount, memo, validation errors, transaction result/error.
- **What**: Form selections and result state are reset so the next payment starts from a clean state.

### 3.9 Error Handling (UI)

- **Account/recipient fetch failure**: Fatal or partial per REQUIREMENTS.md; show message and optionally retry. No partial list when account fetch fails.
- **Balance fetch failure**: Non-fatal; do not block flow; skip balance validation.
- **Transaction failure**: Recoverable; show error, allow edit and retry. Dismissible; cleared on retry or close.

### 3.10 Accessibility and UX

- **Steps**: Clear headings and labels; focus management when moving between steps.
- **Keyboard**: All controls keyboard-accessible; dialogs (if any) trap focus and close on Escape.
- **Responsive**: Layout adapts to container; review may stack on small screens.

### 3.11 Callbacks and Ref

- **onTransactionSettled(response, error)**: Optional callback when submit settles (success or error).
- **Ref**: Optional ref with reset() or similar so parent can reset the flow without closing.

---

## 4. Relationship to REQUIREMENTS.md

- **REQUIREMENTS.md** defines: API endpoints, data contracts, account and recipient rules, payment method availability, amount and balance rules, validation rules, transaction submission payload, error handling rules, and state reset rules.
- **This document** defines: flow steps, UI behaviour, what the user sees and can do, and how success/error and reset behave. Where a rule affects the UI (e.g. LIMITED_DDA → only LINKED_ACCOUNT), both documents align.

---

## 5. Out of Scope for This Document

- Implementation plan, phases, or technology choices.
- Code snippets, file structure, or naming.
- Test strategy or coverage targets (see project testing docs).
- Design tokens or visual specs (see styling/design docs).
- Full API request/response schemas (see REQUIREMENTS.md and API/OpenAPI documentation).
