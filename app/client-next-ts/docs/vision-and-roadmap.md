# Embedded Finance & Solutions Showcase — Vision & Roadmap

## Executive Summary

**Mission**: Transform developer evaluation of J.P. Morgan Embedded Payments
APIs from days of scattered documentation to minutes of interactive,
copy-paste-ready experiences.

**Success Metric**: Reduce time-to-first-successful-run from **~4 hours** to
**<15 minutes** for 80% of developers.

**Positioning**: The interactive proving ground that complements (never
replaces) the official Embedded Payments API documentation at
https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/overview

---

## 1) Vision & Product Principles

### Vision Statement

We enable developers to evaluate, customize, and integrate J.P. Morgan Embedded
Payments APIs through a shareable, themeable showcase that demonstrates
real-world flows with copyable code, live mocks, and deep links to official
documentation.

### Product Principles

1. **Complement, Don't Compete**: Always link back to official docs; we're the
   interactive layer, not the source of truth.
2. **Copy-Paste Ready**: Every component demo includes production-ready code
   snippets with one-click copy.
3. **Shareable by Default**: All demo states are URL-driven and bookmarkable for
   team collaboration.
4. **Mock-First, Real-Ready**: MSW mocks mirror production API contracts;
   swapping to real endpoints is a config change.
5. **Theme as First-Class**: Theming isn't an afterthought—it's a core
   differentiator for brand-conscious platforms.

---

## 2) Problem & Opportunity

### Current Friction Points

- **Scattered Information**: Developers jump between docs, GitHub repos, and
  example codebases to understand integration patterns.
- **Mock vs. Production Uncertainty**: Unclear how MSW mocks map to real API
  behavior, causing integration surprises.
- **Theming Black Box**: No way to preview custom themes before committing to
  implementation.
- **Slow Time-to-Value**: Average 4+ hours from "I want to try this" to "I have
  a working component locally."

### Opportunity

By providing an interactive showcase with:

- **Live, editable demos** with copyable code
- **Validated theme previews** with JSON import/export
- **MSW-backed mocks** that mirror production contracts
- **One-click starter kits** for local development

We can reduce evaluation time by **85%** and increase developer confidence in
theming and integration patterns.

---

## 3) Personas & Jobs-to-be-Done

### Persona 1: API-First Developer (Primary)

**Profile**: Senior engineer evaluating Embedded Payments for platform
integration.

**Jobs-to-be-Done**:

- ✅ Run components locally in <15 minutes
- ✅ Copy production-ready code snippets
- ✅ Validate API payloads against mocks before backend integration
- ✅ Understand theme customization without reading 50+ pages of docs
- ✅ Share specific demo configurations with team via URL

**Success Criteria**: Can integrate OnboardingFlow component into their app
within 1 hour of first visit.

### Persona 2: Technical Product Sponsor (Secondary)

**Profile**: Product manager or technical lead evaluating brand fit and UX
patterns.

**Jobs-to-be-Done**:

- ✅ See branded components (theming) without engineering setup
- ✅ Evaluate onboarding flows for conversion optimization
- ✅ Share demo URLs with stakeholders for approval
- ✅ Understand compliance and accessibility posture

**Success Criteria**: Can make go/no-go decision on Embedded Payments based on
showcase experience alone.

### Persona 3: Partner Solutions / Professional Services (Tertiary)

**Profile**: Solutions architect or PS engineer building repeatable integration
playbooks.

**Jobs-to-be-Done**:

- ✅ Access downloadable starter kits for common scenarios
- ✅ Use health-check scripts for client validation
- ✅ Reference go-live checklists and preflight guides
- ✅ Share Postman/Insomnia collections for API testing

**Success Criteria**: Can onboard a new client using showcase resources without
custom development.

---

## 4) Scope & Boundaries

### In-Scope

- **Core Flows**: Onboarding (KYC/KYB), linked accounts, payouts, transactions,
  accounts management
- **Theming**: Built-in presets (6 themes) + custom JSON import/export with
  validation
- **Developer Tools**: Copy-code snippets, starter kits, health checks, MSW
  mocks
- **Documentation**: Deep links to official API docs, implementation recipes,
  component props reference

### Out-of-Scope (Explicitly)

