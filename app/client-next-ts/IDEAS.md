# JPM Embedded Payments — Adoption Accelerator Tools

## Requirements Specification

**Product:** J.P. Morgan Embedded Payments API Developer Tools  
**Portal:** https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments  
**Date:** April 2026  
**Status:** Draft  

---

## Executive Summary

This document specifies requirements for 8 client-side interactive web applications designed to reduce time-to-value and improve developer adoption of the J.P. Morgan Embedded Payments (EP) API product. Each tool targets a specific adoption bottleneck identified through analysis of the EP documentation surface, existing open-source showcase (github.com/jpmorgan-payments/embedded-finance), the NPM component library (@jpmorgan-payments/embedded-finance-components), the validation SDK (@jpmorgan-payments/embedded-finance-sdk), and the broader Payments Developer Portal.

All tools are designed to run entirely client-side with no backend dependencies, using embedded mock data derived from the EP OpenAPI specification and documented sample payloads. This enables zero-friction access — developers can explore without authentication, certificates, or sandbox provisioning.

### Key Adoption Bottlenecks Identified

1. **API Choreography Opacity** — The EP lifecycle spans 5 resource types across 15+ endpoints. Developers must read multiple doc sections to understand the call sequence from client onboarding through payout. The existing SellSense demo showcases UI components but not the underlying API mechanics.

2. **Authentication Complexity** — The mTLS + JWS digital signature authentication chain is the #1 cause of first-hour developer abandonment. Sample code exists in Python/Java/Go/Node but no interactive tool explains what happens at each step.

3. **Onboarding Payload Density** — The POST /clients body is one of the most complex payloads in the entire JPM API surface, with nested parties, organization details, addresses, documents, attestations, and country-specific conditional fields. The onboarding reference table documents 100+ fields across multiple nested objects.

4. **Pathway Ambiguity** — Two main EP integration pathways exist (Embedded Payments with accounts vs. Direct Payouts without onboarding) plus the broader Embedded Finance suite (Digital Onboarding, Validation Services, Accounts v2 beta). No tool currently maps platform type to recommended API combination.

5. **Money Movement Topology Confusion** — The account type hierarchy (Processing Account, Management Account, Limited DDA, Treasury Account, Linked External Account) and allowed transfer paths between them are documented in text but not visualized interactively.

### Recommended Build Phases

| Phase | Timeline | Tools | Rationale |
|-------|----------|-------|-----------|
| Phase 1 — Quick Wins | 1–2 weeks | Integration Pathway Advisor, API Response Explorer, Compliance Checklist | Low effort, immediate value. Answers "which APIs do I need?" and "what do responses look like?" before developers write a line of code. |
| Phase 2 — Core Enablers | 3–4 weeks | KYC Onboarding Form Builder, mTLS + JWS Auth Debugger | Tackles the two biggest blockers: complex onboarding payloads and authentication setup. Directly reduces the "first successful API call" time from days to hours. |
| Phase 3 — Deep Understanding | 4–6 weeks | EP Flow Simulator, Money Movement Sandbox, Webhook Notification Playground | Comprehensive interactive learning tools for the full API lifecycle. Converts documentation readers into confident integrators. |

---

## Tool 1: Embedded Payments Flow Simulator

**Category:** Understanding  
**Effort:** High  
**Impact:** Critical  
**Priority:** Phase 3  

### Problem Statement

The biggest adoption blocker: developers read 15+ doc pages before understanding how `/clients` → `/accounts` → `/recipients` → `/transactions` chain together. The existing SellSense demo shows UI but not the API choreography underneath. There is no interactive tool that visualizes the full EP lifecycle as a connected state machine with real payloads at each transition.

### Description

A fully client-side visual state machine that lets developers walk through every API call in the Embedded Payments lifecycle — from client onboarding through account creation, recipient linking, fund transfers, and payouts. Each state transition shows the exact HTTP method, endpoint, request/response payloads, and status transitions.

### Functional Requirements

#### FR-1.1: Flow Graph Visualization
- Render an animated directed graph with nodes for each API resource: Clients, Parties, Accounts, Recipients, Transactions.
- Edges represent state transitions and API calls between resources.
- Nodes display the current status (e.g., Client: CREATED → SUBMITTED → REVIEW → APPROVED).
- Active edges animate to show progression through the lifecycle.
- Graph layout adapts responsively to viewport size.

#### FR-1.2: Payload Inspection
- Clicking any node opens a detail panel showing the exact HTTP method, endpoint URL, and full request/response JSON payload.
- Payloads are derived from the EP OpenAPI spec and documented sample responses.
- Payloads are editable in-browser — developers can modify fields and see how the response structure changes.
- Syntax highlighting and collapsible JSON tree view for nested objects.

