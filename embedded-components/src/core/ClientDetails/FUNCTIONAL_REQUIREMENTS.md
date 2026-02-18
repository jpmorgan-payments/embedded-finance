# ClientDetails — Functional Requirements

This document describes **all existing behaviours** of the ClientDetails component in functional terms (requirements and principles only). It is intended for future regeneration or reimplementation of the code.

---

## 1. Principles

- **Client ID required**: The component requires a client ID to fetch and display client data (e.g. GET /clients/:id). When client ID is missing, a clear message is shown (e.g. “Client ID is required”) and no fetch is performed.
- **Read-only display**: The component displays client data from the API; it does not create or update clients. Edits or actions are out of scope unless provided via custom actions.
- **View modes**: Three display modes are supported: summary (compact card with section navigation and optional drill-down), accordion (sections in collapsible panels), and cards (same information in card layout). Mode is selected by the parent via prop.
- **Sections configurable**: The parent chooses which sections to show (e.g. identity, verification, ownership, compliance, accounts, activity). Summary mode uses this list for navigation and drill-down; accordion/cards show the same section set.
- **No code snippets**: This document states what must hold and what the UI must do, not how to implement it.

---

## 2. Scope: What the Component Covers

- **Summary mode**: Compact summary card with quick stats, section list with status/labels, optional custom actions in the footer, and optional drill-down (sheet or panel) when a section is clicked.
- **Accordion mode**: Full-width header with title; content area with accordion panels per section.
- **Cards mode**: Full-width header with title; content area with visual cards per section.
- **Section content**: Identity & Organization, Verification (e.g. KYC status), Ownership (controller and beneficial owners), Compliance (e.g. pending docs/questions, question responses), Accounts (link to view linked accounts), Recent Activity (link to view transactions). Exact fields and grouping follow the API and product spec.
- **Drill-down**: In summary mode, when drill-down is enabled and no external section click handler is provided, clicking a section opens a sheet (or panel) with that section’s detail and navigation between sections.

---

## 3. Functional Requirements by Area

### 3.1 Data Loading and States

- **Fetch**: Client data is fetched when client ID is set. No fetch when client ID is missing.
- **Loading state**: While loading, show a skeleton consistent with the chosen view mode (e.g. title placeholder and content placeholders).
- **Error state**: On fetch error, show an error message (e.g. from error.message or a generic “Failed to load client details”). No retry is required unless specified elsewhere.
- **No client ID**: When client ID is not provided, show a bordered, muted area with the message that client ID is required.

### 3.2 Summary Mode

- **Summary card**: Displays a compact overview: client/org name, key stats or labels per section (e.g. identity, verification, ownership, compliance, accounts, activity). Each section has a label, optional status (complete, pending, warning), optional badge (e.g. count), and optional description.
- **Section click**: When the user clicks a section, either call the parent’s `onSectionClick(section)` if provided, or (if `enableDrillDown` is true) open the built-in drill-down for that section.
- **Actions**: Optional `actions` node is rendered in the summary card footer (e.g. primary button). No built-in edit/submit unless provided via actions.
- **Drill-down**: When drill-down is enabled and no `onSectionClick` is provided, a sheet (or panel) opens with the selected section’s full content and navigation to other sections. Closing the sheet returns to the summary. Section content in the sheet matches the data shown in accordion/cards for that section.

### 3.3 Accordion and Cards Modes

- **Header**: A header shows the configured title (e.g. “Client details”). No section list in the header.
- **Accordion**: Sections are rendered as collapsible panels. Each panel has a header (section label and optional status/badge) and body (section content). Expand/collapse is per panel.
- **Cards**: Sections are rendered as separate cards. Each card has a title and content. No expand/collapse.
- **Section content**: Identity shows organization (and related) details; Verification shows KYC/verification status; Ownership shows controller and beneficial owners with counts/labels; Compliance shows outstanding docs/questions and question responses; Accounts and Activity show links or placeholders as defined by product.

### 3.4 Section Metadata and Status

- **Status**: Sections may show status: complete, pending, or warning, derived from client data (e.g. org present, KYC approved, owners present, outstanding items).
- **Badges**: Counts or “pending” labels may appear on section headers (e.g. number of owners, number of pending docs/questions).
- **Icons**: Each section may have an icon for consistency with the rest of the app.

### 3.5 Error Handling

- **Fetch error**: Single error message; no partial content. Message may be generic or from the error object when safe.
- **Missing client**: Treated as validation: show “Client ID is required” and do not call the API.

### 3.6 Accessibility and UX

- **Headings**: Summary and full views use a logical heading (e.g. h1 for main title). Section titles use appropriate levels.
- **Navigation**: Drill-down and accordion are keyboard-accessible (focus, escape to close sheet, expand/collapse with keyboard).

### 3.7 Callbacks and Configuration

- **onSectionClick**: When provided, section clicks are delegated to the parent; no built-in drill-down. When not provided and drill-down is enabled, built-in sheet is used.
- **sections**: List of section IDs to show; sections not in the list are hidden.
- **enableDrillDown**: When true and no `onSectionClick`, section click opens the drill-down sheet.
- **title, className, actions**: Configurable title, root class, and footer actions.

---

## 4. Out of Scope for This Document

- Implementation plan, phases, or technology choices.
- Code snippets, file structure, or naming.
- Test strategy or coverage targets (see project testing docs).
- Design tokens or visual specs (see styling/design docs).
- API request/response schemas (see API/OpenAPI documentation).
- Behaviour of linked “Accounts” or “Activity” when the user navigates (handled by parent or routing).