- ❌ Real money movement or production API calls
- ❌ Production authentication flows (demo uses MSW mocks only)
- ❌ Analytics or user tracking (privacy-first approach)
- ❌ Localization beyond English (future consideration)
- ❌ RTL language support
- ❌ Mobile app SDKs (web-only showcase)

### Future Considerations (Not Now)

- 🔮 Hosted sandbox with ephemeral instances
- 🔮 CLI tooling for local development
- 🔮 Analytics on snippet usage (opt-in, privacy-preserving)
- 🔮 Internationalization demo (i18n patterns)

---

## 5) Experience Pillars

### Pillar 1: URL-Driven, Shareable State

**Implementation**: All demo configuration (scenario, theme, view, tone,
fullscreen) persists in URL parameters.

**Value**: Developers can bookmark and share specific demo states with teams,
stakeholders, or support.

**Example**:
`?scenario=New+Seller+-+Onboarding&theme=SellSense&view=onboarding&tone=Friendly`

### Pillar 2: Mock Fidelity + Observability

**Implementation**: MSW service worker with production-like responses, visible
status indicator, and reset functionality.

**Value**: Developers trust that mocks mirror production, reducing integration
surprises.

**Metrics**: MSW status visible in UI, health-check pass rate >95%.

### Pillar 3: Validated Theming

**Implementation**: Theme customization drawer with JSON import/export, schema
validation, and live preview.

**Value**: Designers and developers can experiment with themes before committing
to implementation.

**Metrics**: Custom theme validation pass rate >90%, theme JSON download count.

### Pillar 4: Copy-Code + Doc Deep Links

**Implementation**: Every component demo includes inline code snippets with
copy-to-clipboard and links to official API documentation.

**Value**: Zero-friction path from "I like this" to "I'm using this in my code."

**Metrics**: Copy-code coverage >90% of showcased components, click-through rate
to official docs.

### Pillar 5: Guardrails to Go-Live

**Implementation**: Preflight checklist, health-check scripts, and go-live
readiness guide.

**Value**: Reduces production deployment risks and support burden.

**Metrics**: Health-check adoption rate, go-live checklist completion rate.

---

## 6) Success Metrics & Targets

### Primary Metrics (North Star)

| Metric                       | Current  | Target (6mo) | Target (12mo) |
| ---------------------------- | -------- | ------------ | ------------- |
| Time-to-first-successful-run | ~4 hours | <30 minutes  | <15 minutes   |
| Copy-code coverage           | ~40%     | >80%         | >95%          |
| Developer satisfaction (NPS) | N/A      | >40          | >50           |
| Demo URL shares (monthly)    | N/A      | >500         | >2000         |

### Secondary Metrics (Leading Indicators)

- **Component demo views**: Track which components get most attention
- **Theme customization usage**: % of users who customize themes
- **Starter kit downloads**: Adoption of local development templates
- **Health-check pass rate**: % of local runs that pass all checks
- **Documentation click-through**: CTR from showcase to official docs

### Health Metrics (Operational)

- **MSW status uptime**: >99% availability
- **Build/deploy success rate**: >98%
- **TypeScript/lint pass rate**: 100% (blocking)
- **Accessibility score**: WCAG 2.1 AA compliance maintained

---

## 7) Current State Assessment

### ✅ Implemented & Working

- Landing page with component gallery (6 components showcased)
- Component cards with action buttons (View Live Demo, Source Code, Recipe, API
  Docs, NPM)
- SellSense demo with scenario/theme/tone selectors
- Theme customization drawer (brush icon) — **needs validation enhancement**
- MSW demo notice banner with status indicator
- Engineering Recipes section (3 recipes published)
- Utility components showcase (Important Date Selector, Industry Classification)
- Fullscreen component mode via URL params
- Scenario navigation (prev/next buttons)

### ⚠️ Partially Implemented (Needs Verification)

- **Component Details dialog**: Button exists; verify content (code snippets,
  props, API links)
- **Component code links**: Landing page buttons exist; verify GitHub links
  resolve correctly
- **Theme editor**: Drawer opens; verify JSON import/export and validation work
- **MSW reset functionality**: Button exists; verify database reset works
  correctly

### ❌ Missing (High Impact)