#### FR-1.3: Pathway Toggle
- Toggle between two EP integration pathways side-by-side:
  - **With Accounts:** Full onboarding → account creation → recipient linking → transfer → payout.
  - **Direct Payouts:** Recipient creation → payout (without client onboarding or account creation).
- Visual diff highlighting shows which steps are shared vs. pathway-specific.

#### FR-1.4: Error Injection
- Toggle to inject error responses at any step: 400 (bad request), 409 (conflict), 422 (validation failure).
- Display the error response payload and annotate recovery paths (e.g., "re-submit with corrected partyId").
- Show which fields in the request typically cause each error type.

#### FR-1.5: Export
- Export the current flow as a Mermaid sequence diagram for architecture documentation.
- Export as a PNG/SVG image of the graph.
- Copy individual payloads as cURL, Bruno, or Postman snippets.

### Mock Data Requirements

| Step | Endpoint | Response |
|------|----------|----------|
| Create client | `POST /clients` (Digital Onboarding API) | 201 — client created, status: CREATED |
| Add party | `POST /parties` | 201 — party created (link to client via request body / roles) |
| Attestations & diligence | `PATCH /clients/{id}` — body includes `addAttestations`, `questionResponses`, etc. | 200 — client updated (no separate `/attestations` route in OAS) |
| Submit for review | `PATCH /clients/{id}` | 200 — status advances per workflow |
| Create account | `POST /accounts` (Embedded API v1) | 201 — LIMITED_DDA created |
| Add recipient | `POST /recipients` | 201 — linked account, verification: PENDING |
| Transfer funds | `POST /transactions` (Embedded API v2) | 201 — type: TRANSFER, Processing → Limited DDA |
| Execute payout | `POST /transactions` | 201 — type: PAYOUT, Limited DDA → Linked Account |

### Technical Approach

- React + D3.js (or equivalent) for the directed graph rendering.
- All state managed client-side via React state/context.
- Mock payloads embedded as static JSON modules.
- No network requests required.

---

## Tool 2: KYC Onboarding Form Builder

**Category:** Integration  
**Effort:** Medium  
**Impact:** High  
**Priority:** Phase 2  

### Problem Statement

The POST /clients body is one of the most complex payloads in the EP API — nested parties, organization details, addresses, documents, attestations, questions. JPM's existing @jpmorgan-payments/embedded-finance-sdk handles field validation but the onboarding reference table documents 100+ fields across multiple nested objects. Developers waste days mapping which fields are required for which business types (LLC vs. Sole Proprietor vs. Corporation vs. Publicly Traded Company).

### Description

A visual, step-by-step form builder that constructs the JSON payload in real-time as the developer fills in fields, with inline validation against the SDK rules. The form dynamically adapts its required fields based on the selected business type and country.

### Functional Requirements

#### FR-2.1: Business Type Selector
- Present a selector for business entity types: LLC, Sole Proprietor, Corporation, Partnership, Publicly Traded Company.
- Selecting a type dynamically shows/hides required and optional fields across all form sections.
- Display a badge on each field indicating whether it is required, optional, or conditional for the selected type.

#### FR-2.2: Live JSON Preview
- A split-pane layout with form inputs on the left and a live JSON preview on the right.
- The JSON preview builds the `POST /clients` payload in real-time as fields are filled.
- JSON is syntax-highlighted with collapsible sections for nested objects (organization, parties[], addresses[]).
- Invalid or missing required fields are highlighted in red in both the form and the JSON preview.

#### FR-2.3: Country-Specific Field Rules
- Leverage the conditional logic engine from @jpmorgan-payments/embedded-finance-sdk.
- When a country is selected, dynamically adjust which fields are required (e.g., tax identification formats, address structures, document types).
- Display inline help text explaining country-specific requirements.

#### FR-2.4: Test Persona Pre-Loading
- Pre-loaded test personas from JPM's documented test data:
  - **Fairy Tale Book Shop** — LLC persona
  - Additional personas for Sole Proprietor, Corporation, and Publicly Traded Company.
- One-click loading populates all form fields with valid test data for the selected persona.
- Persona data sourced from the EP core concepts documentation.

#### FR-2.5: Payload Export
- Copy the generated JSON payload to clipboard.
- Export as a cURL command targeting the mock API endpoint (`https://api-mock.payments.jpmorgan.com/tsapi/ef/v2/clients`).
- Export as a Bruno request file or Postman collection item.
- Export as code snippets in Python, Node.js, Java, and Go.

