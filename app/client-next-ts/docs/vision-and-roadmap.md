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

## Feature Backlog Summary (One-Pager)

**Quick Reference**: All features organized by category for team prioritization
and planning.

### Developer Experience

| Feature                           | Goal                                                              | Status         |
| --------------------------------- | ----------------------------------------------------------------- | -------------- |
| **Copy-Code & Component Details** | Enable zero-friction code copying for all components              | ❌ Not Started |
| **Starter Kits & Local Setup**    | Reduce time-to-first-successful-run to <30 minutes                | ❌ Not Started |
| **Custom GitHub Copilot Agents**  | Create downloadable agent profiles for EF&SS integration patterns | ❌ Not Started |

### Theming

| Feature                               | Goal                                                      | Status                   |
| ------------------------------------- | --------------------------------------------------------- | ------------------------ |
| **Theme Editor Validation & Presets** | Make theme customization production-ready with validation | ⚠️ Partially Implemented |

### Demo Applications

| Feature                                     | Goal                                                    | Status                                    |
| ------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| **Industry-Specific Solution Bundles**      | Expand demo applications with industry-specific bundles | ⚠️ Partially Implemented (SellSense only) |
| **Interactive Integration Guide & Builder** | Create personalized integration guide and demo builder  | ❌ Not Started                            |
| **Role-Based Presets**                      | Demonstrate different user personas and access levels   | ❌ Not Started                            |
| **API Resource Lifecycle Visualization**    | Visually show API resource evolution across scenarios   | ❌ Not Started                            |

### Documentation

| Feature                                     | Goal                                                       | Status         |
| ------------------------------------------- | ---------------------------------------------------------- | -------------- |
| **Documentation Overhaul**                  | Make showcase self-documenting with comprehensive guides   | ❌ Not Started |
| **Embedded Finance Patterns Documentation** | Expose patterns from EMBEDDED_FINANCE_PATTERNS.md          | ❌ Not Started |
| **Utility Components & Hooks Review**       | Review and document utility components/hooks in library    | ❌ Not Started |
| **Changelog Generation from PRs**           | Automatically generate changelog from last 6 months of PRs | ❌ Not Started |
| **Version Management & Changelog**          | Expose version info and create version-locked changelog    | ❌ Not Started |

### UX/Polish

| Feature                                | Goal                                                       | Status         |
| -------------------------------------- | ---------------------------------------------------------- | -------------- |
| **Hero Section Review & Refinement**   | Improve landing page hero to communicate value proposition | ❌ Not Started |
| **Onboarding Experience for Showcase** | Create comprehensive onboarding experience for new users   | ❌ Not Started |
| **Component Status & Tooltips**        | Improve clarity on what's available vs. planned            | ❌ Not Started |

### Developer Tools

| Feature                                   | Goal                                                         | Status                   |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------ |
| **MSW Status & Health Checks**            | Make mock service observability first-class                  | ⚠️ Partially Implemented |
| **Playground Tab**                        | Enable interactive API exploration with live payload editing | ❌ Not Started           |
| **OpenAPI Bundles & Postman Collections** | Enable API testing without writing code                      | ❌ Not Started           |

### Analytics

| Feature                  | Goal                                              | Status         |
| ------------------------ | ------------------------------------------------- | -------------- |
| **Analytics & Insights** | Understand developer behavior to improve showcase | ❌ Not Started |

### Future Considerations (Not Prioritized)

- 🔮 Hosted try-it sandbox (ephemeral demo instances)
- 🔮 CLI helper (scaffold scenario, inject theme, run health checks)
- 🔮 Design-token pipeline (designer-friendly JSON → validated import → preview)
- 🔮 Component comparison matrix (side-by-side comparison)
- 🔮 Accessibility audit report (WCAG 2.1 AA compliance summary)
- 🔮 Internationalization demo (locale switching with content tokens)
- 🔮 Generative UI experiments (AI-orchestrated component generation)

### Feature Categories Overview

