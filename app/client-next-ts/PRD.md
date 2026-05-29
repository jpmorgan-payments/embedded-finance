# PRD: Embedded Finance and Solutions Showcase

---

## 1. Vision

Enable prospective partners and developers to explore JPMorgan Chase’s Embedded
Payments APIs via a lightweight, polished web showcase.

- Demonstrate end-to-end flows (KYC onboarding, bank account linking,
  transactions list and details, make a payment) in various marketplace contexts
  (e.g. “SellSense”).
- Surface core UI components, theming, tone and copy-code snippets.
- Drive faster time-to-value on our API products.

## 2. Personas

- **API-first Developer**  
  Quickly scans component previews, copies code snippets and understands
  integration points.
- **Technical Product Sponsor**  
  Reviews branding, tone, theming and overall UX before presenting to partners.
- **AI agents**  
  Explore extended API workflow scenarios.

## 3. Goals & Success Criteria

- **Clarity of value:** Visitor clicks “View Demo” without any sign-up friction.
- **API literacy:** Every component links back to its API reference at  
  `developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview`.
- **Copy-code rate:** ≥ 90% of UI examples include a “Copy Code” button and
  research-doc link.

## 4. Scope

### 4.1 In-Scope

- **Landing Page** (anonymous):
  - Hero section + “View Demo” CTA → `/demo`
  - List of demo scenarios with brief descriptions
  - Carousel of API workflow recipes (e.g. onboarding, linked accounts,
    transactions list and details, make a payment)
  - Small utility components gallery:
    - ImportantDateSelector
    - IndustryClassification (NAICS)
    - TaxIDSelector
- **Demo Scenario Portals** (`/demo`):
  - Mocked API responses with optional stateful behavior
  - Ability to switch between scenarios, themes, and tones
  - Persistence of the scenario, theme, and tone selection in the URL
  - Code snippets for each component
- **Theming & Tone**: built-in themes + extensibility pattern; content tokens
  for “Standard” vs “Industry-specific” voice
- **Mock API**: client-side only, stateful via MSW service worker; no
  persistence
- **Docs links**: each preview links to its `ANALYSIS.md` or API spec
- **Accessibility**: WCAG 2.1 AA, keyboard & screen-reader support

### 4.2 Out-of-Scope

- Real backend or data persistence
- Real authentication against identity provider
- Analytics, logging, monitoring
- Localization beyond English; no RTL

## 5. Functional Requirements

TBD

## 6. Theming & Tone

- **Built-in themes (examples):**
  - Default Blue
  - Salt Theme
  - SellSense Theme
  - PayFicient Theme
  - “Add Your Own” extension pattern (see theming docs)
- Themes defined via JSON token sets; onboarding guide in repo
- **Tone variants:** driven by content tokens; demonstrate “Standard” vs
  “Industry-specific” voice

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