#### FR-2.6: Minimum Viable Payload Diff
- Side-by-side diff view comparing the developer's current payload against the minimum required payload for approval.
- Highlight missing required fields and extra optional fields.
- Provide a "strip to minimum" button that removes all optional fields.

### Mock Data Requirements

- Schema derived from the Digital Onboarding OpenAPI spec for `POST /clients` and `POST /parties`.
- Validation rules from @jpmorgan-payments/embedded-finance-sdk.
- Test persona data from EP core concepts documentation (Fairy Tale Book Shop LLC and additional personas).
- Field metadata: required/optional/conditional status per business type and country.

### Technical Approach

- React with controlled form components.
- Leverage @jpmorgan-payments/embedded-finance-sdk validation rules (bundled client-side or replicated).
- JSON diff library for the minimum viable payload comparison.
- No network requests — all validation and schema data embedded.

---

## Tool 3: Money Movement Topology Sandbox

**Category:** Understanding  
**Effort:** High  
**Impact:** High  
**Priority:** Phase 3  

### Problem Statement

The account topology is the second-biggest confusion point. Developers struggle with: which account types they receive, which transfers are allowed between which accounts, what happens with negative balances, and how the Processing → Limited DDA → External payout chain works. Documentation explains this in text; no tool shows it interactively.

### Description

An interactive canvas where developers drag account nodes onto a board, wire them together, and simulate fund transfers and payouts. Balances update in real-time with animated money flow particles showing the direction and amount of each transfer.

### Functional Requirements

#### FR-3.1: Account Node Palette
- Draggable account type nodes available from a sidebar palette:
  - **Processing Account** — platform-level, accepts funds from merchant acquirers.
  - **Management Account** — platform-level, for commissions and platform fees.
  - **Limited DDA** — client-level, limited access demand deposit account.
  - **Treasury Account** — platform-level, for funding other accounts.
  - **Linked External Account** — client's external bank account for payouts.
- Each node displays: account type label, account ID, routing number (JPM routing numbers from docs), and current balance.

#### FR-3.2: Wiring and Connection Rules
- Drag connections between account nodes to represent allowed transfer paths.
- Enforce transfer path constraints:
  - Processing → Limited DDA: allowed (fund client account).
  - Processing → Management: allowed (platform fee allocation).
  - Limited DDA → Linked External: allowed (payout).
  - Treasury → Processing: allowed (funding).
  - Treasury → Limited DDA: allowed (direct funding).
  - External → External: blocked (show constraint indicator).
  - Limited DDA → Processing: blocked without specific configuration.
- Invalid connections show a red indicator with an explanation of why the path is not allowed.

#### FR-3.3: Transaction Simulation
- Transaction panel for creating simulated transactions:
  - **TRANSFER** — move funds between internal accounts (e.g., Processing → Limited DDA).
  - **PAYOUT** — move funds from Limited DDA to Linked External Account.
  - **DIRECT_DEBIT** — pull funds from an external account (where configured).
- Specify amount and see balances update across affected accounts.
- Animated particle flow along the connection wire showing money movement direction and amount.

#### FR-3.4: Balance and State Management
- Real-time balance updates on all affected account nodes after each transaction.
- Transaction status lifecycle simulation: PENDING → POSTED → COMPLETED.
- ACH timing simulation: configurable delay (e.g., 1-3 business days for payout settlement).
- Pending transactions shown as a separate "pending" balance on the account node.

#### FR-3.5: Negative Balance Handling
- Simulate scenarios where a Limited DDA goes negative (e.g., fee deduction before funding).
- Demonstrate management account sweep mechanics.
- Show the `POST /transactions` payload for balance recovery.
- Visual indicator (red glow) on accounts with negative balances.

#### FR-3.6: Scenario Presets
- Pre-built scenario presets:
  - **Basic Payout Flow** — Processing → Limited DDA → External.
  - **Platform Fee Split** — Processing → Management + Limited DDA → External.
  - **Negative Balance Recovery** — Limited DDA goes negative → Treasury funds it → Payout.
- One-click loading of each scenario with pre-positioned nodes and pre-funded balances.

### Mock Data Requirements

| Endpoint | Simulated Behavior |
|----------|-------------------|
| `POST /transactions` (type: TRANSFER) | Balance deducted from source, credited to destination |
| `POST /transactions` (type: PAYOUT) | Balance deducted from Limited DDA, status: PENDING → POSTED |
| `GET /accounts/{id}/balance` | Returns simulated balance response with available/pending breakdown |
| `POST /transactions` (type: DIRECT_DEBIT) | Pull from external, credit to internal, negative balance scenario |

