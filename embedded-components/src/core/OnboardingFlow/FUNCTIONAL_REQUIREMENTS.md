# OnboardingFlow — Functional Requirements

This document describes **all existing behaviours** of the OnboardingFlow component in functional terms (requirements and principles only). It is intended for future regeneration or reimplementation of the code.

---

## 1. Principles

- **Client-centric**: The flow is driven by a client ID (e.g. initial client ID from parent). Client data is fetched via GET client; the flow may create or update client and parties via API. Parent may provide callback when client fetch settles (success, pending, error).
- **Configurable flow**: Screens and sections are defined in a flow config (gateway, overview, section screens, steppers, document upload, review). Organization type (from existing client data) determines entry point (e.g. gateway vs overview).
- **Doc-upload-only mode**: When enabled, the flow can be restricted to document upload only (e.g. upload-documents section as entry); other sections are not reachable.
- **i18n**: All user-facing strings use the onboarding i18n namespaces (e.g. onboarding-overview). No code snippets in this document.
- **User journey events**: Screen navigation and key actions are emit points for analytics when the parent supplies a handler.
- **Exit warning**: Optional before-unload warning when user tries to leave the page (configurable via alertOnExit).
- **No code snippets**: This document states what must hold and what the UI must do, not how to implement it.

---

## 2. Scope: What the Component Covers

- **Gateway**: Initial screen to select organization type (or equivalent) when client has no organization type. Required before proceeding to overview/sections.
- **Overview**: High-level progress or landing when client already has organization type (e.g. returning user).
- **Section screens**: Multi-step sections (e.g. business identity, owners, operational details, document upload, review and attest). Each section may be a stepper (multiple steps) or a single component screen.
- **Stepper**: Within a section, steps (e.g. personal details, identity document, contact details, check answers). Progress and validation per step; navigation between steps and sections.
- **Document upload**: Upload documents (e.g. with file size limit, types). May be a dedicated section or doc-upload-only entry.
- **Review and attest**: Review collected data and accept terms; submit when valid.
- **Sidebar (optional)**: Timeline/sidebar showing section and step progress when enabled; click to navigate. Disabled when form is submitting.
- **Loading and error**: Initial client fetch loading state; client fetch error shown at root. No flow content until client is resolved (or doc-upload-only with minimal client dependency).

---

## 3. Functional Requirements by Area

### 3.1 Entry and Client Data

- **Initial client ID**: Parent provides optional initial client ID. When set, client data is fetched. When not set, behaviour is product-defined (e.g. show gateway or error).
- **Client fetch**: GET client when client ID and interceptor are ready. Refetch on window focus and optionally on interval. On success, organization type and existing parties drive flow state.
- **onGetClientSettled**: When provided, parent is notified with client data, status (success/pending/error), and error so it can sync external state.
- **Entry screen**: If doc-upload-only mode, entry is document-upload section. Else if client has organization type, entry is overview; else entry is gateway. User must complete gateway (select organization type) before reaching overview/sections unless organization type is already set.

### 3.2 Gateway and Overview

- **Gateway**: User selects organization type (from configurable list). Selection is persisted (e.g. to client/session). On continue, flow navigates to overview or next section per config.
- **Overview**: Shows when client already has organization type. May show progress summary and links to sections. Navigation to sections follows flow config.

### 3.3 Sections and Steppers

- **Sections**: Ordered list of sections from flow config. Each section is either a single component screen or a stepper with multiple steps (e.g. form, form, check-answers).
- **Navigation**: User can move to a section from overview or sidebar. Within a stepper, user can move between steps. Next/back and step list (e.g. timeline) respect validation: may block next until current step is valid or allow free navigation per product.
- **Stepper validation**: Each step may have validation (e.g. form valid). Step status (not_started, completed, on_hold) is derived from validation and config. First invalid step may be auto-focused when entering a section.
- **Scroll**: On step/screen change, scroll to top of main content so user sees the new screen.
- **Unknown screen**: If current screen ID is not in config, show an error message (e.g. unknown screen id). Unhandled screen type shows a generic error.

### 3.4 Forms and Data Persistence

- **Form values**: Form values are stored in flow session/context. Saved values are used to compute section/step completion and to prefill when returning to a step.
- **Submit**: Section or step submit (e.g. POST client, POST party, POST verifications) follows API contract. On success, session and client data are updated; flow may move to next step/section or show success. On error, show in-form or inline error and allow retry.
- **Document upload**: Files are subject to max file size (configurable). Upload UX and API contract are as per product/API. Doc-upload-only mode restricts flow to this section.

### 3.5 Sidebar / Timeline

- **Visibility**: When enableSidebar is true and viewport is not mobile, show a sidebar (e.g. timeline) with section list and per-section steps. When form is submitting, sidebar interaction may be disabled.
- **Progress**: Section and step status (completed, not_started, on_hold) are derived from session and validation. Timeline reflects current section and step.
- **Click section**: Navigate to that section; if stepper, go to first invalid step or last step. If already on that section, may move to first invalid step within section.
- **Click step**: If same section, navigate to that step; if different section, navigate to that section (and optionally that step).

### 3.6 Redirects and Guards

- **No organization type**: If not doc-upload-only and client has no organization type, redirect to gateway (and reset history) when user is elsewhere.
- **Doc-upload-only**: If doc-upload-only and user is not on document-upload screen, redirect to document-upload section.

### 3.7 Loading and Error

- **Client loading**: When client ID is set and client is pending and not doc-upload-only, show a loading state (e.g. message from i18n). No flow content until client fetch settles.
- **Client error**: When client fetch fails, show a server error alert (or equivalent) at root. No flow content.
- **Height**: Optional min height style so layout is stable.

### 3.8 Accessibility and UX

- **Focus**: Focus management on screen/step change (e.g. scroll to top, focus first focusable or heading).
- **Keyboard**: Navigation and form submission are keyboard-accessible. Dialogs (if any) trap focus and close on Escape.

### 3.9 Callbacks and Events

- **onGetClientSettled**: Notify parent when client fetch settles.
- **onPostClientSettled, onPostPartySettled, onPostClientVerificationsSettled**: Optional callbacks when respective API calls settle (success or error).
- **User events**: Screen navigation (and optionally step/section actions) are reported when parent supplies handler.
- **beforeunload**: When alertOnExit is true, show browser leave warning to reduce accidental loss of progress.

### 3.10 Configuration

- **availableProducts, availableJurisdictions, availableOrganizationTypes**: Drive gateway and form options.
- **docUploadOnlyMode, docUploadMaxFileSizeBytes, hideLinkAccountSection, enableSidebar**: Behaviour toggles and limits as described above.

---

## 4. Out of Scope for This Document

- Implementation plan, phases, or technology choices.
- Code snippets, file structure, or naming.
- Test strategy or coverage targets (see project testing docs).
- Design tokens or visual specs (see styling/design docs).
- Full API request/response schemas (see API/OpenAPI documentation).
- Exact field lists and validation rules for each form (see form specs or API).