**Developer Experience (DX)**: Copy-code, starter kits, custom Copilot agents,
documentation, playground, health checks **Theming**: Theme editor validation,
presets, custom JSON import/export **Demo Applications**: Solution bundles,
interactive integration guide & builder, role-based presets, API resource
lifecycle visualization **Documentation**: Patterns, changelog, version
management, onboarding **UX/Polish**: Hero refinement, onboarding, component
status, tooltips **Developer Tools**: MSW status, health checks, playground,
Postman collections **Analytics**: Privacy-preserving analytics, insights
reports

### Current Implementation Status

- ✅ **Implemented**: Landing page, component gallery, SellSense demo, theme
  drawer (basic), MSW banner, recipes section
- ⚠️ **Partially Implemented**: Component details dialog, theme editor (needs
  validation), MSW reset, solution bundles (SellSense only)
- ❌ **Missing**: Copy-code buttons, starter kits, comprehensive docs, health
  checks (exposed), preflight checklist, most backlog features

### Key Metrics & Targets

| Metric                       | Current  | 6-Month Target | 12-Month Target |
| ---------------------------- | -------- | -------------- | --------------- |
| Time-to-first-successful-run | ~4 hours | <30 minutes    | <15 minutes     |
| Copy-code coverage           | ~40%     | >80%           | >95%            |
| Developer satisfaction (NPS) | N/A      | >40            | >50             |
| Demo URL shares (monthly)    | N/A      | >500           | >2000           |

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

## Current Features

**Landing Page**: Hero section, component gallery (6 components), demo carousel,
engineering recipes (3 published), experiences showcase

**SellSense Demo Application**: 6 scenarios (onboarding → active seller), 6
themes + custom theming, content tone selection, multiple views
(onboarding/overview/wallet/transactions/linked-accounts/payout), fullscreen
component mode, URL-driven state

**Component Showcase**: OnboardingFlow, LinkedAccountWidget, Accounts,
TransactionsDisplay, Recipients, MakePayment with live demos, code examples, and
documentation links

**Developer Tools**: MSW integration for API mocking, theme customization
drawer, form automation for testing, API flow explorer (Arazzo), code examples
modal, health check scripts

**Content & Documentation**: Partially hosted demo page, engineering
recipes/stories, component documentation with GitHub/NPM links

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

## 8) Feature Backlog

### Developer Experience

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

**DRI**: Frontend Lead **Dependencies**: None **Risks**: Code snippet
maintenance overhead

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

**DRI**: DX Lead **Dependencies**: MSW handlers finalized **Risks**: Starter kit
maintenance burden

---

#### Custom GitHub Copilot Agents

**Goal**: Create installable/downloadable custom GitHub Copilot agent profiles
for various Embedded Finance & Solutions API integration patterns and UI
variants, enabling AI-assisted development workflows.

**Backlog Items**:

- Create agent profile templates for common integration patterns:
  - Onboarding flow integration agent
  - Payment processing integration agent
  - Linked accounts integration agent
  - Transactions display integration agent
  - Recipients management integration agent
  - Multi-component dashboard integration agent
- Configure agent profiles with:
  - Specialized prompts for each integration pattern
  - Relevant tool access (read, edit, search, etc.)
  - Component library context and API documentation references
  - Best practices and patterns guidance
- Create agent variants for different frameworks:
  - React + TypeScript agent
  - Next.js agent
  - Vite + React agent
  - Vanilla JavaScript agent