### Technical Approach

- React + Canvas or SVG for the interactive board.
- Drag-and-drop library (e.g., react-dnd or native HTML5 drag).
- Particle animation system for money flow visualization.
- All state managed client-side.

---

## Tool 4: mTLS + JWS Auth Debugger

**Category:** Integration  
**Effort:** Medium  
**Impact:** High  
**Priority:** Phase 2  

### Problem Statement

The mTLS + JWS digital signature authentication chain is the #1 reason developers get stuck in the first hour of integration. JPM provides sample authentication code in Python, Java, Go, and Node.js (github.com/jpmorgan-payments), but no interactive tool explains what happens at each step. Developers debugging 401/403 errors have no way to determine if the issue is in the OAuth token request, the mTLS handshake, or the JWS signature construction.

### Description

A client-side tool that walks through the entire authentication chain step-by-step: OAuth 2.0 client_credentials flow → mTLS certificate exchange → JWS digital signature generation. Developers can inspect how each header and signature component is constructed, with interactive breakdowns and common error diagnosis.

### Functional Requirements

#### FR-4.1: OAuth 2.0 Flow Walkthrough
- Step-by-step visualization of the OAuth 2.0 client_credentials grant:
  1. Construct the token request (client_id, client_secret, grant_type).
  2. Show the POST to the token endpoint with annotated headers.
  3. Display the token response with access_token, token_type, expires_in.
  4. Explain how to attach the token as a Bearer header on subsequent API calls.
- Each step shows the exact HTTP request and response with field-level annotations.

#### FR-4.2: JWS Signing Visualizer
- Interactive JWS compact serialization builder:
  1. **Header** — show the algorithm (RS256), key ID (kid), and other JOSE header fields.
  2. **Payload** — paste or auto-generate a sample API request body.
  3. **Signature** — demonstrate how Base64URL(Header) + "." + Base64URL(Payload) is signed.
- Live construction showing `Header.Payload.Signature` format as each component is built.
- Use the Web Crypto API to demonstrate the signing process with a demo key pair (not real credentials).
- Explain each `x-jpm-*` header that must be included.

#### FR-4.3: Certificate Inspector
- Upload a `.crt` or `.pem` file and parse/display the X.509 certificate fields:
  - Subject, Issuer, Serial Number, Validity Period, Key Usage, Subject Alternative Names.
- Show how the certificate chain validates for mTLS.
- Highlight common issues: expired certificates, wrong key usage, mismatched CN/SAN.
- Note: All parsing done client-side using an ASN.1/X.509 JavaScript parser. No certificate data is transmitted.

#### FR-4.4: Error Diagnosis Engine
- Paste a 401 or 403 error response from the EP API.
- Diagnose probable causes:
  - 401: expired token, missing Bearer prefix, malformed JWS, clock skew.
  - 403: certificate not whitelisted, wrong environment (mock vs. UAT vs. prod), missing API entitlement.
- Provide specific remediation steps for each diagnosed cause.
- Link to relevant JPM documentation sections.

#### FR-4.5: Auth Method Comparison
- Side-by-side view comparing:
  - **mTLS + Digital Signature** (used by Embedded Payments).
  - **OAuth only** (used by some other JPM APIs like Online Payments).
- Highlight which headers, certificates, and signing steps differ.
- Help developers who have integrated with other JPM APIs understand what's different for EP.

#### FR-4.6: Code Generator
- Generate working authentication code snippets in:
  - Node.js (using `https` agent + `jose` library).
  - Python (using `requests` + `cryptography`).
  - Java (using `HttpClient` + `Nimbus JOSE`).
  - Go (using `crypto/x509` + `gopkg.in/square/go-jose.v2`).
  - C# (using `HttpClient` + `System.IdentityModel.Tokens.Jwt`).
- Code includes placeholder markers for credentials (client_id, key path, cert path).
- Copy-to-clipboard for each snippet.

### Mock Data Requirements

| Component | Simulated Data |
|-----------|---------------|
| `POST /oauth2/token` | Simulated 200 response with mock access_token (JWT format) |
| JWS headers | Demo `x-jpm-*` headers with annotated field explanations |
| JWS signing | Demo RSA key pair for interactive signing demonstration |
| Error responses | Sample 401/403 payloads from EP API documentation |

### Technical Approach

- React for the UI and step-by-step wizard.
- Web Crypto API for JWS signing demonstration (demo keys only, never real credentials).
- ASN.1/X.509 parser (e.g., `asn1js` / `pkijs`) for certificate inspection.
- No credentials are stored or transmitted — all processing is client-side and ephemeral.