- **Copy-code functionality**: No visible "Copy Code" buttons on component cards
  or demo pages
- **Starter kits**: No downloadable templates for local setup
- **README/docs overhaul**: Current docs page is minimal
- **Health-check scripts**: Not exposed to end users
- **Preflight checklist**: No go-live readiness guide

---

## 8) Feature Backlog (Unordered)

### High Priority (Foundation & Core DX)

#### Copy-Code & Component Details

**Goal**: Enable zero-friction code copying for all showcased components.

**Backlog Items**:

- Add "Copy Code" button to all component cards on landing page
- Implement Component Details dialog with:
  - Code snippet (React/TypeScript)
  - Component props reference
  - Deep link to official API docs
  - NPM package link
- Add syntax highlighting (Prism.js or similar)
- Track copy events (privacy-preserving)

**Acceptance Criteria**:

- ✅ Copy-code coverage >80% of showcased components
- ✅ All code snippets are production-ready (no placeholders)
- ✅ Component Details dialog opens from demo pages
- ✅ Deep links resolve to correct API doc sections

**DRI**: Frontend Lead
**Dependencies**: None
**Risks**: Code snippet maintenance overhead

---

#### Theme Editor Validation & Presets

**Goal**: Make theme customization production-ready with validation and preset
management.

**Backlog Items**:

- Implement Zod schema validation for custom theme JSON
- Add JSON import/export functionality
- Create downloadable preset JSONs for all built-in themes
- Add live preview of theme changes
- Implement "Revert to Base" functionality
- Add theme validation error messages (inline)

**Acceptance Criteria**:

- ✅ Custom theme validation pass rate >90%
- ✅ All 6 built-in themes have downloadable JSON presets
- ✅ Theme import errors show clear, actionable messages
- ✅ Theme preview updates in <500ms

**DRI**: Frontend Lead + Design Systems
**Dependencies**: Embedded Components theme schema finalized
**Risks**: Schema drift between showcase and components library

---

#### Starter Kits & Local Setup

**Goal**: Reduce time-to-first-successful-run to <30 minutes.

**Backlog Items**:

- Create Vite + React starter kit (TypeScript)
- Create Next.js starter kit (TypeScript)
- Create vanilla JS starter kit (for comparison)
- Add MSW setup instructions and health-check scripts
- Include example theme JSONs in starter kits
- Add "Quick Start" guide to README

**Acceptance Criteria**:

- ✅ Starter kits can be cloned and run in <5 minutes
- ✅ All starter kits include working MSW setup
- ✅ Starter kits include at least one component example
- ✅ README includes clear setup instructions

**DRI**: DX Lead
**Dependencies**: MSW handlers finalized
**Risks**: Starter kit maintenance burden

---

#### Documentation Overhaul

**Goal**: Make showcase self-documenting with comprehensive guides.

**Backlog Items**:

- Rewrite README with quickstart guide
- Add scenario explanations (what each scenario demonstrates)
- Document magic values for MSW testing
- Add MSW setup and troubleshooting guide
- Create go-live checklist (preflight guide)
- Add architecture diagram (showcase → components → API)

**Acceptance Criteria**:

- ✅ README enables new developers to run showcase in <15 minutes
- ✅ All scenarios have clear explanations
- ✅ Magic values are documented with examples
- ✅ Go-live checklist covers all critical items

**DRI**: Technical Writer + DX Lead
**Dependencies**: None
**Risks**: Documentation drift over time

---

#### Industry-Specific Solution Bundles

**Goal**: Expand "Explore Demo Applications" section with industry-specific demo
bundles that showcase the same components in different configurations for
different use cases.

**Backlog Items**:

- Create solution bundle framework (reusable component configurations)
- Build marketplace solution bundle (SellSense - current, enhanced)
- Build e-commerce solution bundle (Create Commerce - currently "Coming Soon")
- Build SaaS platform solution bundle (subscription billing, vendor payouts)
- Build gig economy solution bundle (creator payouts, contractor onboarding)
- Build B2B marketplace solution bundle (supplier onboarding, invoice payments)
- Add solution bundle selector to landing page
- Each bundle includes:
  - Pre-configured component combinations
  - Industry-specific scenarios
  - Theming examples (brand-aligned)
  - Content token examples (industry terminology)
  - Use case documentation