- Package agents as downloadable `.agent.md` files following
  [GitHub Copilot agent format](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- Add agent download section to showcase:
  - Agent gallery with descriptions
  - One-click download for supported IDEs (VS Code, JetBrains, Eclipse, Xcode)
  - Installation instructions per IDE
  - Agent comparison guide (which agent to use when)
- Create agent configuration examples:
  - Basic agent (read-only, documentation focused)
  - Full-featured agent (read, edit, search, create PRs)
  - Testing-focused agent (test generation, test coverage)
- Document agent customization:
  - How to extend base agents for specific use cases
  - How to configure MCP servers for enhanced capabilities
  - How to set custom AI models per agent
- Add agent usage examples and tutorials
- Create agent validation/testing framework
- Version agents alongside component library versions

**Acceptance Criteria**:

- ✅ At least 5 agent profiles available for download
- ✅ Agents work in VS Code, JetBrains IDEs, Eclipse, and Xcode
- ✅ Agent download and installation process is documented
- ✅ Agents include relevant context about EF&SS components and APIs
- ✅ Agents follow GitHub Copilot agent format standards
- ✅ Agent gallery is accessible from showcase navigation
- ✅ Agents are versioned and compatible with component library versions
- ✅ Agent usage examples demonstrate integration patterns

**DRI**: DX Lead + Frontend Lead **Dependencies**: GitHub Copilot agent format
documentation, component library API finalized **Risks**: Agent maintenance
overhead, format changes in GitHub Copilot, IDE compatibility issues

---

### Theming

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

**DRI**: Frontend Lead + Design Systems **Dependencies**: Embedded Components
theme schema finalized **Risks**: Schema drift between showcase and components
library

---

### Demo Applications

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

**DRI**: Product Manager + Frontend Lead **Dependencies**: Component library
supports all required configurations **Risks**: Solution bundle maintenance
overhead, configuration complexity

---

#### Interactive Integration Guide & Builder

**Goal**: Create a personalized, interactive integration guide and demo builder
that generates customized setup instructions, code examples, and AI prompts
based on user selections (business model, integration type, use case), enabling
developers to build EF&SS integrations with guided, step-by-step assistance.

**Backlog Items**:

**Interactive Guide Component**:

- Create interactive questionnaire/selector interface:
  - Business model selection (Platform, Marketplace, SaaS, E-commerce, etc.)
  - Integration type selection (Full embedded, Partially hosted, API-only)
  - Use case selection (Onboarding, Payments, Payouts, Account Management)
  - Component selection (which EF&SS components to integrate)
  - Framework selection (React, Next.js, Vite, Vanilla JS)
- Implement dynamic content generation:
  - Generate personalized setup steps based on selections
  - Create customized code examples for selected framework and components
  - Generate integration flow diagrams specific to selections
  - Produce API endpoint lists relevant to selected use cases
- Build step-by-step integration guide:
  - Progressive disclosure of setup steps
  - Code snippets with copy-to-clipboard for each step
  - Visual flow diagrams showing integration architecture
  - API endpoint documentation with examples
  - Component configuration examples
- Add preview of user experience:
  - Show how the final integration will look/behave
  - Preview component states and flows
  - Demonstrate user journey through selected components
  - Show API resource lifecycle for selected use case

**AI-Assisted Integration Builder**:

- Generate dynamic LLM prompts for AI assistance:
  - Create context-aware prompts based on user selections
  - Include relevant component documentation in prompts
  - Generate prompts for specific integration tasks (onboarding setup, payment
    flow, etc.)
  - Create prompts for code generation, debugging, and optimization
- Export prompts for use with:
  - GitHub Copilot (custom agents)
  - ChatGPT/Claude/other LLMs
  - IDE-based AI assistants
- Create prompt templates library:
  - Onboarding integration prompts
  - Payment processing prompts
  - Component customization prompts
  - Testing and validation prompts

**Visual Demo Builder**:

- Design builder interface with drag-and-drop component placement
- Implement interactive React grid for component layout (similar to dashboard
  builders)
- Create scenario builder that allows:
  - Component selection and positioning
  - Theme selection and preview
  - Content token customization
  - Scenario metadata (name, description, clientId, etc.)
  - API resource state configuration
- Add preview mode to test builder configurations
- Implement save/load functionality for custom scenarios
- Add shareable URLs for custom scenarios
- Create scenario templates library (starter configurations)
- Add validation for scenario configurations
- Export scenario configurations as JSON

**Code Generation & Quickstarts**:

- Generate code quickstarts based on selections:
  - Starter project structure for selected framework
  - Pre-configured component examples
  - MSW setup with relevant handlers
  - Theme configuration examples
  - API client setup with authentication
- Create downloadable starter kits:
  - One-click download of generated starter project
  - Include all dependencies and configuration
  - Pre-populated with example code from guide
  - README with setup instructions
- Generate implementation checklists:
  - Step-by-step checklist for selected integration
  - Mark progress as steps are completed
  - Link to relevant documentation for each step
  - Include testing and validation steps

**Integration Flow Visualization**:

- Create interactive flow diagrams:
  - Show API call sequences for selected use case
  - Visualize component interactions
  - Display data flow between components and APIs
  - Show error handling and edge cases
- Add flow customization:
  - Allow users to modify flows based on their needs
  - Show alternative integration patterns
  - Highlight best practices and recommendations

**Documentation & Resources**:

- Generate personalized documentation:
  - Customized API reference for selected endpoints
  - Component props documentation for selected components
  - Integration patterns guide for selected use case
  - Troubleshooting guide for common issues
- Link to relevant resources:
  - Official API documentation sections
  - Component Storybook stories
  - Engineering recipes
  - Example implementations

**Integration with Existing Infrastructure**:

- Integrate builder with existing SellSense demo infrastructure
- Connect to MSW for live API simulation
- Link to component library for live examples
- Integrate with theme customization system
- Connect to API resource lifecycle visualization

**Acceptance Criteria**:

- ✅ Interactive guide personalizes content based on user selections
- ✅ Dynamic setup steps are generated for selected integration type
- ✅ LLM prompts are generated and exportable for AI assistance
- ✅ Code quickstarts are downloadable and runnable
- ✅ Visual builder allows drag-and-drop component placement
- ✅ Preview mode accurately reflects final integration state
- ✅ Generated prompts work with GitHub Copilot and other LLMs
- ✅ Integration flows are visualized and interactive
- ✅ Custom scenarios can be saved, loaded, and shared via URL
- ✅ At least 5 integration templates available
- ✅ Builder validates configurations before saving
- ✅ Generated starter kits can be cloned and run in <5 minutes

**DRI**: Full-Stack Lead + Frontend Lead + DX Lead **Dependencies**: Component
library supports dynamic configuration, API documentation finalized **Risks**:
Builder complexity may exceed value; maintenance overhead; prompt generation
quality; keeping generated code up-to-date

---

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

**DRI**: Product Manager + Frontend Lead **Dependencies**: None **Risks**:
Persona definitions may change

---

#### API Resource Lifecycle Visualization

**Goal**: Create an interactive, visual representation of how API resources
(clients, accounts, recipients, transactions) evolve through their lifecycle
across different scenarios, helping developers understand resource state
progression and relationships.

**Backlog Items**:

- Design resource lifecycle visualization component:
  - Timeline view showing resource evolution
  - State diagram showing resource transitions
  - Interactive resource dependency graph
  - Resource state matrix (scenario × resource type)
- Map API resources to lifecycle stages:
  - **Clients**: Initial state → Onboarding → Active → Suspended/Closed
  - **Accounts**: Not created → Created → Active → Limited DDA → Full DDA
  - **Recipients** (Linked Accounts): Not created → Created → Verified → Active
  - **Transactions**: No transactions → First transaction → Transaction history
- Enhance SellSense scenarios to show resource state mapping:
  - "New Seller - Onboarding": Client in onboarding, no
    accounts/recipients/transactions
  - "Onboarding - Docs Needed": Client pending, no accounts yet
  - "Onboarding - Seller with prefilled data": Client active, account creation
    ready
  - "Linked Bank Account": Client active, account created, recipient (linked
    account) created
  - "Seller with Limited DDA": Client active, account active, transactions
    flowing
  - "Active Seller with Direct Payouts": Full lifecycle with all resources
    active
- Create interactive resource state viewer:
  - Visual timeline showing when each resource is created/updated
  - Resource dependency visualization (client → account → recipient →
    transactions)
  - State transition animations
  - Click-to-explore resource details
- Add resource state indicators to SellSense dashboard:
  - Visual badges showing current state of each resource type
  - Resource count indicators (e.g., "3 Transactions", "1 Linked Account")
  - State progression indicators (e.g., "Account: Created → Active")
- Implement resource evolution tracking:
  - Track resource state changes as user progresses through scenarios
  - Show before/after state comparisons
  - Highlight what changes when transitioning between scenarios
- Create resource lifecycle documentation:
  - Visual diagrams for each resource type lifecycle
  - State transition rules and triggers
  - API endpoint mapping (which endpoints create/update resources)
  - Scenario-to-resource-state mapping table
- Add resource state filtering and exploration:
  - Filter scenarios by resource state (e.g., "Show scenarios with active
    accounts")
  - Explore resource relationships (e.g., "Show all recipients for this client")
  - Compare resource states across scenarios
- Integrate with MSW to show real-time resource state:
  - Display current MSW database state
  - Show resource creation/update events
  - Visualize mock data relationships

**Acceptance Criteria**:

- ✅ All major API resources have lifecycle visualizations (clients, accounts,
  recipients, transactions)
- ✅ Each SellSense scenario shows its resource state mapping
- ✅ Interactive timeline/diagram shows resource evolution
- ✅ Resource state indicators are visible in SellSense dashboard
- ✅ Resource lifecycle documentation is accessible from showcase
- ✅ Resource state viewer is interactive and responsive
- ✅ Resource evolution tracking works across scenario transitions
- ✅ MSW resource state is visible and explorable

**DRI**: Frontend Lead + Backend Lead **Dependencies**: MSW database structure
finalized, API resource schemas stable **Risks**: Resource state complexity,
visualization performance with large datasets, maintaining state accuracy

---

### Documentation

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

**DRI**: Technical Writer + DX Lead **Dependencies**: None **Risks**:
Documentation drift over time

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

**DRI**: Technical Writer + Frontend Lead **Dependencies**: Embedded Components
patterns documentation finalized **Risks**: Pattern documentation may become
stale if not maintained

---

#### Utility Components & Hooks Review

**Goal**: Review and document utility components and hooks in
embedded-components library based on recent progress, ensuring showcase
accurately represents available utilities.

**Backlog Items**:

- Audit all utility components in `embedded-components/src/lib/`
- Review shared hooks (`useDialogState`, `useIPAddress`, `useLocale`, etc.)
- Review utility functions (`userTracking`, `getLocaleFromLanguage`, etc.)
- Document utility components and hooks in showcase
- Create showcase section for utility components (similar to main components)
- Add code examples for each utility hook/function
- Update landing page to highlight utility components section
- Create Storybook stories for utility components (if applicable)
- Ensure utility components are discoverable and well-documented
- Review utility component usage patterns across embedded-components

**Acceptance Criteria**:

- ✅ All utility hooks are documented in showcase
- ✅ All utility functions are documented with examples
- ✅ Utility components section is accessible from landing page
- ✅ Code examples are production-ready and copyable
- ✅ Utility components showcase aligns with actual library capabilities

**DRI**: Frontend Lead + Technical Writer **Dependencies**: Embedded Components
library audit complete **Risks**: Utility components may change frequently

---

#### Changelog Generation from PRs

**Goal**: Automatically generate changelog by analyzing all PRs and changes from
the last 6 months, creating a comprehensive change history.

**Backlog Items**:

- Analyze GitHub PRs from last 6 months (using GitHub API or git history)
- Categorize changes by type (features, fixes, docs, refactors, etc.)
- Extract meaningful change descriptions from PR titles/bodies
- Group changes by component/feature area
- Generate changelog in standard format (Keep a Changelog style)
- Create automated changelog generation script
- Add changelog to showcase (dedicated page or section)
- Link changelog entries to relevant PRs/issues
- Include version tags for major releases
- Add changelog RSS feed or subscription (optional)
- Create changelog filtering (by component, type, date range)

**Acceptance Criteria**:

- ✅ Changelog covers last 6 months of changes
- ✅ Changes are categorized correctly
- ✅ Changelog is readable and well-formatted
- ✅ Changelog is accessible from showcase navigation
- ✅ Changelog entries link to PRs/issues
- ✅ Changelog generation is automated (script or CI)

**DRI**: Technical Writer + DevOps Lead **Dependencies**: GitHub API access or
git history access **Risks**: PR descriptions may be inconsistent; requires
manual review

---

#### Version Management & Changelog

**Goal**: Expose showcase version information and create a version-locked
changelog that tracks component library versions and showcase versions.

**Backlog Items**:

- Add version display to showcase footer or header
- Create version information page showing:
  - Showcase application version
  - Embedded Components library version
  - Dependency versions (React, TanStack Router, etc.)
  - Build date and commit hash
- Implement version compatibility matrix
- Create version-locked changelog (CHANGELOG.md) with:
  - Semantic versioning (MAJOR.MINOR.PATCH)
  - Breaking changes clearly marked
  - Migration guides for major versions
  - Component version compatibility
- Add version selector for viewing historical changelogs
- Create version comparison tool (diff between versions)
- Implement version notifications for breaking changes
- Add version badges to component cards
- Create automated version bumping workflow
- Document versioning strategy and release cadence

**Acceptance Criteria**:

- ✅ Showcase version is visible and accessible
- ✅ Version information page shows all relevant versions
- ✅ CHANGELOG.md follows semantic versioning
- ✅ Breaking changes are clearly documented
- ✅ Version compatibility is documented
- ✅ Version history is accessible
- ✅ Version bumping is automated or clearly documented

**DRI**: DevOps Lead + Technical Writer **Dependencies**: Version management
strategy defined **Risks**: Version drift between showcase and components
library

---

### UX/Polish

#### Hero Section Review & Refinement

**Goal**: Improve the landing page hero section to better communicate value
proposition and guide users to key features.

**Backlog Items**:

- Review current hero section messaging and visual hierarchy
- Refine hero copy to better align with developer personas and jobs-to-be-done
- Enhance architecture visualization (nested boxes) with better interactivity
- Add clear value propositions for each layer (Demo Applications, Embedded
  Components, Utility Components)
- Improve call-to-action buttons with clearer destinations
- Add hero metrics or social proof (if available)
- Ensure hero is responsive and accessible
- Consider adding animated transitions or micro-interactions
- Review hero against competitor showcases for best practices

**Acceptance Criteria**:

- ✅ Hero section clearly communicates showcase purpose in <10 seconds
- ✅ Architecture visualization is intuitive and clickable
- ✅ CTAs lead to appropriate destinations
- ✅ Hero passes accessibility audit (WCAG 2.1 AA)
- ✅ Responsive design works on mobile, tablet, desktop
- ✅ Hero messaging aligns with vision statement

**DRI**: Frontend Lead + UX Designer **Dependencies**: None **Risks**:
Over-engineering hero at expense of content

---

#### Onboarding Experience for Showcase

**Goal**: Create a comprehensive onboarding experience that defines and
describes all showcase features, guiding new users through the platform.

**Backlog Items**:

- Design onboarding flow with progressive disclosure
- Create interactive tour of key features:
  - Landing page sections
  - Component demos
  - Scenario navigation
  - Theme customization
  - Code snippets
  - Documentation links
- Add onboarding checklist (first-time user guide)
- Implement "What's New" section for recent features
- Create feature discovery tooltips/highlights
- Add onboarding skip/resume functionality
- Track onboarding completion (privacy-preserving)
- Create video walkthroughs or animated guides (optional)
- Add contextual help throughout showcase
- Implement onboarding analytics (opt-in)

**Acceptance Criteria**:

- ✅ Onboarding flow can be completed in <5 minutes
- ✅ All major features are introduced in onboarding
- ✅ Users can skip or resume onboarding
- ✅ Onboarding is accessible (keyboard navigation, screen readers)
- ✅ Onboarding completion rate >60% for first-time visitors
- ✅ Contextual help is available throughout showcase

**DRI**: UX Designer + Frontend Lead **Dependencies**: None **Risks**:
Onboarding may become stale if not maintained

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

**DRI**: Frontend Lead **Dependencies**: Component library status API (if
exists) **Risks**: Status may become stale

---

### Developer Tools

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

**DRI**: Backend Lead **Dependencies**: MSW handlers stable **Risks**: None

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

**DRI**: Full-Stack Lead **Dependencies**: MSW handlers support all endpoints
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

**DRI**: Backend Lead **Dependencies**: OpenAPI spec finalized **Risks**: Spec
maintenance overhead

---

### Analytics

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

**DRI**: Data Analyst + Frontend Lead **Dependencies**: Analytics infrastructure
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

**Document Version**: 1.0 **Last Updated**: 2025-01-XX **Owner**: DevEx Product
Manager **Review Cadence**: Monthly