### Security Considerations

- The tool must display a prominent warning that users should never paste production credentials.
- Demo signing uses generated throwaway key pairs, not real client keys.
- Certificate inspection parses files locally; no upload to any server.
- No localStorage persistence of any credential-like data.

---

## Tool 5: Integration Pathway Advisor

**Category:** Discovery  
**Effort:** Low  
**Impact:** High  
**Priority:** Phase 1  

### Problem Statement

JPM offers two main EP pathways (with accounts vs. direct payouts) plus the broader Embedded Finance suite (Digital Onboarding, Validation Services, Accounts v2 beta). Developers waste time reading about capabilities they don't need. No tool currently maps "I am X type of platform" to "you need these specific APIs in this order."

### Description

An interactive decision tree and questionnaire that asks platform developers about their business model and use case, then recommends the optimal integration pathway. The output is a custom integration roadmap with a sequenced API checklist, time estimate, and direct links to relevant documentation.

### Functional Requirements

#### FR-5.1: Guided Questionnaire
- Multi-step questionnaire covering:
  1. **Platform type** — Marketplace, SaaS platform, gig economy, e-commerce, lending, other.
  2. **Fund flow model** — Do you hold funds on behalf of clients? Do you need to split payments?
  3. **Client onboarding needs** — Do you need KYC/KYB for your clients? Are your clients individuals or businesses?
  4. **Payout requirements** — Payout frequency (real-time, daily, weekly, on-demand)? Domestic only or international?
  5. **Regulatory considerations** — Are you a payment facilitator? Do you need money transmission licensing?
  6. **Existing JPM relationship** — Do you already have Processing/Management accounts? Are you already using other JPM APIs?
- Each question has 2-4 selectable options with brief explanatory text.
- Progressive disclosure: later questions adapt based on earlier answers.

#### FR-5.2: Decision Tree Visualization
- After completing the questionnaire, display the decision tree showing which branches were taken.
- Highlight the path from start to recommendation.
- Allow developers to click alternative branches to see what would change.

#### FR-5.3: Integration Roadmap Output
- Custom output based on questionnaire answers:
  - **Recommended pathway** — "Embedded Payments with Accounts" or "Direct Payouts" or "Hybrid."
  - **Required APIs** — Sequenced list of API resources needed (e.g., Clients → Accounts → Recipients → Transactions).
  - **Optional APIs** — Additional APIs that add value for this use case (e.g., Notification Subscriptions, Validation Services).
  - **Integration checklist** — Ordered list of implementation steps.
  - **Estimated timeline** — Based on pathway complexity (e.g., 2 weeks for direct payouts, 6-8 weeks for full onboarding + accounts).

#### FR-5.4: Documentation Deep Links
- Each item in the integration roadmap links directly to the relevant section on developer.payments.jpmorgan.com.
- Links use the LLM-friendly URLs from the portal's llms.txt index where available.

#### FR-5.5: Export
- Export the roadmap as a PDF one-pager suitable for stakeholder or compliance review.
- Export as a Markdown checklist for project management tools (Jira, Linear, GitHub Issues).
- Share via URL with encoded questionnaire answers (URL hash parameters).

### Mock Data Requirements

- No API calls required — purely advisory/educational.
- Decision logic embedded as a client-side rule engine.
- Documentation URLs sourced from developer.payments.jpmorgan.com and the llms.txt index.

### Technical Approach

- React with simple state machine for questionnaire flow.
- Decision tree logic as a JSON configuration file.
- PDF generation via a client-side library (e.g., jsPDF or html2canvas).
- URL hash encoding for shareable recommendations.

---

## Tool 6: Webhook Notification Playground

**Category:** Integration  
**Effort:** Medium  
**Impact:** Medium  
**Priority:** Phase 3  

### Problem Statement

JPM provides sample notification payloads in the documentation (both OAuth-wrapped and plain variants), but developers cannot test their webhook handler logic without a live integration and a publicly accessible callback URL. This means webhook parsing and handling is typically the last thing tested, often revealing issues only during UAT.

### Description

A client-side webhook simulator that fires mock notification payloads for every Embedded Payments event type. Developers can inspect payloads, write and test webhook handler logic in an in-browser code editor, and validate that their handler produces the expected outcome for each event.

### Functional Requirements

#### FR-6.1: Event Catalog
- Browseable catalog of all EP notification event types:
  - **Client events:** client.status_changed (CREATED, SUBMITTED, REVIEW, INFORMATION_NEEDED, APPROVED, REJECTED).
  - **Transaction events:** transaction.pending, transaction.posted, transaction.completed, transaction.failed, transaction.reversed.
  - **Recipient events:** recipient.verification_pending, recipient.verified, recipient.verification_failed.
  - **Account events:** account.created, account.status_changed, account.closed.
