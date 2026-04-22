# PTC (Publicly Traded Companies) Feature Plan

**Source:** [Handling of Publicly Traded Companies (PTCs)](https://confluence.prod.aws.jpmchase.net/confluence/spaces/SMBDO/pages/4255687417/Handling+of+Publicly+Traded+Companies+PTCs)  
**Date:** 2026-04-21

---

## Background

A PTC is an organization publicly traded through an exchange. A **subsidiary of a PTC** is an organization where ≥50% of ownership is held by a PTC. The feature is gated behind a configuration flag so platforms can opt in based on their participant population.

---

## 1. Feature Flag — New Prop on `<OnboardingWizardBasic>`

**File:** `OnboardingWizardBasic` props type + context  
**Change:** Add `enablePubliclyTradedCompanies?: boolean` (default `false`) alongside existing props like `showLinkedAccountPanel`, `allowAdditionalDocumentUpload`, etc.  
**Propagation:** Thread through the onboarding context so all child components can read it.

---

## 2. New UI: PTC Entry Questions (Two-Step)

**Where:** After entity type selection in the **Organization Type / Gateway screen**  
**Behavior (when flag is `true`):**

**Step A — Gate question:**

- _"Is your organization publicly traded, or a subsidiary of a publicly traded company?"_ → Yes / No
- If **No** or flag is `false`, flow continues as-is (current behavior)
- **Hidden for Sole Proprietorships** (per spec: all entity types except Sole Prop)

**Step B — PTC vs. Subsidiary (shown only if Step A = Yes):**

- _"Is your organization itself publicly traded, or is it a subsidiary of a publicly traded company?"_ → **Publicly Traded** / **Subsidiary**
- Maps directly to `subsidiaryOfPubliclyTraded: true | false` in the API payload
- If **Subsidiary**, the ticker symbol and exchange collected in §3 refer to the **parent PTC**, not the subsidiary itself

After Step B, show the **Trading Information sub-form** (see §3).

---

## 3. New Sub-Form: Trading Information (`publiclyTraded` block)

New form fields to collect (shown after the §2 gate questions):

| Field               | Type            | Required    | Notes                                                                                                       |
| ------------------- | --------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `tickerSymbol`      | Text input      | Yes         | Regex `^[A-Z0-9]*$`, max 10 chars. If subsidiary, this is the **parent PTC's** ticker.                      |
| `stockExchange`     | Select dropdown | Yes         | Options: `XNYS` (NYSE), `XNAS` (NASDAQ), + all exchanges from the Publicly Traded Companies list, + `Other` |
| `stockExchangeName` | Text input      | Conditional | Required only when `stockExchange === "Other"`                                                              |

> **Note:** The subsidiary question (`subsidiaryOfPubliclyTraded`) is collected in §2 Step B, not here.

**API types already exist:** `PubliclyTraded` interface + `subsidiaryOfPubliclyTraded` field in `OrganizationDetails` (in `smbdo.schemas.ts`).

---

## 4. Field Map Updates (Smart Form Rules)

**File:** Central field-map configuration

### A. New fields to add to the field map

- `organizationDetails.publiclyTraded.tickerSymbol`
- `organizationDetails.publiclyTraded.stockExchange`
- `organizationDetails.publiclyTraded.stockExchangeName`
- `organizationDetails.subsidiaryOfPubliclyTraded`

### B. Conditional rules based on PTC status

The key UI dimension is **US exchange vs. non-US exchange** — PTC vs. subsidiary doesn't change what we collect (the subsidiary boolean is for backend processing only).

| Scenario                                      | Beneficial Owners (≥25%) | Controller                                              | Controller Gov ID | FinCEN Attestation |
| --------------------------------------------- | ------------------------ | ------------------------------------------------------- | ----------------- | ------------------ |
| **US exchange** (XNYS / XNAS) — PTC or sub    | **Skip**                 | Collect (Name, Address, Job Title only — **no Gov ID**) | **Hidden**        | **Skip**           |
| **Non-US exchange** (all others) — PTC or sub | **Collect**              | Collect (**with Gov ID**)                               | **Show**          | **Collect**        |
| **Not a PTC** (non-PTC / flag off)            | **Collect**              | Collect (**with Gov ID**)                               | **Show**          | **Collect**        |

Conditional rules key off: `isPTC && isUSExchange` where `isUSExchange = stockExchange ∈ {"XNYS", "XNAS"}`.

---

## 5. Section Visibility Logic Updates

**File:** `sectionStatusResolver` / `excludeSections` logic  
**Changes:**

- When PTC + **US exchange** (XNYS/XNAS) → exclude `owners-section` (beneficial owners)
- When PTC + **non-US exchange** → keep `owners-section` visible
- The `publiclyTraded` sub-form section should be **hidden entirely** when the feature flag is `false`

---

## 6. Controller Form Adjustments

**File:** Personal details forms for controllers  
**Changes:**

- For PTC + **US exchange**: Controller form collects only **Name, Address, Job Title** — government ID fields become `hidden`
- For PTC + **non-US exchange**: Full controller form including government ID
- Conditional rules key off `isPTC && isUSExchange` (same dimension as §4B)

---

## 7. API Payload Assembly

**File:** Party creation/update utilities  
**Changes:**

- When PTC data is collected, include `publiclyTraded: { tickerSymbol, stockExchange, stockExchangeName? }` and `subsidiaryOfPubliclyTraded: true|false` in the `organizationDetails` payload
- NAICS gating still applies (per spec: "PTC/Subsidiary of PTC will get through NAICS gating")
- Customer type sent to CORE as `NBFI` when NAICS classifies as such (spec: "NAICS-based evaluated customer type overrides user declared PTC")

---

## 8. i18n / Content Tokens

Add translation keys for all new UI strings:

- PTC question label, help text
- Ticker symbol label/placeholder/validation
- Stock exchange label/options
- Subsidiary question label
- Any updated section descriptions when PTC mode is active

Estimated: ~15–20 new translation keys.

---

## 9. Tests & Mocks

- **MSW mocks**: Add mock responses for PTC organization creation/updates
- **Unit tests**: PTC sub-form rendering, conditional field visibility, payload assembly
- **Integration tests**: Full onboarding flow with PTC enabled vs disabled
- **Edge cases**: Sole Prop should never see PTC option; exchange "Other" conditional field

---

## Summary of Touched Areas

| Area                | Scope                                            |
| ------------------- | ------------------------------------------------ |
| **Props / Config**  | 1 new boolean prop                               |
| **New UI**          | 2 gate questions + 1 sub-form (3 fields)         |
| **Field map**       | 4 new field entries + conditional rules          |
| **Section logic**   | Beneficial owners section conditionally excluded |
| **Controller form** | Gov ID conditionally hidden for US PTC           |
| **API payload**     | Include `publiclyTraded` block                   |
| **i18n**            | ~15–20 new translation keys                      |
| **Tests**           | Unit + integration coverage                      |
