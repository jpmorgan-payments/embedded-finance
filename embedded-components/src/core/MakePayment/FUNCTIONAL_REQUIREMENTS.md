# MakePayment — Functional Requirements

This document describes **all existing behaviours** of the MakePayment component in functional terms (requirements and principles only). MakePayment is the dialog-based entry point for initiating a payment: trigger button, dialog containing the payment flow (account, payee, method, amount, memo, review, submit), optional preview panel, success and error handling, and optional inline recipient creation. It is intended for future regeneration or reimplementation of the code.

---

## 1. Principles

- **Dialog UX**: The payment flow is presented in a dialog (or drawer). User opens via a trigger (e.g. “Make payment” button); completes or cancels; dialog closes on success (optional), cancel, or close. “Make another payment” resets the form and keeps the dialog open.
- **Reuse of payment flow**: Account selection, payee selection, payment method, amount, memo, review, and submit follow the same business rules as PaymentFlow (see PaymentFlow REQUIREMENTS.md and FUNCTIONAL_REQUIREMENTS.md). MakePayment wraps that flow in a dialog and may add trigger, success screen, and optional preview panel.
- **Client ID from parent**: Authentication and client context are provided by the parent (e.g. provider). The component does not create clients.
- **i18n**: All user-facing strings are localisable. No code snippets in this document.
- **Optional pre-selected recipient**: Parent can pass recipientId to pre-select a payee when the dialog opens. If the recipient is not found (e.g. deleted, or filtered by LIMITED_DDA account), selection is cleared and optionally a warning is shown.
- **No code snippets**: This document states what must hold and what the UI must do, not how to implement it.

---

## 2. Scope: What the Component Covers

- **Trigger**: A button (or custom trigger node) that opens the payment dialog. Default label from i18n (e.g. “Make payment”). Trigger variant and optional icon are configurable.
- **Dialog**: Modal (or drawer) containing the payment flow: source account, payee (existing or manual/new), payment method, amount, memo, review, submit. Steps may be linear or combined in one scrollable form per product.
- **Preview panel**: Optional right-hand panel showing a summary of the payment (account, payee, method, amount) as the user fills the form. Can be turned off (showPreviewPanel false).
- **Recipient mode**: “Existing” (select from list) or “Manual” (enter details for a one-time payee). When manual, user may optionally “Save recipient” so the payee is created via API and then selected for this payment; after creation, flow continues without closing.
- **Success**: After successful submit, show success content (e.g. confirmation, transaction reference). Options: “Make another payment” (reset form, stay in dialog) and “Close” (close dialog). Optional callback onTransactionSettled(response).
- **Error**: On submit error, show error in-dialog (friendly or generic message). User can correct and retry. Optional callback onTransactionSettled(undefined, error).
- **Close**: Cancel or Escape closes the dialog and resets form state so the next open is clean.

---

## 3. Functional Requirements by Area

### 3.1 Trigger and Dialog Open

- **Trigger**: Parent may supply a custom trigger (e.g. button node) or use the default button. Default button shows label (from i18n) and optional icon. Clicking the trigger opens the dialog.
- **Initial state**: When dialog opens, form is in reset state unless pre-selected recipient (and optionally account) are applied. Pre-selected recipient is resolved from API; if not found, show warning and leave payee unselected.

### 3.2 Payment Flow Inside Dialog

- **Steps**: Same as PaymentFlow: select source account, select or add payee, select payment method, enter amount (and optional memo), review, submit. Account list filtered by usability (e.g. OPEN, PENDING_CLOSE); LIMITED_DDA restricts payees to LINKED_ACCOUNT. Payment methods only those supported by selected payee. Balance validation when balance is loaded.
- **Payee sources**: Existing (from recipient list) or Manual. Manual collects party type (individual/organization), name, account/routing, and optionally address for WIRE/RTP. Optional “Save recipient” creates the recipient via API and refetches list; new recipient is then selectable.
- **Preview panel**: When showPreviewPanel is true, a panel (e.g. right side) shows a live summary of selected account, payee, method, and amount. When false, no preview panel.

### 3.3 Inline Recipient Creation (Manual + Save)

- **Manual entry**: User chooses “Pay to someone new” or “Manual” and fills party type, name, account number, routing, account type, and (if required for method) address. For WIRE/RTP, address and method-specific fields are required.
- **Save recipient**: If “Save recipient” is checked, on submit (or on a dedicated “Save and use”) the component creates the recipient via API, then selects the new recipient and continues the payment flow. New recipient appears in list without closing the dialog.
- **Validation**: Same validation as RecipientWidgets bank account form where applicable (account number, routing, required fields per method). Errors shown in-dialog.

### 3.4 Submit and Result

- **Submit**: Build transaction payload (amount, currency, debtorAccountId, recipientId, method, memo, transactionReferenceId). Submit via API. While submitting, disable submit and show loading state.
- **Success**: Show success view (e.g. “Payment sent”, transaction reference). Buttons: “Make another payment” (reset form, stay in dialog) and “Close” (close dialog). Call onTransactionSettled(response) if provided.
- **Error**: Show error message (known codes friendly, others generic with optional details). User can edit and retry. Call onTransactionSettled(undefined, error) if provided. Do not close dialog unless user closes it.

### 3.5 Close and Reset

- **Close**: User can close the dialog via Cancel, Escape, or overlay click (when allowed). On close, form state and result state are reset so the next open starts clean.
- **Make another payment**: Resets form and result; user remains in the dialog to start a new payment.

### 3.6 Configuration and Callbacks

- **paymentMethods**: List of payment method options (id, name, optional fee, description). Default ACH, RTP, WIRE.
- **recipientId**: Optional initial payee to pre-select. Resolved when dialog opens; if not found, cleared and optionally warning shown.
- **onTransactionSettled(response?, error?)**: Optional callback when submit settles (success or error).
- **userEventsHandler / userEventsLifecycle**: Optional; payment completed and payment failed events are reported when handler is provided.

### 3.7 Error Handling

- **Account/recipient load failure**: Same as PaymentFlow; show message and optionally retry. Pre-selected recipient not found: clear selection and optional warning.
- **Transaction failure**: Show in-dialog error; allow retry. Same known-error mapping as PaymentFlow.

### 3.8 Accessibility and UX

- **Dialog**: Focus trap, Escape to close, accessible title and description. Focus returns to trigger on close when appropriate.
- **Trigger**: Button has accessible name (e.g. “Make payment”).

---

## 4. Relationship to PaymentFlow

- PaymentFlow defines the inline flow steps, account/payee/method/amount rules, validation, and API behaviour. MakePayment reuses that flow (or the same logic) inside a dialog and adds trigger, preview panel, success/close UX, and optional manual/save-recipient flow.
- Where PaymentFlow REQUIREMENTS.md or FUNCTIONAL_REQUIREMENTS.md define a rule (e.g. LIMITED_DDA, balance validation, state reset), MakePayment adheres to it within the dialog context.

---

## 5. Out of Scope for This Document

- Implementation plan, phases, or technology choices.
- Code snippets, file structure, or naming.
- Test strategy or coverage targets (see project testing docs).
- Design tokens or visual specs (see styling/design docs).
- Full API request/response schemas (see PaymentFlow REQUIREMENTS.md and API documentation).