- Each event type shows a description, when it fires, and the full payload structure.

#### FR-6.2: Payload Firing
- "Fire" button next to each event type that sends the mock payload to the in-browser handler.
- Configurable payload variants: success path, error path, edge cases.
- Fire events in sequence to simulate a complete lifecycle (e.g., client.created → client.submitted → client.approved → account.created → transaction.pending → transaction.completed).

#### FR-6.3: In-Browser Code Editor
- Embedded code editor (Monaco Editor or CodeMirror) for writing webhook handler logic.
- Support for JavaScript (primary), with syntax highlighting for Python and Java (display-only for reference).
- Pre-loaded handler template with the basic event parsing structure.
- Console output panel showing handler return values, logged output, and errors.

#### FR-6.4: Payload Format Toggle
- Toggle between:
  - **OAuth-wrapped notifications** — payload wrapped in JWS with signature verification.
  - **Plain notifications** — unwrapped JSON payload.
- Show the structural differences between the two formats.
- For OAuth-wrapped format, demonstrate how to verify the JWS signature.

#### FR-6.5: Lifecycle Timeline
- Visual timeline showing notifications in chronological order for a complete EP lifecycle.
- Click any point on the timeline to fire that specific event.
- Highlight which events the developer's handler has successfully processed vs. failed.

#### FR-6.6: Idempotency Testing
- Button to fire duplicate events (same event ID, same payload).
- Test whether the developer's handler correctly detects and deduplicates repeated notifications.
- Show best practices for idempotent webhook handling.

### Mock Data Requirements

- Notification payloads sourced from EP documentation:
  - With OAuth: payload samples from the "Notification payload samples with OAuth" doc page.
  - Without OAuth: payload samples from the "Notification payload samples without OAuth" doc page.
- Event type taxonomy from the "Manage notifications" doc page.
- Mock JWS-wrapped payloads for signature verification demonstration.

### Technical Approach

- React + Monaco Editor (or CodeMirror) for the code editor.
- In-browser JavaScript execution via `Function()` constructor (sandboxed).
- Mock payloads embedded as static JSON.
- Timeline visualization with SVG or CSS.

---

## Tool 7: Interactive API Response Explorer

**Category:** Discovery  
**Effort:** Low  
**Impact:** Medium  
**Priority:** Phase 1  

### Problem Statement

The EP OpenAPI spec is downloadable but developers typically need to load it into Swagger UI or a similar tool for exploration. This adds friction and the generic Swagger UI doesn't provide EP-specific context like field relationships across endpoints, status transition rules, or cross-references between resources.

### Description

A browseable, searchable, interactive catalog of every Embedded Payments API response. Each response is shown as a collapsible JSON tree with field-level annotations, data type indicators, and cross-references to where that field appears in other endpoints.

### Functional Requirements

#### FR-7.1: Resource Browser
- Navigation sidebar listing all EP API resources:
  - Clients, Parties, Accounts, Recipients, Transactions, Documents, Attestations, Questions, Notifications.
- Each resource expands to show available operations (GET, POST, PATCH, DELETE) with HTTP method badges.

#### FR-7.2: Collapsible JSON Tree
- Each endpoint displays its response as a collapsible JSON tree.
- Syntax highlighting with distinct colors for strings, numbers, booleans, arrays, objects, and null values.
- Each field shows:
  - Data type (string, integer, enum, array, object).
  - Required/optional indicator.
  - Descriptive annotation from the OpenAPI spec.
  - Enum values where applicable (e.g., status: CREATED | SUBMITTED | APPROVED | REJECTED).

#### FR-7.3: Cross-Resource Search
- Global search across all responses: "where does partyId appear?"
- Search results show every endpoint that returns or accepts the searched field.
- Click a result to navigate to that endpoint's response with the matching field highlighted.

#### FR-7.4: Relationship Map
- Click any ID field (clientId, accountId, partyId, recipientId, transactionId) to see a visual map of all endpoints that reference that ID.
- Shows the relationship direction: "clientId is returned by POST /clients and accepted by GET /clients/{id}, GET /recipients?clientId=…, GET /accounts?clientId=…, etc."

#### FR-7.5: Version Comparison
- Toggle between API versions (v1 and v2) to compare response structures side-by-side.
- Highlight added, removed, and modified fields between versions.
- Note: Transactions resource is v2 while other resources are v1.

