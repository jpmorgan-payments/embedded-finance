# PRD: Embedded Finance Solutions Showcase (“SellSense Demo”)

**Timeline:** 1–2 weeks  
**Team:** 1 Senior Engineer + AI‐generation agents

---

## 1. Vision  
Enable prospective partners and developers to explore JPMorgan Chase’s Embedded Payments APIs via a lightweight, polished web showcase.  
- Demonstrate end-to-end flows (KYC onboarding, bank linking, transactions) in a marketplace context (“SellSense”).  
- Surface core UI components, theming, tone and copy-code snippets.  
- Drive faster time-to-value on our API products.

## 2. Personas  
- **API-first Developer**  
  Quickly scans component previews, copies code snippets and understands integration points.  
- **Marketplace Admin (SellSense Operator)**  
  Evaluates onboarding, transaction monitoring and reconciliation workflows.  
- **Technical Product Sponsor**  
  Reviews branding, tone, theming and overall UX before presenting to partners.

## 3. Goals & Success Criteria  
- **Clarity of value:** Visitor clicks “View Demo” without any sign-up friction.  
- **API literacy:** Every component links back to its API reference at  
  `developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview`.  
- **Scenario coverage:** Showcase 3–4 user-lifecycle states (e.g. Pending KYC, In Review, Active).  
- **Copy-code rate:** ≥ 90% of UI examples include a “Copy Code” button and research-doc link.

## 4. Scope

### 4.1 In-Scope  
- **Landing Page** (anonymous):  
  - Hero section + “View Demo” CTA → `/demo`  
  - 3–5-panel feature carousel  
- **SellSense Dashboard** (`/demo`):  
  - KYC onboarding wizard (mocked)  
  - Bank-linking step (mocked)  
  - Wallet overview with 5–10 sample transactions  
  - Component gallery:  
    - ImportantDateSelector  
    - IndustryClassification (NAICS)  
    - TaxIDSelector (EIN, VAT, GST)  
    - ToneSwitcher (content-token demo)  
    - ThemeSwitcher (drops into EBComponentsProvider)  
  - Scenario switching via URL param (e.g. `?scenario=kyc_pending`)  
- **Theming & Tone**: built-in themes + extensibility pattern; content tokens for “Standard” vs “Industry-specific” voice  
- **Mock API**: client-side only, stateful via MSW service worker; no persistence  
- **Docs links**: each preview links to its `ANALYSIS.md` or API spec  
- **Accessibility**: WCAG 2.1 AA, keyboard & screen-reader support

### 4.2 Out-of-Scope  
- Real backend or data persistence  
- Real authentication against identity provider  
- Analytics, logging, monitoring  
- Localization beyond English; no RTL

## 5. Functional Requirements

### 5.1 Landing Page  
- Hero: headline, subhead, “View Demo” CTA → `/demo`  
- Carousel: 3–5 panels, each linking to a component preview  
- Metadata: page title, meta description, OpenGraph tags

### 5.2 Demo Entry & Scenario Control  
- URL-driven scenario (e.g. `/demo?scenario=kyc_review`)  
- Banner: “This is a mocked demo using Service Worker.”  
- Scenario persists on refresh via URL only

### 5.3 KYC Onboarding  
- 3-step wizard:  
  1. **Docs Needed** – form fields per API spec, file-upload placeholders  
  2. **In Review** – spinner + status message  
  3. **Completed** – success message + next CTA  
- Inline validation per API schema

### 5.4 Bank Linking  
- Mocked “Connect Your Bank” card  
- Success & error states, sample balance display

### 5.5 Wallet & Transactions  
- Display mocked wallet balance  
- Table of 5–10 transactions with client-side paging  
- Filters: date range selector, vendor search

### 5.6 Component Gallery  
For each component:  
- Live preview  
- “Copy Code” button  
- Link to `ANALYSIS.md` in `embedded-components` repo

## 6. Theming & Tone  
- **Built-in themes (examples):**  
  - Default Blue  
  - S&P Theme  
  - SellSense Theme  
  - PayFicient Theme  
  - “Add Your Own” extension pattern (see theming docs)  
- Themes defined via JSON token sets; onboarding guide in repo  
- **Tone variants:** driven by content tokens; demonstrate “Standard” vs “Industry-specific” voice

## 7. Mock API & Data  
- MSW service worker with predefined fixtures keyed by scenario  
- Data shapes and sample payloads cross-linked to the API overview at  
  `developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview`

## 8. Accessibility  
- Must meet WCAG 2.1 AA: color contrast, focus indicators, ARIA roles  
- Full keyboard support for dialogs, carousels, dropdowns

## 9. Constraints & Assumptions  
- No persistent backend; all state in-memory via service worker  
- Single-page app with routes `/` and `/demo`  
- English only; no RTL support  
- Senior engineer + AI agents generate code artifacts

## 10. Timeline & Milestones  
- **Day 1:** Finalize PRD & component list  
- **Days 2–5:** Build skeleton, MSW mocks, landing page & demo shell  
- **Days 6–10:** Implement flows, components, themes, tone tokens  
- **Days 11–14:** QA accessibility, link docs, finalize copy

## 11. Stakeholders & Roles  
- **Product Owner:** Prioritizes scenarios & content tokens  
- **Senior Engineer:** Oversees code quality & accessibility  
- **AI Agents:** Scaffold components, MSW handlers, code snippets  
- **UX Designer:** Reviews visual styling against theme tokens

## 12. Next Steps  
1. Review & approve PRD  
2. Draft detailed tech spec & feature checklist  
3. Kick off implementation sprint