- Add "Solution Architecture" view showing component relationships per bundle

**Acceptance Criteria**:

- ✅ At least 4 industry-specific solution bundles available
- ✅ Each bundle demonstrates unique component configurations
- ✅ Solution bundles are shareable via URL parameters
- ✅ Landing page clearly distinguishes between component demos and solution
  bundles
- ✅ Each bundle includes architecture diagram and use case explanation

**DRI**: Product Manager + Frontend Lead
**Dependencies**: Component library supports all required configurations
**Risks**: Solution bundle maintenance overhead, configuration complexity

---

#### Embedded Finance Patterns Documentation

**Goal**: Expose the deeply opinionated patterns from Embedded Finance Patterns
document, making them discoverable and actionable for developers building
finance/banking features.

**Backlog Items**:

- Add "Patterns" section to showcase navigation
- Create interactive pattern explorer showing:
  - Pattern categories (Data Display, Forms, Tables, Navigation, etc.)
  - Implementation status matrix per component
  - Code examples for each pattern
  - Pattern decision trees (when to use which pattern)
- Link patterns to component demos (show pattern in action)
- Add pattern comparison tool (e.g., Dialog vs. Sheet vs. Drawer for detail
  views)
- Include pattern refinement recommendations from UX testing
- Add "Pattern Library" view with:
  - Atomic Design hierarchy (Atoms → Molecules → Organisms)
  - Nielsen's Usability Heuristics alignment
  - Best practices per pattern
  - Anti-patterns to avoid
- Create downloadable pattern reference guide (PDF/Markdown)
- Add pattern search/filter functionality

**Acceptance Criteria**:

- ✅ All patterns from EMBEDDED_FINANCE_PATTERNS.md are accessible in showcase
- ✅ Pattern explorer is interactive and searchable
- ✅ Each pattern includes code examples and live demos
- ✅ Pattern decision trees help developers choose correct patterns
- ✅ Pattern library is downloadable for offline reference
- ✅ Patterns are linked to relevant component demos

**DRI**: Technical Writer + Frontend Lead
**Dependencies**: Embedded Components patterns documentation finalized
**Risks**: Pattern documentation may become stale if not maintained

---

### Medium Priority (Enhanced DX & Advanced Features)

#### MSW Status & Health Checks

**Goal**: Make mock service observability first-class.

**Backlog Items**:

- Add persistent MSW status pill in header (replaces banner)
- Implement health-check script with CLI output
- Add preflight checklist modal (triggered from header)
- Expose health-check endpoints (`/ef/do/v1/_status`, `/_reset`)
- Add health-check to CI pipeline

**Acceptance Criteria**:

- ✅ MSW status always visible (not dismissible)
- ✅ Health-check script runs in <10 seconds
- ✅ Preflight checklist covers all critical items
- ✅ Health-check pass rate >95% in CI

**DRI**: Backend Lead
**Dependencies**: MSW handlers stable
**Risks**: None

---

#### Playground Tab

**Goal**: Enable interactive API exploration with live payload editing.

**Backlog Items**:

- Add "Playground" tab to SellSense demo
- Implement editable payload editor (JSON)
- Add MSW response preview (side-by-side)
- Generate curl/SDK snippets from payloads
- Add request/response history
- Support multiple API endpoints (onboarding, payouts, etc.)

**Acceptance Criteria**:

- ✅ Playground supports at least 3 API endpoints
- ✅ Payload editor validates JSON in real-time
- ✅ curl/SDK snippets are production-ready
- ✅ Response preview updates in <1 second

**DRI**: Full-Stack Lead
**Dependencies**: MSW handlers support all endpoints
**Risks**: Complexity of maintaining playground state

---

#### OpenAPI Bundles & Postman Collections

**Goal**: Enable API testing without writing code.

**Backlog Items**:

- Generate OpenAPI spec from MSW handlers
- Create Postman collection per scenario
- Create Insomnia collection per scenario
- Add download buttons to component cards
- Include example requests/responses

**Acceptance Criteria**:

- ✅ Postman collections work out-of-the-box
- ✅ All scenarios have corresponding collections
- ✅ Collections include example requests
- ✅ Collections are updated with MSW changes