#### FR-7.6: Status Code Browser
- For each endpoint, show example responses for:
  - 200/201 (success).
  - 400 (bad request — with common validation errors).
  - 401 (unauthorized).
  - 404 (not found).
  - 409 (conflict — duplicate resource).
  - 422 (unprocessable entity — business rule violation).
- Each error response includes the EP-specific error payload structure with error codes and messages.

#### FR-7.7: Copy and Mock Data Export
- Copy individual fields, nested objects, or entire responses to clipboard.
- Export a response as mock data for use in MSW (Mock Service Worker) handlers — matching the format used in the existing embedded-finance showcase app.
- Generate TypeScript interfaces from response structures.

### Mock Data Requirements

- All data derived from the EP OpenAPI specification (v1 and v2).
- Sample success and error response payloads from documentation.
- Field metadata: types, required/optional, enums, descriptions.

### Technical Approach

- React with a recursive JSON tree component.
- OpenAPI spec parsed at build time into a structured data model.
- Client-side search index (e.g., Fuse.js) for cross-resource field search.
- No runtime API calls.

---

## Tool 8: Compliance & Go-Live Readiness Checker

**Category:** Adoption  
**Effort:** Low  
**Impact:** Medium  
**Priority:** Phase 1  

### Problem Statement

The path from "sandbox works" to "production live" has many non-obvious steps: certificate exchange, terms acceptance, compliance documentation, error handling requirements, idempotency implementation, and notification subscription setup. Developers discover these requirements late in the integration process, causing delays and rework. No interactive tracker exists.

### Description

A self-service interactive checklist that walks platform developers through every technical, regulatory, and operational requirement for going live with Embedded Payments. Tracks completion state locally and generates a readiness report.

### Functional Requirements

#### FR-8.1: Categorized Checklist
- Requirements organized into categories:
  - **Technical** — Authentication setup (mTLS certificates, JWS signing), error handling implementation, idempotency key generation, pagination handling, rate limiting awareness.
  - **Regulatory** — Terms and conditions display on platform, attestation collection from clients, KYC/KYB document upload flow, compliance with applicable money transmission laws.
  - **Operational** — Notification subscription setup, monitoring and alerting, support escalation contacts, incident response procedures.
  - **Testing** — UAT environment validation, test persona coverage, error scenario testing, end-to-end payout flow verification.
- Each item has a checkbox, description, and difficulty/time estimate.

#### FR-8.2: Progress Tracking
- Persistent progress tracking via localStorage (or in-memory with export option).
- Visual progress bar showing overall completion percentage and per-category completion.
- Ability to mark items as "Not Applicable" with a reason note.

#### FR-8.3: Documentation Links
- Each checklist item links directly to the relevant documentation section on developer.payments.jpmorgan.com.
- Links prioritize the how-to guides and getting started pages.

#### FR-8.4: Readiness Report Export
- Generate a PDF readiness report showing:
  - Overall completion status.
  - Per-category breakdown.
  - Outstanding items with descriptions and estimated effort.
  - Date of report generation.
- Suitable for sharing with compliance teams, project managers, or JPM relationship managers.

#### FR-8.5: Team Collaboration
- Shareable state via URL hash encoding — share a link with teammates to sync progress.
- Import/export checklist state as JSON for backup or team handoff.

#### FR-8.6: Timeline Calculator
- Based on remaining unchecked items, estimate the time to production readiness.
- Factor in item difficulty weights (e.g., certificate exchange = 3 days, error handling = 5 days).
- Display a projected go-live date on a visual timeline.

### Mock Data Requirements

- No API calls — purely educational and tracking.
- Checklist items derived from EP documentation: Getting Started, Core Concepts, Support, and various how-to guides.
- Time estimates based on typical integration timelines from the documentation.

### Technical Approach

- React with localStorage for state persistence.
- PDF generation via client-side library (jsPDF or html2canvas).
- URL hash encoding for shareable state.
- Simple state: array of items with checked/unchecked/na status.

---

## Cross-Cutting Requirements

### CRQ-1: Design System Consistency
- All 8 tools should share a common design system:
  - Color palette, typography, spacing, component styles.
  - Consistent navigation pattern (sidebar or top nav with tool switcher).
  - Shared footer with links to JPM developer portal, GitHub repos, and support.
- Consider packaging as a single React application with route-based tool switching, or as individual standalone artifacts depending on deployment model.

### CRQ-2: Mobile Responsiveness
- All tools must function on tablet and mobile viewports.
- Complex visualizations (Flow Simulator, Money Movement Sandbox) may offer a simplified mobile layout with the full interactive experience on desktop.

### CRQ-3: Accessibility
- WCAG 2.1 AA compliance.
- Keyboard navigation for all interactive elements.
- Screen reader support with ARIA labels on graph nodes, form fields, and interactive elements.
- High contrast mode toggle.

### CRQ-4: Zero Backend Dependency
- All tools run entirely client-side.
- No authentication, API keys, or sandbox credentials required to use any tool.
- All mock data embedded at build time.
- No external API calls except loading CDN-hosted fonts/libraries.

### CRQ-5: Performance
- Initial load under 3 seconds on a 3G connection.
- Lazy loading for tools not currently active.
- Code splitting per tool if packaged as a single application.

### CRQ-6: Analytics Integration Points
- Each tool should expose event hooks for analytics integration (tool opened, step completed, payload exported, etc.).
- Analytics implementation is out of scope but the hooks should be present for future integration.

### CRQ-7: Data Source Alignment
- Mock data must be reviewed against the latest EP OpenAPI specification with each release.
- A data update process should be documented for refreshing mock payloads when the API spec changes.
- Version indicators should show which EP API version the mock data reflects (currently v1.0.9 for most resources, v2.0.9 for transactions).

---

## Appendix A: EP API Resource Summary

| Resource | Base Path | Key Operations | API / version |
|----------|-----------|----------------|---------------|
| Clients | `/clients` | Create, Get, List, Update (`PATCH` / `POST` legacy) | Digital Onboarding |
| Parties | `/parties` | Create, Get, List, Update | Digital Onboarding |
| Documents | `/documents`, `/document-requests` | Upload, list requests, submit | Digital Onboarding |
| Attestations | (fields on client update) | `PATCH /clients/{id}` — e.g. `addAttestations` in body per OAS | Digital Onboarding |
| Questions | `/questions`, `/questions/{id}` | List, get; answers via `PATCH /clients/{id}` | Digital Onboarding |
| Accounts | `/accounts` | Create, Get, List | Embedded API v1 |
| Recipients | `/recipients` | Create, Get, List, Update; `POST …/verify-microdeposit` | Embedded API v1 |
| Transactions | `/transactions` | Create, Get, List | Embedded API v2 |
| Webhooks | `/webhooks` | Create, Get, Update subscription (`POST /webhooks/{id}`) | Embedded Banking (`tsapi/ef/v1`) |

**Example production base (EF):** `https://apigateway.jpmorgan.com/tsapi/ef/v1`  
**Mock:** `https://api-mock.payments.jpmorgan.com/tsapi/ef/v1`

## Appendix B: Account Type Reference

| Account Type | Owner | Purpose | Balance Visible | Funding Direction |
|-------------|-------|---------|-----------------|-------------------|
| Processing Account | Platform | Accept funds from acquirers | Yes | Inbound from external sources |
| Management Account | Platform | Commission/fee allocation | Yes | Inbound from Processing |
| Limited DDA | Client | Client's ring-fenced funds | Yes | Inbound from Processing/Treasury, outbound to Linked |
| Treasury Account | Platform | Fund Processing or DDAs | No (details only) | Outbound to Processing/DDA |
| Linked External Account | Client | Client's own bank account | N/A | Inbound (payout destination) |

## Appendix C: Authentication Methods Reference

| Method | Used By | Components |
|--------|---------|------------|
| mTLS + Digital Signature | Embedded Payments, Digital Onboarding | Client certificate (.crt/.key), JWS signing (RS256), x-jpm-* headers |
| OAuth 2.0 (client_credentials) | Embedded Payments (token acquisition) | client_id, client_secret, token endpoint |
| OAuth 2.0 only | Online Payments, some other JPM APIs | client_id, client_secret, Bearer token |

## Appendix D: Related JPM Open Source Resources

| Resource | URL | Relevance |
|----------|-----|-----------|
| Embedded Finance Showcase | github.com/jpmorgan-payments/embedded-finance | React component library + SellSense demo app with MSW mocks |
| Self-Gen SDK Reference | github.com/jpmorgan-payments/ep-selfgen-sdk-reference | OpenAPI Generator setup for Java client |
| PDP MCP Server | github.com/jpmorgan-payments/pdp-mcp | MCP server for developer portal documentation search |
| Embedded Finance SDK (NPM) | @jpmorgan-payments/embedded-finance-sdk | Payment data validation and field definition engine |
| Embedded Components (NPM) | @jpmorgan-payments/embedded-finance-components | Pre-built React components for onboarding, payments, accounts |
| Live Demo | www.embedded-finance-dev.com | Hosted SellSense marketplace demo |