**DRI**: Backend Lead
**Dependencies**: OpenAPI spec finalized
**Risks**: Spec maintenance overhead

---

### Lower Priority (Advanced Features & Polish)

#### Role-Based Presets

**Goal**: Demonstrate different user personas and access levels.

**Backlog Items**:

- Add persona selector (Admin, Analyst, Support)
- Implement feature flags per persona
- Show read-only vs. full-access modes
- Add persona descriptions and use cases

**Acceptance Criteria**:

- ✅ At least 3 personas supported
- ✅ Feature flags work correctly
- ✅ Persona descriptions are clear
- ✅ Personas persist in URL

**DRI**: Product Manager + Frontend Lead
**Dependencies**: None
**Risks**: Persona definitions may change

---

#### Component Status & Tooltips

**Goal**: Improve clarity on what's available vs. planned.

**Backlog Items**:

- Add tooltips to status badges ("Testing", "In Progress", "Coming Soon")
- Explain what each status means
- Add estimated availability dates for "Coming Soon"
- Update status badges automatically from component library

**Acceptance Criteria**:

- ✅ All status badges have tooltips
- ✅ Tooltips explain status clearly
- ✅ "Coming Soon" items have dates (if known)
- ✅ Status updates don't require code changes

**DRI**: Frontend Lead
**Dependencies**: Component library status API (if exists)
**Risks**: Status may become stale

---

#### Analytics & Insights

**Goal**: Understand developer behavior to improve showcase.

**Backlog Items**:

- Implement privacy-preserving analytics (opt-in)
- Track snippet copy events
- Track component demo views
- Track theme customization usage
- Generate monthly insights report

**Acceptance Criteria**:

- ✅ Analytics are opt-in only
- ✅ No PII collected
- ✅ Insights report generated monthly
- ✅ Analytics don't impact performance

**DRI**: Data Analyst + Frontend Lead
**Dependencies**: Analytics infrastructure
**Risks**: Privacy concerns, GDPR compliance

---

### Future Considerations (Backlog, Not Prioritized)

- 🔮 **Hosted try-it sandbox**: Ephemeral demo instances with shareable URLs
- 🔮 **CLI helper**: Scaffold scenario, inject theme, run health checks
- 🔮 **Design-token pipeline**: Designer-friendly JSON → validated import →
  preview
- 🔮 **Component comparison matrix**: Side-by-side comparison of similar
  components
- 🔮 **Accessibility audit report**: WCAG 2.1 AA compliance summary and VPAT
- 🔮 **Internationalization demo**: Show locale switching with content token
  examples
- 🔮 **Generative UI experiments**: AI-orchestrated component generation (labs
  flag)

---

## 13) Appendix

### Key Links

- **Official API Documentation**:
  https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/overview
- **GitHub Repository**: [To be added]
- **NPM Package**: `@jpmorgan-payments/embedded-finance-components`
- **Embedded Finance Patterns**:
  `embedded-components/docs/EMBEDDED_FINANCE_PATTERNS.md` (deeply opinionated
  patterns for finance/banking features)
- **Health Endpoints**:
  - Status: `/ef/do/v1/_status`
  - Reset: `/ef/do/v1/_reset`

### Glossary

- **MSW**: Mock Service Worker (API mocking library)
- **KYC/KYB**: Know Your Customer / Know Your Business (compliance verification)
- **Content Tokens**: String abstraction for localization and brand voice
- **Design Tokens**: Visual customization variables (colors, typography,
  spacing)
- **Scenario**: Pre-configured demo state (e.g., "New Seller - Onboarding")
- **Magic Values**: Special test values that trigger specific MSW responses
- **Patterns**: Deeply opinionated UI/UX patterns for finance/banking features
  (documented in EMBEDDED_FINANCE_PATTERNS.md) following Atomic Design and
  Nielsen's Usability Heuristics
- **Solution Bundle**: Industry-specific demo configuration showcasing component
  combinations for specific use cases (marketplace, e-commerce, SaaS, etc.)

### Backlog Refinement Process

See separate document: `BACKLOG_REFINEMENT.md` (to be created)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-XX
**Owner**: DevEx Product Manager
**Review Cadence**: Monthly
